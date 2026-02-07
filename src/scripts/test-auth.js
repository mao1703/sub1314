const http = require('http');

const postData = (path, data) => {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(dataString);
    req.end();
  });
};

async function testAuth() {
  const timestamp = Date.now().toString().slice(-6);
  const testUser = {
    username: 'user_' + timestamp,
    email: `test_${timestamp}@example.com`,
    password: 'password123'
  };

  console.log('1. 测试注册 (Testing Register)...');
  try {
    const registerRes = await postData('/api/auth/register', testUser);
    console.log('Status:', registerRes.status);
    console.log('Response:', registerRes.body);

    if (registerRes.status === 201) {
      console.log('✅ 注册成功');
    } else {
      console.log('❌ 注册失败');
    }

    console.log('\n2. 测试登录 (Testing Login)...');
    const loginRes = await postData('/api/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    console.log('Status:', loginRes.status);
    console.log('Response:', loginRes.body);

    if (loginRes.status === 200 && loginRes.body.token) {
      console.log('✅ 登录成功，Token:', loginRes.body.token.substring(0, 20) + '...');
    } else {
      console.log('❌ 登录失败');
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
}

// 延时执行，等待服务器启动
setTimeout(testAuth, 3000);
