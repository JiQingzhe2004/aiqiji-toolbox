import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 文件上传中间件
 */

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const iconDir = path.join(uploadDir, 'icons');
const avatarDir = path.join(uploadDir, 'avatars');
const attachmentsDir = path.join(uploadDir, 'attachments');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, iconDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/svg+xml,image/webp,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

// Multer配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// 头像存储配置
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `avatar_${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

// 头像上传配置
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_AVATAR_SIZE) || 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

/**
 * 图标上传中间件
 */
export const uploadIcon = upload.single('iconFile');

/**
 * 头像上传中间件
 */
export const uploadAvatar = avatarUpload.single('avatar');

// 附件上传配置
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentsDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `att_${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

const attachmentsUpload = multer({
  storage: attachmentStorage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE) || 10 * 1024 * 1024, // 10MB
    files: parseInt(process.env.MAX_ATTACHMENT_COUNT) || 5
  }
});

/**
 * 附件上传中间件（多文件）
 */
export const uploadAttachments = attachmentsUpload.array('attachments');

/**
 * 图像处理中间件
 */
export const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  try {
    const { filename } = req.file;
    const inputPath = path.join(iconDir, filename);
    
    // 如果是SVG文件，跳过处理
    if (req.file.mimetype === 'image/svg+xml') {
      return next();
    }
    
    // 创建不同尺寸的图标
    const sizes = [32, 64, 128, 256];
    const processedFiles = {};
    
    for (const size of sizes) {
      const outputFilename = `${path.parse(filename).name}_${size}${path.parse(filename).ext}`;
      const outputPath = path.join(iconDir, outputFilename);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath.replace(path.extname(outputPath), '.png'));
        
      processedFiles[size] = outputFilename.replace(path.extname(outputFilename), '.png');
    }
    
    // 保存处理后的文件信息
    req.processedFiles = processedFiles;
    req.originalFile = filename;
    
    next();
  } catch (error) {
    console.error('图像处理失败:', error);
    next(error);
  }
};

/**
 * 头像图像处理中间件
 */
export const processAvatar = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  try {
    const { filename } = req.file;
    const inputPath = path.join(avatarDir, filename);
    
    // 如果是SVG文件，跳过处理
    if (req.file.mimetype === 'image/svg+xml') {
      return next();
    }
    
    // 只生成一张200px的头像，压缩到200KB以内
    const outputFilename = `${path.parse(filename).name}_avatar.jpg`;
    const outputPath = path.join(avatarDir, outputFilename);
    
    let quality = 85;
    let buffer;
    
    // 逐步降低质量直到文件大小在200KB以内
    do {
      buffer = await sharp(inputPath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality })
        .toBuffer();
      
      if (buffer.length <= 200 * 1024) break; // 200KB
      quality -= 5;
    } while (quality > 30); // 最低质量30%
    
    // 写入文件
    await fs.promises.writeFile(outputPath, buffer);
    
    // 删除原始文件
    await fs.promises.unlink(inputPath);
    
    // 保存处理后的文件信息
    req.processedFiles = { avatar: outputFilename };
    req.originalFile = filename;
    
    next();
  } catch (error) {
    console.error('头像处理失败:', error);
    next(error);
  }
};

/**
 * 删除文件
 */
export const deleteFile = (filename) => {
  const filePath = path.join(iconDir, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    
    // 删除相关的处理文件
    const baseName = path.parse(filename).name;
    const sizes = [32, 64, 128, 256];
    
    sizes.forEach(size => {
      const sizedFile = path.join(iconDir, `${baseName}_${size}.png`);
      if (fs.existsSync(sizedFile)) {
        fs.unlinkSync(sizedFile);
      }
    });
  }
};

/**
 * 删除头像文件
 */
export const deleteAvatarFile = (filename) => {
  const filePath = path.join(avatarDir, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * 获取文件URL
 */
export const getFileUrl = (filename) => {
  if (!filename) return null;
  const staticUrl = process.env.STATIC_URL || '/static';
  return `${staticUrl}/icons/${filename}`;
};

/**
 * 获取头像URL
 */
export const getAvatarUrl = (filename) => {
  if (!filename) return null;
  const staticUrl = process.env.STATIC_URL || '/static';
  return `${staticUrl}/avatars/${filename}`;
};

/**
 * 验证图标文件
 */
export const validateIconFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '请选择图标文件'
    });
  }
  
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`
    });
  }
  
  next();
};

/**
 * 错误处理中间件
 */
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超出限制'
      });
    }
  }
  
  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};
