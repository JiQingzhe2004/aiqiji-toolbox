/**
 * 身份验证控制器
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { VerificationCodeService } from '../services/VerificationCodeService.js';

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 用户登录
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户 - 支持用户名或邮箱登录
    const isEmail = username.includes('@');
    const whereCondition = isEmail 
      ? { email: username.toLowerCase().trim(), status: 'active' }
      : { username: username.toLowerCase().trim(), status: 'active' };
    
    const user = await User.findOne({
      where: whereCondition
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查账户是否被锁定
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: '账户已被锁定，请稍后再试'
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // 增加失败次数
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 重置登录失败次数
    await user.resetLoginAttempts();

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
      createdAt: user.created_at
    };

    console.log('🔐 Login - 返回的用户信息:', {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      display_name: userInfo.display_name,
      avatar_url: userInfo.avatar_url,
      role: userInfo.role
    });

    res.json({
      success: true,
      data: {
        user: userInfo,
        token
      },
      message: '登录成功'
    });

  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 验证token
 */
export const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查找用户
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        status: 'active'
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 返回用户信息
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
      createdAt: user.created_at
    };

    console.log('🔍 ValidateToken - 从数据库查询的用户信息:', {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role
    });

    console.log('🔍 ValidateToken - 返回的用户信息:', userInfo);

    res.json({
      success: true,
      data: {
        user: userInfo,
        valid: true
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token已过期'
      });
    }

    console.error('Token validation error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 用户注册（公开注册，需要邮箱验证码）
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, displayName, verificationCode, role = 'user' } = req.body;
    const verificationCodeService = new VerificationCodeService();

    // 验证输入
    if (!username || !password || !email || !verificationCode || !displayName) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱、昵称、密码和验证码不能为空'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为8位'
      });
    }

    // 验证密码强度
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: '密码必须包含大小写字母和数字'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址'
      });
    }

    // 验证验证码
    const isValidCode = await verificationCodeService.verifyCode(email, verificationCode, 'register');
    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 标记验证码为已使用
    await verificationCodeService.markCodeAsUsed(email, verificationCode, 'register');

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username: username.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await User.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: '邮箱已存在'
        });
      }
    }

    // 加密密码
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email?.toLowerCase().trim(),
      display_name: displayName?.trim(),
      password_hash,
      role
    });

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      createdAt: user.created_at
    };

    res.status(201).json({
      success: true,
      data: userInfo,
      message: '用户创建成功'
    });

  } catch (error) {
    console.error('Register error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 用户登出
 */
export const logout = async (req, res) => {
  // 在无状态JWT系统中，登出主要由前端处理（删除token）
  // 这里可以添加token黑名单逻辑（如果需要的话）
  res.json({
    success: true,
    message: '登出成功'
  });
};


/**
 * 更新个人信息
 */
export const updateProfile = async (req, res) => {
  try {
    const { email, display_name, avatar_url, avatar_file } = req.body;
    const userId = req.user.id;

    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证邮箱格式（如果提供了邮箱）
    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        });
      }

      // 检查邮箱是否已被其他用户使用
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: { 
            email: email.toLowerCase().trim(),
            id: { [Op.ne]: userId }
          }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: '该邮箱已被其他用户使用'
          });
        }
      }
    }

    // 验证昵称长度（如果提供了昵称）
    if (display_name !== undefined && display_name && (display_name.length < 1 || display_name.length > 100)) {
      return res.status(400).json({
        success: false,
        message: '昵称长度必须在1-100字符之间'
      });
    }

    // 构建更新数据
    const updateData = {};
    if (email !== undefined) {
      updateData.email = email ? email.toLowerCase().trim() : null;
    }
    if (display_name !== undefined) {
      updateData.display_name = display_name ? display_name.trim() : null;
    }
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }
    if (avatar_file !== undefined) {
      updateData.avatar_file = avatar_file;
    }

    await user.update(updateData);

    // 返回更新后的用户信息（不包含敏感信息）
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'login_attempts', 'locked_until'] }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: '个人信息更新成功'
    });

  } catch (error) {
    console.error('Update profile error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取个人信息
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 返回用户信息
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at
    };

    res.json({
      success: true,
      data: userInfo
    });

  } catch (error) {
    console.error('Get profile error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 检查邮箱是否已存在
 */
export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: '邮箱地址不能为空'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    res.json({
      success: true,
      data: {
        email: email.toLowerCase().trim(),
        exists: !!existingUser,
        message: existingUser ? '该邮箱已被注册' : '该邮箱可以使用'
      }
    });

  } catch (error) {
    console.error('Check email exists error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 检查用户名是否已存在
 */
export const checkUsernameExists = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: '用户名不能为空'
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username: username.toLowerCase().trim() }
    });

    res.json({
      success: true,
      data: {
        username: username.toLowerCase().trim(),
        exists: !!existingUser,
        message: existingUser ? '该用户名已被占用' : '该用户名可以使用'
      }
    });

  } catch (error) {
    console.error('Check username exists error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 根据用户名获取公开用户信息
 */
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: '用户名不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({
      where: {
        username: username.toLowerCase().trim(),
        status: 'active' // 只显示活跃用户
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查是否为用户本人（通过Authorization头）
    let isOwnProfile = false;
    try {
      const authHeader = req.headers.authorization;
      console.log('🔐 GetUserByUsername - Authorization头:', authHeader);
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('🔐 GetUserByUsername - 提取的Token:', token.substring(0, 50) + '...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('🔐 GetUserByUsername - 解码的JWT:', decoded);
        console.log('🔐 GetUserByUsername - JWT用户ID:', decoded.userId);
        console.log('🔐 GetUserByUsername - 请求的用户ID:', user.id);
        isOwnProfile = decoded.userId === user.id;
        console.log('🔐 GetUserByUsername - 是否本人资料:', isOwnProfile);
      }
    } catch (error) {
      // 忽略token验证失败，继续返回公开信息
      console.log('🔐 GetUserByUsername - JWT验证失败:', error.message);
    }

    // 返回用户信息（如果是本人则包含邮箱等私人信息）
    const publicUserInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login_success: user.last_login_success,
      // 如果是本人，包含邮箱信息
      ...(isOwnProfile && { email: user.email }),
      // 可以扩展更多公开信息，如头像、简介等
      profile: {
        display_name: user.display_name || user.username, // 优先使用昵称，否则使用用户名
        avatar: user.avatar_url, // 头像链接
        // 未来可以添加更多个人资料字段
      }
    };

    console.log('👤 GetUserByUsername - 请求用户:', username);
    console.log('👤 GetUserByUsername - 是否本人资料:', isOwnProfile);
    console.log('👤 GetUserByUsername - 从数据库查询的用户信息:', {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role
    });
    console.log('👤 GetUserByUsername - 返回的公开信息:', publicUserInfo);

    res.json({
      success: true,
      data: publicUserInfo
    });

  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};


/**
 * 请求修改密码验证码
 */
export const requestPasswordChangeCode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查找用户
    const user = await User.findByPk(userId);
    if (!user || !user.email) {
      return res.status(400).json({
        success: false,
        message: '用户邮箱不存在，无法发送验证码'
      });
    }
    
    // 发送验证码
    const result = await VerificationCodeService.sendCode(
      user.email,
      'password_change',
      req.ip,
      req.get('User-Agent')
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: '验证码已发送到您的邮箱'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error) {
    console.error('Request password change code error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 修改密码
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, verificationCode } = req.body;
    
    // 验证输入
    if (!currentPassword || !newPassword || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: '当前密码、新密码和验证码都不能为空'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少6位'
      });
    }
    
    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与当前密码相同'
      });
    }
    
    // 验证验证码
    const codeVerification = await VerificationCodeService.verifyCode(
      user.email,
      verificationCode,
      'password_change'
    );
    
    if (!codeVerification.success) {
      return res.status(400).json({
        success: false,
        message: codeVerification.message
      });
    }
    
    // 生成新密码哈希
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // 更新密码
    await user.update({
      password_hash: newPasswordHash
    });
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 上传头像
 */
