const db = require('../config/db');

const adminMiddleware = async (req, res, next) => {
  try {
    // req.user 已经由 authMiddleware 设置 (包含 id)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: '未授权 (Unauthorized)' });
    }

    // 查询数据库获取最新角色信息
    const result = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在 (User not found)' });
    }

    const userRole = result.rows[0].role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: '禁止访问：需要管理员权限 (Forbidden: Admin access required)' });
    }

    // 可以在这里把完整的 role 信息更新到 req.user
    req.user.role = userRole;
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ message: '服务器错误 (Server error)' });
  }
};

module.exports = adminMiddleware;
