const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '请选择文件' });
  }

  try {
    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `img-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // 使用 sharp 进行压缩和格式转换 (本地文件存储，数据库存路径优化)
    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true }) // 限制最大宽度 1200px，保持比例，不放大
      .webp({ quality: 80 }) // 转为 webp 格式，质量 80%
      .toFile(outputPath);

    // 返回访问 URL
    // 注意：需要在 app.js 中配置静态文件服务 app.use('/uploads', express.static(...))
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    
    res.json({ 
      message: '上传成功',
      url: fileUrl 
    });
  } catch (err) {
    console.error('Image processing error:', err);
    res.status(500).json({ message: '图片处理失败', error: err.message });
  }
};
