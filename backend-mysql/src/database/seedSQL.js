import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { testConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 查找SQL种子数据文件
 */
function findSQLSeedFile() {
  const possiblePaths = [
    // 后端目录中的SQL种子数据文件（推荐）
    path.join(__dirname, '../../data/initial-tools.sql'),
    // 从 backend-mysql 目录启动的情况
    path.join(process.cwd(), 'data/initial-tools.sql')
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`📁 找到SQL种子数据文件: ${filePath}`);
      return filePath;
    }
  }

  console.error('❌ 找不到SQL种子数据文件');
  console.log('📍 当前工作目录:', process.cwd());
  console.log('📍 脚本目录:', __dirname);
  console.log('🔍 已尝试的路径:');
  possiblePaths.forEach(p => console.log(`  ❌ ${p}`));
  
  throw new Error('找不到SQL种子数据文件，请确保 backend-mysql/data/initial-tools.sql 存在');
}

/**
 * 执行SQL种子数据
 */
export async function executeSQLSeed() {
  try {
    console.log('🌱 开始执行SQL种子数据...');

    // 测试数据库连接
    const connected = await testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }

    // 查找SQL文件
    const sqlFilePath = findSQLSeedFile();
    
    // 读取SQL文件
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`📄 读取SQL文件完成，大小: ${(sqlContent.length / 1024).toFixed(2)}KB`);

    // 拆分SQL语句（按分号分割，忽略注释）
    const sqlStatements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`🔄 准备执行 ${sqlStatements.length} 条SQL语句...`);

    let executedCount = 0;
    let affectedRows = 0;

    // 执行每条SQL语句
    for (const sql of sqlStatements) {
      try {
        const [results] = await sequelize.query(sql);
        
        if (sql.toUpperCase().includes('INSERT')) {
          // INSERT语句返回受影响的行数
          const rows = Array.isArray(results) ? results.length : (results.affectedRows || 0);
          affectedRows += rows;
          if (rows > 0) {
            console.log(`✅ 插入了 ${rows} 条数据`);
          }
        } else if (sql.toUpperCase().includes('SELECT')) {
          // SELECT语句显示查询结果
          console.log('📊 数据库统计:', results);
        }
        
        executedCount++;
      } catch (error) {
        // 如果是INSERT IGNORE导致的重复键错误，不算作错误
        if (error.message.includes('Duplicate entry') || error.message.includes('ER_DUP_ENTRY')) {
          console.log(`ℹ️ 数据已存在，跳过插入`);
          executedCount++;
        } else {
          console.error(`❌ SQL执行失败:`, error.message);
          console.error(`SQL语句:`, sql.substring(0, 200) + '...');
          throw error;
        }
      }
    }

    console.log('\n📊 执行统计:');
    console.log(`✅ 成功执行: ${executedCount} 条SQL语句`);
    console.log(`📈 影响行数: ${affectedRows} 行`);
    console.log('\n🎉 SQL种子数据执行完成！');
    
    return { executedCount, affectedRows };

  } catch (error) {
    console.error('❌ 执行SQL种子数据失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则执行SQL种子数据
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  executeSQLSeed()
    .then((result) => {
      console.log(`🎉 SQL种子数据执行完成！执行了 ${result.executedCount} 条语句，影响 ${result.affectedRows} 行`);
    })
    .catch((error) => {
      console.error('❌ 执行SQL种子数据失败:', error);
    })
    .finally(() => {
      process.exit(0);
    });
}
