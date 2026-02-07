const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding role column...');
    // 添加 role 字段，默认为 'user'
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    `);
    
    console.log('Setting admin user...');
    // 将指定用户设为管理员
    const adminId = 'f833983c-51a2-422f-a5b4-8bfa0db4934d'; // user_903864
    await client.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', adminId]);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
