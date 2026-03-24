import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
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

        const orderData = {
            userId,
            items,
            amount: Number(amount),
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
        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { placeOrder, allOrders, userOrders, updateStatus };
