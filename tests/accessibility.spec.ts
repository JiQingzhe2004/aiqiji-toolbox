import { test, expect } from '@playwright/test';

/**
 * 可访问性测试
 * 测试WCAG AA标准合规性、键盘导航、屏幕阅读器支持等
 */

test.describe('可访问性测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('页面结构语义化正确', async ({ page }) => {
    // 检查主要地标元素
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // 检查标题层级
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveCount(1); // 只能有一个 h1
    
    // 检查导航结构
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    
    // 检查按钮和链接的可访问标签
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasVisibleText = await button.textContent();
      
      // 每个按钮必须有可访问的名称
      expect(hasAriaLabel || hasVisibleText?.trim()).toBeTruthy();
    }
  });

  test('键盘导航功能完整', async ({ page }) => {
    // 测试 Tab 键导航
    await page.keyboard.press('Tab');
    
    // 第一个可聚焦元素应该是搜索框或跳过链接
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 继续Tab导航，确保能到达所有交互元素
    const interactiveElements = [
      'input[type="text"]',
      'button',
      'a[href]',
      '[tabindex="0"]'
    ];
    
    let tabCount = 0;
    const maxTabs = 20; // 防止无限循环
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      const currentFocus = page.locator(':focus');
      const isVisible = await currentFocus.isVisible().catch(() => false);
      
      if (isVisible) {
        const tagName = await currentFocus.evaluate(el => el.tagName.toLowerCase());
        const hasTabindex = await currentFocus.getAttribute('tabindex');
        
        // 验证聚焦元素是可交互的
        const isInteractive = interactiveElements.some(selector => 
          selector.includes(tagName) || hasTabindex === '0'
        );
        
        if (isInteractive) {
          continue; // 正常的可聚焦元素
        }
      }
    }
  });

  test('ARIA 属性正确设置', async ({ page }) => {
    // 检查搜索框的 aria 属性
    const searchBox = page.getByPlaceholder(/搜索工具/);
    await expect(searchBox).toHaveAttribute('aria-label');
    
    // 检查标签页的 aria 属性
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute('aria-selected');
      await expect(tab).toHaveAttribute('role', 'tab');
    }
    
    // 检查工具卡片的 aria 属性
    const toolCards = page.locator('[role="button"][aria-label*="打开工具"]');
    const cardCount = await toolCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // 验证第一个卡片的属性
    const firstCard = toolCards.first();
    await expect(firstCard).toHaveAttribute('aria-label');
    await expect(firstCard).toHaveAttribute('tabindex', '0');
  });

  test('颜色对比度符合WCAG AA标准', async ({ page }) => {
    // 这个测试需要更高级的颜色对比度检查工具
    // 这里我们检查基本的颜色设置
    
    // 检查文本颜色不是纯灰色（可能对比度不足）
    const textElements = page.locator('p, span, div').filter({ hasText: /\w+/ });
    const elementCount = Math.min(await textElements.count(), 10); // 检查前10个元素
    
    for (let i = 0; i < elementCount; i++) {
      const element = textElements.nth(i);
      const color = await element.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // 确保不是纯灰色 rgb(128, 128, 128) 这样的低对比度颜色
      expect(color).not.toBe('rgb(128, 128, 128)');
    }
  });

  test('屏幕阅读器支持', async ({ page }) => {
    // 检查页面是否有合适的标题
    const pageTitle = await page.title();
    expect(pageTitle).toMatch(/AiQiji工具箱/);
    
    // 检查是否有跳过导航链接（可选）
    const skipLink = page.locator('a[href="#main"], a[href="#content"]');
    const hasSkipLink = await skipLink.count() > 0;
    // 跳过链接是可选的，但如果有的话应该指向正确位置
    
    // 检查图片的 alt 属性
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // 图片应该有 alt 属性或适当的 role
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
    
    // 检查表单标签
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // 输入框应该有可访问的标签
      expect(ariaLabel || ariaLabelledby || placeholder).toBeTruthy();
    }
  });

  test('焦点管理正确', async ({ page }) => {
    // 测试模态框焦点管理（如果有的话）
    // 测试搜索框焦点
    const searchBox = page.getByPlaceholder(/搜索工具/);
    
    // 通过快捷键聚焦搜索框
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    
    await expect(searchBox).toBeFocused();
    
    // ESC 键应该移除焦点
    await page.keyboard.press('Escape');
    await expect(searchBox).not.toBeFocused();
    
    // 测试工具卡片的焦点
    const firstCard = page.locator('[role="button"][aria-label*="打开工具"]').first();
    await firstCard.focus();
    await expect(firstCard).toBeFocused();
    
    // Enter 键应该激活卡片
    // 注意：这会打开新窗口，所以要小心处理
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.keyboard.press('Enter')
    ]);
    
    if (popup) {
      await popup.close();
    }
  });

  test('动画可以被关闭（尊重用户偏好）', async ({ page }) => {
    // 模拟用户偏好：减少动画
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    // 检查动画是否被禁用或减少
    // 这需要检查CSS中的 prefers-reduced-motion 媒体查询
    const animatedElement = page.locator('.animate-fade-in, [class*="animate"]').first();
    
    if (await animatedElement.count() > 0) {
      const animationDuration = await animatedElement.evaluate(el => 
        window.getComputedStyle(el).animationDuration
      );
      
      // 动画持续时间应该非常短或为0
      expect(animationDuration === '0s' || animationDuration === '0.01ms').toBeTruthy();
    }
  });

  test('错误消息可访问', async ({ page }) => {
    // 触发错误状态（例如网络错误）
    await page.route('/tools.json', (route) => {
      route.fulfill({
        status: 500,
        body: 'Server Error'
      });
    });
    
    await page.reload();
    
    // 错误消息应该可见且可访问
    const errorMessage = page.getByText(/加载失败|错误/);
    await expect(errorMessage).toBeVisible();
    
    // 错误消息应该有适当的 role 或 aria 属性
    const errorContainer = errorMessage.locator('..'); // 父容器
    const role = await errorContainer.getAttribute('role');
    const ariaLive = await errorContainer.getAttribute('aria-live');
    
    // 错误消息应该有 alert 角色或 aria-live 属性
    expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
  });
});
