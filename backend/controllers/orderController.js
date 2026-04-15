import mongoose from 'mongoose';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import walletTransactionModel from '../models/walletTransactionModel.js';
import importBatchModel from '../models/importBatchModel.js';
import logAction from '../utils/logger.js';
import { buildInventoryFilter, getAvailableStock, normalizeVariantColor } from '../utils/inventory.js';
import { buildVisibleOrderQuery } from '../utils/orderVisibility.js';
import { SePayPgClient } from 'sepay-pg-node';

const getSepayClient = () => new SePayPgClient({
    env: 'production',
    merchant_id: 'SP-LIVE-TN79A866', 
    secret_key: process.env.SEPAY_SECRET_KEY,
});

const DEDUCTION_TRIGGER_STATUSES = new Set(['Packing', 'Shipped', 'Out for Delivery', 'Delivered', 'Received']);
const PENDING_SEPAY_STATUSES = new Set(['Pending Payment']);
const DEFAULT_SEPAY_PENDING_TIMEOUT_SECONDS = 5 * 60;

const getSepayPendingTimeoutMs = () => {
    const configuredSeconds = Number(process.env.SEPAY_PENDING_TIMEOUT_SECONDS);

    if (Number.isFinite(configuredSeconds) && configuredSeconds > 0) {
        return Math.floor(configuredSeconds * 1000);
    }

    return DEFAULT_SEPAY_PENDING_TIMEOUT_SECONDS * 1000;
};

const buildSePayReturnUrls = (origin, invoiceId) => ({
    success_url: `${origin}/orders?sepay_status=success&invoice=${invoiceId}`,
    error_url: `${origin}/orders?sepay_status=error&invoice=${invoiceId}`,
    cancel_url: `${origin}/orders?sepay_status=cancelled&invoice=${invoiceId}`,
});

const buildSePayCheckoutSession = (order, origin) => {
    const invoiceId = order._id.toString();
    const checkoutFields = getSepayClient().checkout.initOneTimePaymentFields({
        payment_method: 'BANK_TRANSFER',
        order_invoice_number: invoiceId,
        order_amount: Number(order.amount),
        currency: 'VND',
        order_description: 'Thanh toan don hang',
        ...buildSePayReturnUrls(origin, invoiceId),
    });

    return {
        checkoutUrl: getSepayClient().checkout.initCheckoutUrl(),
        checkoutFields,
    };
};

const expirePendingSePayOrders = async () => {
    const now = Date.now();
    const expiredOrders = await orderModel.find({
        paymentMethod: 'Banking',
        payment: false,
        status: 'Pending Payment',
        paymentExpiresAt: { $ne: null, $lte: now },
    });

    for (const order of expiredOrders) {
        try {
            await getSepayClient().order.cancel(order._id.toString());
        } catch (error) {
            console.error(`Unable to cancel SePay invoice ${order._id}:`, error?.message || error);
        }

        order.status = 'Cancelled';
        order.paymentExpiresAt = null;
        await order.save();

        if (order.userId) {
            await logAction(
                order.userId,
                'System',
                'AUTO_CANCEL_PENDING_SEPAY_ORDER',
                `SePay payment window expired for order #${String(order._id).slice(-8)}`,
                order._id,
            );
        }
    }
};

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
        const { userId, items, amount, subtotal, discount, address, voucherCode } = req.body;

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
            subtotal: Number(subtotal) || 0,
            discount: Number(discount) || 0,
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

