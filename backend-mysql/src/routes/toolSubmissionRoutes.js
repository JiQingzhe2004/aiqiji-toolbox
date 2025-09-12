import express from 'express';
import {
  submitTool,
  getAllSubmissions,
  getSubmissionById,
  reviewSubmission,
  batchReview,
  deleteSubmission,
  getSubmissionStats,
  updateSubmission,
  checkDuplicateTools
} from '../controllers/toolSubmissionController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadIcon } from '../middleware/upload.js';

const router = express.Router();

/**
 * 工具提交相关路由
 */

// 公开路由 - 用户提交工具
router.post('/submit', uploadIcon, submitTool);

// 公开路由 - 检查重复工具
router.get('/check-duplicates', checkDuplicateTools);

// 管理员路由 - 需要认证和管理员权限
router.get('/admin/submissions', authenticateToken, requireAdmin, getAllSubmissions);
router.get('/admin/submissions/stats', authenticateToken, requireAdmin, getSubmissionStats);
router.get('/admin/submissions/:id', authenticateToken, requireAdmin, getSubmissionById);
router.put('/admin/submissions/:id', authenticateToken, requireAdmin, uploadIcon, updateSubmission);
router.post('/admin/submissions/:id/review', authenticateToken, requireAdmin, reviewSubmission);
router.post('/admin/submissions/batch-review', authenticateToken, requireAdmin, batchReview);
router.delete('/admin/submissions/:id', authenticateToken, requireAdmin, deleteSubmission);

export default router;
