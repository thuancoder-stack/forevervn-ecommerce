import { v2 as cloudinary } from 'cloudinary';
import { generateTryOnFromKling } from '../utils/klingAiUtil.js';
import fs from 'fs'; // Thư viện có sẵn của Node.js để quản lý file

export const generateTryOnImage = async (req, res) => {
    try {
        // Lấy dữ liệu text từ Frontend
        const { productImg, prompt } = req.body; 
        
        // Lấy file ảnh vật lý từ Frontend do Multer bắt được
        const imageFile = req.file; 

        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Vui lòng tải lên ảnh của bạn." });
        }
        if (!productImg) {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu ảnh sản phẩm." });
        }

        // 1. Đẩy ảnh người dùng từ máy chủ (thư mục tạm của multer) lên Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageFile.path, { 
            resource_type: "image",
            folder: "virtual_try_on" // Phân loại thư mục trên Cloudinary cho gọn
        });
        
        const userImageUrl = uploadResult.secure_url;

        // 2. Dọn dẹp: Xoá file rác do multer vừa lưu tạm trên ổ cứng server
        fs.unlinkSync(imageFile.path);

      // 3. Đưa 2 đường link sang Kling AI để xử lý
        const aiResult = await generateTryOnFromKling(userImageUrl, productImg, prompt);

        // THÊM ĐOẠN NÀY: Kiểm tra xem Kling có chửi "hết tiền" hay lỗi gì không
        // Thường các API Trung Quốc trả về code = 0 là thành công, các số khác là lỗi
        if (aiResult.code && aiResult.code !== 0) {
            return res.status(400).json({
                success: false,
                message: `Lỗi từ Kling AI: ${aiResult.message}`, // Sẽ báo "Account balance not enough"
                kling_code: aiResult.code
            });
        }

        // 4. Trả kết quả về Frontend (Chỉ chạy khi Kling thực sự thành công)
        res.status(200).json({
            success: true,
            message: "Tạo ảnh mặc thử thành công!",
            data: aiResult
        });;

    } catch (error) {
        console.error("Lỗi tại aiController:", error);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi Server xử lý AI", 
            error: error.message 
        });
    }
};