import express from 'express';
import {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  rateTool,
  getToolStats,
  getFeaturedTools,
  uploadIcon
} from '../controllers/toolController.js';

import {
  uploadIcon as uploadMiddleware,
  processImage,
  validateIconFile,
  handleUploadError
} from '../middleware/upload.js';

import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * 工具相关路由
 */

// 公开路由

// GET /api/v1/tools - 获取所有工具（可选认证，用于返回favorited标志）
router.get('/', optionalAuth, getAllTools);

// GET /api/v1/tools/featured - 获取精选工具
router.get('/featured', getFeaturedTools);

// GET /api/v1/tools/stats - 获取工具统计信息
router.get('/stats', getToolStats);

// GET /api/v1/tools/:id - 根据ID获取单个工具
router.get('/:id', getToolById);


// POST /api/v1/tools/:id/rate - 工具评分
router.post('/:id/rate', rateTool);

// 管理员路由 (需要身份验证和管理员权限)

// POST /api/v1/tools - 创建工具
router.post('/',
  authenticateToken,
  requireAdmin,
  uploadMiddleware,
  handleUploadError,
  processImage,
  createTool
);

// PUT /api/v1/tools/:id - 更新工具
router.put('/:id',
  authenticateToken,
  requireAdmin,
  uploadMiddleware,
  handleUploadError,
  processImage,
  updateTool
);

// DELETE /api/v1/tools/:id - 删除工具
router.delete('/:id', authenticateToken, requireAdmin, deleteTool);

// POST /api/v1/tools/upload/icon - 单独上传图标
router.post('/upload/icon',
  authenticateToken,
  requireAdmin,
  uploadMiddleware,
  handleUploadError,
  validateIconFile,
  processImage,
  uploadIcon
);

export default router;
