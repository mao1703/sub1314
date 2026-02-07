const db = require('../config/db');

// 创建文章
exports.createPost = async (req, res) => {
  const { title, content, category, tags, cover } = req.body;
  const author_id = req.user.id;

  if (!title) {
    return res.status(400).json({ message: '标题是必填的 (Title is required)' });
  }

  try {
    const newPost = await db.query(
      `INSERT INTO articles (title, content, category_id, tags, cover, author_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, content, category || null, JSON.stringify(tags || []), cover, author_id]
    );

    res.status(201).json({
      message: '文章创建成功 (Article created successfully)',
      article: newPost.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};

// 获取文章列表
exports.getPosts = async (req, res) => {
  const { page = 1, pageSize = 10, category, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    // 1. 构建查询条件
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    // 分类筛选
    if (category) {
      // 优化：优先使用 ID 匹配，避免不必要的 JOIN
      // 假设前端现在主要传 ID，但保留兼容性
      whereClause += ` AND (a.category_id::text = $${paramIndex} OR c.name = $${paramIndex})`;
      queryParams.push(category);
      paramIndex++;
    }

    // 关键词搜索
    if (keyword) {
      whereClause += ` AND (a.title ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    // 2. 获取总数 (Count Query)
    // 优化：COUNT(*) 不需要选择所有字段，也不需要排序
    const countQuery = `
      SELECT COUNT(*) 
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // 3. 分页查询 (Data Query)
    const dataQuery = `
      SELECT a.*, u.username as author_name, c.name as category_name 
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const result = await db.query(dataQuery, [...queryParams, pageSize, offset]);

    res.json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      articles: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};

// 获取我的文章列表
exports.getMyPosts = async (req, res) => {
  const { page = 1, pageSize = 10, category, keyword } = req.query;
  const offset = (page - 1) * pageSize;
  const userId = req.user.id;

  try {
    // 1. 构建查询条件
    let whereClause = 'WHERE a.author_id = $1';
    const queryParams = [userId];
    let paramIndex = 2;

    // 分类筛选
    if (category) {
      whereClause += ` AND (a.category_id::text = $${paramIndex} OR c.name = $${paramIndex})`;
      queryParams.push(category);
      paramIndex++;
    }

    // 关键词搜索
    if (keyword) {
      whereClause += ` AND (a.title ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    // 2. 获取总数 (Count Query)
    const countQuery = `
      SELECT COUNT(*) 
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // 3. 分页查询 (Data Query)
    const dataQuery = `
      SELECT a.*, u.username as author_name, c.name as category_name 
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const result = await db.query(dataQuery, [...queryParams, pageSize, offset]);

    res.json({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      articles: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};

// 获取文章详情
exports.getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    // 增加浏览次数
    await db.query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);

    const result = await db.query(
      `SELECT a.*, u.username as author_name, c.name as category_name
       FROM articles a
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '文章未找到 (Article not found)' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};

// 更新文章
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, category, tags, cover } = req.body;
  const userId = req.user.id;

  try {
    // 检查文章是否存在及权限
    const checkPost = await db.query('SELECT author_id FROM articles WHERE id = $1', [id]);
    
    if (checkPost.rows.length === 0) {
      return res.status(404).json({ message: '文章未找到 (Article not found)' });
    }

    if (checkPost.rows[0].author_id !== userId) {
      return res.status(403).json({ message: '无权修改此文章 (Permission denied)' });
    }

    // 动态构建更新查询
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (title) {
      updateFields.push(`title = $${paramIndex++}`);
      queryParams.push(title);
    }
    if (content) {
      updateFields.push(`content = $${paramIndex++}`);
      queryParams.push(content);
    }
    if (category !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      queryParams.push(category);
    }
    if (tags) {
      updateFields.push(`tags = $${paramIndex++}`);
      queryParams.push(JSON.stringify(tags));
    }
    if (cover) {
      updateFields.push(`cover = $${paramIndex++}`);
      queryParams.push(cover);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: '未提供更新字段 (No fields to update)' });
    }

    queryParams.push(id);
    const queryText = `UPDATE articles SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const updatedPost = await db.query(queryText, queryParams);

    res.json({
      message: '文章更新成功 (Article updated successfully)',
      article: updatedPost.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};

// 删除文章
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const checkPost = await db.query('SELECT author_id FROM articles WHERE id = $1', [id]);

    if (checkPost.rows.length === 0) {
      return res.status(404).json({ message: '文章未找到 (Article not found)' });
    }

    if (checkPost.rows[0].author_id !== userId) {
      return res.status(403).json({ message: '无权删除此文章 (Permission denied)' });
    }

    await db.query('DELETE FROM articles WHERE id = $1', [id]);

    res.json({ message: '文章删除成功 (Article deleted successfully)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};
