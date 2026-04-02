import userModel from '../models/userModel.js';
import userBehaviorModel from '../models/userBehaviorModel.js';

// Add products to user cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, size, color = 'Any' } = req.body;

        if (!userId || !itemId || !size) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const userData = await userModel.findById(userId);

        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        const cartData = userData.cartData || {};

        if (!cartData[itemId]) {
            cartData[itemId] = {};
        }

        if (!cartData[itemId][size]) {
            cartData[itemId][size] = {};
        }

        cartData[itemId][size][color] = (Number(cartData[itemId][size][color]) || 0) + 1;

        await userModel.findByIdAndUpdate(userId, { cartData });

        // Ghi nhận hành vi User Analytics
        userBehaviorModel.create({
            userId,
            actionType: 'ADD_TO_CART',
            targetId: itemId,
            metadata: { size, color }
        }).catch(err => console.log('Log add cart error:', err));

        res.json({ success: true, message: 'Added To Cart' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update user cart
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, size, color, quantity, cartData: nextCartData } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        if (nextCartData && typeof nextCartData === 'object') {
            await userModel.findByIdAndUpdate(userId, { cartData: nextCartData });
            return res.json({ success: true, message: 'Cart Updated' });
        }

        if (!itemId || !size || !color || typeof quantity === 'undefined') {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const userData = await userModel.findById(userId);
        if (!userData) return res.json({ success: false, message: 'User not found' });

        const cartData = userData.cartData || {};
        const qty = Number(quantity);

        if (!cartData[itemId]) cartData[itemId] = {};
        if (!cartData[itemId][size]) cartData[itemId][size] = {};

        if (!qty || qty <= 0) {
            delete cartData[itemId][size][color];

            if (Object.keys(cartData[itemId][size]).length === 0) {
                delete cartData[itemId][size];
            }
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
        } else {
            cartData[itemId][size][color] = qty;
        }

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: 'Cart Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get user cart data
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'Missing user id' });
        }

        const userData = await userModel.findById(userId);

        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, cartData: userData.cartData || {} });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart };
