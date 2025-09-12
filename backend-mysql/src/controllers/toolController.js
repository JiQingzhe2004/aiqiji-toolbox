import Tool from '../models/Tool.js';
import { deleteFile, getFileUrl } from '../middleware/upload.js';
import { cleanToolData, validateToolData, cleanTagsData } from '../utils/dataValidator.js';

/**
 * 工具控制器
 */

// 获取所有工具
export const getAllTools = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      featured,
      status = 'active',
      q: query,
      sort = 'default'
    } = req.query;

    const offset = (page - 1) * parseInt(limit);
    let order;

    // 排序逻辑
    switch (sort) {
      case 'name':
        order = [['name', 'ASC']];
        break;
      case 'rating':
        order = [['rating_sum', 'DESC'], ['rating_count', 'DESC']];
        break;
      case 'latest':
        order = [['created_at', 'DESC']];
        break;
      default:
        order = [['sort_order', 'DESC'], ['created_at', 'DESC']];
    }

    const result = await Tool.searchTools(query, {
      category,
      featured: featured !== undefined ? featured === 'true' : undefined,
      status: status === 'all' ? undefined : (status || 'active'), // 当status为'all'时不筛选，否则默认为'active'
      limit: parseInt(limit),
      offset,
      order
    });

    const totalPages = Math.ceil(result.count / parseInt(limit));

    // 处理图标URL
    const tools = result.rows.map(tool => {
      const toolData = tool.toJSON();
      if (toolData.icon_file) {
        toolData.icon_url = getFileUrl(toolData.icon_file);
      }
      return toolData;
    });

    res.json({
      success: true,
      data: {
        tools,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: result.count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('获取工具列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工具列表失败'
    });
  }
};

// 根据ID获取单个工具
export const getToolById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tool = await Tool.findOne({
      where: { id }
    });
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }


    // 处理图标URL
    const toolData = tool.toJSON();
    if (toolData.icon_file) {
      toolData.icon_url = getFileUrl(toolData.icon_file);
    }

    res.json({
      success: true,
      data: { tool: toolData }
    });
  } catch (error) {
    console.error('获取工具失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工具失败'
    });
  }
};

// 创建工具
export const createTool = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      icon,
      icon_url,
      icon_theme,
      category,
      tags,
      url,
      featured,
      sort_order,
      needs_vpn
    } = req.body;

    // 检查ID是否已存在
    const existingTool = await Tool.findByPk(id);
    if (existingTool) {
      return res.status(400).json({
        success: false,
        message: '工具ID已存在'
      });
    }

    // 清理和验证数据
    const rawData = {
      id,
      name,
      description,
      icon,
      icon_url,
      icon_theme,
      category,
      tags,
      url,
      featured,
      sort_order,
      needs_vpn
    };
    
    const cleanedData = cleanToolData(rawData);
    const validation = validateToolData(cleanedData);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }

    const toolData = {
      id: cleanedData.id,
      name: cleanedData.name,
      description: cleanedData.description,
      icon: cleanedData.icon,
      icon_url: cleanedData.icon_url,
      icon_theme: cleanedData.icon_theme,
      category: cleanedData.category,
      tags: cleanTagsData(cleanedData.tags),
      url: cleanedData.url,
      featured: cleanedData.featured === true || cleanedData.featured === 'true',
      sort_order: cleanedData.sort_order || 0,
      needs_vpn: cleanedData.needs_vpn === true || cleanedData.needs_vpn === 'true'
    };

    // 如果有上传的图标文件
    if (req.file) {
      toolData.icon_file = req.file.filename;
      toolData.icon_url = getFileUrl(req.file.filename);
    }

    const tool = await Tool.create(toolData);

    // 处理返回数据
    const responseData = tool.toJSON();
    if (responseData.icon_file) {
      responseData.icon_url = getFileUrl(responseData.icon_file);
    }

    res.status(201).json({
      success: true,
      data: { tool: responseData },
      message: '工具创建成功'
    });
  } catch (error) {
    console.error('创建工具失败:', error);
    
    // 如果有上传的文件，删除它
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      message: '创建工具失败: ' + error.message
    });
  }
};

// 更新工具
export const updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    const tool = await Tool.findByPk(id);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }

    // 清理和处理tags
    if (updateData.tags !== undefined) {
      updateData.tags = cleanTagsData(updateData.tags);
    }
    
    // 清理其他数据
    updateData = cleanToolData(updateData);

    // 处理featured
    if (updateData.featured !== undefined) {
      updateData.featured = updateData.featured === true || updateData.featured === 'true';
    }

    // 处理needs_vpn
    if (updateData.needs_vpn !== undefined) {
      updateData.needs_vpn = updateData.needs_vpn === true || updateData.needs_vpn === 'true';
    }

    // 如果有新的图标文件
    if (req.file) {
      // 删除旧的图标文件
      if (tool.icon_file) {
        deleteFile(tool.icon_file);
      }
      
      updateData.icon_file = req.file.filename;
      updateData.icon_url = getFileUrl(req.file.filename);
    }

    await tool.update(updateData);

    // 处理返回数据
    const responseData = tool.toJSON();
    if (responseData.icon_file) {
      responseData.icon_url = getFileUrl(responseData.icon_file);
    }

    res.json({
      success: true,
      data: { tool: responseData },
      message: '工具更新成功'
    });
  } catch (error) {
    console.error('更新工具失败:', error);
    
    // 如果有上传的文件，删除它
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      message: '更新工具失败: ' + error.message
    });
  }
};

// 删除工具
export const deleteTool = async (req, res) => {
  try {
    const { id } = req.params;

    const tool = await Tool.findByPk(id);
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }

    // 删除图标文件
    if (tool.icon_file) {
      deleteFile(tool.icon_file);
    }

    await tool.destroy();

    res.json({
      success: true,
      message: '工具删除成功'
    });
  } catch (error) {
    console.error('删除工具失败:', error);
    res.status(500).json({
      success: false,
      message: '删除工具失败'
    });
  }
};


// 工具评分
export const rateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }
    
    const tool = await Tool.findOne({
      where: { id, status: 'active' }
    });
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }

    await tool.addRating(parseInt(rating));

    res.json({
      success: true,
      data: { 
        averageRating: tool.getAverageRating(),
        ratingCount: tool.rating_count 
      },
      message: '评分成功'
    });
  } catch (error) {
    console.error('评分失败:', error);
    res.status(500).json({
      success: false,
      message: '评分失败: ' + error.message
    });
  }
};

// 获取工具统计信息
export const getToolStats = async (req, res) => {
  try {
    const stats = await Tool.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
};

// 获取精选工具
export const getFeaturedTools = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const tools = await Tool.findAll({
      where: { 
        status: 'active', 
        featured: true 
      },
      limit: parseInt(limit),
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']]
    });

    // 处理图标URL
    const toolsData = tools.map(tool => {
      const toolData = tool.toJSON();
      if (toolData.icon_file) {
        toolData.icon_url = getFileUrl(toolData.icon_file);
      }
      return toolData;
    });

    res.json({
      success: true,
      data: { tools: toolsData }
    });
  } catch (error) {
    console.error('获取精选工具失败:', error);
    res.status(500).json({
      success: false,
      message: '获取精选工具失败'
    });
  }
};

// 上传图标
export const uploadIcon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择图标文件'
      });
    }

    const iconUrl = getFileUrl(req.file.filename);

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: iconUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: '图标上传成功'
    });
  } catch (error) {
    console.error('上传图标失败:', error);
    res.status(500).json({
      success: false,
      message: '上传图标失败'
    });
  }
};
