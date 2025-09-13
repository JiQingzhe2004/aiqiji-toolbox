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
    
    // 检查并创建验证码表
    await ensureVerificationCodesTable(sequelize);
    
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
  try {
    // 检查 category 字段类型
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM tools LIKE 'category'
    `);
    
    if (columns.length === 0) {
      return;
    }
    
    const currentType = columns[0].Type;
    
    // 如果已经是 JSON 类型，跳过category字段升级
    if (!currentType.toLowerCase().includes('json')) {
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
  try {
    // 检查 content 字段是否存在
    const [contentColumns] = await sequelize.query(`
      SHOW COLUMNS FROM tools LIKE 'content'
    `);
    
    if (contentColumns.length === 0) {
      await sequelize.query(`
        ALTER TABLE tools 
        ADD COLUMN content LONGTEXT DEFAULT NULL COMMENT '工具详细说明内容，支持富文本格式'
        AFTER description
      `);
    }
  } catch (error) {
    // 静默处理错误，继续执行
  }
}

async function upgradeFriendLinksSettings(sequelize) {
  // 升级：确保存在 friend_links 设置（用于友情链接）
  try {
    const [existsRows] = await sequelize.query(`
      SELECT COUNT(*) as count FROM system_settings WHERE setting_key = 'friend_links'
    `);
    if (existsRows[0].count === 0) {
      const id = 'friend-links-' + Date.now();
      await sequelize.query(`
        INSERT INTO system_settings (
          id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at
        ) VALUES (
          :id, 'friend_links', '[]', 'json', '友情链接列表（数组：{name,url,icon}）', 'website', 1, NOW(), NOW()
        )
      `, { replacements: { id } });
    } else {
      // 确保 category 是 'website'
      await sequelize.query(`
        UPDATE system_settings 
        SET category = 'website' 
        WHERE setting_key = 'friend_links' AND category != 'website'
      `);
    }
  } catch (error) {
    // 静默处理错误
  }

  // 升级：确保存在 needs_vpn 字段（用于VPN标识）
  try {
    const [vpnColumns] = await sequelize.query(`
      SHOW COLUMNS FROM tools LIKE 'needs_vpn'
    `);
    
    if (vpnColumns.length === 0) {
      await sequelize.query(`
        ALTER TABLE tools 
        ADD COLUMN needs_vpn BOOLEAN DEFAULT FALSE COMMENT '是否需要VPN访问'
      `);
    }
  } catch (error) {
    // 静默处理错误
  }

  // 升级：确保存在 show_vpn_indicator 系统设置（用于控制VPN标识显示）
  try {
    const [existsRows] = await sequelize.query(`
      SELECT COUNT(*) as count FROM system_settings WHERE setting_key = 'show_vpn_indicator'
    `);
    if (existsRows[0].count === 0) {
      const id = 'show-vpn-indicator-' + Date.now();
      await sequelize.query(`
        INSERT INTO system_settings (
          id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at
        ) VALUES (
          :id, 'show_vpn_indicator', 'true', 'boolean', '是否显示VPN标识', 'general', 1, NOW(), NOW()
        )
      `, { replacements: { id } });
    }
  } catch (error) {
    // 静默处理错误
  }

  // 升级：确保用户表包含 display_name 字段
  await ensureUserDisplayNameField(sequelize);
}

// 确保友链申请表存在
async function ensureFriendLinkApplicationsTable(sequelize) {
  try {
    // 检查表是否存在
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'friend_link_applications'");
    
    if (tables.length === 0) {
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
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 确保工具提交表存在
async function ensureToolSubmissionsTable(sequelize) {
  try {
    // 检查表是否存在
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'tool_submissions'");
    
    if (tables.length === 0) {
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
    }
  } catch (error) {
    // 静默处理错误
  }
}

async function createTables(sequelize) {
  // 创建 users 表
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` varchar(36) NOT NULL,
      \`username\` varchar(50) NOT NULL,
      \`email\` varchar(100) NOT NULL,
      \`display_name\` varchar(100) DEFAULT NULL COMMENT '用户昵称/显示名',
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
      KEY \`idx_users_status\` (\`status\`),
      KEY \`idx_users_display_name\` (\`display_name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  
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
}

async function initializeAdminUser(sequelize) {
  // 检查是否已存在管理员账户
  const [existingUsers] = await sequelize.query(
    "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
  );
  
  if (existingUsers[0].count > 0) {
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
      id, username, email, display_name, password_hash, role, status, created_at, updated_at
    ) VALUES (
      :id, :username, :email, :displayName, :passwordHash, 'admin', 'active', NOW(), NOW()
    )
  `, {
    replacements: {
      id: adminId,
      username: username,
      email: email,
      displayName: '超级管理员',
      passwordHash: passwordHash
    }
  });
}

