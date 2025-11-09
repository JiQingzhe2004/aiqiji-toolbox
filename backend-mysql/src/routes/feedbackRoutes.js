/**
 * 意见反馈路由
 * 处理意见反馈相关的路由
 */

import express from 'express';
import { submitFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

// 公开路由
/**
 * @route POST /api/feedback/submit
 * @desc 提交意见反馈
 * @access Public
 */
router.post('/submit', submitFeedback);

export default router;

