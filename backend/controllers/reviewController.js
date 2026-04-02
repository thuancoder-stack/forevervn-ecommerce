import reviewModel from '../models/reviewModel.js';
import userModel from '../models/userModel.js';
import { v2 as cloudinary } from 'cloudinary';
import logAction from '../utils/logger.js';

const addReview = async (req, res) => {
    try {
        const { userId, productId, rating, comment } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        const userName = user.name;

        const images = req.files;

        let imageUrls = [];
        if (images && images.length > 0) {
            imageUrls = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                })
            );
        }

        const reviewData = {
            userId,
            productId,
            userName,
            rating: Number(rating),
            comment,
            images: imageUrls,
            status: true
        };

        const newReview = new reviewModel(reviewData);
        await newReview.save();

        res.json({ success: true, message: 'Review added successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listReviews = async (req, res) => {
    try {
        const { productId } = req.query;
        let query = {};
        if (productId) query.productId = productId;

        const reviews = await reviewModel.find(query).populate('productId', 'name image').sort({ date: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { id } = req.body;
        await reviewModel.findByIdAndDelete(id);

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'DELETE_REVIEW', `Permanently deleted review ID: ${id}`, id);
        }

        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const replyReview = async (req, res) => {
    try {
        const { id, reply } = req.body;
        const review = await reviewModel.findByIdAndUpdate(id, {
            adminReply: reply,
            replyDate: Date.now()
        }, { new: true });

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'REPLY_REVIEW', `Replied to review ID: ${id}`, id);
        }

        res.json({ success: true, message: 'Reply added successfully', review });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addReview, listReviews, deleteReview, replyReview };