const placeOrderWallet = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, items, amount, subtotal, discount, address, voucherCode } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        const user = await userModel.findById(userId).session(session);
        if (!user || (user.walletBalance || 0) < Number(amount)) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: 'Số dư ví không đủ để thanh toán' });
        }

        if (voucherCode && voucherCode.toUpperCase() === 'BANMOI') {
            const completedCount = await orderModel.countDocuments({
                userId,
                status: 'Delivered'
            });
            if (completedCount > 0) {
                await session.abortTransaction();
                session.endSession();
                return res.json({ success: false, message: 'BANMOI only works for the first completed order' });
            }
        }

        const normalizedItems = normalizeOrderItems(items);

        if (normalizedItems.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: 'Cart is empty' });
        }

        if (!amount || Number(amount) <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: 'Invalid order amount' });
        }

        if (!address || typeof address !== 'object' || !validateAddress(address)) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: 'Address is required' });
        }

        const requestedVariants = buildRequestedVariants(normalizedItems);

        for (const variant of requestedVariants) {
            const availableStock = await getAvailableStock(variant);

            if (availableStock < variant.quantity) {
                await session.abortTransaction();
                session.endSession();
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

        // Trừ tiền ví
        user.walletBalance -= Number(amount);
        await user.save({ session });

        const orderData = {
            userId,
            items: normalizedItems,
            amount: Number(amount),
            subtotal: Number(subtotal) || 0,
            discount: Number(discount) || 0,
            cogs: 0,
            profit: 0,
            inventoryDeducted: false,
            inventoryDeductedAt: null,
            inventoryAdjustments: [],
            address,
            status: 'Order Placed',
            paymentMethod: 'Wallet',
            payment: true, // Thanh toán qua Ví coi như Paid luôn
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save({ session });

        // Ghi Log giao dịch Ví
        const tx = new walletTransactionModel({
            userId,
            type: 'Debit',
            amount: Number(amount),
            description: `Thanh toán Đơn hàng #${String(newOrder._id).slice(-8).toUpperCase()}`,
            relatedOrderId: String(newOrder._id)
        });
        await tx.save({ session });

        // Xoá giỏ hàng
        await userModel.findByIdAndUpdate(userId, { cartData: {} }, { session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: 'Thanh toán qua Ví thành công',
            orderId: newOrder._id
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const allOrders = async (req, res) => {
    try {
        await expirePendingSePayOrders();
        const orders = await orderModel.find(buildVisibleOrderQuery()).sort({ date: -1 });
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

        await expirePendingSePayOrders();

        const orders = await orderModel
            .find(buildVisibleOrderQuery({ userId }, { includePendingBanking: true }))
            .sort({ date: -1 });
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

const retryPendingSePayOrder = async (req, res) => {
    try {
        const { userId, orderId } = req.body;

        if (!userId || !orderId) {
            return res.json({ success: false, message: 'Missing user id or order id' });
        }

        await expirePendingSePayOrders();

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        if (String(order.userId) !== String(userId)) {
            return res.json({ success: false, message: 'Not authorized' });
        }

        if (order.paymentMethod !== 'Banking') {
            return res.json({ success: false, message: 'Order is not a SePay transfer' });
        }

        if (order.payment) {
            return res.json({ success: false, message: 'Payment already confirmed' });
        }

        if (!PENDING_SEPAY_STATUSES.has(String(order.status || ''))) {
            return res.json({ success: false, message: `Cannot retry payment in ${order.status} status` });
        }

        order.paymentExpiresAt = Date.now() + getSepayPendingTimeoutMs();
        await order.save();

        const origin = req.headers.origin || 'https://forevervn-ecommerce.vercel.app';
        const { checkoutUrl, checkoutFields } = buildSePayCheckoutSession(order, origin);

        res.json({
            success: true,
            checkoutUrl,
            checkoutFields,
            orderId: order._id,
            paymentExpiresAt: order.paymentExpiresAt,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
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

const placeOrderSePay = async (req, res) => {
    try {
        const { userId, items, amount, subtotal, discount, address, voucherCode } = req.body;

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
                    return res.json({ success: false, message: `${variant.size} / ${variant.color} is out of stock` });
                }
                return res.json({ success: false, message: `Only ${availableStock} item(s) left for ${variant.size} / ${variant.color}` });
            }
        }

        const orderData = {
            userId,
            items: normalizedItems,
            amount: Number(amount),
            subtotal: Number(subtotal) || 0,
            discount: Number(discount) || 0,
            cogs: 0,
            profit: 0,
            inventoryDeducted: false,
            inventoryDeductedAt: null,
            inventoryAdjustments: [],
            address,
            status: 'Pending Payment',
            paymentMethod: 'Banking',
            payment: false,
            paymentExpiresAt: Date.now() + getSepayPendingTimeoutMs(),
            date: Date.now()
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        const origin = req.headers.origin || 'https://forevervn-ecommerce.vercel.app';
        const { checkoutUrl, checkoutFields } = buildSePayCheckoutSession(newOrder, origin);

        res.json({
            success: true,
            checkoutUrl,
            checkoutFields,
            orderId: newOrder._id,
            paymentExpiresAt: newOrder.paymentExpiresAt,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const sepayIpnHandler = async (req, res) => {
    try {
        const data = req.body;
        
        if (data.notification_type === 'ORDER_PAID') {
            const invoiceOrderId = data.order.order_invoice_number;
            const status = data.transaction.transaction_status; 
            
            if (status === 'APPROVED') {
                if (String(invoiceOrderId).startsWith('WT_')) {
                    // Logic xử lý nạp tiền vào ví
                    // Invoice có dạng: WT_{userId}_{timestamp}
                    const parts = invoiceOrderId.split('_');
                    if (parts.length >= 2) {
                        const userId = parts[1];
                        const amount = Number(data.transaction.transaction_amount);
                        
                        const session = await mongoose.startSession();
                        session.startTransaction();
                        try {
                            const user = await userModel.findById(userId).session(session);
                            if (user) {
                                user.walletBalance = (user.walletBalance || 0) + amount;
                                await user.save({ session });

                                const tx = new walletTransactionModel({
                                    userId,
                                    type: 'Credit',
                                    amount,
                                    description: `Nạp tiền vào tài khoản Ví (SePay ${data.transaction.transaction_id})`
                                });
                                await tx.save({ session });
                                
                                await logAction(userId, 'SePay Webhook', 'WALLET_TOPUP', `Topup ${amount} đ thành công`, invoiceOrderId);
                            }
                            await session.commitTransaction();
                            session.endSession();
                        } catch (err) {
                            await session.abortTransaction();
                            session.endSession();
                            console.error("Lỗi khi xử lý Nạp tiền Wallet IPN: ", err);
                        }
                    }
                } else {
                    const order = await orderModel.findById(invoiceOrderId);
                    if (order && !order.payment) {
                        order.payment = true;
                        order.paymentExpiresAt = null;
                        if (order.paymentMethod === 'Banking') {
                            order.status = 'Order Placed';
                        }
                        await order.save();

                        if (order.userId) {
                            await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
                        }
                        
                        if (order.userId) { 
                            await logAction(order.userId, 'SePay Webhook', 'PAYMENT_SUCCESS', `SePay confirmed payment for order #${String(invoiceOrderId).slice(-8)}`, invoiceOrderId);
                        }
                    }
                }
            }
        }
        res.status(200).json({ success: true }); 
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: true }); 
    }
};

const getAdminPaymentAnalytics = async (req, res) => {
    try {
        await expirePendingSePayOrders();
        const stats = await orderModel.aggregate([
            { $match: buildVisibleOrderQuery({ status: { $nin: ['Cancelled', 'Returned'] } }) },
            { 
                $group: {
                    _id: "$paymentMethod", 
                    totalRevenue: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json({ success: true, stats });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { placeOrder, placeOrderSePay, retryPendingSePayOrder, sepayIpnHandler, getAdminPaymentAnalytics, restoreInventoryFromOrder, placeOrderWallet, allOrders, userOrders, updateStatus, cancelOrder, confirmReceived, deleteOrder, expirePendingSePayOrders };
