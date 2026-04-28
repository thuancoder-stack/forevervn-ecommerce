import productModel from '../models/productModel.js';
import dotenv from 'dotenv';
dotenv.config();

// Lấy danh sách tiêu chí tìm kiếm có sẵn
export const getSearchCriteria = async (req, res) => {
    try {
        // Lấy tất cả categories và subcategories có trong DB
        const categories = await productModel.distinct('category');
        const subCategories = await productModel.distinct('subCategory');
        const sizes = await productModel.distinct('sizes');
        const colors = await productModel.distinct('colors');

        const criteria = {
            categories: categories.filter(Boolean),
            subCategories: subCategories.filter(Boolean),
            sizes: sizes.flat().filter(Boolean),
            colors: colors.flat().filter(Boolean),
            priceRanges: [
                { label: 'Dưới 100k', min: 0, max: 100000 },
                { label: '100k - 300k', min: 100000, max: 300000 },
                { label: '300k - 500k', min: 300000, max: 500000 },
                { label: 'Trên 500k', min: 500000, max: 999999999 }
            ]
        };

        res.json({ success: true, criteria });
    } catch (error) {
        console.error('Get criteria error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Trích xuất tiêu chí từ mô tả bằng AI
export const extractCriteria = async (req, res) => {
    try {
        const { description, availableCriteria } = req.body;

        if (!description || description.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mô tả tìm kiếm' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Thiếu GEMINI_API_KEY trong .env');
        }

        // Tạo prompt cho Gemini để trích xuất tiêu chí
        const prompt = `Bạn là trợ lý tìm kiếm sản phẩm thời trang. Nhiệm vụ: phân tích mô tả của khách hàng và trích xuất các tiêu chí tìm kiếm.

Tiêu chí có sẵn:
- Categories: ${availableCriteria.categories.join(', ')}
- SubCategories: ${availableCriteria.subCategories.join(', ')}
- Sizes: ${availableCriteria.sizes.join(', ')}
- Colors: ${availableCriteria.colors.join(', ')}
- Price ranges: Dưới 100k, 100k-300k, 300k-500k, Trên 500k

Mô tả của khách: "${description}"

Trả về JSON với format (chỉ JSON, không có text khác):
{
  "categories": [],
  "subCategories": [],
  "sizes": [],
  "colors": [],
  "minPrice": null,
  "maxPrice": null,
  "keywords": ""
}

Chỉ điền các giá trị có trong danh sách tiêu chí. Nếu không tìm thấy thì để mảng rỗng hoặc null.`;

        // Gọi Gemini API - dùng gemini-2.5-flash (stable, nhanh, miễn phí)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1024,
                    }
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
            throw new Error('Không nhận được phản hồi từ Gemini');
        }

        // Parse JSON từ response (loại bỏ markdown code block nếu có)
        let jsonText = content.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const extracted = JSON.parse(jsonText.trim());

        res.json({ success: true, criteria: extracted });
    } catch (error) {
        console.error('Extract criteria error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xử lý AI: ' + error.message });
    }
};

// Tìm kiếm sản phẩm theo tiêu chí
export const searchProducts = async (req, res) => {
    try {
        const { categories, subCategories, sizes, colors, minPrice, maxPrice, keywords } = req.body;

        const filter = {};

        if (categories && categories.length > 0) {
            filter.category = { $in: categories };
        }

        if (subCategories && subCategories.length > 0) {
            filter.subCategory = { $in: subCategories };
        }

        if (sizes && sizes.length > 0) {
            filter.sizes = { $in: sizes };
        }

        if (colors && colors.length > 0) {
            filter.colors = { $in: colors };
        }

        if (minPrice !== null && minPrice !== undefined) {
            filter.price = { ...filter.price, $gte: Number(minPrice) };
        }

        if (maxPrice !== null && maxPrice !== undefined) {
            filter.price = { ...filter.price, $lte: Number(maxPrice) };
        }

        if (keywords && keywords.trim()) {
            const regex = new RegExp(keywords.trim(), 'i');
            filter.$or = [
                { name: regex },
                { description: regex }
            ];
        }

        const products = await productModel
            .find(filter)
            .select('_id name price oldPrice image category subCategory bestseller')
            .limit(50)
            .sort({ bestseller: -1, date: -1 });

        res.json({ success: true, products, count: products.length });
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
