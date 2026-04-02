import express from 'express';
import { generateTryOnImage } from '../controllers/aiController.js';

// Import cấu hình multer mà bạn vừa viết
import upload from '../middleware/multer.js'; // Sửa lại đường dẫn này nếu file multer của bạn ở thư mục khác

const router = express.Router();

// Sử dụng upload.single('userPhoto') vì ở Frontend chúng ta dùng formData.append('userPhoto', file)
router.post('/generate-try-on', upload.single('userPhoto'), generateTryOnImage);

export default router;