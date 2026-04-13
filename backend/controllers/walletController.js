import userModel from '../models/userModel.js';
import walletTransactionModel from '../models/walletTransactionModel.js';
import { SePayPgClient } from 'sepay-pg-node';
import mongoose from 'mongoose';

const getSepayClient = () => new SePayPgClient({
    env: 'production',
    merchant_id: 'SP-LIVE-TN79A866', 
    secret_key: process.env.SEPAY_SECRET_KEY,
});

// Lấy thông tin ví và lịch sử dòng tiền
const getWalletBalanceAndHistory = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.json({ success: false, message: 'Người dùng không tồn tại' });
        }

        const transactions = await walletTransactionModel.find({ userId }).sort({ date: -1 });

        res.json({
            success: true,
            balance: user.walletBalance || 0,
            transactions
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Khởi tạo một lệnh nạp tiền vào Ví
const createTopUpRequest = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        if (!amount || amount < 10000) {
            return res.json({ success: false, message: 'Số tiền nạp tối thiểu là 10.000đ' });
        }

        // Tạo 1 transaction Pending (Dùng mô tả để lưu tạm state, loại sẽ đổi khi IPN gọi)
        // Chúng ta tạm ko đưa vào walletTransactionModel ngay, hoặc đưa vào nhưng status: Pending.
        // NHƯNG schema walletTransactionModel hiện chưa có "status".
        // Thực tế, khi thanh toán SePay, ta lấy ID user gắn vào invoice.
        // VD invoice là: WT_userId_timestamp
        
        const invoiceId = `WT_${userId}_${Date.now()}`;
        const origin = req.headers.origin || 'https://forevervn-ecommerce.vercel.app';
        
        const checkoutFields = getSepayClient().checkout.initOneTimePaymentFields({
            payment_method: 'BANK_TRANSFER',
            order_invoice_number: invoiceId, 
            order_amount: Number(amount), 
            currency: 'VND',
            order_description: 'Nap Tien Vi Forever',
            success_url: `${origin}/my-wallet?success=true`,
            error_url:   `${origin}/my-wallet?error=true`,
            cancel_url:  `${origin}/my-wallet?cancel=true`,
        });

        const checkoutURL = getSepayClient().checkout.initCheckoutUrl();

        res.json({
            success: true,
            checkoutUrl: checkoutURL,
            checkoutFields: checkoutFields
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Gọi nội bộ bởi hệ thống
const processRefundToWallet = async (userId, amount, orderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await userModel.findById(userId).session(session);
        if(!user) throw new Error("Không tìm thấy User");

        const newBalance = (user.walletBalance || 0) + amount;
        
        await userModel.findByIdAndUpdate(userId, { walletBalance: newBalance }, { session });

        const tx = new walletTransactionModel({
            userId,
            type: 'Credit',
            amount,
            description: `Hoàn tiền mua sắm - Đơn hàng #${String(orderId).slice(-8).toUpperCase()}`,
            relatedOrderId: orderId
        });
        await tx.save({ session });

        await session.commitTransaction();
        session.endSession();
        return true;
    } catch(err) {
        await session.abortTransaction();
        session.endSession();
        console.error("Lỗi quá trình hoàn tiền ví:", err);
        return false;
    }
}

export { getWalletBalanceAndHistory, createTopUpRequest, processRefundToWallet };
