# AiQiji工具箱后端API - MySQL版本

基于 Node.js + Express + MySQL + Sequelize 构建的RESTful API服务，支持图标文件上传和存储。

## 🚀 功能特性

### 核心功能
- ✅ **工具管理** - 完整的CRUD操作
- ✅ **图标上传** - 支持多种格式图片上传和处理
- ✅ **分类筛选** - 按类别组织工具
- ✅ **搜索功能** - 全文搜索工具名称、描述、标签
- ✅ **统计分析** - 浏览量、点击量、评分统计
- ✅ **评分系统** - 用户可对工具进行评分
- ✅ **分页支持** - 高效的数据分页
- ✅ **文件处理** - 自动生成多尺寸图标

### 技术特性
- 🔒 **安全防护** - CORS、Helmet、文件验证
- 📊 **数据库** - MySQL + Sequelize ORM
- 📁 **文件存储** - 本地文件系统存储
- 🖼️ **图像处理** - Sharp库处理图片
- 📱 **响应式** - 支持移动端和桌面端
- 🌍 **部署友好** - 适合各种服务器环境

## 📋 API文档

### 基础信息
- **Base URL**: `http://your-server.com:3001/api/v1`
- **认证方式**: 暂无（管理功能可后续添加JWT）
- **数据格式**: JSON
- **字符编码**: UTF-8

### 响应格式
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

## 🛠 API端点

### 工具相关

#### 获取所有工具
```http
GET /api/v1/tools
```

**查询参数:**
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认20，最大100
- `sort` (string): 排序方式，可选值：`default`, `name`, `views`, `clicks`, `rating`, `latest`
- `category` (string): 分类筛选
- `featured` (boolean): 是否精选
- `status` (string): 状态筛选，默认`active`
- `q` (string): 搜索关键词

#### 创建工具（支持图标上传）
```http
POST /api/v1/tools
Content-Type: multipart/form-data

{
  "id": "new-tool",
  "name": "新工具",
  "description": "工具描述",
  "icon": "Tool",
  "category": "效率",
  "tags": ["工具", "效率"],
  "url": "https://example.com",
  "featured": false,
  "icon": [图标文件]
}
```

#### 上传图标
```http
POST /api/v1/tools/upload/icon
Content-Type: multipart/form-data

{
  "icon": [图标文件]
}
```

**支持的文件格式:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- SVG (.svg)
- WebP (.webp)

**文件限制:**
- 最大文件大小: 5MB
- 自动生成尺寸: 32x32, 64x64, 128x128, 256x256

### 其他端点

```http
GET /api/v1/tools/:id          # 获取单个工具
PUT /api/v1/tools/:id          # 更新工具
DELETE /api/v1/tools/:id       # 删除工具
POST /api/v1/tools/:id/click   # 记录点击
POST /api/v1/tools/:id/rate    # 工具评分
GET /api/v1/tools/featured     # 获取精选工具
GET /api/v1/tools/stats        # 获取统计信息
GET /health                    # 健康检查
GET /api/v1/info              # API信息
```

## 🗂 数据库设计

### Tools表结构
```sql
CREATE TABLE tools (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  icon_url VARCHAR(500),
  icon_file VARCHAR(255),
  icon_theme ENUM('auto', 'light', 'dark', 'none') DEFAULT 'auto',
  category ENUM('AI', '效率', '设计', '开发', '其他') NOT NULL,
  tags JSON,
  url VARCHAR(500) NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  view_count INT UNSIGNED DEFAULT 0,
  click_count INT UNSIGNED DEFAULT 0,
  rating_sum INT UNSIGNED DEFAULT 0,
  rating_count INT UNSIGNED DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 📋 系统要求

- **Node.js**: >= 16.20.2 (推荐使用 16.20.2 - 17.x 版本)
- **MySQL**: >= 5.7 或 MySQL 8.0
- **npm**: >= 7.0 (建议使用最新版本)
- **操作系统**: Windows, macOS, Linux

> **重要**: 当前版本专门针对Node.js 16.20.2优化，所有依赖包版本都已降级以确保兼容性。如果使用Node.js 18+版本，可能需要升级相关依赖包版本。

### Node.js 16兼容性优化
- ✅ 添加了fetch polyfill支持
- ✅ 降级Sharp到0.32.6版本
- ✅ 降级Sequelize到6.32.1版本
- ✅ 降级nodemon到2.0.22版本
- ✅ 使用兼容的mysql2版本

## 🚀 部署指南

### 本地开发

1. **安装依赖**
```bash
cd backend-mysql
npm install
```

2. **配置环境变量**
```bash
cp env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

