const http = require('http');

const request = (method, path, data = null, token = null) => {
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
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsedBody });
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

async function testPosts() {
  const timestamp = Date.now().toString().slice(-6);
  const testUser = {
    username: 'post_tester_' + timestamp,
    email: `post_${timestamp}@example.com`,
    password: 'password123'
  };

  console.log('--- 开始文章功能测试 (Starting Post Tests) ---');

  try {
    // 1. 注册并登录获取 Token
    console.log('\n1. 准备用户 (Preparing User)...');
    await request('POST', '/api/auth/register', testUser);
    const loginRes = await request('POST', '/api/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    
    if (loginRes.status !== 200) {
      throw new Error('登录失败 (Login failed)');
    }
    const token = loginRes.body.token;
    console.log('✅ 用户登录成功，获取 Token');

    // 2. 创建文章
    console.log('\n2. 测试创建文章 (Testing Create Post)...');
    const newPostData = {
      title: '测试文章标题 ' + timestamp,
      content: '这是一篇测试文章的内容。This is a test post content.',
      tags: ['test', 'demo'],
      cover: 'http://example.com/cover.jpg',
      category: null // Explicitly setting null for category
    };
    
    const createRes = await request('POST', '/api/posts', newPostData, token);
    console.log('Status:', createRes.status);
    if (createRes.status === 201) {
      console.log('✅ 创建成功 ID:', createRes.body.article.id);
    } else {
      console.log('❌ 创建失败:', createRes.body);
    }
    const postId = createRes.body.article && createRes.body.article.id;
    if (!postId) {
       throw new Error('创建文章失败，无法获取 ID');
    }

    // 3. 获取文章列表
    console.log('\n3. 测试获取文章列表 (Testing Get Posts)...');
    const listRes = await request('GET', '/api/posts?page=1&pageSize=5');
    console.log('Status:', listRes.status);
    if (listRes.status === 200 && listRes.body.articles.length > 0) {
      console.log(`✅ 获取列表成功，当前页数量: ${listRes.body.articles.length}, 总数: ${listRes.body.total}`);
    } else {
      console.log('❌ 获取列表失败');
    }

    // 4. 获取文章详情
    console.log('\n4. 测试获取文章详情 (Testing Get Post Detail)...');
    const detailRes = await request('GET', `/api/posts/${postId}`);
    console.log('Status:', detailRes.status);
    if (detailRes.status === 200 && detailRes.body.views >= 0) {
      console.log(`✅ 获取详情成功，浏览次数: ${detailRes.body.views} (应增加)`);
    } else {
      console.log('❌ 获取详情失败');
    }

    // 5. 更新文章
    console.log('\n5. 测试更新文章 (Testing Update Post)...');
    const updateData = {
      title: '更新后的标题 ' + timestamp,
      content: '更新后的内容'
    };
    const updateRes = await request('PUT', `/api/posts/${postId}`, updateData, token);
    console.log('Status:', updateRes.status);
    if (updateRes.status === 200 && updateRes.body.article.title === updateData.title) {
      console.log('✅ 更新成功');
    } else {
      console.log('❌ 更新失败');
    }

    // 6. 删除文章
    console.log('\n6. 测试删除文章 (Testing Delete Post)...');
    const deleteRes = await request('DELETE', `/api/posts/${postId}`, null, token);
    console.log('Status:', deleteRes.status);
    if (deleteRes.status === 200) {
      console.log('✅ 删除成功');
    } else {
      console.log('❌ 删除失败');
    }

    // 7. 验证删除后获取详情
    const checkRes = await request('GET', `/api/posts/${postId}`);
    if (checkRes.status === 404) {
      console.log('✅ 验证成功：文章已不存在');
    } else {
      console.log('❌ 验证失败：文章仍然存在');
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
}

// 延时执行
setTimeout(testPosts, 1000);
