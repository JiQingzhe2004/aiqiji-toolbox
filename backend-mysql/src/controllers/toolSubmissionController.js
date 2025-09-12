import { Op } from 'sequelize';
import ToolSubmission from '../models/ToolSubmission.js';
import Tool from '../models/Tool.js';
import User from '../models/User.js';
import { deleteFile, getFileUrl } from '../middleware/upload.js';
import { cleanToolData, validateToolData, cleanTagsData } from '../utils/dataValidator.js';

/**
 * 工具提交控制器
 */

// 提交新工具
export const submitTool = async (req, res) => {
  try {
    const {
      name,
      description,
      url,
      category,
      tags,
      icon_url,
      submitter_name,
      submitter_email,
      submitter_contact,
      additional_info
    } = req.body;

    // 自动生成工具ID（包含时间戳确保唯一性）
    const generateToolId = (name) => {
      const baseName = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // 添加时间戳确保唯一性
      const timestamp = Date.now();
      return `${baseName}-${timestamp}`;
    };

    const tool_id = generateToolId(name);

    // 清理和验证数据
    const rawData = {
      id: tool_id,
      name,
      description,
      url,
      category,
      tags,
      icon: 'Tool', // 设置默认图标名称
      icon_url,
      icon_theme: 'auto-dark' // 设置默认图标主题
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

    const submissionData = {
      tool_id: cleanedData.id,
      name: cleanedData.name,
      description: cleanedData.description,
      url: cleanedData.url,
      category: cleanedData.category,
      tags: cleanTagsData(cleanedData.tags),
      icon: 'Tool', // 设置默认图标名称
      icon_url: cleanedData.icon_url,
      icon_theme: 'auto-dark', // 设置默认图标主题
      submitter_name: submitter_name?.trim() || null,
      submitter_email: submitter_email?.trim() || null,
      submitter_contact: submitter_contact?.trim() || null,
      additional_info: additional_info || null,
      status: 'pending',
      source: 'user_submit'
    };

    // 如果有上传的图标文件
    if (req.file) {
      submissionData.icon_file = req.file.filename;
      submissionData.icon_url = getFileUrl(req.file.filename);
    }

    const submission = await ToolSubmission.create(submissionData);

    res.status(201).json({
      success: true,
      data: { submission },
      message: '工具提交成功，我们会尽快审核'
    });
  } catch (error) {
    console.error('提交工具失败:', error);
    
    // 如果有上传的文件，删除它
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      message: '提交工具失败: ' + error.message
    });
  }
};

// 获取所有提交（管理员用）
export const getAllSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sort = 'default'
    } = req.query;

    const offset = (page - 1) * parseInt(limit);
    let order;

    // 排序逻辑
    switch (sort) {
      case 'name':
        order = [['name', 'ASC']];
        break;
      case 'latest':
        order = [['created_at', 'DESC']];
        break;
      case 'oldest':
        order = [['created_at', 'ASC']];
        break;
      default:
        order = [['priority', 'DESC'], ['created_at', 'ASC']];
    }

    const result = await ToolSubmission.getPendingSubmissions({
      status: status === 'all' ? undefined : (status || 'pending'),
      limit: parseInt(limit),
      offset,
      order
    });

    const totalPages = Math.ceil(result.count / parseInt(limit));

    // 处理图标URL
    const submissions = result.rows.map(submission => {
      const submissionData = submission.toJSON();
      if (submissionData.icon_file) {
        submissionData.icon_url = getFileUrl(submissionData.icon_file);
      }
      return submissionData;
    });

    res.json({
      success: true,
      data: {
        submissions,
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
    console.error('获取提交列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取提交列表失败'
    });
  }
};

// 获取单个提交详情
export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await ToolSubmission.findByPk(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '提交不存在'
      });
    }

    // 处理图标URL
    const submissionData = submission.toJSON();
    if (submissionData.icon_file) {
      submissionData.icon_url = getFileUrl(submissionData.icon_file);
    }

    res.json({
      success: true,
      data: { submission: submissionData }
    });
  } catch (error) {
    console.error('获取提交详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取提交详情失败'
    });
  }
};

// 审核工具提交
export const reviewSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const reviewerId = req.user?.id; // 从认证中间件获取用户ID

    if (!['approve', 'reject', 'processing'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }

    const submission = await ToolSubmission.findByPk(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '提交不存在'
      });
    }

    if (submission.status !== 'pending' && submission.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: '该提交已经被处理过了'
      });
    }

    let newStatus;
    let responseMessage;

    if (action === 'approve') {
      // 通过审核，创建工具
      try {
        const toolData = submission.toToolData();
        
        // 检查工具是否已经存在
        const existingTool = await Tool.findByPk(toolData.id);
        if (existingTool) {
          return res.status(400).json({
            success: false,
            message: '该工具已存在，无法重复创建'
          });
        }
        
        await Tool.create(toolData);
        
        newStatus = 'approved';
        responseMessage = '工具已通过审核并添加到系统中';
      } catch (error) {
        console.error('创建工具失败:', error);
        return res.status(500).json({
          success: false,
          message: '审核通过但创建工具失败: ' + error.message
        });
      }
    } else if (action === 'reject') {
      newStatus = 'rejected';
      responseMessage = '工具提交已被拒绝';
    } else if (action === 'processing') {
      newStatus = 'processing';
      responseMessage = '工具提交状态已更新为处理中';
    }

    // 更新提交状态
    await submission.update({
      status: newStatus,
      reviewer_id: reviewerId,
      review_comment: comment || null,
      reviewed_at: new Date()
    });

    res.json({
      success: true,
      data: { submission },
      message: responseMessage
    });
  } catch (error) {
    console.error('审核提交失败:', error);
    res.status(500).json({
      success: false,
      message: '审核提交失败: ' + error.message
    });
  }
};