export const uploadUserAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择头像文件'
      });
    }
    
    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 删除旧头像文件（如果存在）
    if (user.avatar_file) {
      try {
        const { deleteAvatarFile } = await import('../middleware/upload.js');
        deleteAvatarFile(user.avatar_file);
      } catch (error) {
        console.error('删除旧头像失败:', error);
      }
    }
    
    // 使用处理后的头像文件
    const avatarFile = req.processedFiles ? req.processedFiles.avatar : req.file.filename;
    const staticUrl = process.env.STATIC_URL || '/static';
    const avatarUrl = `${staticUrl}/avatars/${avatarFile}`;
    
    // 更新用户头像信息
    await user.update({
      avatar_file: avatarFile,
      avatar_url: avatarUrl
    });
    
    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar_url: avatarUrl,
        avatar_file: avatarFile
      }
    });
    
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 请求邮箱修改验证码
 */
export const requestEmailChangeCode = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: '新邮箱地址不能为空'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 检查新邮箱是否已被使用
    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被其他用户使用'
      });
    }

    // 生成并发送验证码
    const code = VerificationCodeService.generateCode();
    await VerificationCodeService.storeCode(userId, 'email_change', code, { newEmail });

    // 这里需要发送邮件到新邮箱
    // TODO: 实现发送邮件功能
    console.log(`邮箱修改验证码: ${code}, 新邮箱: ${newEmail}`);

    res.json({
      success: true,
      message: '验证码已发送到新邮箱'
    });

  } catch (error) {
    console.error('Request email change code error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 修改邮箱
 */
export const changeEmail = async (req, res) => {
  try {
    const { newEmail, verificationCode } = req.body;
    const userId = req.user.id;

    if (!newEmail || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: '新邮箱和验证码不能为空'
      });
    }

    // 验证验证码
    const isValid = await VerificationCodeService.verifyCode(userId, 'email_change', verificationCode);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 再次检查新邮箱是否已被使用
    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被其他用户使用'
      });
    }

    // 更新用户邮箱
    const user = await User.findByPk(userId);
    await user.update({ email: newEmail });

    // 清除验证码
    await VerificationCodeService.clearCode(userId, 'email_change');

    res.json({
      success: true,
      message: '邮箱修改成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Change email error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};