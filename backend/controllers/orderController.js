import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import importBatchModel from '../models/importBatchModel.js';
import logAction from '../utils/logger.js';
import { buildInventoryFilter, getAvailableStock, normalizeVariantColor } from '../utils/inventory.js';

const buildVariantKey = ({ productId, size, color }) =>
    `${String(productId)}__${String(size || 'Free')}__${normalizeVariantColor(color)}`;

const normalizeOrderItems = (items = []) =>
    items
        .map((item) => ({
            ...item,
            _id: String(item?._id || item?.id || ''),
            size: String(item?.size || 'Free'),
            color: normalizeVariantColor(item?.color),
            quantity: Number(item?.quantity) || 0,
            price: Number(item?.price) || 0,
        }))
        .filter((item) => item._id && item.quantity > 0);

const validateAddress = (address = {}) => {
    const requiredFields = [
        'fullName',
        'email',
        'phone',
        'province',
        'district',
        'ward',
        'addressDetail',
    ];

    return requiredFields.every((field) => String(address?.[field] || '').trim().length > 0);
};

const buildRequestedVariants = (items = []) => {
    const variantMap = new Map();

    items.forEach((item) => {
        const key = buildVariantKey({
            productId: item._id,
            size: item.size,
            color: item.color,
        });

        const existing = variantMap.get(key) || {
            productId: item._id,
            size: item.size,
            color: item.color,
            quantity: 0,
        };

        existing.quantity += Number(item.quantity) || 0;
        variantMap.set(key, existing);
    });

    return Array.from(variantMap.values());
};

const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address, voucherCode } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        if (voucherCode && voucherCode.toUpperCase() === 'BANMOI') {
            const completedCount = await orderModel.countDocuments({
                userId,
                status: 'Delivered'
            });
            if (completedCount > 0) {
                return res.json({ success: false, message: 'BANMOI only works for the first completed order' });
            }
        }

        const normalizedItems = normalizeOrderItems(items);

        if (normalizedItems.length === 0) {
            return res.json({ success: false, message: 'Cart is empty' });
        }

        if (!amount || Number(amount) <= 0) {
            return res.json({ success: false, message: 'Invalid order amount' });
        }

        if (!address || typeof address !== 'object' || !validateAddress(address)) {
            return res.json({ success: false, message: 'Address is required' });
        }

        const requestedVariants = buildRequestedVariants(normalizedItems);

        for (const variant of requestedVariants) {
            const availableStock = await getAvailableStock(variant);

            if (availableStock < variant.quantity) {
                if (availableStock <= 0) {
                    return res.json({
                        success: false,
                        message: `${variant.size} / ${variant.color} is out of stock`,
                    });
                }

                return res.json({
                    success: false,
                    message: `Only ${availableStock} item(s) left for ${variant.size} / ${variant.color}`,
                });
            }
        }

        const deductionPlan = [];
        let totalCOGS = 0;

        for (const variant of requestedVariants) {
            let requiredQty = variant.quantity;
            const batches = await importBatchModel
                .find(buildInventoryFilter(variant))
                .sort({ importDate: 1 });

            for (const batch of batches) {
                if (requiredQty <= 0) break;

                const deductQty = Math.min(Number(batch.remainingQty) || 0, requiredQty);
                if (deductQty <= 0) continue;

                deductionPlan.push({
                    batchId: batch._id,
                    remainingQty: (Number(batch.remainingQty) || 0) - deductQty,
                    status: (Number(batch.remainingQty) || 0) - deductQty <= 0 ? 'Depleted' : 'Active',
                });

                totalCOGS += deductQty * (Number(batch.costPrice) || 0);
                requiredQty -= deductQty;
            }

            if (requiredQty > 0) {
                return res.json({
                    success: false,
                    message: 'Inventory changed while placing the order. Please review your cart again.',
                });
            }
        }

        for (const update of deductionPlan) {
            await importBatchModel.findByIdAndUpdate(update.batchId, {
                remainingQty: update.remainingQty,
                status: update.status,
            });
        }

        const orderData = {
            userId,
            items: normalizedItems,
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

        if (order.userId.toString() !== userId.toString()) {
            return res.json({ success: false, message: 'Not authorized' });
        }

        const cancellableStatuses = ['Order Placed', 'Packing'];
        if (!cancellableStatuses.includes(order.status)) {
            return res.json({ success: false, message: `Cannot cancel order in ${order.status} status` });
        }

        await orderModel.findByIdAndUpdate(orderId, { status: 'Cancelled' });
        
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