// 批量审核
export const batchReview = async (req, res) => {
  try {
    const { ids, action, comment } = req.body;
    const reviewerId = req.user?.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要处理的提交'
      });
    }

    if (!['approve', 'reject', 'processing'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }

    const submissions = await ToolSubmission.findAll({
      where: {
        id: ids,
        status: ['pending', 'processing']
      }
    });

    if (submissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有找到可处理的提交'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const submission of submissions) {
      try {
        let newStatus;

        if (action === 'approve') {
          // 检查工具ID是否已存在
          const existingTool = await Tool.findByPk(submission.tool_id);
          if (existingTool) {
            results.failed++;
            results.errors.push({
              id: submission.id,
              tool_id: submission.tool_id,
              error: '工具ID已存在'
            });
            continue;
          }

          // 创建工具
          const toolData = submission.toToolData();
          await Tool.create(toolData);
          newStatus = 'approved';
        } else if (action === 'reject') {
          newStatus = 'rejected';
        } else if (action === 'processing') {
          newStatus = 'processing';
        }

        // 更新提交状态
        await submission.update({
          status: newStatus,
          reviewer_id: reviewerId,
          review_comment: comment || null,
          reviewed_at: new Date()
        });

        results.success++;
      } catch (error) {
        console.error(`处理提交 ${submission.id} 失败:`, error);
        results.failed++;
        results.errors.push({
          id: submission.id,
          tool_id: submission.tool_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `批量处理完成：成功 ${results.success} 个，失败 ${results.failed} 个`
    });
  } catch (error) {
    console.error('批量审核失败:', error);
    res.status(500).json({
      success: false,
      message: '批量审核失败: ' + error.message
    });
  }
};

// 删除提交
export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await ToolSubmission.findByPk(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '提交不存在'
      });
    }

    // 删除图标文件
    if (submission.icon_file) {
      deleteFile(submission.icon_file);
    }

    await submission.destroy();

    res.json({
      success: true,
      message: '提交删除成功'
    });
  } catch (error) {
    console.error('删除提交失败:', error);
    res.status(500).json({
      success: false,
      message: '删除提交失败'
    });
  }
};

// 获取提交统计信息
export const getSubmissionStats = async (req, res) => {
  try {
    const stats = await ToolSubmission.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取提交统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取提交统计信息失败'
    });
  }
};

// 更新提交信息（管理员编辑）
export const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    const submission = await ToolSubmission.findByPk(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '提交不存在'
      });
    }

    // 清理和处理tags
    if (updateData.tags !== undefined) {
      updateData.tags = cleanTagsData(updateData.tags);
    }
    
    // 清理其他数据
    if (updateData.name || updateData.description || updateData.url || updateData.category) {
      const rawData = {
        id: updateData.tool_id || submission.tool_id,
        name: updateData.name || submission.name,
        description: updateData.description || submission.description,
        url: updateData.url || submission.url,
        category: updateData.category || submission.category,
        tags: updateData.tags || submission.tags,
        icon: updateData.icon || submission.icon,
        icon_url: updateData.icon_url || submission.icon_url,
        icon_theme: updateData.icon_theme || submission.icon_theme
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
      
      // 更新清理后的数据
      Object.assign(updateData, cleanedData);
      updateData.tool_id = cleanedData.id;
    }

    // 如果有新的图标文件
    if (req.file) {
      // 删除旧的图标文件
      if (submission.icon_file) {
        deleteFile(submission.icon_file);
      }
      
      updateData.icon_file = req.file.filename;
      updateData.icon_url = getFileUrl(req.file.filename);
    }

    await submission.update(updateData);

    // 处理返回数据
    const responseData = submission.toJSON();
    if (responseData.icon_file) {
      responseData.icon_url = getFileUrl(responseData.icon_file);
    }

    res.json({
      success: true,
      data: { submission: responseData },
      message: '提交更新成功'
    });
  } catch (error) {
    console.error('更新提交失败:', error);
    
    // 如果有上传的文件，删除它
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      message: '更新提交失败: ' + error.message
    });
  }
};

// 检查重复工具（根据名称和链接）
export const checkDuplicateTools = async (req, res) => {
  try {
    const { name, url, excludeId } = req.query;
    
    if (!name && !url) {
      return res.status(400).json({
        success: false,
        message: '请提供工具名称或链接'
      });
    }

    const whereConditions = [];
    
    if (name) {
      whereConditions.push({
        name: {
          [Op.like]: `%${name.trim()}%`
        }
      });
    }
    
    if (url) {
      whereConditions.push({
        url: url.trim()
      });
    }

    // 检查已存在的工具
    const existingTools = await Tool.findAll({
      where: {
        [Op.or]: whereConditions
      },
      attributes: ['id', 'name', 'url', 'description'],
      limit: 10
    });

    // 检查待审核的提交（排除当前提交）
    const pendingSubmissionsWhere = {
      [Op.or]: whereConditions,
      status: {
        [Op.in]: ['pending', 'processing']
      }
    };
    
    // 如果提供了excludeId，排除当前提交
    if (excludeId) {
      pendingSubmissionsWhere.id = {
        [Op.ne]: parseInt(excludeId)
      };
    }
    
    const pendingSubmissions = await ToolSubmission.findAll({
      where: pendingSubmissionsWhere,
      attributes: ['id', 'tool_id', 'name', 'url', 'description', 'status'],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        existingTools,
        pendingSubmissions,
        hasDuplicates: existingTools.length > 0 || pendingSubmissions.length > 0
      }
    });
  } catch (error) {
    console.error('检查重复工具失败:', error);
    res.status(500).json({
      success: false,
      message: '检查重复工具失败: ' + error.message
    });
  }
};
