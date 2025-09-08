/**
 * 身份验证路由
 */

import express from 'express';
import { login, register, validateToken, logout } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 用户登录
router.post('/login', login);

// 用户登出
router.post('/logout', logout);

// 验证token
router.get('/validate', validateToken);

// 用户注册（需要管理员权限）
router.post('/register', authenticateToken, requireAdmin, register);

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

export default router;
