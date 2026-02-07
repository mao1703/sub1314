const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// 确保存储目录存在
// 注意：在中间件中，__dirname 是 d:\项目1\11\src\middleware
// 所以 ../../uploads 解析为 d:\项目1\11\uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 使用内存存储，以便 sharp 处理
const storage = multer.memoryStorage();

// 文件过滤器（安全审核机制 + 格式限制）
const fileFilter = (req, file, cb) => {
  // 仅支持 jpg, jpeg, png
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('仅支持上传 JPG 或 PNG 格式的图片'));
  }
};

// 配置 multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB (处理前)
  }
});

// 图片处理中间件
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 统一转换为 JPEG 格式进行存储优化
    const filename = `avatar-${uniqueSuffix}.jpeg`;
    const filepath = path.join(uploadDir, filename);

    // 确保目录存在（双重保险）
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 使用 sharp 进行压缩和格式转换
    await sharp(req.file.buffer)
      .resize(500, 500, { // 统一尺寸，避免过大图片
        fit: 'cover',
        position: 'center'
      })
      .toFormat('jpeg')
      .jpeg({ quality: 80 }) // 80% 质量，平衡体积和清晰度
      .toFile(filepath);

    // 更新 req.file 对象，以便后续控制器使用
    req.file.filename = filename;
    req.file.path = filepath;
    req.file.mimetype = 'image/jpeg';

    next();
  } catch (error) {
    console.error('图片处理失败:', error);
    next(new Error('图片处理失败'));
  }
};

module.exports = { upload, processImage };
