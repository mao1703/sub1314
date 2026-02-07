const bcrypt = require('bcrypt');
const db = require('../config/db');

// 验证邮箱格式
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// 获取个人资料
exports.getProfile = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 头像上传
exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '未选择文件' });
  }

  const userId = req.user.id;
  // 构建访问 URL
  // 使用 req.get('host') 获取实际请求的主机名和端口，避免硬编码 3001
  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  try {
    const result = await db.query(
      'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING id, username, email, avatar, created_at',
      [avatarUrl, userId]
    );

    res.json({
      message: '头像上传成功',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 更新个人资料 (昵称, 邮箱, 头像)
exports.updateProfile = async (req, res) => {
  const { username, email, avatar } = req.body;
  const userId = req.user.id;

  // 动态构建更新查询
  let updateFields = [];
  let queryParams = [];
  let paramIndex = 1;

  if (username) {
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: '用户名长度必须在 3 到 20 个字符之间' });
    }
    updateFields.push(`username = $${paramIndex++}`);
    queryParams.push(username);
  }

  if (email) {
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: '邮箱格式无效' });
    }
    updateFields.push(`email = $${paramIndex++}`);
    queryParams.push(email);
  }

  if (avatar !== undefined) {
    updateFields.push(`avatar = $${paramIndex++}`);
    queryParams.push(avatar);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: '没有需要更新的字段' });
  }

  queryParams.push(userId);

  try {
    const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, avatar, created_at`;
    
    const result = await db.query(queryText, queryParams);

    res.json({
      message: '个人资料更新成功',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    // 处理唯一约束冲突
    if (err.code === '23505') { // PostgreSQL unique violation code
      if (err.detail.includes('username')) {
        return res.status(409).json({ message: '用户名已存在' });
      }
      if (err.detail.includes('email')) {
        return res.status(409).json({ message: '邮箱已存在' });
      }
    }
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 修改密码
exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: '旧密码和新密码都是必填的' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: '新密码长度至少为 6 位' });
  }

  try {
    // 1. 获取当前用户密码
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const currentPasswordHash = userResult.rows[0].password;

    // 2. 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, currentPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: '旧密码错误' });
    }

    // 3. 加密新密码
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. 更新密码
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
};

// 获取用户自定义标签
exports.getUserTags = async (req, res) => {
  try {
    const result = await db.query('SELECT tags FROM user_tags WHERE user_id = $1', [req.user.id]);
    const tags = result.rows.length > 0 ? result.rows[0].tags : [];
    // 如果没有标签，返回默认标签
    if (tags.length === 0) {
      return res.json();
    }
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新用户标签 (自动去重)
exports.updateUserTags = async (req, res) => {
  const { tags } = req.body; // Expecting array of strings
  if (!Array.isArray(tags)) {
    return res.status(400).json({ message: '标签必须是数组' });
  }

  try {
    // Upsert logic
    const query = `
      INSERT INTO user_tags (user_id, tags)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET tags = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING tags
    `;
    const result = await db.query(query, [req.user.id, tags]);
    res.json(result.rows[0].tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};
