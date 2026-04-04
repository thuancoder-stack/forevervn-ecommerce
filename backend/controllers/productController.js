import importBatchModel from '../models/importBatchModel.js';
import productModel from '../models/productModel.js';
import { v2 as cloudinary } from 'cloudinary';
import logAction from '../utils/logger.js';
import { getTikTokHDLink } from '../utils/tiktok.js';
import fs from 'fs';
import Papa from 'papaparse';
import iconv from 'iconv-lite';
import { getAvailableStock, normalizeVariantColor } from '../utils/inventory.js';

const addProduct = async (req, res) => {
    try {
        const { name, description, price, oldPrice, category, subCategory, sizes, colors, videoUrl, bestseller } = req.body;

        const image1 = req.files?.image1?.[0];
        const image2 = req.files?.image2?.[0];
        const image3 = req.files?.image3?.[0];
        const image4 = req.files?.image4?.[0];

        const images = [image1, image2, image3, image4].filter(Boolean);

        if (!images.length) {
            return res.json({ success: false, message: 'Please upload at least one image' });
        }

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );

        let parsedSizes = [];
        if (Array.isArray(sizes)) {
            parsedSizes = sizes;
        } else if (typeof sizes === 'string') {
            try {
                parsedSizes = JSON.parse(sizes);
            } catch {
                parsedSizes = sizes
                    .replace(/^\[|\]$/g, '')
                    .split(/[,\s]+/)
                    .map((item) => item.replace(/^"|"$/g, '').trim())
                    .filter(Boolean);
            }
        }

        if (!Array.isArray(parsedSizes) || !parsedSizes.length) {
            return res.json({ success: false, message: 'Please select at least one size' });
        }

        let parsedColors = [];
        if (Array.isArray(colors)) {
            parsedColors = colors;
        } else if (typeof colors === 'string') {
            try {
                parsedColors = JSON.parse(colors);
            } catch {
                parsedColors = colors.replace(/^\[|\]$/g, '').split(/[,\s]+/).map(i => i.replace(/^"|"$/g, '').trim()).filter(Boolean);
            }
        }

        const productData = {
            name,
            description,
            price: Number(price),
            oldPrice: Number(oldPrice) || 0,
            category,
            subCategory,
            sizes: parsedSizes,
            colors: parsedColors,
            videoUrl: getTikTokHDLink(videoUrl),
            bestseller: bestseller === 'true' ? true : false,
            image: imagesUrl,
            date: Date.now()
        };

        const product = new productModel(productData);
        await product.save();

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'ADD_PRODUCT', `Added new product: ${name}`, product._id);
        }

        res.json({ success: true, message: 'Product Added' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


const removeProduct = async (req, res) => {
    try {
        const { id } = req.body;
        const product = await productModel.findById(id);
        if (product) {
            await productModel.findByIdAndDelete(id);
            if (req.adminEmail) {
                await logAction(req.adminEmail, req.adminName, 'DELETE_PRODUCT', `Deleted product: ${product.name}`, id);
            }
        }
        res.json({ success: true, message: 'Product Removed' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
const listProducts = async (req, res) => {
    try {
        const products = await productModel.aggregate([
            {
                $addFields: {
                    smartScore: {
                        $add: [
                            { $multiply: [{ $ifNull: ["$ratingAvg", 0] }, 0.4] },
                            { $multiply: [{ $ifNull: ["$sold", 0] }, 0.3] },
                            { $multiply: [{ $ifNull: ["$views", 0] }, 0.2] },
                            { $multiply: ["$price", -0.1] }
                        ]
                    }
                }
            },
            { $sort: { smartScore: -1, date: -1 } }
        ]);
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { productId, name, description, price, oldPrice, category, subCategory, sizes, colors, videoUrl, bestseller } = req.body;

        let parsedSizes = [];
        if (Array.isArray(sizes)) {
            parsedSizes = sizes;
        } else if (typeof sizes === 'string') {
            try {
                parsedSizes = JSON.parse(sizes);
            } catch {
                parsedSizes = sizes.replace(/^\[|\]$/g, '').split(/[,\s]+/).map(i => i.replace(/^"|"$/g, '').trim()).filter(Boolean);
            }
        }
        
        let parsedColors = [];
        if (Array.isArray(colors)) {
            parsedColors = colors;
        } else if (typeof colors === 'string') {
            try {
                parsedColors = JSON.parse(colors);
            } catch {
                parsedColors = colors.replace(/^\[|\]$/g, '').split(/[,\s]+/).map(i => i.replace(/^"|"$/g, '').trim()).filter(Boolean);
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (oldPrice !== undefined) updateData.oldPrice = Number(oldPrice);
        if (category) updateData.category = category;
        if (subCategory) updateData.subCategory = subCategory;
        if (parsedSizes.length) updateData.sizes = parsedSizes;
        if (parsedColors.length) updateData.colors = parsedColors;
        if (videoUrl !== undefined) updateData.videoUrl = getTikTokHDLink(videoUrl);
        if (bestseller !== undefined) updateData.bestseller = bestseller === 'true' || bestseller === true;

        const image1 = req.files?.image1?.[0];
        const image2 = req.files?.image2?.[0];
        const image3 = req.files?.image3?.[0];
        const image4 = req.files?.image4?.[0];

        const images = [image1, image2, image3, image4].filter(Boolean);

        if (images.length > 0) {
            let imagesUrl = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                })
            );
            updateData.image = imagesUrl;
        }

        await productModel.findByIdAndUpdate(productId, updateData);
        await logAction(req.adminEmail, req.adminName, 'UPDATE_PRODUCT', `Updated product: ${name || productId}`, productId);
        res.json({ success: true, message: 'Product Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const bulkDiscount = async (req, res) => {
    try {
        const { category, subCategory, discountPercent } = req.body;
        
        if (!discountPercent || discountPercent <= 0 || discountPercent >= 100) {
            return res.json({ success: false, message: 'Invalid discount percentage' });
        }

        const filter = {};
        if (category) filter.category = category;
        if (subCategory) filter.subCategory = subCategory;

        // Thay thế bằng BulkWrite để tương thích với mọi phiên bản Mongoose, tránh lỗi "Cannot pass an array to query updates..."
        const products = await productModel.find(filter);
        if (products.length === 0) {
            return res.json({ success: false, message: 'Không tìm thấy sản phẩm nào để giảm giá.' });
        }

        const bulkOps = products.map((prod) => {
            const currentPrice = prod.price || 0;
            const originalPrice = (prod.oldPrice === 0 || !prod.oldPrice) ? currentPrice : prod.oldPrice;
            const newPrice = Math.round(originalPrice * ((100 - Number(discountPercent)) / 100));

            return {
                updateOne: {
                    filter: { _id: prod._id },
                    update: {
                        $set: {
                            oldPrice: originalPrice,
                            price: newPrice
                        }
                    }
                }
            };
        });

        if (bulkOps.length > 0) {
            await productModel.bulkWrite(bulkOps);
        }

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'BULK_DISCOUNT', `Applied ${discountPercent}% discount to ${category || 'All'} - ${subCategory || 'All'}`, 'BULK');
        }

        res.json({ success: true, message: `Successfully applied ${discountPercent}% discount` });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const bulkImport = async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ success: false, message: 'Không tìm thấy file CSV' });
        }

        const filePath = req.file.path;
        const buffer = fs.readFileSync(filePath);
        
        // Nhận diện Encoding thông minh: Thử UTF-8, nếu lỗi dùng Win-1258 hoặc UTF-16LE
        let content = "";
        const utf8Content = iconv.decode(buffer, 'utf-8');
        if (utf8Content.includes('\uFFFD')) {
            const win1258Content = iconv.decode(buffer, 'win1258');
            if (win1258Content.includes('\uFFFD')) {
                content = iconv.decode(buffer, 'utf-16le');
            } else {
                content = win1258Content;
            }
        } else {
            content = utf8Content;
        }

        // Loại bỏ BOM và chuẩn hóa chuỗi
        content = content.replace(/^\uFEFF/, '').trim();

        // Sử dụng PapaParse để bóc tách dữ liệu
        const parsedData = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
        });

        if (parsedData.errors && parsedData.errors.length > 0) {
            console.log('PapaParse Errors:', parsedData.errors);
        }

        const results = parsedData.data;

        const validProducts = results.map((row) => {
            const cleanRow = {};
            // Làm sạch triệt để Key và Value
            Object.keys(row).forEach(key => {
                // Xóa mọi ký tự không in được và trim
                const cleanKey = key.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '').trim().toLowerCase();
                let value = (row[key] || '').toString().replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '').trim();
                // Bóc dấu ngoặc kép bọc quanh
                value = value.replace(/^["']|["']$/g, '').trim();
                cleanRow[cleanKey] = value;
            });

            // Map cột linh hoạt (Tiếng Việt & Tiếng Anh)
            const name = (cleanRow.name || cleanRow['tên sản phẩm'] || cleanRow['product name'] || '').normalize('NFC');
            const category = (cleanRow.category || cleanRow['danh mục'] || '').normalize('NFC');
            
            if (!name || !category) return null;

            // Xử lý giá tiền (loại bỏ dấu chấm, phẩy, ký tự tiền tệ)
            const parsePrice = (val) => {
                const cleaned = val.toString().replace(/[^0-9]/g, '');
                return Number(cleaned) || 0;
            };

            const price = parsePrice(cleanRow.price || cleanRow['giá'] || '0');
            const oldPrice = parsePrice(cleanRow.oldprice || cleanRow['giá cũ'] || '0');

            // Xử lý ảnhlink sạch
            const rawImage = cleanRow.image || cleanRow['hình ảnh'] || cleanRow['ảnh'];
            const imageList = rawImage 
                ? rawImage.split('|').map(i => i.trim().replace(/^["']|["']$/g, '').trim()) 
                : ['https://via.placeholder.com/600'];

            return {
                name: name,
                description: (cleanRow.description || cleanRow['mô tả'] || name).normalize('NFC'),
                price: price,
                oldPrice: oldPrice > price ? oldPrice : 0, // Đảm bảo logic SALE hợp lý
                category: category,
                subCategory: (cleanRow.subcategory || cleanRow['danh mục phụ'] || 'Khác').normalize('NFC'),
                sizes: (cleanRow.sizes || 'M|L|XL').split('|').map(s => s.trim()),
                colors: (cleanRow.colors || '').split('|').map(c => c.trim()).filter(c => c),
                videoUrl: cleanRow.videourl || '',
                bestseller: cleanRow.bestseller?.toLowerCase() === 'true' || cleanRow.bestseller === '1',
                image: imageList,
                date: Date.now()
            };
        }).filter(p => p !== null);

        if (validProducts.length === 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.json({ success: false, message: 'Dữ liệu không hợp lệ hoặc sai cấu trúc cột (Cần: Tên sản phẩm, Danh mục, Giá...)' });
        }

        await productModel.insertMany(validProducts);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        
        res.json({ success: true, message: `Thành công! Đã nhập ${validProducts.length} sản phẩm.` });
    } catch (error) {
        console.error('System Error:', error);
        res.json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
    }
};

const getInventory = async (req, res) => {
    try {
        const inventory = await importBatchModel.aggregate([
            {
                $project: {
                    productId: { $toObjectId: '$productId' },
                    size: 1,
                    color: 1,
                    remainingQty: 1,
                }
            },
            {
                $group: {
                    _id: {
                        productId: '$productId',
                        size: '$size',
                        color: '$color',
                    },
                    totalStock: { $sum: '$remainingQty' },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id.productId',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            {
                $unwind: '$productInfo',
            },
            {
                $project: {
                    _id: 0,
                    productId: '$_id.productId',
                    productName: '$productInfo.name',
                    category: '$productInfo.category',
                    subCategory: '$productInfo.subCategory',
                    size: '$_id.size',
                    color: '$_id.color',
                    totalStock: '$totalStock',
                },
            },
        ]);
        res.json({ success: true, inventory });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const size = String(req.query?.size || '').trim();
        const rawColor = String(req.query?.color || '').trim();
        const totalStock = await getAvailableStock({
            productId: id,
            size: size || undefined,
            color: rawColor ? normalizeVariantColor(rawColor) : undefined,
        });
        
        res.json({ success: true, stock: totalStock });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addProduct, removeProduct, singleProduct, listProducts, updateProduct, bulkDiscount, bulkImport, getInventory, getProductStock };
