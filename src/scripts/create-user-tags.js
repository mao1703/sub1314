const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTable() {
  const client = await pool.connect();
  try {
    console.log('Creating user_tags table...');
    
    // 创建 user_tags 表
    // user_id 作为主键，确保每个用户只有一条记录存储其标签列表
    // tags 存储为文本数组
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tags (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        tags TEXT[] DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('user_tags table created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createTable();
