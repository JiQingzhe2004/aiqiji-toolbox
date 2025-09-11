/**
 * 友链申请路由
 * 处理友链申请相关的路由
 */

import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  submitApplication,
  getApplications,
  getApplicationStats,
  getApplicationById,
  approveApplication,
  rejectApplication,
  batchProcessApplications,
  deleteApplication,
  cleanupExpiredApplications
} from '../controllers/friendLinkController.js';

const router = express.Router();

// 公开路由
/**
 * @route POST /api/friend-links/apply
 * @desc 提交友链申请
 * @access Public
 */
router.post('/apply', submitApplication);

// 管理员路由
/**
 * @route GET /api/friend-links/applications
 * @desc 获取申请列表（分页、筛选、搜索）
 * @access Admin
 */
router.get('/applications', authenticateToken, requireAdmin, getApplications);

/**
 * @route GET /api/friend-links/applications/stats
 * @desc 获取申请统计
 * @access Admin
 */
router.get('/applications/stats', authenticateToken, requireAdmin, getApplicationStats);

/**
 * @route GET /api/friend-links/applications/:id
 * @desc 获取单个申请详情
 * @access Admin
 */
router.get('/applications/:id', authenticateToken, requireAdmin, getApplicationById);

/**
 * @route POST /api/friend-links/applications/:id/approve
 * @desc 批准友链申请
 * @access Admin
 */
router.post('/applications/:id/approve', authenticateToken, requireAdmin, approveApplication);

/**
 * @route POST /api/friend-links/applications/:id/reject
 * @desc 拒绝友链申请
 * @access Admin
 */
router.post('/applications/:id/reject', authenticateToken, requireAdmin, rejectApplication);

/**
 * @route POST /api/friend-links/applications/batch
 * @desc 批量处理申请
 * @access Admin
 */
router.post('/applications/batch', authenticateToken, requireAdmin, batchProcessApplications);

/**
 * @route DELETE /api/friend-links/applications/:id
 * @desc 删除申请记录
 * @access Admin
 */
router.delete('/applications/:id', authenticateToken, requireAdmin, deleteApplication);

/**
 * @route POST /api/friend-links/cleanup-expired
 * @desc 清理过期申请
 * @access Admin
 */
router.post('/cleanup-expired', authenticateToken, requireAdmin, cleanupExpiredApplications);

export default router;
