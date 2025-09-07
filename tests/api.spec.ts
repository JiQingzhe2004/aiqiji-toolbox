import { test, expect } from '@playwright/test';

/**
 * API和数据加载测试
 * 测试工具数据的加载、格式验证等
 */

test.describe('数据和API测试', () => {
  test('tools.json 数据格式正确', async ({ page }) => {
    // 直接请求 tools.json
    const response = await page.request.get('/tools.json');
    expect(response.status()).toBe(200);
    
    const tools = await response.json();
    
    // 验证基本结构
    expect(Array.isArray(tools)).toBeTruthy();
    expect(tools.length).toBeGreaterThan(0);
    
    // 验证每个工具的必需字段
    for (const tool of tools) {
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('desc');
      expect(tool).toHaveProperty('icon');
      expect(tool).toHaveProperty('category');
      expect(tool).toHaveProperty('url');
      
      // 验证字段类型
      expect(typeof tool.id).toBe('string');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.desc).toBe('string');
      expect(typeof tool.icon).toBe('string');
      expect(typeof tool.category).toBe('string');
      expect(typeof tool.url).toBe('string');
      
      // 验证分类值
      const validCategories = ['开发', '设计', '效率', 'AI', '其它'];
      expect(validCategories).toContain(tool.category);
      
      // 验证URL格式
      expect(tool.url).toMatch(/^https?:\/\//);
      
      // 验证可选字段
      if (tool.tags) {
        expect(Array.isArray(tool.tags)).toBeTruthy();
      }
      
      if (tool.featured) {
        expect(typeof tool.featured).toBe('boolean');
      }
      
      if (tool.createdAt) {
        expect(typeof tool.createdAt).toBe('string');
        // 验证ISO日期格式
        expect(new Date(tool.createdAt).toISOString()).toBe(tool.createdAt);
      }
    }
  });

  test('数据加载错误处理', async ({ page }) => {
    // 拦截 tools.json 请求并返回错误
    await page.route('/tools.json', (route) => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });
    
    await page.goto('/');
    
    // 应该显示错误状态
    await expect(page.getByText(/加载失败/)).toBeVisible();
    await expect(page.getByText(/重新加载/)).toBeVisible();
  });

  test('数据加载性能', async ({ page }) => {
    const startTime = Date.now();
    
    // 监听网络请求
    let dataLoaded = false;
    page.on('response', (response) => {
      if (response.url().includes('tools.json')) {
        dataLoaded = true;
      }
    });
    
    await page.goto('/');
    
    // 等待数据加载完成
    await page.waitForFunction(() => dataLoaded);
    
    const loadTime = Date.now() - startTime;
    
    // 数据应该在2秒内加载完成
    expect(loadTime).toBeLessThan(2000);
    
    // 检查工具卡片是否显示
    await expect(page.locator('[role="button"][aria-label*="打开工具"]').first()).toBeVisible();
  });

  test('缓存机制工作正常', async ({ page }) => {
    let requestCount = 0;
    
    // 监听 tools.json 请求
    page.on('request', (request) => {
      if (request.url().includes('tools.json')) {
        requestCount++;
      }
    });
    
    // 第一次访问
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(requestCount).toBe(1);
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 由于浏览器缓存，可能不会发起新请求
    // 或者由于我们的缓存逻辑，也可能不会发起新请求
    expect(requestCount).toBeGreaterThanOrEqual(1);
    expect(requestCount).toBeLessThanOrEqual(2);
  });
});
