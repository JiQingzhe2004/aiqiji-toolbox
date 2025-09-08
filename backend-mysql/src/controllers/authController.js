/**
 * 身份验证控制器
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

    // 查找用户
    const user = await User.findOne({
      where: { 
        username: username.toLowerCase().trim(),
        status: 'active'
      }
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
      role: user.role,
      createdAt: user.created_at
    };

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
      role: user.role,
      createdAt: user.created_at
    };

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
 * 用户注册（仅管理员可用）
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

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
      password_hash,
      role
    });

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
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
