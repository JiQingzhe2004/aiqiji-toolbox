// Node.js 16 兼容性: 导入polyfills (必须在所有其他导入之前)
import './polyfills.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 导入配置和模块
import sequelize, { testConnection, syncDatabase, closeConnection } from './config/database.js';
import { initializeDatabase } from './database/init.js';
import toolRoutes from './routes/toolRoutes.js';
import authRoutes from './routes/authRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import importRoutes from './routes/importRoutes.js';
import friendLinkRoutes from './routes/friendLinkRoutes.js';
import toolSubmissionRoutes from './routes/toolSubmissionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import emailRoutes from './routes/emailRoutes.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AiQiji工具箱后端API服务 - MySQL版本
 */
class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.apiPrefix = process.env.API_PREFIX || '/api/v1';
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * 初始化中间件
   */
  initializeMiddlewares() {
    // 信任代理
    this.app.set('trust proxy', 1);

    // 安全头
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "*"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"]
        }
      }
    }));

    // CORS配置 - 从环境变量读取允许的域名
    const allowedOrigins = [];
    
    // 添加主要前端域名
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // 添加额外的前端域名（逗号分隔）
    if (process.env.FRONTEND_URLS) {
      const additionalUrls = process.env.FRONTEND_URLS.split(',').map(url => url.trim());
      allowedOrigins.push(...additionalUrls);
    }
    
    // 开发环境域名
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5173',
        'https://localhost:5173',
        'http://127.0.0.1:5173'
      );
    }
    
    // 如果没有配置任何域名，使用默认值
    if (allowedOrigins.length === 0) {
      allowedOrigins.push('https://tools.aiqji.com');
    }
    
    // 输出CORS配置信息（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 CORS允许的域名:', allowedOrigins);
    }

    this.app.use(cors({
      origin: function (origin, callback) {
        // 允许没有origin的请求（比如移动应用或Postman）
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // 请求日志
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // 请求体解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 压缩响应
    this.app.use(compression());

    // 静态文件服务
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const staticUrl = process.env.STATIC_URL || '/static';
    this.app.use(staticUrl, express.static(uploadDir));
    
    // 图标文件专用路径 (映射到 uploads/icons)
    this.app.use('/icon', express.static(path.join(uploadDir, 'icons')));

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ 
        success: true, 
        message: '服务运行正常',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
  }

  /**
   * 初始化路由
   */
  initializeRoutes() {
    // API信息
    this.app.get(`${this.apiPrefix}/info`, (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'AiQiji工具箱 API - MySQL版本',
          version: '1.0.0',
          description: '基于Node.js + MySQL的工具导航API服务',
          endpoints: {
            tools: `${this.apiPrefix}/tools`,
            auth: `${this.apiPrefix}/auth`,
            settings: `${this.apiPrefix}/settings`,
            import: `${this.apiPrefix}/import`,
            email: `${this.apiPrefix}/email`,
            'friend-links': `${this.apiPrefix}/friend-links`,
            'tool-submissions': `${this.apiPrefix}/tool-submissions`,
            health: '/health',
            info: `${this.apiPrefix}/info`,
            static: process.env.STATIC_URL || '/static'
          },
          features: [
            '工具CRUD操作',
            '图标文件上传',
            '搜索和筛选',
            '统计分析',
            '点击和评分记录',
            'Excel批量导入导出',
            '用户认证和权限管理'
          ],
          contact: {
            author: 'AiQiji',
            website: process.env.FRONTEND_URL || 'https://tools.aiqji.com',
            ...(process.env.FRONTEND_URLS && {
              mirrors: process.env.FRONTEND_URLS.split(',').map(url => url.trim())
            })
          }
        }
      });
    });

    // 身份验证路由
    this.app.use(`${this.apiPrefix}/auth`, authRoutes);
    
    // 工具相关路由
    this.app.use(`${this.apiPrefix}/tools`, toolRoutes);
    
    // 系统设置路由
    this.app.use(`${this.apiPrefix}/settings`, settingsRoutes);
    
    // 导入导出路由
    this.app.use(`${this.apiPrefix}/import`, importRoutes);
    
    // 友链申请路由
    this.app.use(`${this.apiPrefix}/friend-links`, friendLinkRoutes);
    
    // 工具提交路由
    this.app.use(`${this.apiPrefix}/tool-submissions`, toolSubmissionRoutes);
    
    // 邮件路由
    this.app.use(`${this.apiPrefix}/email`, emailRoutes);

    // 用户管理（管理员）
    this.app.use(`${this.apiPrefix}/users`, userRoutes);

    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '欢迎使用AiQiji工具箱API - MySQL版本',
        version: '1.0.0',
        documentation: `${req.protocol}://${req.get('host')}${this.apiPrefix}/info`
      });
    });

    // 404处理
    this.app.all('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `路径 ${req.originalUrl} 不存在`
      });
    });
  }

  /**
   * 初始化错误处理
   */
  initializeErrorHandling() {
    // 全局错误处理
    this.app.use((error, req, res, next) => {
      console.error('服务器错误:', error);
      
      res.status(error.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : '服务器内部错误'
      });
    });

    // 未捕获的异常处理
    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
      this.gracefulShutdown();
    });

    // 未处理的Promise拒绝
    process.on('unhandledRejection', (err) => {
      console.error('未处理的Promise拒绝:', err);
      this.gracefulShutdown();
    });

    // 优雅关闭信号
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，开始优雅关闭...');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      console.log('收到SIGINT信号，开始优雅关闭...');
      this.gracefulShutdown();
    });
  }

  /**
   * 优雅关闭服务器
   */
  async gracefulShutdown() {
    try {
      // 关闭HTTP服务器
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        console.log('✅ HTTP服务器已关闭');
      }

      // 关闭数据库连接
      await closeConnection();

      console.log('✅ 服务器已优雅关闭');
      process.exit(0);
    } catch (error) {
      console.error('❌ 优雅关闭失败:', error);
      process.exit(1);
    }
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      // 测试数据库连接
      const dbConnected = await testConnection();
      if (!dbConnected) {
        throw new Error('数据库连接失败');
      }

      // 同步数据库模型
      await syncDatabase();

      // 自动运行数据库初始化和升级
      console.log('🔄 正在自动检查和升级数据库...');
      try {
        await initializeDatabase();
        console.log('✅ 数据库初始化和升级完成');
      } catch (error) {
        console.error('⚠️ 数据库初始化失败，但服务继续启动:', error.message);
        // 继续启动服务，不中断
      }

      // 启动HTTP服务器
      this.server = this.app.listen(this.port, () => {
        console.log(`
🚀 AiQiji工具箱API服务已启动 (MySQL版本)
📍 地址: http://localhost:${this.port}
🌐 API端点: http://localhost:${this.port}${this.apiPrefix}
🔧 环境: ${process.env.NODE_ENV || 'development'}
📊 数据库: MySQL (已连接)
📁 静态文件: ${process.env.STATIC_URL || '/static'}
🗂️ 初始化: 使用 npm run db:init
⏰ 启动时间: ${new Date().toISOString()}
        `);
      });

      return this.server;
    } catch (error) {
      console.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }
}

// 启动服务器
if (process.env.NODE_ENV !== 'test') {
  const server = new Server();
  server.start();
}

export default Server;
