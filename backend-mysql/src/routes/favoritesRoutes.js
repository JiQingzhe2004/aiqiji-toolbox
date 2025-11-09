import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { listFavorites, addFavorite, removeFavorite, existsFavorite } from '../controllers/favoritesController.js';

const router = express.Router();

// 所有收藏接口均需登录
router.get('/', authenticateToken, listFavorites);
router.post('/', authenticateToken, addFavorite);
router.delete('/:toolId', authenticateToken, removeFavorite);
router.get('/:toolId/exists', authenticateToken, existsFavorite);

export default router;
