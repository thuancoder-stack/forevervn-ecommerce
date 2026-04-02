import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import importBatchModel from '../models/importBatchModel.js';
import logAction from '../utils/logger.js';

const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address, voucherCode } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        // Smart Voucher "BANMOI" Validation
        if (voucherCode && voucherCode.toUpperCase() === 'BANMOI') {
            const completedCount = await orderModel.countDocuments({
                userId,
                status: 'Delivered' // Chỉ tính đơn đã giao thành công
            });
            if (completedCount > 0) {
                return res.json({ success: false, message: 'Mã BANMOI chỉ áp dụng cho đơn hàng đầu tiên hoàn thành!' });
            }
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.json({ success: false, message: 'Cart is empty' });
        }

        if (!amount || Number(amount) <= 0) {
            return res.json({ success: false, message: 'Invalid order amount' });
        }

        if (!address || typeof address !== 'object') {
            return res.json({ success: false, message: 'Address is required' });
        }

        let totalCOGS = 0;

        // Perform FIFO deduction
        for (let item of items) {
            let requiredQty = item.quantity;
            let itemCOGS = 0;

            const batches = await importBatchModel.find({
                productId: item._id,
                size: item.size,
                color: item.color || 'Any',
                status: 'Active',
                remainingQty: { $gt: 0 }
            }).sort({ importDate: 1 });

            for (let batch of batches) {
                if (requiredQty <= 0) break;

                const deductQty = Math.min(batch.remainingQty, requiredQty);
                batch.remainingQty -= deductQty;
                if (batch.remainingQty === 0) batch.status = 'Depleted';
                
                await batch.save();

                itemCOGS += deductQty * batch.costPrice;
                requiredQty -= deductQty;
            }

            totalCOGS += itemCOGS;
            // Note: If requiredQty > 0, it means we oversold past tracked inventory. 
            // In a real system, we might reject the order or fallback costPrice.
        }

        const orderData = {
            userId,
            items,
            amount: Number(amount),
            cogs: totalCOGS,
            profit: Number(amount) - totalCOGS,
            address,
            status: 'Order Placed',
            paymentMethod: 'COD',
            payment: false,
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        res.json({
            success: true,
            message: 'Order placed successfully',
            orderId: newOrder._id
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const userOrders = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        const orders = await orderModel.find({ userId }).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.json({ success: false, message: 'Missing orderId or status' });
        }

        await orderModel.findByIdAndUpdate(orderId, { status });
        
        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'UPDATE_ORDER_STATUS', `Updated order #${orderId.slice(-8)} to ${status}`, orderId);
        }
        
        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { userId, orderId } = req.body;

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        // Check if the order belongs to the requester
        if (order.userId.toString() !== userId.toString()) {
            return res.json({ success: false, message: 'Not authorized' });
        }

        const cancellableStatuses = ['Order Placed', 'Packing'];
        if (!cancellableStatuses.includes(order.status)) {
            return res.json({ success: false, message: `Cannot cancel order in ${order.status} status` });
        }

        await orderModel.findByIdAndUpdate(orderId, { status: 'Cancelled' });
        
        // Log user cancellation
        await logAction(userId, 'Customer', 'CANCEL_ORDER', `Customer cancelled order #${orderId.slice(-8)}`, orderId);
        
        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.json({ success: false, message: 'Missing orderId' });
        }

        await orderModel.findByIdAndDelete(orderId);
        
        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'DELETE_ORDER', `Permanently deleted order #${orderId.slice(-8)}`, orderId);
        }
        
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { placeOrder, allOrders, userOrders, updateStatus, cancelOrder, deleteOrder };
