import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Favorite from '../models/Favorite.js';
import Tool from '../models/Tool.js';

// 列出当前用户收藏的工具，支持搜索与分类筛选、分页
export const listFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, q = '', category } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const offset = (pageNum - 1) * pageSize;

    // 总数用于分页
    const total = await Favorite.count({ where: { user_id: userId } });
    if (total === 0) {
      return res.json({ success: true, data: { items: [], pagination: { currentPage: 1, itemsPerPage: pageSize, totalItems: 0, totalPages: 0 } } });
    }

    // 本页收藏记录，按收藏时间倒序
    const favPageRows = await Favorite.findAll({
      where: { user_id: userId },
      attributes: ['tool_id', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset
    });
    const favIds = favPageRows.map(r => r.tool_id);

    // 工具筛选（仅本页收藏ID）
    const whereClause = { id: { [Op.in]: favIds } };
    if (q) {
      const kw = String(q).trim();
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${kw}%` } },
        { description: { [Op.like]: `%${kw}%` } },
        sequelize.where(
          sequelize.fn('JSON_SEARCH', sequelize.col('tags'), 'one', `%${kw}%`),
          { [Op.ne]: null }
        )
      ];
    }
    if (category) {
      whereClause[Op.and] = [
        sequelize.literal(`JSON_SEARCH(category, 'one', '${String(category).trim()}') IS NOT NULL`)
      ];
    }

    const tools = await Tool.findAll({ where: whereClause });
    const toolMap = new Map(tools.map(t => [t.id, t]));
    // 保持按收藏时间顺序
    const ordered = favPageRows
      .map(r => toolMap.get(r.tool_id))
      .filter(Boolean);

    res.json({ success: true, data: { items: ordered, pagination: { currentPage: pageNum, itemsPerPage: pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) } } });
  } catch (error) {
    console.error('List favorites failed:', error);
    res.status(500).json({ success: false, message: '获取收藏列表失败' });
  }
};

// 检查是否已收藏
export const existsFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { toolId } = req.params;
    if (!toolId) return res.status(400).json({ success: false, message: '缺少工具ID' });

    const exists = await Favorite.findOne({ where: { user_id: userId, tool_id: toolId } });
    return res.json({ success: true, data: { favorited: !!exists } });
  } catch (error) {
    console.error('Exists favorite failed:', error);
    res.status(500).json({ success: false, message: '检查收藏状态失败' });
  }
};

// 添加收藏
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tool_id } = req.body;
    if (!tool_id) return res.status(400).json({ success: false, message: '缺少工具ID' });

    // 确认工具存在
    const tool = await Tool.findByPk(tool_id);
    if (!tool) return res.status(404).json({ success: false, message: '工具不存在' });

    // 创建收藏（唯一约束）
    try {
      await Favorite.create({ user_id: userId, tool_id });
    } catch (e) {
      // 已存在则忽略
    }

    return res.status(201).json({ success: true, message: '已收藏' });
  } catch (error) {
    console.error('Add favorite failed:', error);
    res.status(500).json({ success: false, message: '收藏失败' });
  }
};

// 取消收藏
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { toolId } = req.params;
    if (!toolId) return res.status(400).json({ success: false, message: '缺少工具ID' });

    const count = await Favorite.destroy({ where: { user_id: userId, tool_id: toolId } });
    if (count === 0) {
      return res.status(404).json({ success: false, message: '未找到收藏记录' });
    }

    return res.json({ success: true, message: '已取消收藏' });
  } catch (error) {
    console.error('Remove favorite failed:', error);
    res.status(500).json({ success: false, message: '取消收藏失败' });
  }
};
