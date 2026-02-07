const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// 显式加载 .env.local，以防此文件被单独导入时未加载环境变量
// Explicitly load .env.local in case this file is imported independently
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：环境变量中缺少 SUPABASE_URL 或 SUPABASE_KEY');
  console.error('Error: Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
