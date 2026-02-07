const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function seedCategories() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ 未找到 DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const categories = ['技术', '生活', '随笔'];

  try {
    const client = await pool.connect();
    try {
      for (const name of categories) {
        // 检查是否存在
        const res = await client.query('SELECT id FROM categories WHERE name = $1', [name]);
        if (res.rows.length === 0) {
          await client.query('INSERT INTO categories (name) VALUES ($1)', [name]);
          console.log(`✅ 已插入分类: ${name}`);
        } else {
          console.log(`ℹ️ 分类已存在: ${name}`);
        }
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ 插入分类失败:', err);
  } finally {
    await pool.end();
  }
}

seedCategories();
