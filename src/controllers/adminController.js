const db = require('../config/db');
const bcrypt = require('bcrypt');

// 获取所有用户
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, email, role, created_at, avatar FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  
  // 防止自杀 (管理员不能删除自己)
  if (id === req.user.id) {
    return res.status(400).json({ message: '不能删除自己的管理员账号' });
  }

  try {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: '用户已删除' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 修改用户信息 (管理员修改)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { password, role, username, email } = req.body; // 管理员主要修改密码或权限

  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    if (role) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (username) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }

    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有提供要修改的信息' });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, role`;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户未找到' });
    }

    res.json({ message: '用户信息更新成功', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有文章 (管理视图)
exports.getAllPosts = async (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pIdx = 1;

    if (keyword) {
      whereClause += ` AND (a.title ILIKE $${pIdx} OR u.username ILIKE $${pIdx})`;
      params.push(`%${keyword}%`);
      pIdx++;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);

    const dataQuery = `
      SELECT a.id, a.title, a.created_at, a.views, u.username as author_name, c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const dataRes = await db.query(dataQuery, [...params, pageSize, offset]);

    res.json({
      total: parseInt(countRes.rows[0].count),
      articles: dataRes.rows,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 修改文章 (管理员权限)
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, category, tags, cover } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (content) {
      updates.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    if (category) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(category);
    }
    if (tags) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(tags));
    }
    if (cover) {
      updates.push(`cover = $${paramIndex++}`);
      values.push(cover);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有提供要修改的信息' });
    }

    values.push(id);
    const query = `UPDATE articles SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '文章未找到' });
    }

    res.json({ message: '文章更新成功 (管理员操作)', article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除文章 (管理员权限)
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '文章未找到' });
    }
    res.json({ message: '文章已删除 (管理员操作)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取指定用户的标签
exports.getUserTags = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT tags FROM user_tags WHERE user_id = $1', [id]);
    const tags = result.rows.length > 0 ? result.rows[0].tags : [];
    if (tags.length === 0) {
      return res.json();
    }
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新指定用户的标签
exports.updateUserTags = async (req, res) => {
  const { id } = req.params;
  const { tags } = req.body;

  if (!Array.isArray(tags)) {
    return res.status(400).json({ message: '标签必须是数组' });
  }

  try {
    const query = `
      INSERT INTO user_tags (user_id, tags)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET tags = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING tags
    `;
    const result = await db.query(query, [id, tags]);
    res.json({ message: '标签更新成功', tags: result.rows[0].tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
};
