import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: Array, default: [] }, // Image urls only
    status: { type: Boolean, default: true },
    date: { type: Number, default: Date.now },
    adminReply: { type: String, default: "" },
    replyDate: { type: Number }
});

const reviewModel = mongoose.models.review_user || mongoose.model('review_user', reviewSchema);

export default reviewModel;
