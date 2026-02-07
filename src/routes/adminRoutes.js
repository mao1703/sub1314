const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// 所有 admin 路由都需要先验证 token，再验证 admin 权限
router.use(authMiddleware, adminMiddleware);

// 用户管理
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/tags', adminController.getUserTags);
router.put('/users/:id/tags', adminController.updateUserTags);

// 文章管理
router.get('/posts', adminController.getAllPosts);
router.put('/posts/:id', adminController.updatePost);
router.delete('/posts/:id', adminController.deletePost);

module.exports = router;