3. **创建数据库**
```sql
CREATE DATABASE aiqiji_tools CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **运行数据库迁移**
```bash
npm run db:migrate
```

5. **启动开发服务器（自动导入种子数据）**
```bash
npm run dev
```

> 🌱 **自动种子数据**: 服务器启动时会自动执行SQL种子数据  
> 📁 **种子数据文件**: `backend-mysql/data/initial-tools.sql`  
> 🔧 **禁用方式**: 设置环境变量 `AUTO_SEED=false`  
> ✨ **优势**: 使用SQL INSERT IGNORE，既能在空数据库添加数据，也能补充缺失数据

**手动执行种子数据**（可选）:
```bash
# 执行种子数据
npm run db:seed
```

6. **启动生产服务器**
```bash
npm run dev
```

### 生产环境部署

#### 使用PM2部署

1. **安装PM2**
```bash
npm install -g pm2
```

2. **创建PM2配置文件**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'aiqiji-tools-api',
    script: 'src/index.js',
    cwd: '/path/to/backend-mysql',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

3. **启动应用**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 使用Docker部署

1. **创建Dockerfile**
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

2. **构建和运行**
```bash
docker build -t aiqiji-tools-api .
docker run -d -p 3001:3001 --name aiqiji-tools-api \
  -e DB_HOST=your-mysql-host \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  aiqiji-tools-api
```

### Nginx反向代理配置

```nginx
server {
    listen 80;
    server_name api.tools.aiqji.com;

    # 静态文件
    location /static/ {
        alias /path/to/backend-mysql/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API代理
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

## 🔧 环境变量

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aiqiji_tools
DB_USER=root
DB_PASSWORD=your_password

# 服务器配置
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tools.aiqji.com

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/svg+xml,image/webp

# 自动种子数据配置
AUTO_SEED=true              # 启动时自动导入种子数据 (默认: true)

# API配置
API_PREFIX=/api/v1
STATIC_URL=/static

# JWT配置（未来使用）
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
```

## 📊 文件结构

```
backend-mysql/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库配置
│   ├── models/
│   │   └── Tool.js              # 工具模型
│   ├── controllers/
│   │   └── toolController.js    # 工具控制器
│   ├── routes/
│   │   └── toolRoutes.js        # 工具路由
│   ├── middleware/
│   │   └── upload.js            # 文件上传中间件
│   ├── database/
│   │   ├── migrate.js           # 数据库迁移
│   │   └── seedSQL.js           # SQL种子数据
│   └── index.js                 # 应用入口
├── data/                        # 种子数据目录
│   ├── initial-tools.json      # 初始工具数据（源数据）
│   └── initial-tools.sql       # SQL种子数据（自动生成）
├── scripts/                     # 工具脚本目录
│   └── generate-sql.js         # SQL生成脚本
├── uploads/                     # 上传文件目录
│   └── icons/                   # 图标文件
├── logs/                        # 日志目录
├── package.json
├── env.example
└── README.md
```

## 🔍 监控和维护

### 日志查看
```bash
# PM2日志
pm2 logs aiqiji-tools-api

# 实时监控
pm2 monit
```

### 数据库维护
```bash
# 重置数据库
npm run db:reset

# 备份数据库
mysqldump -u root -p aiqiji_tools > backup.sql

# 恢复数据库
mysql -u root -p aiqiji_tools < backup.sql
```

### 性能优化

1. **数据库索引** - 已创建常用字段索引
2. **文件缓存** - Nginx静态文件缓存
3. **进程管理** - PM2集群模式
4. **内存监控** - 自动重启机制

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否运行
   - 验证数据库连接参数
   - 确认数据库用户权限

2. **文件上传失败**
   - 检查uploads目录权限
   - 验证文件大小限制
   - 确认文件类型支持

3. **图标显示不正常**
   - 检查静态文件路径配置
   - 确认Nginx代理设置
   - 验证文件是否存在

4. **Node.js版本兼容问题**
   - `ReferenceError: fetch is not defined`: 已添加fetch polyfill支持
   - `Could not load the "sharp" module`: 降级Sharp到0.32.6版本
   - `Module not found`: 检查Node.js版本是否为16.20.2+
   - 所有依赖包已降级至兼容Node.js 16的版本
   
   **解决方案**: 
   ```bash
   cd backend-mysql
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```
   
   **依赖版本说明**:
   - `sharp`: 0.32.6 (兼容Node.js 16)
   - `sequelize`: 6.32.1 (兼容Node.js 16)
   - `nodemon`: 2.0.22 (兼容Node.js 16)

## 📞 技术支持

- 📧 邮箱: support@aiqji.com
- 🐛 Bug报告: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 文档: [API文档](http://your-server.com:3001/api/v1/info)

---

**最后更新**: 2024年1月
**维护者**: AiQiji团队
