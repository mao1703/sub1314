const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function optimizeDb() {
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
      console.log('🚀 开始数据库优化...');

      // 1. 基础索引 (B-Tree)
      console.log('📦 创建基础索引...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
        CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
        CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      `);
      console.log('✅ 基础索引创建完成');

      // 2. 尝试启用 pg_trgm 扩展以支持模糊搜索优化
      try {
        console.log('🔍 尝试启用 pg_trgm 扩展...');
        await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        
        console.log('📦 创建 GIN 索引 (用于标题模糊搜索)...');
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING GIN (title gin_trgm_ops);
          CREATE INDEX IF NOT EXISTS idx_articles_content_trgm ON articles USING GIN (content gin_trgm_ops);
        `);
        console.log('✅ 模糊搜索索引创建完成');
      } catch (err) {
        console.warn('⚠️ 无法启用 pg_trgm 扩展或创建 GIN 索引 (可能需要超级用户权限)，跳过此步骤。', err.message);
        // 回退方案：创建普通索引（仅加速精确匹配或前缀匹配，对 %keyword% 帮助有限）
        await client.query('CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);');
      }

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

optimizeDb();
