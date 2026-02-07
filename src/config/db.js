const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// 检查 DATABASE_URL 是否存在
if (!process.env.DATABASE_URL) {
  console.error('错误：未找到 DATABASE_URL 环境变量 (Error: DATABASE_URL not found)');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 导出 query 方法，方便使用
// Export query method for easier usage
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // 导出 pool 实例以备不时之需
};
