import XLSX from 'xlsx';
import Tool from '../models/Tool.js';
import { cleanToolData, validateToolData, cleanTagsData } from '../utils/dataValidator.js';

/**
 * Excel导入控制器
 */

// Excel模板下载
export const downloadTemplate = async (req, res) => {
  try {
    // 创建示例数据
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
      },
      {
        'ID': 'example-tool-2',
        '工具名称': '另一个工具',
        '工具描述': '这是另一个示例工具，展示不同的配置选项。',
        '图标名称': 'Code2',
        '图标URL': '',
        '图标主题': 'auto-light',
        '分类': '开发',
        '标签': '开发工具,编程',
        '网站URL': 'https://another-example.com',
        '是否精选': 'true',
        '排序权重': '100'
      }
    ];

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // 设置列宽
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

    const optionsSheet = XLSX.utils.json_to_sheet(optionsData);
    optionsSheet['!cols'] = [
      { width: 15 }, // 字段
      { width: 20 }, // 可选值
      { width: 50 }  // 说明
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '工具导入模板');
    XLSX.utils.book_append_sheet(workbook, optionsSheet, '选项参考');

    // 创建说明页
    const instructionsData = [
      { '字段名': 'ID', '是否必填': '是', '说明': '工具的唯一标识符，只能包含字母、数字、连字符和下划线' },
      { '字段名': '工具名称', '是否必填': '是', '说明': '工具的显示名称，长度1-100字符' },
      { '字段名': '工具描述', '是否必填': '是', '说明': '工具的详细描述，长度10-1000字符' },
      { '字段名': '图标名称', '是否必填': '否', '说明': 'Lucide图标名称，如Tool、Code2等，默认为Tool' },
      { '字段名': '图标URL', '是否必填': '否', '说明': '自定义图标的URL地址，优先级高于图标名称' },
      { '字段名': '图标主题', '是否必填': '否', '说明': '图标主题，可选值请查看"选项参考"工作表，默认auto-dark' },
      { '字段名': '分类', '是否必填': '是', '说明': '工具分类，可选值请查看"选项参考"工作表。多个分类用英文逗号分隔' },
      { '字段名': '标签', '是否必填': '否', '说明': '工具标签，多个标签用英文逗号分隔' },
      { '字段名': '网站URL', '是否必填': '是', '说明': '工具的官方网站地址，必须是有效的URL' },
      { '字段名': '是否精选', '是否必填': '否', '说明': '是否为精选工具，可选值请查看"选项参考"工作表，默认false' },
      { '字段名': '排序权重', '是否必填': '否', '说明': '排序权重，数字越大排序越靠前，默认0' }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [
      { width: 15 }, // 字段名
      { width: 10 }, // 是否必填
      { width: 80 }  // 说明
    ];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, '导入说明');

    // 生成Excel文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="tools-import-template.xlsx"');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('下载Excel模板失败:', error);
    res.status(500).json({
      success: false,
      message: '下载Excel模板失败: ' + error.message
    });
  }
};

