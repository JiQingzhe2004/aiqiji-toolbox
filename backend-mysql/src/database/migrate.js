import sequelize, { testConnection, syncDatabase } from '../config/database.js';
import Tool from '../models/Tool.js';

/**
 * 数据库迁移脚本
 */

async function migrate() {
  try {
    console.log('🚀 开始数据库迁移...');

    // 测试数据库连接
    const connected = await testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }

    // 同步模型到数据库
    await syncDatabase();

    console.log('✅ 数据库迁移完成！');
    console.log(`
📊 创建的表:
- tools (工具表)

🔧 索引:
- category (分类索引)
- featured (精选索引)
- status (状态索引)
- view_count (浏览量索引)
- click_count (点击量索引)
- sort_order (排序索引)
- created_at (创建时间索引)
    `);

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 运行迁移
migrate();
