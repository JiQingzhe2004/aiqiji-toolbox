# AiQiji工具箱后端API - MySQL版本

基于 Node.js + Express + MySQL + Sequelize 构建的RESTful API服务，支持工具管理和用户认证。

## 🚀 功能特性

### 核心功能
- ✅ **工具管理** - 完整的CRUD操作
- ✅ **图标上传** - 支持多种格式图片上传和处理
- ✅ **分类筛选** - 按类别组织工具
- ✅ **搜索功能** - 全文搜索工具名称、描述、标签
- ✅ **用户认证** - JWT身份验证和管理员权限
- ✅ **分页支持** - 高效的数据分页

### 技术特性
- 🔒 **安全防护** - CORS、Helmet、JWT认证
- 📊 **数据库** - MySQL + Sequelize ORM
- 📁 **文件存储** - 本地文件系统存储
- 🖼️ **图像处理** - Sharp库处理图片
- 🌍 **部署友好** - 适合各种服务器环境

## 📋 系统要求

- **Node.js**: >= 16.20.2
- **MySQL**: >= 5.7 或 MySQL 8.0
- **npm**: >= 7.0

## 🚀 快速开始

### 1. 安装依赖
```bash
cd backend-mysql
npm install
```

### 2. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 3. 创建数据库
```sql
CREATE DATABASE tools_navigation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 初始化数据库
```bash
npm run db:init
```

这将创建所有必要的表并设置管理员账户：
- **用户名**: `admin`
- **密码**: `admin123`

### 5. 启动服务
```bash
# 开发环境（自动重启）
npm run dev

# 生产环境
npm start
```

服务默认运行在 `http://localhost:3001`

## 🗂 数据库设计

### 主要数据表

#### users表（用户表）
- 用户认证和权限管理
- 支持管理员和普通用户角色
- 登录安全机制

#### tools表（工具表）
- 工具基本信息存储
- 支持分类、标签、评分
- 图标文件管理

## 🔧 环境变量配置

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tools_navigation
DB_USER=root
DB_PASSWORD=your_password

# 服务器配置
PORT=3001
NODE_ENV=production

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

## 📊 文件结构

```
backend-mysql/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库配置
│   ├── models/
│   │   ├── Tool.js              # 工具模型
│   │   └── User.js              # 用户模型
│   ├── controllers/
│   │   ├── toolController.js    # 工具控制器
│   │   └── authController.js    # 认证控制器
│   ├── routes/
│   │   ├── toolRoutes.js        # 工具路由
│   │   └── authRoutes.js        # 认证路由
│   ├── middleware/
│   │   ├── auth.js              # 认证中间件
│   │   └── upload.js            # 文件上传中间件
│   ├── database/
│   │   └── init.js              # 数据库初始化脚本
│   └── index.js                 # 应用入口
├── uploads/                     # 上传文件目录
├── package.json
├── env.example
└── README.md
```

## 🔍 API端点

### 认证相关
```http
POST /api/v1/auth/login         # 用户登录
POST /api/v1/auth/logout        # 用户登出
GET  /api/v1/auth/validate      # 验证token
```

### 工具相关
```http
GET    /api/v1/tools            # 获取工具列表
GET    /api/v1/tools/:id        # 获取单个工具
POST   /api/v1/tools            # 创建工具（需要认证）
PUT    /api/v1/tools/:id        # 更新工具（需要认证）
DELETE /api/v1/tools/:id        # 删除工具（需要认证）
GET    /api/v1/tools/featured   # 获取精选工具
GET    /api/v1/tools/stats      # 获取统计信息
```

### 其他
```http
GET /health                     # 健康检查
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否运行
   - 验证 `.env` 文件中的数据库配置
   - 确保数据库用户有足够权限

2. **文件上传失败**
   - 检查uploads目录权限
   - 验证文件大小限制
   - 确认文件类型支持

3. **JWT认证问题**
   - 确保JWT_SECRET已设置
   - 检查token是否正确传递
   - 验证用户权限

## 🔒 安全建议

⚠️ **重要**: 首次部署后，请立即：
1. 修改管理员默认密码
2. 更换JWT_SECRET为复杂随机字符串
3. 配置适当的CORS策略
4. 启用HTTPS（生产环境）

---

**维护者**: AiQiji团队