// Excel文件导入
export const importFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Excel文件'
      });
    }

    // 读取Excel文件
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 将Excel数据转换为JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel文件中没有数据'
      });
    }

    const results = {
      total: rawData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // 处理每一行数据
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNumber = i + 2; // Excel行号从2开始（第1行是标题）

      try {
        // 映射Excel列名到数据库字段
        const toolData = {
          id: row['ID'] || row['id'],
          name: row['工具名称'] || row['name'],
          description: row['工具描述'] || row['description'],
          icon: row['图标名称'] || row['icon'] || 'Tool',
          icon_url: row['图标URL'] || row['icon_url'] || '',
          icon_theme: row['图标主题'] || row['icon_theme'] || 'auto-dark',
          category: row['分类'] || row['category'],
          tags: row['标签'] || row['tags'] || '',
          url: row['网站URL'] || row['url'],
          featured: row['是否精选'] || row['featured'] || false,
          sort_order: row['排序权重'] || row['sort_order'] || 0
        };

        // 数据清理和验证
        const cleanedData = cleanToolData(toolData);
        const validation = validateToolData(cleanedData);

        if (!validation.isValid) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            id: toolData.id || '未知',
            errors: validation.errors
          });
          continue;
        }

        // 处理分类数据
        let categories = [];
        if (cleanedData.category) {
          if (typeof cleanedData.category === 'string') {
            categories = cleanedData.category.split(',').map(cat => cat.trim()).filter(cat => cat);
          } else if (Array.isArray(cleanedData.category)) {
            categories = cleanedData.category;
          }
        }

        // 验证分类
        const validCategories = ['AI', '效率', '设计', '开发', '其他'];
        categories = categories.filter(cat => validCategories.includes(cat));
        if (categories.length === 0) {
          categories = ['其他'];
        }

        // 处理标签数据
        let tags = [];
        if (cleanedData.tags) {
          if (typeof cleanedData.tags === 'string') {
            tags = cleanedData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          } else if (Array.isArray(cleanedData.tags)) {
            tags = cleanedData.tags;
          }
        }

        // 处理布尔值
        let featured = false;
        if (typeof cleanedData.featured === 'string') {
          featured = cleanedData.featured.toLowerCase() === 'true';
        } else {
          featured = Boolean(cleanedData.featured);
        }

        // 处理数字
        let sortOrder = 0;
        if (cleanedData.sort_order) {
          sortOrder = parseInt(cleanedData.sort_order) || 0;
        }

        const finalToolData = {
          id: cleanedData.id,
          name: cleanedData.name,
          description: cleanedData.description,
          icon: cleanedData.icon,
          icon_url: cleanedData.icon_url,
          icon_theme: cleanedData.icon_theme,
          category: categories,
          tags: tags,
          url: cleanedData.url,
          featured: featured,
          sort_order: sortOrder
        };

        // 检查是否已存在
        const existingTool = await Tool.findByPk(finalToolData.id);
        if (existingTool) {
          // 更新现有工具
          await existingTool.update(finalToolData);
        } else {
          // 创建新工具
          await Tool.create(finalToolData);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          id: row['ID'] || row['id'] || '未知',
          errors: [error.message]
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`
    });

  } catch (error) {
    console.error('Excel导入失败:', error);
    res.status(500).json({
      success: false,
      message: 'Excel导入失败: ' + error.message
    });
  }
};

// 导出当前工具数据为Excel
export const exportToExcel = async (req, res) => {
  try {
    // 获取所有工具
    const tools = await Tool.findAll({
      where: { status: 'active' },
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']]
    });

    // 转换数据格式
    const exportData = tools.map(tool => ({
      'ID': tool.id,
      '工具名称': tool.name,
      '工具描述': tool.description,
      '图标名称': tool.icon,
      '图标URL': tool.icon_url || '',
      '图标主题': tool.icon_theme,
      '分类': Array.isArray(tool.category) ? tool.category.join(',') : tool.category,
      '标签': Array.isArray(tool.tags) ? tool.tags.join(',') : (tool.tags || ''),
      '网站URL': tool.url,
      '是否精选': tool.featured ? 'true' : 'false',
      '排序权重': tool.sort_order,
      '创建时间': tool.created_at ? new Date(tool.created_at).toLocaleString('zh-CN') : '',
      '更新时间': tool.updated_at ? new Date(tool.updated_at).toLocaleString('zh-CN') : ''
    }));

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 设置列宽
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
      { width: 10 }, // 排序权重
      { width: 20 }, // 创建时间
      { width: 20 }  // 更新时间
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '工具数据');

    // 生成Excel文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tools-export-${timestamp}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('导出Excel失败:', error);
    res.status(500).json({
      success: false,
      message: '导出Excel失败: ' + error.message
    });
  }
};
