import express from 'express';
import multer from 'multer';
import { 
  downloadTemplate, 
  importFromExcel, 
  exportToExcel 
} from '../controllers/importController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 配置multer用于Excel文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许Excel文件类型
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式 (.xls, .xlsx)'), false);
    }
  }
});

/**
 * 导入导出路由
 */

// GET /api/v1/import/template - 下载Excel导入模板
router.get('/template', downloadTemplate);

// POST /api/v1/import/excel - Excel文件导入（需要管理员权限）
router.post('/excel', 
  authenticateToken, 
  requireAdmin,
  upload.single('file'),
  importFromExcel
);

// GET /api/v1/import/export - 导出当前工具数据为Excel（需要管理员权限）
router.get('/export', 
  authenticateToken, 
  requireAdmin,
  exportToExcel
);

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      });
    }
  }
  
  if (error.message.includes('只支持Excel文件格式')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

export default router;
