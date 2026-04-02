import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const generateKlingToken = () => {
    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;

    if (!accessKey || !secretKey) {
        throw new Error("Thiếu API Key Kling trong file .env!");
    }

    const payload = {
        iss: accessKey,
        exp: Math.floor(Date.now() / 1000) + (30 * 60), 
        nbf: Math.floor(Date.now() / 1000) - 5 
    };

    return jwt.sign(payload, secretKey, { header: { alg: 'HS256', typ: 'JWT' } });
};

export const generateTryOnFromKling = async (userImageUrl, productImageUrl, prompt) => {
    const token = generateKlingToken();
    
    // Lưu ý: Đây là URL tạo ảnh mẫu của Kling. 
    // Nếu Kling có endpoint riêng cho Virtual Try-On, bạn hãy thay đổi URL và cấu trúc body theo tài liệu của họ nhé.
    const KLING_API_URL = 'https://api.klingai.com/v1/images/generations'; 

    try {
        const response = await fetch(KLING_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                model: 'kling-v1', 
                prompt: prompt || "A realistic virtual try-on fashion photography",
                // Tùy thuộc vào tài liệu API của Kling, họ có thể yêu cầu truyền link ảnh gốc như thế này:
                // image: userImageUrl, 
                // cloth_image: productImageUrl,
                n: 1 
            })
        });

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error("Lỗi khi gọi Kling API:", error);
        throw error;
    }
};