async function initializeSystemSettings(sequelize) {
  // 检查是否已存在系统设置
  const [existingSettings] = await sequelize.query(
    "SELECT COUNT(*) as count FROM system_settings"
  );
  
  if (existingSettings[0].count > 0) {
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
    },
    // 邮箱配置设置
    {
      id: 'smtp-host-' + Date.now(),
      setting_key: 'smtp_host',
      setting_value: '',
      setting_type: 'string',
      description: 'SMTP服务器地址',
      category: 'email',
      is_public: 0
    },
    {
      id: 'smtp-port-' + Date.now() + 1,
      setting_key: 'smtp_port',
      setting_value: '587',
      setting_type: 'string',
      description: 'SMTP端口',
      category: 'email',
      is_public: 0
    },
    {
      id: 'smtp-secure-' + Date.now() + 2,
      setting_key: 'smtp_secure',
      setting_value: 'false',
      setting_type: 'boolean',
      description: '是否启用SSL/TLS',
      category: 'email',
      is_public: 0
    },
    {
      id: 'smtp-user-' + Date.now() + 3,
      setting_key: 'smtp_user',
      setting_value: '',
      setting_type: 'string',
      description: 'SMTP用户名',
      category: 'email',
      is_public: 0
    },
    {
      id: 'smtp-pass-' + Date.now() + 4,
      setting_key: 'smtp_pass',
      setting_value: '',
      setting_type: 'string',
      description: 'SMTP密码',
      category: 'email',
      is_public: 0
    },
    {
      id: 'from-name-' + Date.now() + 5,
      setting_key: 'from_name',
      setting_value: 'AiQiji工具箱',
      setting_type: 'string',
      description: '发件人名称',
      category: 'email',
      is_public: 0
    },
    {
      id: 'from-email-' + Date.now() + 6,
      setting_key: 'from_email',
      setting_value: '',
      setting_type: 'string',
      description: '发件人邮箱',
      category: 'email',
      is_public: 0
    },
    {
      id: 'email-enabled-' + Date.now() + 7,
      setting_key: 'email_enabled',
      setting_value: 'false',
      setting_type: 'boolean',
      description: '是否启用邮件功能',
      category: 'email',
      is_public: 0
    }
  ];

  // 检查现有设置并只插入不存在的设置
  for (const setting of defaultSettings) {
    const existing = await sequelize.query(
      'SELECT id FROM system_settings WHERE setting_key = ?',
      {
        replacements: [setting.setting_key],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existing.length === 0) {
      await sequelize.query(
        'INSERT INTO system_settings (id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        {
          replacements: [setting.id, setting.setting_key, setting.setting_value, setting.setting_type, setting.description, setting.category, setting.is_public]
        }
      );
    }
  }
}

// 运行初始化
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('init.js')) {
  initializeDatabase();
}

/**
 * 确保验证码表存在
 */
