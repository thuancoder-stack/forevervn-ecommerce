import mongoose from 'mongoose';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import importBatchModel from '../models/importBatchModel.js';
import logAction from '../utils/logger.js';
import { buildInventoryFilter, getAvailableStock, normalizeVariantColor } from '../utils/inventory.js';

const DEDUCTION_TRIGGER_STATUSES = new Set(['Packing', 'Shipped', 'Out for Delivery', 'Delivered', 'Received']);

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

const buildInventoryDeductionPlan = async (items = [], session) => {
    const requestedVariants = buildRequestedVariants(items);
    const deductionPlan = [];
    let totalCOGS = 0;

    for (const variant of requestedVariants) {
        let requiredQty = Number(variant.quantity) || 0;
        const batches = await importBatchModel
            .find(buildInventoryFilter(variant))
            .sort({ importDate: 1, _id: 1 })
            .session(session);

        for (const batch of batches) {
            if (requiredQty <= 0) break;

            const currentQty = Number(batch.remainingQty) || 0;
            const deductQty = Math.min(currentQty, requiredQty);
            if (deductQty <= 0) continue;

            const nextRemainingQty = currentQty - deductQty;

            deductionPlan.push({
                batchId: batch._id,
                quantity: deductQty,
                costPrice: Number(batch.costPrice) || 0,
                nextRemainingQty,
                nextStatus: nextRemainingQty <= 0 ? 'Depleted' : 'Active',
            });

            totalCOGS += deductQty * (Number(batch.costPrice) || 0);
            requiredQty -= deductQty;
        }

        if (requiredQty > 0) {
            throw new Error(`Not enough stock for ${variant.size} / ${variant.color}`);
        }
    }

    return { deductionPlan, totalCOGS };
};

const applyDeductionPlan = async (deductionPlan = [], session) => {
    for (const update of deductionPlan) {
        await importBatchModel.findByIdAndUpdate(
            update.batchId,
            {
                remainingQty: update.nextRemainingQty,
                status: update.nextStatus,
            },
            { session },
        );
    }
};

const restoreInventoryFromOrder = async (order, session) => {
    const adjustments = Array.isArray(order?.inventoryAdjustments) ? order.inventoryAdjustments : [];

    for (const adjustment of adjustments) {
        const batch = await importBatchModel.findById(adjustment.batchId).session(session);

        if (!batch) {
            throw new Error('Cannot restore inventory because an import batch is missing');
        }

        batch.remainingQty = (Number(batch.remainingQty) || 0) + (Number(adjustment.quantity) || 0);
        if (batch.status !== 'Cancelled') {
            batch.status = 'Active';
        }

        await batch.save({ session });
    }
};

const hasTrackedInventoryDeduction = (order) =>
    Boolean(order?.inventoryDeducted) && Array.isArray(order?.inventoryAdjustments) && order.inventoryAdjustments.length > 0;

const hasLegacyInventoryDeduction = (order) =>
    !order?.inventoryDeducted &&
    (!Array.isArray(order?.inventoryAdjustments) || order.inventoryAdjustments.length === 0) &&
    Number(order?.cogs || 0) > 0;

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

        const orderData = {
            userId,
            items: normalizedItems,
            amount: Number(amount),
            cogs: 0,
            profit: 0,
            inventoryDeducted: false,
            inventoryDeductedAt: null,
            inventoryAdjustments: [],
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
    const session = await mongoose.startSession();

    try {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.json({ success: false, message: 'Missing orderId or status' });
        }

        await session.withTransaction(async () => {
            const order = await orderModel.findById(orderId).session(session);

            if (!order) {
                throw new Error('Order not found');
            }

            const nextStatus = String(status);
            const trackedDeduction = hasTrackedInventoryDeduction(order);
            const legacyDeduction = hasLegacyInventoryDeduction(order);
            const shouldDeductInventory =
                !trackedDeduction &&
                !legacyDeduction &&
                DEDUCTION_TRIGGER_STATUSES.has(nextStatus);
            const shouldRestoreInventory = trackedDeduction && nextStatus === 'Cancelled';

            if ((trackedDeduction || legacyDeduction) && nextStatus === 'Order Placed') {
                throw new Error('Cannot move an approved order back to Order Placed');
            }

            if (shouldDeductInventory) {
                const { deductionPlan, totalCOGS } = await buildInventoryDeductionPlan(order.items, session);

                await applyDeductionPlan(deductionPlan, session);

                order.inventoryAdjustments = deductionPlan.map((update) => ({
                    batchId: update.batchId,
                    quantity: update.quantity,
                    costPrice: update.costPrice,
                }));
                order.inventoryDeducted = true;
                order.inventoryDeductedAt = Date.now();
                order.cogs = totalCOGS;
                order.profit = (Number(order.amount) || 0) - totalCOGS;
            }

            if (shouldRestoreInventory) {
                await restoreInventoryFromOrder(order, session);
                order.inventoryAdjustments = [];
                order.inventoryDeducted = false;
                order.inventoryDeductedAt = null;
                order.cogs = 0;
                order.profit = 0;
            }

            order.status = nextStatus;
            await order.save({ session });
        });

        if (req.adminEmail) {
            await logAction(req.adminEmail, req.adminName, 'UPDATE_ORDER_STATUS', `Updated order #${String(orderId).slice(-8)} to ${status}`, orderId);
        }

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    } finally {
        await session.endSession();
    }
};

const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { userId, orderId } = req.body;

        await session.withTransaction(async () => {
            const order = await orderModel.findById(orderId).session(session);

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.userId.toString() !== userId.toString()) {
                throw new Error('Not authorized');
            }

            const cancellableStatuses = ['Order Placed', 'Packing'];
            if (!cancellableStatuses.includes(order.status)) {
                throw new Error(`Cannot cancel order in ${order.status} status`);
            }

            if (hasTrackedInventoryDeduction(order)) {
                await restoreInventoryFromOrder(order, session);
                order.inventoryAdjustments = [];
                order.inventoryDeducted = false;
                order.inventoryDeductedAt = null;
                order.cogs = 0;
                order.profit = 0;
            }

            order.status = 'Cancelled';
            await order.save({ session });
        });
        
        await logAction(userId, 'Customer', 'CANCEL_ORDER', `Customer cancelled order #${String(orderId).slice(-8)}`, orderId);
        
        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    } finally {
        await session.endSession();
    }
};

const confirmReceived = async (req, res) => {
    try {
        const { userId, orderId } = req.body;

        if (!userId || !orderId) {
            return res.json({ success: false, message: 'Missing userId or orderId' });
        }

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        if (String(order.userId) !== String(userId)) {
            return res.json({ success: false, message: 'Not authorized' });
        }

        if (order.status === 'Received') {
            return res.json({ success: true, message: 'Order already confirmed as received' });
        }

        if (order.status !== 'Delivered') {
            return res.json({ success: false, message: `Cannot confirm receipt in ${order.status} status` });
        }

        await orderModel.findByIdAndUpdate(orderId, { status: 'Received' });

        await logAction(
            userId,
            'Customer',
            'UPDATE_ORDER_RECEIVED',
            `Customer confirmed receipt for order #${String(orderId).slice(-8)}`,
            orderId,
        );

        res.json({ success: true, message: 'Order marked as received' });
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
            await logAction(req.adminEmail, req.adminName, 'DELETE_ORDER', `Permanently deleted order #${String(orderId).slice(-8)}`, orderId);
        }
        
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { placeOrder, allOrders, userOrders, updateStatus, cancelOrder, confirmReceived, deleteOrder };
