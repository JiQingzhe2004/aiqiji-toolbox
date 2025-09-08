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
import toolRoutes from './routes/toolRoutes.js';
import { executeSQLSeed } from './database/seedSQL.js';

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

    // CORS配置
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://tools.aiqji.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:5173',
      'http://127.0.0.1:5173'
    ];

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
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
            health: '/health',
            info: `${this.apiPrefix}/info`,
            static: process.env.STATIC_URL || '/static'
          },
          features: [
            '工具CRUD操作',
            '图标文件上传',
            '搜索和筛选',
            '统计分析',
            '点击和评分记录'
          ],
          contact: {
            author: 'AiQiji',
            website: 'https://tools.aiqji.com'
          }
        }
      });
    });

    // 工具相关路由
    this.app.use(`${this.apiPrefix}/tools`, toolRoutes);


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

      // 自动执行SQL种子数据（可通过环境变量控制）
      const autoSeed = process.env.AUTO_SEED !== 'false'; // 默认启用
      if (autoSeed) {
        try {
          console.log('🌱 执行SQL种子数据...');
          const seedResult = await executeSQLSeed();
          if (seedResult.affectedRows > 0) {
            console.log(`✅ 成功插入 ${seedResult.affectedRows} 条新数据`);
          } else {
            console.log('ℹ️ 数据库已包含所有数据，无需插入');
          }
        } catch (error) {
          console.warn('⚠️ SQL种子数据执行失败，继续启动服务:', error.message);
        }
      } else {
        console.log('ℹ️ 已禁用自动种子数据导入 (AUTO_SEED=false)');
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
🌱 自动种子数据: ${process.env.AUTO_SEED !== 'false' ? '启用' : '禁用'}
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
