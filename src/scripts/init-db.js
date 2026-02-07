const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function initDB() {
  // 检查是否存在 DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误：未找到 DATABASE_URL 环境变量。');
    console.error('请在 .env.local 中添加您的 PostgreSQL 连接字符串。');
    console.error('格式示例：postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('正在连接数据库...');
    const client = await pool.connect();
    
    try {
      console.log('正在读取 SQL 架构文件...');
      const sqlPath = path.resolve(__dirname, '../db/schema.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      console.log('正在执行 SQL 脚本...');
      await client.query(sql);
      
      console.log('✅ 数据库初始化成功！所有表已创建。');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ 数据库初始化失败：', err);
  } finally {
    await pool.end();
  }
}

initDB();
