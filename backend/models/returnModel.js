import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        orderId: { type: String, required: true },
        reason: { type: String, required: true },
        images: { type: Array, default: [] }, // Uploaded via Cloudinary
        status: { type: String, required: true, default: 'Pending' }, // Pending, Approved, Rejected, Completed
        refundAmount: { type: Number, required: true },
        adminNote: { type: String, default: '' },
        date: { type: Number, required: true, default: Date.now }
    },
    { minimize: false }
);

const returnModel = mongoose.models.returnRequest || mongoose.model('returnRequest', returnSchema);
export default returnModel;
