const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const sendEmail = require('../utils/email');

// 验证邮箱格式
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// 注册
exports.register = async (req, res) => {
  const { username, email, password, code } = req.body;

  // 1. 验证参数
  if (!username || !email || !password || !code) {
    return res.status(400).json({ message: '所有字段都是必填的 (All fields are required)' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ message: '用户名长度必须在 3 到 20 个字符之间 (Username must be between 3 and 20 characters)' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: '邮箱格式无效 (Invalid email format)' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码长度至少为 6 位 (Password must be at least 6 characters)' });
  }

  try {
    // 2. 验证验证码
    const codeCheck = await db.query(
      'SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND expires_at > NOW()',
      [email, code]
    );

    if (codeCheck.rows.length === 0) {
      return res.status(400).json({ message: '验证码无效或已过期 (Invalid or expired verification code)' });
    }

    // 3. 检查用户名和邮箱是否已存在
    const userCheck = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: '用户名或邮箱已存在 (Username or email already exists)' });
    }

    // 4. 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. 保存到数据库
    const newUser = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, avatar, created_at',
      [username, email, hashedPassword]
    );

    // 6. 删除验证码
    await db.query('DELETE FROM verification_codes WHERE email = $1', [email]);

    // 7. 返回成功信息
    res.status(201).json({
      message: '用户注册成功 (User registered successfully)',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};

// 发送验证码
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: '请输入有效的邮箱地址 (Please enter a valid email)' });
  }

  try {
    // 检查邮箱是否已被注册
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: '该邮箱已被注册 (Email is already registered)' });
    }

    // 生成 6 位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 保存到数据库 (UPSERT)
    await db.query(`
      INSERT INTO verification_codes (email, code, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) 
      DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()
    `, [email, code, expiresAt]);

    // 发送邮件
    await sendEmail(
      email,
      'Trae Blog 注册验证码',
      `您的注册验证码是：${code}。该验证码将在 10 分钟后过期。\nYour verification code is: ${code}. It expires in 10 minutes.`
    );

    res.json({ message: '验证码已发送 (Verification code sent)' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '发送失败 (Failed to send code)', error: err.message });
  }
};

// 登录
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // 1. 验证参数
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码是必填的 (Username and password are required)' });
  }

  try {
    // 2. 验证用户是否存在
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误 (Invalid username or password)' });
    }

    const user = result.rows[0];

    // 3. 验证密码是否正确
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误 (Invalid username or password)' });
    }

    // 4. 生成 JWT token
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role // Add role to token payload
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret', // 确保有 fallback
      { expiresIn: '7d' }
    );

    // 5. 返回 token 和用户信息
    // 去除密码字段
    delete user.password;

    res.json({
      message: '登录成功 (Login successful)',
      token,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误 (Server error)', error: err.message });
  }
};
