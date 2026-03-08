import { createContext, useEffect, useMemo, useState } from 'react';
import { products } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

export const ShopContext = createContext(null);

function loadCart() {
    try {
        const raw = localStorage.getItem('cartItems');
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function parseVndPrice(price) {
    if (typeof price === 'number') return price < 1000 ? price * 1000 : price;
    if (typeof price === 'string') {
        const digits = price.replace(/[^\d]/g, '');
        if (!digits) return 0;
        const n = Number(digits);
        if (!Number.isFinite(n)) return 0;
        return n < 1000 ? n * 1000 : n;
    }
    return 0;
}

const ShopContextProvider = ({ children }) => {
    const currency = '';
    const delivery_fee = 30000;

    const [search, setSearch]         = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems]   = useState(() => loadCart());
    const navigate = useNavigate();
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // ── Thêm vào giỏ theo id + size ──────────────────────────────
    // cartItems: { "aaaab": { "M": 2, "L": 1 }, "aaaac": { "S": 1 } }
    const addToCart = async (itemId, size) => {
        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;   // tăng số lượng
            } else {
                cartData[itemId][size] = 1;    // thêm size mới
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;        // thêm sản phẩm mới
        }

        setCartItems(cartData);
    };

    // ── Xóa 1 size khỏi giỏ ──────────────────────────────────────
    const removeFromCart = (itemId, size) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
        }
        setCartItems(cartData);
    };

    // ── Cập nhật số lượng theo id + size ─────────────────────────
    const updateCartQty = (itemId, size, qty) => {
        let cartData = structuredClone(cartItems);
        const n = Number(qty);
        if (!n || n <= 0) {
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
        } else {
            cartData[itemId][size] = n;
        }
        setCartItems(cartData);
    };

    // ── Tổng số lượng tất cả sản phẩm ────────────────────────────
    const getCartCount = () => {
        let count = 0;
        for (const itemId in cartItems) {
            for (const size in cartItems[itemId]) {
                count += cartItems[itemId][size];
            }
        }
        return count;
    };

    // ── Tổng tiền ─────────────────────────────────────────────────
    const getCartAmount = () => {
        let total = 0;
        for (const itemId in cartItems) {
            const item = products.find(
                (p) => String(p._id || p.id) === String(itemId)
            );
            if (item) {
                for (const size in cartItems[itemId]) {
                    total += parseVndPrice(item.price) * cartItems[itemId][size];
                }
            }
        }
        return total;
    };

    const value = useMemo(
        () => ({
            products,
            currency,
            delivery_fee,
            cartItems,
            addToCart,
            removeFromCart,
            updateCartQty,
            getCartCount,
            getCartAmount,
            navigate,
            search,
            setSearch,
            showSearch,
            setShowSearch,
        }),
        [cartItems, search, showSearch],
    );

    return (
        <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
    );
};

export default ShopContextProvider;