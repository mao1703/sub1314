const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 注册路由
router.post('/register', authController.register);

// 发送验证码路由
router.post('/send-code', authController.sendVerificationCode);

// 登录路由
router.post('/login', authController.login);

module.exports = router;
