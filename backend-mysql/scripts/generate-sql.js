import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取JSON数据
const inputFile = path.join(__dirname, '../data/initial-tools.json');
const outputFile = path.join(__dirname, '../data/initial-tools.sql');

console.log('📖 读取种子数据文件...');
const toolsData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log(`🔄 转换 ${toolsData.length} 个工具为SQL语句...`);

// 生成SQL头部
let sql = `-- AiQiji工具箱初始数据
-- 自动生成于: ${new Date().toISOString()}
-- 数据总数: ${toolsData.length}

-- 使用 INSERT IGNORE 避免重复插入
-- 只会插入不存在的数据（基于主键ID判断）

`;

// 生成INSERT语句
const values = [];

toolsData.forEach(tool => {
  // 处理字段映射
  const id = tool.id;
  const name = tool.name;
  const description = tool.desc || tool.description || '';
  const icon = tool.icon || 'Tool';
  const icon_url = tool.logoUrl || tool.icon_url || null;
  const icon_theme = tool.logoTheme || tool.icon_theme || 'auto';
  const category = Array.isArray(tool.category) ? tool.category[0] : tool.category;
  const tags = JSON.stringify(tool.tags || []);
  const url = tool.url;
  const featured = tool.featured ? 1 : 0;
  const status = 'active';
  const view_count = Math.floor(Math.random() * 100) + 10;
  const click_count = Math.floor(Math.random() * 50) + 5;
  const sort_order = tool.featured ? 100 : 0;
  
  // 转义SQL字符串
  function escapeSQL(str) {
    if (str === null) return 'NULL';
    return "'" + str.toString().replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
  }
  
  const valueString = `(${escapeSQL(id)}, ${escapeSQL(name)}, ${escapeSQL(description)}, ${escapeSQL(icon)}, ${icon_url ? escapeSQL(icon_url) : 'NULL'}, NULL, ${escapeSQL(icon_theme)}, ${escapeSQL(category)}, ${escapeSQL(tags)}, ${escapeSQL(url)}, ${featured}, ${escapeSQL(status)}, ${view_count}, ${click_count}, 0, 0, ${sort_order}, NOW(), NOW())`;
  
  values.push(valueString);
});

// 构建完整的INSERT语句
sql += `INSERT IGNORE INTO Tools (
  id,
  name,
  description,
  icon,
  icon_url,
  icon_file,
  icon_theme,
  category,
  tags,
  url,
  featured,
  status,
  view_count,
  click_count,
  rating_count,
  rating_sum,
  sort_order,
  created_at,
  updated_at
) VALUES
${values.join(',\n')};

-- 更新统计信息
SELECT 
  COUNT(*) as total_tools,
  SUM(featured) as featured_tools,
  category,
  COUNT(*) as category_count
FROM Tools 
GROUP BY category
ORDER BY category_count DESC;
`;

// 保存SQL文件
fs.writeFileSync(outputFile, sql, 'utf8');

console.log(`✅ SQL文件生成完成！保存到: ${outputFile}`);
console.log(`📊 生成统计:`);
console.log(`  - 总计工具: ${toolsData.length}`);
console.log(`  - 精选工具: ${toolsData.filter(t => t.featured).length}`);

// 分类统计
const categories = {};
toolsData.forEach(tool => {
  const cat = Array.isArray(tool.category) ? tool.category[0] : tool.category;
  categories[cat] = (categories[cat] || 0) + 1;
});

console.log(`  - 分类统计:`);
Object.entries(categories).forEach(([cat, count]) => {
  console.log(`    ${cat}: ${count} 个`);
});

console.log('\n🎯 下一步: 在数据库启动时执行此SQL文件');
