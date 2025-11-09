import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadAvatar, processAvatar, handleUploadError } from '../middleware/upload.js';
import { listUsers, createUser, updateUser, resetPassword, updateStatus, deleteUser, adminUploadUserAvatar } from '../controllers/userController.js';

const router = express.Router();

// 管理员专用用户管理接口
router.get('/', authenticateToken, requireAdmin, listUsers);
router.post('/', authenticateToken, requireAdmin, createUser);
router.put('/:id', authenticateToken, requireAdmin, updateUser);
router.post('/:id/reset-password', authenticateToken, requireAdmin, resetPassword);
router.patch('/:id/status', authenticateToken, requireAdmin, updateStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

// 管理员上传用户头像
router.post('/:id/avatar', authenticateToken, requireAdmin, uploadAvatar, processAvatar, adminUploadUserAvatar, handleUploadError);

export default router;
