const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const authMiddleware = (req, res, next) => {
  // 1. 获取 Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '未授权：未提供 Token (Unauthorized: No token provided)' });
  }

  try {
    // 2. 验证 Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (err) {
    return res.status(403).json({ message: '禁止访问：Token 无效或已过期 (Forbidden: Invalid or expired token)' });
  }
};

module.exports = authMiddleware;
