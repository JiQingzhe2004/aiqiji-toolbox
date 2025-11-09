/**
 * 系统设置路由
 */

import express from 'express';
import {
  getPublicSettings,
  getAllSettings,
  updateSetting,
  updateSettings,
  deleteSetting,
  getWebsiteInfo,
  getAiModels,
  createAiModel,
  updateAiModel,
  deleteAiModel,
  applyAiModel
} from '../controllers/settingsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 公开路由 - 获取公开的系统设置
router.get('/public', getPublicSettings);

// 公开路由 - 获取网站基本信息
router.get('/website', getWebsiteInfo);

// 管理员路由 - 需要认证和管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 获取所有系统设置
router.get('/', getAllSettings);

// 更新单个系统设置
router.put('/', updateSetting);

// 批量更新系统设置
router.put('/batch', updateSettings);

// 删除系统设置
router.delete('/:setting_key', deleteSetting);

// ===== AI 模型预设管理 =====
router.get('/ai-models', getAiModels);
router.post('/ai-models', createAiModel);
router.put('/ai-models/:id', updateAiModel);
router.delete('/ai-models/:id', deleteAiModel);
router.post('/ai-models/:id/apply', applyAiModel);

export default router;
