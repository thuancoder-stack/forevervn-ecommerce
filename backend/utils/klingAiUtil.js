import dotenv from 'dotenv';
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Virtual Try-On qua aimlapi.com (proxy của Kling AI)
// Model: klingai/image-o1 — nhận 2 ảnh (người + áo) + prompt → trả ảnh kết quả
// Không cần JWT, chỉ cần AIMLAPI_KEY
// ─────────────────────────────────────────────────────────────────────────────

const AIMLAPI_URL = 'https://api.aimlapi.com/v1/images/generations';

export const generateTryOnFromKling = async (humanImageUrl, clothImageUrl) => {
    const apiKey = process.env.AIMLAPI_KEY;

    if (!apiKey) {
        throw new Error('Thiếu AIMLAPI_KEY trong .env');
    }

    const response = await fetch(AIMLAPI_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'klingai/image-o1',
            // Prompt mô tả rõ: ghép áo từ ảnh 2 lên người trong ảnh 1
            prompt: 'Virtual try-on: dress the person in @image1 with the exact clothing item shown in @image2. Preserve the person\'s face, body proportions, pose, and background. The clothing must fit naturally and realistically.',
            image_urls: [humanImageUrl, clothImageUrl],
            num_images: 1,
            aspect_ratio: '3:4',   // tỉ lệ phù hợp cho ảnh thời trang
            resolution: '1K',
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`aimlapi lỗi ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // aimlapi trả về: { data: [{ url: "..." }] }
    const resultUrl = data?.data?.[0]?.url;
    if (!resultUrl) {
        throw new Error('Không nhận được URL ảnh kết quả từ AI');
    }

    return resultUrl;
};
