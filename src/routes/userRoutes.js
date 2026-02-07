const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, processImage } = require('../middleware/upload');

// 所有路由都需要登录
router.use(authMiddleware);

// 获取个人资料
router.get('/profile', userController.getProfile);

// 更新个人资料
router.put('/profile', userController.updateProfile);

// 修改密码
router.put('/password', userController.updatePassword);

// 上传头像 (添加图片处理中间件)
router.post('/avatar', upload.single('avatar'), processImage, userController.uploadAvatar);

// 标签管理
router.get('/tags', userController.getUserTags);
router.post('/tags', userController.updateUserTags);

module.exports = router;
