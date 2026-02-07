const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// 加载环境变量
// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const port = process.env.PORT || 3000;

// 中间件
// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter); // Apply rate limiting to all API routes

// 静态文件托管
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 基础路由
// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Vue.js + Express 后端项目正在运行 (Backend is running)' });
});

// 示例：测试数据库连接的路由
// Example: Route to test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    // 使用 pg 连接池查询当前时间
    const result = await db.query('SELECT NOW()');
    
    res.json({ 
      status: 'success', 
      message: '数据库连接成功 (Database connected successfully)', 
      time: result.rows[0].now 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: '数据库连接失败 (Database connection failed)', error: err.message });
  }
});

// 启动服务器
// Start server
if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`端口 ${port} 已被占用，请尝试其他端口。`);
      console.error(`Port ${port} is already in use. Please try another port.`);
    } else {
      console.error(e);
    }
  });
}

module.exports = app;
