import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 测试配置
 * 针对 AiQiji工具箱 项目的端到端测试
 */
export default defineConfig({
  testDir: './tests',
  
  /* 并行运行测试 */
  fullyParallel: true,
  
  /* 在CI中禁止重试失败的测试 */
  forbidOnly: !!process.env.CI,
  
  /* 在CI中重试失败的测试 */
  retries: process.env.CI ? 2 : 0,
  
  /* 并行worker数量 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 测试报告配置 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  /* 全局测试配置 */
  use: {
    /* 基础URL */
    baseURL: 'http://localhost:5173',
    
    /* 收集失败测试的trace */
    trace: 'on-first-retry',
    
    /* 截图设置 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',
  },

  /* 配置不同浏览器的测试项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* 移动设备测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* 平板设备测试 */
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  /* 启动开发服务器 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
