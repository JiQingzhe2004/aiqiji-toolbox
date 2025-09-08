/**
 * 数据库初始化脚本
 * 创建数据库表结构并初始化管理员账户
 */

import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'tools_navigation',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  dialect: 'mysql',
  logging: console.log,
  timezone: '+08:00',
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
};

async function initializeDatabase() {
  let sequelize;
  
  try {
    console.log('🚀 开始初始化数据库...\n');
    
    // 连接数据库
    sequelize = new Sequelize(config);
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 创建表结构
    await createTables(sequelize);
    
    // 初始化管理员账户
    await initializeAdminUser(sequelize);
    
    console.log('\n🎉 数据库初始化完成!');
    console.log(`
📊 初始化完成:
- ✅ 创建 users 表
- ✅ 创建 tools 表
- ✅ 创建管理员账户

🔧 数据库信息:
- 数据库: ${config.database}
- 主机: ${config.host}:${config.port}
- 字符集: utf8mb4

👤 管理员账户:
- 用户名: admin
- 密码: admin123
- 角色: 管理员
    `);
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

async function createTables(sequelize) {
  console.log('📋 创建数据表...');
  
  // 创建 users 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` varchar(36) NOT NULL,
      \`username\` varchar(50) NOT NULL,
      \`email\` varchar(100) NOT NULL,
      \`password_hash\` varchar(255) NOT NULL,
      \`role\` enum('admin','user') DEFAULT 'user',
      \`status\` enum('active','inactive','banned') DEFAULT 'active',
      \`login_attempts\` int unsigned DEFAULT '0',
      \`last_login_attempt\` datetime DEFAULT NULL,
      \`last_login_success\` datetime DEFAULT NULL,
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`users_username_unique\` (\`username\`),
      UNIQUE KEY \`users_email_unique\` (\`email\`),
      KEY \`idx_users_role\` (\`role\`),
      KEY \`idx_users_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✅ users 表创建完成');
  
  // 创建 tools 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`tools\` (
      \`id\` varchar(255) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`description\` text NOT NULL,
      \`icon\` varchar(100) DEFAULT NULL,
      \`icon_url\` varchar(500) DEFAULT NULL,
      \`icon_file\` varchar(255) DEFAULT NULL,
      \`icon_theme\` enum('auto','light','dark','none') DEFAULT 'auto',
      \`category\` varchar(50) NOT NULL,
      \`tags\` json DEFAULT NULL,
      \`url\` varchar(500) NOT NULL,
      \`featured\` tinyint(1) DEFAULT '0',
      \`status\` enum('active','inactive','maintenance') DEFAULT 'active',
      \`rating_sum\` int unsigned DEFAULT '0',
      \`rating_count\` int unsigned DEFAULT '0',
      \`sort_order\` int DEFAULT '0',
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_tools_category\` (\`category\`),
      KEY \`idx_tools_featured\` (\`featured\`),
      KEY \`idx_tools_status\` (\`status\`),
      KEY \`idx_tools_sort_order\` (\`sort_order\`),
      KEY \`idx_tools_created_at\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✅ tools 表创建完成');
}

async function initializeAdminUser(sequelize) {
  console.log('👤 初始化管理员账户...');
  
  // 检查是否已存在管理员账户
  const [existingUsers] = await sequelize.query(
    "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
  );
  
  if (existingUsers[0].count > 0) {
    console.log('  ⚠️  管理员账户已存在，跳过初始化');
    return;
  }
  
  // 创建管理员账户
  const adminId = 'admin-' + Date.now();
  const username = 'admin';
  const email = 'admin@tools.local';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);
  
  await sequelize.query(`
    INSERT INTO users (
      id, username, email, password_hash, role, status, created_at, updated_at
    ) VALUES (
      :id, :username, :email, :passwordHash, 'admin', 'active', NOW(), NOW()
    )
  `, {
    replacements: {
      id: adminId,
      username: username,
      email: email,
      passwordHash: passwordHash
    }
  });
  
  console.log('  ✅ 管理员账户创建完成');
  console.log(`     - 用户名: ${username}`);
  console.log(`     - 密码: ${password}`);
  console.log(`     - 邮箱: ${email}`);
}

// 运行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };
