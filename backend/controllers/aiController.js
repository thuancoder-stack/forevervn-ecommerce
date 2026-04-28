import { v2 as cloudinary } from 'cloudinary';
import { generateTryOnFromKling } from '../utils/klingAiUtil.js';
import fs from 'fs';

export const generateTryOnImage = async (req, res) => {
    const imageFile = req.file;       // ảnh người dùng (từ multer)
    const { productImg } = req.body;  // URL ảnh sản phẩm (từ frontend)

    if (!imageFile) {
        return res.status(400).json({ success: false, message: 'Vui lòng tải lên ảnh của bạn.' });
    }
    if (!productImg) {
        return res.status(400).json({ success: false, message: 'Thiếu ảnh sản phẩm.' });
    }

    try {
        // 1. Upload ảnh người dùng lên Cloudinary → lấy URL public
        const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
            resource_type: 'image',
            folder: 'virtual_try_on',
        });
        const userImageUrl = uploadResult.secure_url;

        // Dọn file tạm của multer
        if (fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);

        // 2. Gọi Kling AI qua aimlapi.com — đồng bộ, không cần polling
        const resultImageUrl = await generateTryOnFromKling(userImageUrl, productImg);

        return res.status(200).json({
            success: true,
            message: 'Thử đồ ảo thành công!',
            resultImage: resultImageUrl,
        });

    } catch (error) {
        // Dọn file tạm nếu chưa xoá
        if (imageFile?.path && fs.existsSync(imageFile.path)) {
            fs.unlinkSync(imageFile.path);
        }

        console.error('Virtual Try-On error:', error.message);

        let userMessage = 'Lỗi server khi xử lý AI. Vui lòng thử lại sau.';
        if (error.message?.toLowerCase().includes('balance') || error.message?.includes('1102')) {
            userMessage = 'Tính năng thử đồ ảo tạm thời không khả dụng. Vui lòng thử lại sau.';
        } else if (error.message?.toLowerCase().includes('timeout')) {
            userMessage = 'AI xử lý quá lâu. Vui lòng thử lại với ảnh khác.';
        }

        return res.status(500).json({
            success: false,
            message: userMessage,
            debug: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        });
    }
};
