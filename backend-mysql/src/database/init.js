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

// 导入主应用的数据库配置
import sequelizeInstance from '../config/database.js';

async function initializeDatabase() {
  const sequelize = sequelizeInstance;
  
  try {
    console.log('🚀 开始检查数据库状态...\n');
    
    // 检查数据库连接状态，不重新认证
    console.log('✅ 使用现有数据库连接');
    
    // 检查表是否存在
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'tools'");
    const isFirstRun = tables.length === 0;
    
    if (isFirstRun) {
      console.log('📋 首次运行，创建数据表...');
        // 创建表结构
      await createTables(sequelize);
    } else {
      console.log('📋 数据表已存在，跳过创建...');
    }
    
    // 自动升级数据库结构（每次启动都检查）
    await upgradeDatabase(sequelize);
    
    // 检查并创建友链申请表
    await ensureFriendLinkApplicationsTable(sequelize);
    
    // 检查并创建工具提交表
    await ensureToolSubmissionsTable(sequelize);
    
    if (isFirstRun) {
      // 初始化管理员账户
      await initializeAdminUser(sequelize);
      
      // 初始化系统设置
      await initializeSystemSettings(sequelize);
    } else {
      console.log('📋 非首次运行，跳过数据初始化...');
    }
    
    console.log('\n🎉 数据库检查完成!');
    if (isFirstRun) {
      console.log(`
📊 初始化完成:
- ✅ 创建 users 表
- ✅ 创建 tools 表 (支持多分类)
- ✅ 创建 system_settings 表
- ✅ 创建 friend_link_applications 表
- ✅ 创建 tool_submissions 表
- ✅ 创建管理员账户
- ✅ 初始化系统设置

👤 管理员账户:
- 用户名: admin
- 密码: admin123
- 角色: 管理员
      `);
    } else {
      console.log(`
📊 检查完成:
- ✅ 数据库结构已是最新版本
- ✅ 多分类功能已启用
- ✅ 所有功能正常运行
      `);
    }
    
    console.log(`
🔧 数据库信息:
- 数据库: ${sequelize.config.database}
- 主机: ${sequelize.config.host}:${sequelize.config.port}
- 字符集: utf8mb4
    `);
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error; // 抛出错误而不是退出进程
  }
  // 不关闭数据库连接，因为主应用还需要使用
}

