import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/User.js';

// 列表查询
export const listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      role,
      status,
      sort = 'latest'
    } = req.query;

    const where = {};
    if (q) {
      const kw = q.trim().toLowerCase();
      where[Op.or] = [
        { username: { [Op.like]: `%${kw}%` } },
        { email: { [Op.like]: `%${kw}%` } },
        { display_name: { [Op.like]: `%${kw}%` } },
      ];
    }
    if (role && ['admin','user'].includes(role)) where.role = role;
    if (status && ['active','inactive','suspended'].includes(status)) where.status = status;

    const order = sort === 'name'
      ? [['username', 'ASC']]
      : [['created_at', 'DESC']];

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order,
      attributes: { exclude: ['password_hash', 'login_attempts', 'locked_until'] }
    });

    return res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('List users failed:', error);
    return res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
};

// 创建用户（管理员）
export const createUser = async (req, res) => {
  try {
    const { username, password, role = 'user', status = 'active', email, display_name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码必填' });
    }
    const exists = await User.findOne({ where: { username: username.toLowerCase().trim() } });
    if (exists) return res.status(409).json({ success: false, message: '用户名已存在' });

    if (email) {
      const emailExists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (emailExists) return res.status(409).json({ success: false, message: '邮箱已存在' });
    }

    const password_hash = await bcrypt.hash(String(password), 12);
    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : null,
      display_name: display_name || null,
      password_hash,
      role,
      status
    });

    const { password_hash: _ph, login_attempts, locked_until, ...safe } = user.toJSON();
    return res.status(201).json({ success: true, data: { user: safe }, message: '用户创建成功' });
  } catch (error) {
    console.error('Create user failed:', error);
    return res.status(500).json({ success: false, message: '创建用户失败' });
  }
};

// 更新用户（管理员）
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, email, display_name, username, avatar_url, avatar_file } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const updates = {};
    if (role && ['admin','user'].includes(role)) updates.role = role;
    if (status && ['active','inactive','suspended'].includes(status)) updates.status = status;
    if (username !== undefined) {
      const uname = String(username).toLowerCase().trim();
      if (!uname) return res.status(400).json({ success: false, message: '用户名不能为空' });
      if (uname !== user.username) {
        const taken = await User.findOne({ where: { username: uname, id: { [Op.ne]: id } } });
        if (taken) return res.status(409).json({ success: false, message: '用户名已存在' });
      }
      updates.username = uname;
    }
    if (email !== undefined) {
      if (email) {
        // check email unique
        const taken = await User.findOne({ where: { email: email.toLowerCase().trim(), id: { [Op.ne]: id } } });
        if (taken) return res.status(409).json({ success: false, message: '邮箱已被使用' });
        updates.email = email.toLowerCase().trim();
      } else {
        updates.email = null;
      }
    }
    if (display_name !== undefined) updates.display_name = display_name || null;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url || null;
    if (avatar_file !== undefined) updates.avatar_file = avatar_file || null;

    await user.update(updates);
    const json = user.toJSON();
    delete json.password_hash; delete json.login_attempts; delete json.locked_until;
    return res.json({ success: true, data: { user: json }, message: '用户更新成功' });
  } catch (error) {
    console.error('Update user failed:', error);
    return res.status(500).json({ success: false, message: '更新用户失败' });
  }
};

// 重置密码（管理员直接设置）
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少6位' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const password_hash = await bcrypt.hash(String(newPassword), 12);
    await user.update({ password_hash });
    return res.json({ success: true, message: '密码已重置' });
  } catch (error) {
    console.error('Reset password failed:', error);
    return res.status(500).json({ success: false, message: '重置密码失败' });
  }
};

// 切换状态
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active','inactive','suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    await user.update({ status });
    const json = user.toJSON();
    delete json.password_hash; delete json.login_attempts; delete json.locked_until;
    return res.json({ success: true, data: { user: json }, message: '状态已更新' });
  } catch (error) {
    console.error('Update status failed:', error);
    return res.status(500).json({ success: false, message: '更新状态失败' });
  }
};

// 删除用户
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    await user.destroy();
    return res.json({ success: true, message: '用户已删除' });
  } catch (error) {
    console.error('Delete user failed:', error);
    return res.status(500).json({ success: false, message: '删除用户失败' });
  }
};

// 管理员上传用户头像
export const adminUploadUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    if (!req.file && !(req.processedFiles && req.processedFiles.avatar)) {
      return res.status(400).json({ success: false, message: '未接收到头像文件' });
    }

    // 删除旧头像文件（如果有且需要，可选）
    try {
      if (user.avatar_file) {
        const { deleteAvatarFile } = await import('../middleware/upload.js');
        deleteAvatarFile(user.avatar_file);
      }
    } catch (e) {
      console.warn('删除旧头像失败(忽略):', e?.message || e);
    }

    const avatarFile = req.processedFiles ? req.processedFiles.avatar : req.file.filename;
    const staticUrl = process.env.STATIC_URL || '/static';
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const avatarUrl = `${base}${staticUrl}/avatars/${avatarFile}`;

    await user.update({ avatar_file: avatarFile, avatar_url: avatarUrl });

    return res.json({
      success: true,
      message: '头像上传成功',
      data: { user: { ...user.toJSON(), password_hash: undefined, login_attempts: undefined, locked_until: undefined } }
    });
  } catch (error) {
    console.error('Admin upload avatar failed:', error);
    return res.status(500).json({ success: false, message: '上传头像失败' });
  }
};
