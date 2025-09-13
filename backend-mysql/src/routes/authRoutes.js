/**
 * 身份验证路由
 */

import express from 'express';
import { login, register, validateToken, logout, changePassword, updateProfile, getProfile, getUserByUsername, checkEmailExists, checkUsernameExists } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 用户登录
router.post('/login', login);

// 用户登出
router.post('/logout', logout);

// 验证token
router.get('/validate', validateToken);

// 用户注册（公开注册）
router.post('/register', register);

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// 获取个人详细信息
router.get('/profile', authenticateToken, getProfile);

// 更新个人信息
router.put('/profile', authenticateToken, updateProfile);

// 修改密码
router.post('/change-password', authenticateToken, changePassword);

// 根据用户名获取公开用户信息（无需登录）
router.get('/user/:username', getUserByUsername);

// 检查邮箱是否已存在（无需登录）
router.post('/check-email', checkEmailExists);

// 检查用户名是否已存在（无需登录）
router.post('/check-username', checkUsernameExists);

export default router;