async function ensureVerificationCodesTable(sequelize) {
  try {
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'verification_codes'");
    
    if (tables.length === 0) {
      await sequelize.query(`
        CREATE TABLE verification_codes (
          id INT AUTO_INCREMENT PRIMARY KEY COMMENT '验证码ID',
          email VARCHAR(255) NOT NULL COMMENT '邮箱地址',
          code VARCHAR(255) NOT NULL COMMENT '验证码（bcrypt加密）',
          code_type ENUM('register', 'login', 'reset_password', 'email_change') NOT NULL COMMENT '验证码类型',
          expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
          is_used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
          used_at TIMESTAMP NULL COMMENT '使用时间',
          send_count INT DEFAULT 1 COMMENT '发送次数',
          last_send_at TIMESTAMP NULL COMMENT '最后发送时间',
          ip_address VARCHAR(45) NULL COMMENT '请求IP地址',
          user_agent TEXT NULL COMMENT '用户代理信息',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          
          INDEX idx_email_type (email, code_type),
          INDEX idx_code_type_used (code, code_type, is_used),
          INDEX idx_expires_at (expires_at),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表'
      `);
    } else {
      // 检查并添加可能缺失的列，以及更新验证码字段长度
      try {
        const [columns] = await sequelize.query(`
          SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'verification_codes'
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        const requiredColumns = [
          'send_count', 'last_send_at', 'ip_address', 'user_agent'
        ];
        
        // 检查验证码字段长度，如果是旧的VARCHAR(10)则升级到VARCHAR(255)
        const codeColumn = columns.find(col => col.COLUMN_NAME === 'code');
        if (codeColumn && codeColumn.CHARACTER_MAXIMUM_LENGTH < 255) {
          console.log('  🔧 升级验证码字段以支持加密存储...');
          
          // 先清空现有数据（因为旧数据是明文，新系统需要加密）
          await sequelize.query(`TRUNCATE TABLE verification_codes`);
          
          // 修改字段长度和注释
          await sequelize.query(`
            ALTER TABLE verification_codes 
            MODIFY COLUMN code VARCHAR(255) NOT NULL COMMENT '验证码（bcrypt加密）'
          `);
          
          console.log('  ✅ 验证码字段升级完成，现已支持加密存储');
        }
        
        for (const column of requiredColumns) {
          if (!existingColumns.includes(column)) {
            switch (column) {
              case 'send_count':
                await sequelize.query(`
                  ALTER TABLE verification_codes 
                  ADD COLUMN send_count INT DEFAULT 1 COMMENT '发送次数'
                `);
                break;
              case 'last_send_at':
                await sequelize.query(`
                  ALTER TABLE verification_codes 
                  ADD COLUMN last_send_at TIMESTAMP NULL COMMENT '最后发送时间'
                `);
                break;
              case 'ip_address':
                await sequelize.query(`
                  ALTER TABLE verification_codes 
                  ADD COLUMN ip_address VARCHAR(45) NULL COMMENT '请求IP地址'
                `);
                break;
              case 'user_agent':
                await sequelize.query(`
                  ALTER TABLE verification_codes 
                  ADD COLUMN user_agent TEXT NULL COMMENT '用户代理信息'
                `);
                break;
            }
          }
        }
      } catch (error) {
        // 静默处理错误
        console.error('验证码表升级失败:', error.message);
      }
    }
  } catch (error) {
    console.error('❌ 创建验证码表失败:', error);
    throw error;
  }
}

/**
 * 确保用户表包含display_name字段
 */
async function ensureUserDisplayNameField(sequelize) {
  try {
    // 检查 display_name 字段是否存在
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM users LIKE 'display_name'
    `);
    
    if (columns.length === 0) {
      // 第一步：只添加字段
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN display_name VARCHAR(100) DEFAULT NULL COMMENT '用户昵称/显示名' AFTER email
      `);
      
      // 第二步：检查索引数量并尝试添加索引
      try {
        const [indexes] = await sequelize.query(`
          SHOW INDEX FROM users
        `);
        const indexCount = new Set(indexes.map(idx => idx.Key_name)).size;
        
        if (indexCount < 60) { // 留一些余量
          await sequelize.query(`
            ALTER TABLE users ADD INDEX idx_users_display_name (display_name)
          `);
        }
      } catch (indexError) {
        // 静默处理索引错误
      }
      
      // 为现有用户设置默认昵称（使用用户名）
      await sequelize.query(`
        UPDATE users SET display_name = username WHERE display_name IS NULL
      `);
    }
  } catch (error) {
    // 静默处理错误，继续执行
  }
}

export { initializeDatabase };
