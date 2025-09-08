# 工具卡片Logo支持说明文档

## 📖 概述

工具卡片现在支持显示网站logo图片，可以使用本地SVG文件或外部图片链接。当logo存在时，优先显示logo；如果logo加载失败，会自动回退到原有的图标。

## 🎯 功能特性

- ✅ **优先显示logo**：logo存在时优先显示，图标作为备用
- ✅ **错误回退**：logo加载失败时自动显示原图标
- ✅ **主题适配**：支持多种主题适配模式
- ✅ **本地/远程支持**：支持本地SVG文件和外部图片链接
- ✅ **自动优化**：图片自动调整尺寸和比例

## 📋 数据结构

在 `public/tools.json` 中，每个工具对象支持以下logo相关字段：

```typescript
interface Tool {
  // ... 其他字段
  logoUrl?: string;      // logo图片链接（可选）
  logoTheme?: 'auto' | 'invert' | 'none';  // 主题适配模式（可选）
}
```

## 🎨 主题适配模式

### 1. `auto` - 自动适配（默认，推荐）
```json
{
  "logoUrl": "/icon/openai.svg",
  "logoTheme": "auto"
}
```
- **浅色模式**：保持原色显示
- **深色模式**：自动反色（CSS `invert` 滤镜）
- **适用于**：纯黑色图标

### 2. `invert` - 强制反色
```json
{
  "logoUrl": "/icon/apple.svg",
  "logoTheme": "invert"
}
```
- **任何模式**：都进行反色处理
- **适用于**：纯白色图标

### 3. `none` - 保持原色
```json
{
  "logoUrl": "/icon/google.svg",
  "logoTheme": "none"
}
```
- **任何模式**：都保持原始颜色
- **适用于**：彩色图标、品牌色图标

### 4. 不指定 - 默认为auto
```json
{
  "logoUrl": "/icon/github.svg"
  // logoTheme 默认为 'auto'
}
```

## 📁 本地SVG文件使用

### 文件放置
将SVG文件放在 `public` 目录下的任何位置：

```
public/
  ├── icon/
  │   ├── openai.svg
  │   ├── github.svg
  │   ├── google.svg
  │   └── apple.svg
  └── logos/
      ├── brand/
      │   ├── chatgpt.svg
      │   └── notion.svg
      └── companies/
          └── microsoft.svg
```

### 路径引用
使用相对于 `public` 目录的路径：

```json
// 推荐：放在 /icon/ 目录下
"logoUrl": "/icon/openai.svg"

// 子目录组织
"logoUrl": "/logos/brand/chatgpt.svg"

// 直接放在根目录
"logoUrl": "/company-logo.svg"
```

## 🌐 外部图片链接

也支持使用外部图片链接：

```json
{
  "logoUrl": "https://cdn.openai.com/chatgpt-logo.png",
  "logoTheme": "none"
}
```

**注意**：外部链接可能存在加载失败的风险，建议优先使用本地文件。

## 📝 完整示例

### 示例1：ChatGPT - 纯黑SVG图标
```json
{
  "id": "chatgpt",
  "name": "ChatGPT",
  "desc": "OpenAI开发的强大AI对话助手，能够回答问题、协助写作、编程等多种任务",
  "icon": "MessageSquare",
  "logoUrl": "/icon/openai.svg",
  "logoTheme": "auto",
  "category": "AI",
  "tags": ["AI", "对话", "写作", "编程"],
  "url": "https://chat.openai.com/",
  "featured": true
}
```

### 示例2：GitHub - 纯黑SVG图标
```json
{
  "id": "github",
  "name": "GitHub",
  "desc": "全球最大的代码托管平台，支持Git版本控制",
  "icon": "Github",
  "logoUrl": "/icon/github.svg",
  "logoTheme": "auto",
  "category": "开发",
  "url": "https://github.com/"
}
```

### 示例3：Google - 彩色品牌图标
```json
{
  "id": "google",
  "name": "Google",
  "desc": "全球最大的搜索引擎",
  "icon": "Search",
  "logoUrl": "/icon/google.svg",
  "logoTheme": "none",
  "category": "其它",
  "url": "https://www.google.com/"
}
```

### 示例4：Apple - 纯白SVG图标
```json
{
  "id": "apple",
  "name": "Apple",
  "desc": "苹果官方网站",
  "icon": "Apple",
  "logoUrl": "/icon/apple.svg",
  "logoTheme": "invert",
  "category": "其它",
  "url": "https://www.apple.com/"
}
```

## 💡 最佳实践

### 1. SVG文件优化
- 使用工具压缩SVG文件大小
- 移除不必要的metadata和注释
- 建议文件大小控制在10KB以内

### 2. 命名规范
- 使用工具名称或域名命名：`openai.svg`, `github.svg`
- 避免中文文件名和特殊字符
- 使用小写字母和连字符：`chat-gpt.svg`

### 3. 设计建议
- SVG建议设计为正方形比例
- 图标大小会自动调整为24x24px
- 确保在小尺寸下仍然清晰可辨

### 4. 主题选择指南
| 图标类型 | 推荐logoTheme | 说明 |
|---------|--------------|------|
| 纯黑图标 | `auto` | 深色模式自动反色 |
| 纯白图标 | `invert` | 强制反色保证可见性 |
| 彩色图标 | `none` | 保持品牌原色 |
| 品牌色图标 | `none` | 保持品牌识别度 |

### 5. 兼容性考虑
- 始终保留 `icon` 字段作为备用
- 测试logo在浅色/深色主题下的显示效果
- 考虑logo加载失败的情况

## 🔧 技术实现

### 渲染逻辑
```typescript
// 伪代码
if (tool.logoUrl) {
  // 显示logo图片
  <img src={tool.logoUrl} className={getThemeClass(tool.logoTheme)} />
  // 隐藏但保留图标作为备用
  <Icon className="hidden" />
} else {
  // 显示原有图标
  <Icon />
}
```

### 错误处理
当logo加载失败时：
1. 隐藏logo图片元素
2. 显示备用图标
3. 保持卡片布局不变

### 主题适配CSS
```css
/* auto模式 */
.dark .logo-auto { filter: invert(1); }

/* invert模式 */
.logo-invert { filter: invert(1); }

/* none模式 */
.logo-none { /* 无额外样式 */ }
```

## 📚 相关文件

- **类型定义**：`src/types/index.ts`
- **组件实现**：`src/components/MagicCard.tsx`
- **工具数据**：`public/tools.json`
- **图标目录**：`public/icon/`

---

**更新时间**：2024年1月
**版本**：v1.0.0
