const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function optimizeUserDb() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ 未找到 DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    try {
      console.log('🚀 开始用户表数据库优化...');

      // 1. 确保唯一索引存在 (Unique Constraint 自动创建索引，但这里显式确认)
      // 注意：PostgreSQL 的 UNIQUE 约束会自动创建索引，所以这里主要关注性能索引
      
      // 2. 确保主键索引 (ID) 存在 - 默认就有
      
      // 3. 额外的性能索引 (虽然 UNIQUE 已经涵盖了查找，但如果将来有非唯一查找需求)
      // 其实对于 Users 表，主要通过 ID (PK), Username (Unique), Email (Unique) 查找
      // 所以默认的约束索引已经足够快了。
      
      // 为了以防万一，我们检查并创建这些索引（如果它们因某种原因丢失）
      // 使用 IF NOT EXISTS 是安全的
      
      console.log('📦 检查用户表索引...');
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);
      `);
      
      console.log('✅ 用户表索引检查完成');
      console.log('🎉 数据库优化完成！');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ 优化失败:', err);
  } finally {
    await pool.end();
  }
}

optimizeUserDb();
