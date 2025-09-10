// 简单测试脚本来验证Excel模板生成
import XLSX from 'xlsx';

// 模拟模板数据
const templateData = [
  {
    'ID': 'example-tool-1',
    '工具名称': '示例工具',
    '工具描述': '这是一个示例工具的描述，用于演示Excel导入功能。',
    '图标名称': 'Tool',
    '图标URL': 'https://example.com/icon.png',
    '图标主题': 'auto-dark',
    '分类': 'AI,效率',
    '标签': '人工智能,自动化,效率工具',
    '网站URL': 'https://example.com',
    '是否精选': 'false',
    '排序权重': '0'
  }
];

// 创建选项参考工作表
const optionsData = [
  { '字段': '图标主题', '可选值': 'auto', '说明': '根据系统主题自动切换' },
  { '字段': '图标主题', '可选值': 'auto-light', '说明': '浅色模式下自动' },
  { '字段': '图标主题', '可选值': 'auto-dark', '说明': '深色模式下自动（默认）' },
  { '字段': '图标主题', '可选值': 'light', '说明': '强制浅色' },
  { '字段': '图标主题', '可选值': 'dark', '说明': '强制深色' },
  { '字段': '图标主题', '可选值': 'none', '说明': '无主题' },
  { '字段': '', '可选值': '', '说明': '' },
  { '字段': '分类', '可选值': 'AI', '说明': '人工智能相关工具' },
  { '字段': '分类', '可选值': '效率', '说明': '提高工作效率的工具' },
  { '字段': '分类', '可选值': '设计', '说明': '设计相关工具' },
  { '字段': '分类', '可选值': '开发', '说明': '开发相关工具' },
  { '字段': '分类', '可选值': '其他', '说明': '其他类型工具' },
  { '字段': '', '可选值': '', '说明': '' },
  { '字段': '是否精选', '可选值': 'true', '说明': '精选工具，会在首页突出显示' },
  { '字段': '是否精选', '可选值': 'false', '说明': '普通工具（默认）' }
];

try {
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  
  // 创建主模板工作表
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { width: 20 }, // ID
    { width: 20 }, // 工具名称
    { width: 50 }, // 工具描述
    { width: 15 }, // 图标名称
    { width: 30 }, // 图标URL
    { width: 15 }, // 图标主题
    { width: 20 }, // 分类
    { width: 30 }, // 标签
    { width: 30 }, // 网站URL
    { width: 10 }, // 是否精选
    { width: 10 }  // 排序权重
  ];
  
  // 创建选项参考工作表
  const optionsSheet = XLSX.utils.json_to_sheet(optionsData);
  optionsSheet['!cols'] = [
    { width: 15 }, // 字段
    { width: 20 }, // 可选值
    { width: 50 }  // 说明
  ];
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '工具导入模板');
  XLSX.utils.book_append_sheet(workbook, optionsSheet, '选项参考');
  
  // 生成Excel文件
  XLSX.writeFile(workbook, 'test-template.xlsx');
  
  console.log('✅ Excel模板生成成功！文件已保存为 test-template.xlsx');
  console.log('📋 模板包含以下工作表：');
  console.log('   - 工具导入模板: 主要数据输入表');
  console.log('   - 选项参考: 固定选项字段的可选值参考');
  
} catch (error) {
  console.error('❌ Excel模板生成失败:', error.message);
}
