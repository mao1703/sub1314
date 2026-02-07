const http = require('http');

const request = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const dataString = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(dataString) }),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (data) req.write(dataString);
    req.end();
  });
};

async function testEmailVerification() {
  const timestamp = Date.now().toString().slice(-6);
  const email = `verify_${timestamp}@example.com`;
  const username = `user_${timestamp}`;
  const password = 'password123';

  console.log('--- 开始邮箱验证注册测试 ---');

  try {
    // 1. 发送验证码
    console.log('\n1. 请求发送验证码...');
    const sendRes = await request('POST', '/api/auth/send-code', { email });
    console.log('Status:', sendRes.status);
    console.log('Response:', sendRes.body);

    if (sendRes.status !== 200) {
      throw new Error('发送验证码失败');
    }

    // 2. 模拟获取验证码 (由于我们无法查收邮件，我们需要从数据库获取或者在 sendEmail 中 mock 打印了)
    // 这里我们直接查询数据库获取验证码
    // 注意：这个脚本需要连接数据库
    const { Pool } = require('pg');
    require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    const codeRes = await client.query('SELECT code FROM verification_codes WHERE email = $1', [email]);
    client.release();
    await pool.end();

    if (codeRes.rows.length === 0) {
      throw new Error('数据库中未找到验证码');
    }
    const code = codeRes.rows[0].code;
    console.log(`✅ 获取到验证码: ${code}`);

    // 3. 提交注册
    console.log('\n2. 提交注册 (带验证码)...');
    const registerRes = await request('POST', '/api/auth/register', {
      username,
      email,
      password,
      code
    });
    console.log('Status:', registerRes.status);
    console.log('Response:', registerRes.body);

    if (registerRes.status === 201) {
      console.log('✅ 注册成功');
    } else {
      console.log('❌ 注册失败');
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
}

testEmailVerification();
