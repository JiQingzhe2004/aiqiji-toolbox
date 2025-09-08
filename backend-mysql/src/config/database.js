import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MySQL数据库连接配置
 */
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'aiqiji_tools',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: 'mysql',
  
  // 连接池配置
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // 日志配置
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // 时区配置
  timezone: '+08:00',
  
  // 其他配置
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

/**
 * 测试数据库连接
 */
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ MySQL数据库连接失败:', error.message);
    return false;
  }
}

/**
 * 同步数据库模型
 */
export async function syncDatabase() {
  try {
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false 
    });
    console.log('✅ 数据库模型同步成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error.message);
    return false;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
}

export default sequelize;
