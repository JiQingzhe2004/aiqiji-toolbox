# AiQiji工具箱 - 效率工具导航站

> 🚀 为开发者、设计师和效率工具爱好者精心收集的工具导航站点。让工作更高效，让创作更便捷。

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ 特性

- 🎨 **现代设计** - 基于暗色主题的科技未来感界面
- 🔍 **智能搜索** - 支持工具名称、描述、标签的多词搜索，带有180ms防抖优化
- 🏷️ **分类导航** - 按开发、设计、效率、AI等分类整理工具
- 🌙 **主题切换** - 支持深色/浅色主题，带有平滑过渡动画
- ♿ **无障碍** - 符合WCAG AA标准，支持键盘导航和屏幕阅读器
- 📱 **响应式** - 完美适配桌面、平板、手机各种设备
- ⚡ **高性能** - React.memo、懒加载、代码分割等性能优化
- 🎭 **动画效果** - 基于framer-motion的流畅动画体验

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式方案**: TailwindCSS + shadcn/ui
- **动画库**: Framer Motion
- **图标库**: Lucide React
- **路由**: React Router DOM
- **测试**: Playwright

## 📦 快速开始

### 环境要求

- Node.js 18+ 
- pnpm 8+ (推荐) 或 npm

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发运行

```bash
# 启动开发服务器
pnpm dev

# 或
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

```bash
# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

### 代码检查

```bash
# ESLint 检查
pnpm lint

# 或
npm run lint
```

## 🧪 测试

```bash
# 运行 Playwright 测试
pnpm test

# 以 UI 模式运行测试
pnpm test:ui
```

## 📝 数据管理

### 添加新工具

编辑 `public/tools.json` 文件，按以下格式添加新工具：

```json
{
  "id": "tool-unique-id",
  "name": "工具名称",
  "desc": "工具描述",
  "icon": "LucideIconName",
  "category": "开发|设计|效率|AI|其它",
  "tags": ["标签1", "标签2"],
  "url": "https://example.com",
  "featured": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 字段说明

- `id`: 唯一标识符（必填）
- `name`: 工具名称（必填）
- `desc`: 简短描述（必填）
- `icon`: [Lucide图标名称](https://lucide.dev/icons/)（必填）
- `category`: 分类，支持：开发、设计、效率、AI、其它（必填）
- `tags`: 标签数组（可选）
- `url`: 工具链接（必填）
- `featured`: 是否为推荐工具（可选，默认false）
- `createdAt`: 创建时间 ISO 格式（可选）

## 🚀 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 连接 Vercel 账号到 GitHub
3. 导入项目，Vercel 会自动识别 Vite 项目
4. 部署完成

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/aiqiji-toolbox)

### Netlify 部署

1. 构建项目：`npm run build`
2. 将 `dist` 文件夹拖拽到 Netlify 部署页面
3. 或连接 GitHub 仓库自动部署

### 手动部署

```bash
# 构建生产版本
npm run build

# dist 文件夹包含所有静态文件
# 可以部署到任何静态文件服务器
```

## 🔧 PWA 支持

项目已预配置 PWA 功能：

- 📱 可安装到手机桌面
- 🔌 离线缓存支持
- 🎨 自定义启动画面
- 📱 移动设备优化

要完整启用 PWA，需要：

1. 安装 Service Worker：
```bash
npm install workbox-window
```

2. 在 `src/main.jsx` 中注册 Service Worker
3. 配置 `vite.config.ts` 中的 PWA 插件

## 🎯 扩展建议

1. **后端集成** - 连接数据库存储工具数据，支持用户提交
2. **用户系统** - 添加用户注册登录，支持个人收藏
3. **评价系统** - 为工具添加评分和评论功能
4. **API接口** - 提供 RESTful API 供第三方调用
5. **多语言** - 支持英文/中文等多语言切换

## ❓ 常见问题

### Q: 如何切换到 JavaScript 版本？

A: 项目默认使用 TypeScript。如需切换到 JavaScript：

1. 将所有 `.ts/.tsx` 文件重命名为 `.js/.jsx`
2. 删除 `tsconfig.json` 和 `tsconfig.node.json`
3. 移除 package.json 中的 TypeScript 相关依赖
4. 删除代码中的类型注解

### Q: 工具数据从哪里来？

A: 工具数据存储在 `public/tools.json` 文件中。这是一个静态JSON文件，你可以直接编辑添加新工具。未来可以接入数据库或CMS系统。

### Q: 如何自定义主题颜色？

A: 编辑 `src/index.css` 文件中的 CSS 自定义属性，或修改 `tailwind.config.js` 中的颜色配置。主要颜色变量：

- `--background`: 背景色
- `--foreground`: 前景文字色  
- `--primary`: 主色调
- `--violet-500` / `--cyan-500`: 渐变色

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 构建工具
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Lucide](https://lucide.dev/) - 图标库
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库

## 📧 联系我们

- 邮箱: contact@aiqiji.com
- GitHub: [AiQiji Team](https://github.com/aiqiji)
- 网站: [https://tools.aiqiji.com](https://tools.aiqiji.com)

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！