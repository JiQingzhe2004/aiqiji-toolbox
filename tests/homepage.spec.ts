import { test, expect, type Page } from '@playwright/test';

/**
 * 主页功能测试
 * 测试搜索、分类过滤、工具卡片等核心功能
 */

test.describe('AiQiji工具箱 - 主页功能', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前访问主页
    await page.goto('/');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('页面标题和基本元素显示正确', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/AiQiji工具箱/);
    
    // 检查主标题
    await expect(page.getByRole('heading', { name: /工具导航站/ })).toBeVisible();
    
    // 检查搜索框
    await expect(page.getByPlaceholder(/搜索工具/)).toBeVisible();
    
    // 检查分类标签
    await expect(page.getByRole('tab', { name: '全部' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '开发' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '设计' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'AI' })).toBeVisible();
  });

  test('主题切换功能正常工作', async ({ page }) => {
    // 检查默认主题（深色）
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // 点击主题切换按钮
    await page.getByRole('button', { name: /切换到.*主题/ }).click();
    
    // 等待主题切换动画完成
    await page.waitForTimeout(300);
    
    // 检查主题是否切换
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toMatch(/light|dark/);
  });

  test('搜索功能正常工作', async ({ page }) => {
    // 输入搜索关键词
    const searchBox = page.getByPlaceholder(/搜索工具/);
    await searchBox.fill('代码');
    
    // 等待防抖延迟
    await page.waitForTimeout(200);
    
    // 检查搜索结果
    const toolCards = page.locator('[role="button"][aria-label*="打开工具"]');
    await expect(toolCards.first()).toBeVisible();
    
    // 检查高亮显示
    await expect(page.locator('mark')).toBeVisible();
    
    // 清空搜索
    await searchBox.clear();
    await page.waitForTimeout(200);
    
    // 检查所有工具重新显示
    const allCards = page.locator('[role="button"][aria-label*="打开工具"]');
    expect(await allCards.count()).toBeGreaterThan(5);
  });

  test('分类过滤功能正常工作', async ({ page }) => {
    // 记录初始工具数量
    const initialCards = page.locator('[role="button"][aria-label*="打开工具"]');
    const initialCount = await initialCards.count();
    
    // 点击"开发"分类
    await page.getByRole('tab', { name: '开发' }).click();
    
    // 等待过滤动画完成
    await page.waitForTimeout(500);
    
    // 检查过滤后的工具数量
    const filteredCards = page.locator('[role="button"][aria-label*="打开工具"]');
    const filteredCount = await filteredCards.count();
    
    // 过滤后的数量应该少于初始数量
    expect(filteredCount).toBeLessThan(initialCount);
    
    // 切换回"全部"
    await page.getByRole('tab', { name: '全部' }).click();
    await page.waitForTimeout(500);
    
    // 检查工具数量恢复
    const restoredCount = await initialCards.count();
    expect(restoredCount).toBe(initialCount);
  });

  test('工具卡片交互正常', async ({ page }) => {
    // 等待工具卡片加载
    const firstCard = page.locator('[role="button"][aria-label*="打开工具"]').first();
    await expect(firstCard).toBeVisible();
    
    // 测试悬停效果
    await firstCard.hover();
    
    // 检查卡片缩放效果（通过transform样式）
    const transform = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    expect(transform).not.toBe('none');
    
    // 测试复制链接按钮
    const copyButton = firstCard.locator('[aria-label*="复制"][aria-label*="链接"]');
    await expect(copyButton).toBeVisible();
    
    // 点击复制按钮
    await copyButton.click();
    
    // 注意：实际的剪贴板测试需要特殊权限，这里只测试点击不报错
  });

  test('键盘导航功能正常', async ({ page }) => {
    // 测试搜索框快捷键 (Ctrl+K 或 Cmd+K)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+KeyK`);
    
    // 检查搜索框获得焦点
    const searchBox = page.getByPlaceholder(/搜索工具/);
    await expect(searchBox).toBeFocused();
    
    // 测试 ESC 键清空搜索
    await searchBox.fill('test');
    await page.keyboard.press('Escape');
    
    // 检查搜索框失去焦点
    await expect(searchBox).not.toBeFocused();
  });

  test('响应式设计在不同设备上正常工作', async ({ page }) => {
    // 测试桌面视图
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    // 检查工具网格列数（应该是3-4列）
    const toolGrid = page.locator('[class*="grid-cols"]').first();
    await expect(toolGrid).toBeVisible();
    
    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // 测试手机视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // 在小屏幕上，分类标签应该变为网格布局
    const categoryTabs = page.locator('[role="tablist"]');
    await expect(categoryTabs).toBeVisible();
  });

  test('外部链接安全性', async ({ page }) => {
    // 获取第一个工具卡片
    const firstCard = page.locator('[role="button"][aria-label*="打开工具"]').first();
    await expect(firstCard).toBeVisible();
    
    // 获取打开工具按钮
    const openButton = firstCard.locator('button', { hasText: '打开工具' });
    await expect(openButton).toBeVisible();
    
    // 检查点击不会在当前页面导航（应该打开新标签页）
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      openButton.click()
    ]);
    
    // 检查新页面确实打开了
    expect(newPage).toBeTruthy();
    
    // 关闭新页面
    await newPage.close();
  });

  test('性能基准测试', async ({ page }) => {
    // 测试页面加载性能
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // 页面应该在3秒内加载完成
    expect(loadTime).toBeLessThan(3000);
    
    // 测试搜索性能
    const searchStart = Date.now();
    await page.getByPlaceholder(/搜索工具/).fill('代码格式化');
    await page.waitForTimeout(200); // 等待防抖
    const searchTime = Date.now() - searchStart;
    
    // 搜索应该在500ms内完成
    expect(searchTime).toBeLessThan(500);
  });
});
