import userModel from '../models/userModel.js';
import userBehaviorModel from '../models/userBehaviorModel.js';
import { getAvailableStock, normalizeVariantColor } from '../utils/inventory.js';

const sanitizeIncomingCart = async (cartData = {}) => {
    const sanitizedCart = {};
    let firstErrorMessage = '';

    for (const itemId in cartData || {}) {
        const sizeMap = cartData[itemId];
        if (!sizeMap || typeof sizeMap !== 'object') continue;

        for (const size in sizeMap) {
            const colorMap = sizeMap[size];
            if (!colorMap || typeof colorMap !== 'object') continue;

            for (const rawColor in colorMap) {
                const color = normalizeVariantColor(rawColor);
                const requestedQty = Number(colorMap[rawColor]) || 0;
                if (requestedQty <= 0) continue;

                const availableStock = await getAvailableStock({
                    productId: itemId,
                    size,
                    color,
                });
                const acceptedQty = Math.min(requestedQty, availableStock);

                if (acceptedQty > 0) {
                    if (!sanitizedCart[itemId]) sanitizedCart[itemId] = {};
                    if (!sanitizedCart[itemId][size]) sanitizedCart[itemId][size] = {};
                    sanitizedCart[itemId][size][color] = acceptedQty;
                }

                if (!firstErrorMessage && acceptedQty !== requestedQty) {
                    if (availableStock <= 0) {
                        firstErrorMessage = 'This product variant is out of stock';
                    } else {
                        firstErrorMessage = `Only ${availableStock} item(s) left for this product variant`;
                    }
                }
            }
        }
    }

    return {
        sanitizedCart,
        firstErrorMessage,
    };
};

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

        const normalizedColor = normalizeVariantColor(color);
        const cartData = userData.cartData || {};
        const currentQty = Number(cartData?.[itemId]?.[size]?.[normalizedColor]) || 0;
        const availableStock = await getAvailableStock({
            productId: itemId,
            size,
            color: normalizedColor,
        });

        if (availableStock <= 0) {
            return res.json({ success: false, message: 'This product variant is out of stock' });
        }

        if (currentQty + 1 > availableStock) {
            return res.json({
                success: false,
                message: `Only ${availableStock} item(s) left for this product variant`,
                stock: availableStock,
            });
        }

        if (!cartData[itemId]) {
            cartData[itemId] = {};
        }

        if (!cartData[itemId][size]) {
            cartData[itemId][size] = {};
        }

        cartData[itemId][size][normalizedColor] = currentQty + 1;

        await userModel.findByIdAndUpdate(userId, { cartData });

        userBehaviorModel.create({
            userId,
            actionType: 'ADD_TO_CART',
            targetId: itemId,
            metadata: { size, color: normalizedColor }
        }).catch(err => console.log('Log add cart error:', err));

        res.json({ success: true, message: 'Added To Cart', cartData });

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

        const userData = await userModel.findById(userId);
        if (!userData) return res.json({ success: false, message: 'User not found' });

        if (nextCartData && typeof nextCartData === 'object') {
            const { sanitizedCart, firstErrorMessage } = await sanitizeIncomingCart(nextCartData);
            await userModel.findByIdAndUpdate(userId, { cartData: sanitizedCart });

            if (firstErrorMessage) {
                return res.json({
                    success: false,
                    message: firstErrorMessage,
                    cartData: sanitizedCart,
                });
            }

            return res.json({ success: true, message: 'Cart Updated', cartData: sanitizedCart });
        }

        if (!itemId || !size || !color || typeof quantity === 'undefined') {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        const cartData = userData.cartData || {};
        const normalizedColor = normalizeVariantColor(color);
        const qty = Number(quantity);

        if (!cartData[itemId]) cartData[itemId] = {};
        if (!cartData[itemId][size]) cartData[itemId][size] = {};

        if (!qty || qty <= 0) {
            delete cartData[itemId][size][normalizedColor];

            if (Object.keys(cartData[itemId][size]).length === 0) {
                delete cartData[itemId][size];
            }
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }

            await userModel.findByIdAndUpdate(userId, { cartData });
            return res.json({ success: true, message: 'Cart Updated', cartData });
        }

        const availableStock = await getAvailableStock({
            productId: itemId,
            size,
            color: normalizedColor,
        });

        if (availableStock <= 0) {
            delete cartData[itemId][size][normalizedColor];

            if (Object.keys(cartData[itemId][size]).length === 0) {
                delete cartData[itemId][size];
            }
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }

            await userModel.findByIdAndUpdate(userId, { cartData });
            return res.json({
                success: false,
                message: 'This product variant is out of stock',
                cartData,
                stock: 0,
            });
        }

        const acceptedQty = Math.min(qty, availableStock);
        cartData[itemId][size][normalizedColor] = acceptedQty;

        await userModel.findByIdAndUpdate(userId, { cartData });

        if (acceptedQty !== qty) {
            return res.json({
                success: false,
                message: `Only ${availableStock} item(s) left for this product variant`,
                cartData,
                stock: availableStock,
            });
        }

        res.json({ success: true, message: 'Cart Updated', cartData });
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
