const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

// 使用内存存储，以便 sharp 处理
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制 10MB
  fileFilter: (req, file, cb) => {
    // 只允许图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件 (Only image files are allowed)'), false);
    }
  }
});

// 上传接口 POST /api/upload
router.post('/', authMiddleware, upload.single('file'), uploadController.uploadImage);

module.exports = router;