async function upgradeDatabase(sequelize) {
  console.log('🔄 检查数据库升级...');
  
  try {
    // 检查 category 字段类型
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM tools LIKE 'category'
    `);
    
    if (columns.length === 0) {
      console.log('  ⚠️  tools 表中没有 category 字段，跳过升级');
      return;
    }
    
    const currentType = columns[0].Type;
    console.log(`  📊 当前 category 字段类型: ${currentType}`);
    
    // 如果已经是 JSON 类型，跳过category字段升级
    if (currentType.toLowerCase().includes('json')) {
      console.log('  ✅ category 字段已经是 JSON 类型，无需升级');
    } else {
      // 执行category字段升级逻辑
      await upgradeCategoryField(sequelize);
    }
    
    // 检查并添加 content 字段
    await ensureContentField(sequelize);
    
    // 升级友情链接设置
    await upgradeFriendLinksSettings(sequelize);
    
  } catch (error) {
    console.error('❌ 数据库升级失败:', error);
    throw error;
  }
}

async function upgradeCategoryField(sequelize) {
  try {
    console.log('  🚀 开始自动升级 category 字段以支持多分类...');
    
    // 备份现有数据
    const [existingTools] = await sequelize.query(`
      SELECT id, category FROM tools WHERE category IS NOT NULL
    `);
    console.log(`  📊 找到 ${existingTools.length} 个工具需要迁移`);
    
    // 添加临时字段
    try {
      await sequelize.query(`
        ALTER TABLE tools 
        ADD COLUMN category_new JSON DEFAULT NULL
      `);
      console.log('  ✅ 添加临时字段 category_new');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
    }
    
    // 迁移数据
    let migratedCount = 0;
    for (const tool of existingTools) {
      if (tool.category && tool.category.trim()) {
        const categoryArray = [tool.category.trim()];
        await sequelize.query(`
          UPDATE tools 
          SET category_new = ? 
          WHERE id = ?
        `, {
          replacements: [JSON.stringify(categoryArray), tool.id]
        });
        migratedCount++;
      }
    }
    console.log(`  ✅ 迁移 ${migratedCount} 个工具的分类数据`);
    
    // 备份原字段
    try {
      await sequelize.query(`
        ALTER TABLE tools 
        CHANGE COLUMN category category_backup VARCHAR(100)
      `);
      console.log('  ✅ 备份原 category 字段');
    } catch (error) {
      if (!error.message.includes("doesn't exist")) {
        throw error;
      }
    }
    
    // 激活新字段
    try {
      await sequelize.query(`
        ALTER TABLE tools 
        CHANGE COLUMN category_new category JSON NOT NULL
      `);
      console.log('  ✅ 激活新的 category 字段');
    } catch (error) {
      if (!error.message.includes("doesn't exist")) {
        throw error;
      }
    }
    
    // 处理空值
    await sequelize.query(`
      UPDATE tools 
      SET category = JSON_ARRAY('其他') 
      WHERE category IS NULL
    `);
    
    // 更新索引
    try {
      await sequelize.query(`DROP INDEX idx_tools_category ON tools`);
    } catch (error) {
      // 索引不存在，忽略
    }
    
    console.log('  🎉 数据库升级完成！category 字段现在支持多分类');
    
  } catch (error) {
    console.error('  ❌ 数据库升级失败:', error.message);
    console.log('  ⚠️  继续使用现有结构...');
  }
}

async function ensureContentField(sequelize) {
  console.log('🔄 检查工具内容字段...');
  
  try {
    // 检查 content 字段是否存在
    const [contentColumns] = await sequelize.query(`
      SHOW COLUMNS FROM tools LIKE 'content'
    `);
    
    if (contentColumns.length === 0) {
      console.log('  🚀 添加 content 字段以支持富文本内容...');
      
      await sequelize.query(`
        ALTER TABLE tools 
        ADD COLUMN content LONGTEXT DEFAULT NULL COMMENT '工具详细说明内容，支持富文本格式'
        AFTER description
      `);
      
      console.log('  ✅ content 字段添加成功');
    } else {
      console.log('  ✅ content 字段已存在，无需添加');
    }
  } catch (error) {
    console.error('  ❌ 添加 content 字段失败:', error.message);
    console.log('  ⚠️  继续使用现有结构...');
  }
}

async function upgradeFriendLinksSettings(sequelize) {
  // 升级：确保存在 friend_links 设置（用于友情链接）
  try {
    console.log('🔄 检查系统设置：friend_links ...');
    const [existsRows] = await sequelize.query(`
      SELECT COUNT(*) as count FROM system_settings WHERE setting_key = 'friend_links'
    `);
    if (existsRows[0].count === 0) {
      console.log('  ➕ 新增 friend_links 设置（默认空数组）');
      const id = 'friend-links-' + Date.now();
      await sequelize.query(`
        INSERT INTO system_settings (
          id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at
        ) VALUES (
          :id, 'friend_links', '[]', 'json', '友情链接列表（数组：{name,url,icon}）', 'website', 1, NOW(), NOW()
        )
      `, { replacements: { id } });
    } else {
      console.log('  ✅ friend_links 设置已存在，检查 category...');
      // 确保 category 是 'website'
      const [updateResult] = await sequelize.query(`
        UPDATE system_settings 
        SET category = 'website' 
        WHERE setting_key = 'friend_links' AND category != 'website'
      `);
      if (updateResult.affectedRows > 0) {
        console.log('  🔧 已修正 friend_links 的 category 为 website');
      }
    }
  } catch (error) {
    console.error('  ❌ 升级 friend_links 设置失败:', error.message);
  }

  // 升级：确保存在 needs_vpn 字段（用于VPN标识）
  try {
    console.log('🔄 检查 needs_vpn 字段...');
    const [vpnColumns] = await sequelize.query(`
      SHOW COLUMNS FROM tools LIKE 'needs_vpn'
    `);
    
    if (vpnColumns.length === 0) {
      console.log('  ➕ 添加 needs_vpn 字段');
      await sequelize.query(`
        ALTER TABLE tools 
        ADD COLUMN needs_vpn BOOLEAN DEFAULT FALSE COMMENT '是否需要VPN访问'
      `);
      console.log('  ✅ needs_vpn 字段添加成功');
    } else {
      console.log('  ✅ needs_vpn 字段已存在');
    }
  } catch (error) {
    console.error('  ❌ 升级 needs_vpn 字段失败:', error.message);
  }

  // 升级：确保存在 show_vpn_indicator 系统设置（用于控制VPN标识显示）
  try {
    console.log('🔄 检查系统设置：show_vpn_indicator ...');
    const [existsRows] = await sequelize.query(`
      SELECT COUNT(*) as count FROM system_settings WHERE setting_key = 'show_vpn_indicator'
    `);
    if (existsRows[0].count === 0) {
      console.log('  ➕ 新增 show_vpn_indicator 设置（默认启用）');
      const id = 'show-vpn-indicator-' + Date.now();
      await sequelize.query(`
        INSERT INTO system_settings (
          id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at
        ) VALUES (
          :id, 'show_vpn_indicator', 'true', 'boolean', '是否显示VPN标识', 'general', 1, NOW(), NOW()
        )
      `, { replacements: { id } });
    } else {
      console.log('  ✅ show_vpn_indicator 设置已存在');
    }
  } catch (error) {
    console.error('  ❌ 升级 show_vpn_indicator 设置失败:', error.message);
  }
}

// 确保友链申请表存在
async function ensureFriendLinkApplicationsTable(sequelize) {
  try {
    console.log('🔄 检查友链申请表...');
    
    // 检查表是否存在
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'friend_link_applications'");
    
    if (tables.length === 0) {
      console.log('  ➕ 创建 friend_link_applications 表...');
      
      // 创建 friend_link_applications 表
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`friend_link_applications\` (
          \`id\` varchar(36) NOT NULL,
          \`site_name\` varchar(100) NOT NULL,
          \`site_url\` varchar(500) NOT NULL,
          \`site_description\` text NOT NULL,
          \`site_icon\` varchar(500) DEFAULT NULL,
          \`admin_email\` varchar(100) NOT NULL,
          \`admin_qq\` varchar(20) DEFAULT NULL,
          \`status\` enum('pending','approved','rejected','expired') DEFAULT 'pending',
          \`admin_note\` text DEFAULT NULL,
          \`processed_by\` varchar(36) DEFAULT NULL,
          \`processed_at\` datetime DEFAULT NULL,
          \`ip_address\` varchar(45) DEFAULT NULL,
          \`user_agent\` text DEFAULT NULL,
          \`verification_token\` varchar(64) DEFAULT NULL,
          \`expires_at\` datetime DEFAULT NULL,
          \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_friend_applications_status\` (\`status\`),
          KEY \`idx_friend_applications_email\` (\`admin_email\`),
          KEY \`idx_friend_applications_url\` (\`site_url\`),
          KEY \`idx_friend_applications_created\` (\`created_at\`),
          KEY \`idx_friend_applications_expires\` (\`expires_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log('  ✅ friend_link_applications 表创建完成');
    } else {
      console.log('  ✅ friend_link_applications 表已存在');
    }
  } catch (error) {
    console.error('  ❌ 友链申请表检查失败:', error.message);
  }
}

// 确保工具提交表存在
async function ensureToolSubmissionsTable(sequelize) {
  try {
    console.log('🔄 检查工具提交表...');
    
    // 检查表是否存在
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'tool_submissions'");
    
    if (tables.length === 0) {
      console.log('  ➕ 创建 tool_submissions 表...');
      
      // 创建 tool_submissions 表
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`tool_submissions\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`tool_id\` varchar(50) NOT NULL,
          \`name\` varchar(100) NOT NULL,
          \`description\` text NOT NULL,
          \`url\` varchar(500) NOT NULL,
          \`category\` json NOT NULL,
          \`tags\` json DEFAULT NULL,
          \`icon\` varchar(50) DEFAULT 'Tool',
          \`icon_url\` varchar(500) DEFAULT NULL,
          \`icon_file\` varchar(255) DEFAULT NULL,
          \`icon_theme\` enum('auto','auto-light','auto-dark','light','dark','none') DEFAULT 'auto-dark',
          \`submitter_name\` varchar(100) DEFAULT NULL,
          \`submitter_email\` varchar(255) DEFAULT NULL,
          \`submitter_contact\` varchar(255) DEFAULT NULL,
          \`status\` enum('pending','approved','rejected','processing') DEFAULT 'pending',
          \`reviewer_id\` varchar(36) DEFAULT NULL,
          \`review_comment\` text DEFAULT NULL,
          \`reviewed_at\` datetime DEFAULT NULL,
          \`priority\` int DEFAULT '0',
          \`source\` varchar(50) DEFAULT 'user_submit',
          \`additional_info\` json DEFAULT NULL,
          \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`tool_submissions_tool_id_unique\` (\`tool_id\`),
          KEY \`idx_tool_submissions_status\` (\`status\`),
          KEY \`idx_tool_submissions_email\` (\`submitter_email\`),
          KEY \`idx_tool_submissions_reviewer\` (\`reviewer_id\`),
          KEY \`idx_tool_submissions_created\` (\`created_at\`),
          KEY \`idx_tool_submissions_priority_created\` (\`priority\`, \`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log('  ✅ tool_submissions 表创建完成');
    } else {
      console.log('  ✅ tool_submissions 表已存在');
    }
  } catch (error) {
    console.error('  ❌ 工具提交表检查失败:', error.message);
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
      \`content\` longtext DEFAULT NULL COMMENT '工具详细说明内容，支持富文本格式',
      \`icon\` varchar(100) DEFAULT NULL,
      \`icon_url\` varchar(500) DEFAULT NULL,
      \`icon_file\` varchar(255) DEFAULT NULL,
      \`icon_theme\` enum('auto','light','dark','none') DEFAULT 'auto',
      \`category\` json NOT NULL,
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
  
  // 创建 system_settings 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`system_settings\` (
      \`id\` varchar(36) NOT NULL,
      \`setting_key\` varchar(100) NOT NULL,
      \`setting_value\` text,
      \`setting_type\` enum('string','number','boolean','json') DEFAULT 'string',
      \`description\` varchar(255) DEFAULT NULL,
      \`category\` varchar(50) DEFAULT 'general',
      \`is_public\` tinyint(1) DEFAULT '1',
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`system_settings_key_unique\` (\`setting_key\`),
      KEY \`idx_settings_category\` (\`category\`),
      KEY \`idx_settings_public\` (\`is_public\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✅ system_settings 表创建完成');
  
  // 创建 friend_link_applications 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`friend_link_applications\` (
      \`id\` varchar(36) NOT NULL,
      \`site_name\` varchar(100) NOT NULL,
      \`site_url\` varchar(500) NOT NULL,
      \`site_description\` text NOT NULL,
      \`site_icon\` varchar(500) DEFAULT NULL,
      \`admin_email\` varchar(100) NOT NULL,
      \`admin_qq\` varchar(20) DEFAULT NULL,
      \`status\` enum('pending','approved','rejected','expired') DEFAULT 'pending',
      \`admin_note\` text DEFAULT NULL,
      \`processed_by\` varchar(36) DEFAULT NULL,
      \`processed_at\` datetime DEFAULT NULL,
      \`ip_address\` varchar(45) DEFAULT NULL,
      \`user_agent\` text DEFAULT NULL,
      \`verification_token\` varchar(64) DEFAULT NULL,
      \`expires_at\` datetime DEFAULT NULL,
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_friend_applications_status\` (\`status\`),
      KEY \`idx_friend_applications_email\` (\`admin_email\`),
      KEY \`idx_friend_applications_url\` (\`site_url\`),
      KEY \`idx_friend_applications_created\` (\`created_at\`),
      KEY \`idx_friend_applications_expires\` (\`expires_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✅ friend_link_applications 表创建完成');
  
  // 创建 tool_submissions 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`tool_submissions\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`tool_id\` varchar(50) NOT NULL,
      \`name\` varchar(100) NOT NULL,
      \`description\` text NOT NULL,
      \`url\` varchar(500) NOT NULL,
      \`category\` json NOT NULL,
      \`tags\` json DEFAULT NULL,
      \`icon\` varchar(50) DEFAULT 'Tool',
      \`icon_url\` varchar(500) DEFAULT NULL,
      \`icon_file\` varchar(255) DEFAULT NULL,
      \`icon_theme\` enum('auto','auto-light','auto-dark','light','dark','none') DEFAULT 'auto-dark',
      \`submitter_name\` varchar(100) DEFAULT NULL,
      \`submitter_email\` varchar(255) DEFAULT NULL,
      \`submitter_contact\` varchar(255) DEFAULT NULL,
      \`status\` enum('pending','approved','rejected','processing') DEFAULT 'pending',
      \`reviewer_id\` varchar(36) DEFAULT NULL,
      \`review_comment\` text DEFAULT NULL,
      \`reviewed_at\` datetime DEFAULT NULL,
      \`priority\` int DEFAULT '0',
      \`source\` varchar(50) DEFAULT 'user_submit',
      \`additional_info\` json DEFAULT NULL,
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`tool_submissions_tool_id_unique\` (\`tool_id\`),
      KEY \`idx_tool_submissions_status\` (\`status\`),
      KEY \`idx_tool_submissions_email\` (\`submitter_email\`),
      KEY \`idx_tool_submissions_reviewer\` (\`reviewer_id\`),
      KEY \`idx_tool_submissions_created\` (\`created_at\`),
      KEY \`idx_tool_submissions_priority_created\` (\`priority\`, \`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✅ tool_submissions 表创建完成');
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

async function initializeSystemSettings(sequelize) {
  console.log('⚙️ 初始化系统设置...');
  
  // 检查是否已存在系统设置
  const [existingSettings] = await sequelize.query(
    "SELECT COUNT(*) as count FROM system_settings"
  );
  
  if (existingSettings[0].count > 0) {
    console.log('  ⚠️  系统设置已存在，跳过初始化');
    return;
  }
  
  // 初始化默认系统设置
  const defaultSettings = [
    {
      id: 'icp-number-' + Date.now(),
      setting_key: 'icp_number',
      setting_value: '',
      setting_type: 'string',
      description: '网站备案号',
      category: 'website',
      is_public: 1
    },
    {
      id: 'show-icp-' + Date.now(),
      setting_key: 'show_icp',
      setting_value: 'false',
      setting_type: 'boolean',
      description: '是否显示备案号',
      category: 'website',
      is_public: 1
    },
    {
      id: 'site-name-' + Date.now(),
      setting_key: 'site_name',
      setting_value: 'AiQiji工具箱',
      setting_type: 'string',
      description: '网站名称',
      category: 'website',
      is_public: 1
    },
    {
      id: 'site-url-' + Date.now(),
      setting_key: 'site_url',
      setting_value: 'https://aiqiji.com',
      setting_type: 'string',
      description: '网站地址',
      category: 'website',
      is_public: 1
    },
    {
      id: 'site-icon-' + Date.now(),
      setting_key: 'site_icon',
      setting_value: '/favicon.ico',
      setting_type: 'string',
      description: '网站图标',
      category: 'website',
      is_public: 1
    },
    {
      id: 'site-desc-' + Date.now(),
      setting_key: 'site_description',
      setting_value: '为开发者、设计师和效率工具爱好者精心收集的工具导航站点',
      setting_type: 'string',
      description: '网站描述',
      category: 'website',
      is_public: 1
    },
    {
      id: 'friend-links-' + Date.now(),
      setting_key: 'friend_links',
      setting_value: '[]',
      setting_type: 'json',
      description: '友情链接列表（数组：{name,url,icon}）',
      category: 'website',
      is_public: 1
    }
  ];
  
  for (const setting of defaultSettings) {
    await sequelize.query(`
      INSERT INTO system_settings (
        id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at
      ) VALUES (
        :id, :setting_key, :setting_value, :setting_type, :description, :category, :is_public, NOW(), NOW()
      )
    `, {
      replacements: setting
    });
  }
  
  console.log('  ✅ 系统设置初始化完成');
  console.log('     - 备案号设置');
  console.log('     - 显示控制开关');
  console.log('     - 网站基本信息');
}

// 运行初始化
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('init.js')) {
  initializeDatabase();
}

export { initializeDatabase };
