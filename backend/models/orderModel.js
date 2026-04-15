import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        items: { type: Array, required: true },
        amount: { type: Number, required: true },
        subtotal: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        cogs: { type: Number, default: 0 },
        profit: { type: Number, default: 0 },
        inventoryDeducted: { type: Boolean, default: false },
        inventoryDeductedAt: { type: Number, default: null },
        inventoryAdjustments: { type: Array, default: [] },
        address: { type: Object, required: true },
        status: { type: String, required: true, default: 'Order Placed' },
        paymentMethod: { type: String, required: true },
        payment: { type: Boolean, required: true, default: false },
        paymentExpiresAt: { type: Number, default: null },
        date: { type: Number, required: true }
    },
    { minimize: false }
);

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;
