import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { products as localProducts } from '../assets/assets'; // CHANGE: doi ten import de khong trung voi state products
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const ShopContext = createContext(null);

const LEGACY_CART_STORAGE_KEY = 'cartItems';
const GUEST_CART_STORAGE_KEY = 'cartItems:guest';

function getInitialToken() {
    try {
        return localStorage.getItem('token') || '';
    } catch {
        return '';
    }
}

function parseTokenPayload(token) {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

function getCartStorageKeyByToken(token) {
    // CHANGE: tach cart theo user id/email trong token de user khong dung chung gio
    const payload = parseTokenPayload(token);
    const userKey = payload?.id || payload?._id || payload?.email || '';

    if (!userKey) return GUEST_CART_STORAGE_KEY;
    return `cartItems:user:${String(userKey)}`;
}

function loadCartFromStorage(storageKey) {
    try {
        let raw = localStorage.getItem(storageKey);

        // CHANGE: ho tro migrate key cu cartItems -> cartItems:guest
        if (!raw && storageKey === GUEST_CART_STORAGE_KEY) {
            const legacyRaw = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
            if (legacyRaw) {
                raw = legacyRaw;
                localStorage.setItem(GUEST_CART_STORAGE_KEY, legacyRaw);
            }
        }

        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
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

function resolveProductsPayload(payload) {
    if (Array.isArray(payload?.products)) return payload.products;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
}

function normalizeImages(imageValue) {
    if (Array.isArray(imageValue)) {
        const arr = imageValue.filter(Boolean).map(String);
        return arr.length > 0 ? arr : ['https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image'];
    }

    if (typeof imageValue === 'string') {
        const trimmed = imageValue.trim();
        if (!trimmed) {
            return ['https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image'];
        }

        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.filter(Boolean).map(String);
                }
            } catch {
                // ignore parse error and fallback to single url string
            }
        }

        return [trimmed];
    }

    return ['https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image'];
}

function normalizeSizes(sizeValue) {
    if (Array.isArray(sizeValue)) {
        const arr = sizeValue.filter(Boolean).map(String);
        return arr.length > 0 ? arr : ['Free'];
    }

    if (typeof sizeValue === 'string') {
        const trimmed = sizeValue.trim();
        if (!trimmed) return ['Free'];

        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.filter(Boolean).map(String);
                }
            } catch {
                // ignore parse error and fallback split string
            }
        }

        const list = trimmed
            .replace(/\[|\]|"|'|`/g, '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);

        return list.length > 0 ? list : ['Free'];
    }

    return ['Free'];
}

// CHANGE: normalize du lieu truoc khi dua vao UI de tranh lech gia/hinh/size
function normalizeProduct(item, fallbackId = '') {
    const rawId = item?._id ?? item?.id ?? item?.name ?? fallbackId;
    const normalizedId = String(rawId);

    return {
        ...item,
        _id: normalizedId,
        id: normalizedId,
        name: String(item?.name ?? ''),
        description: String(item?.description ?? ''),
        category: String(item?.category ?? ''),
        subCategory: String(item?.subCategory ?? ''),
        image: normalizeImages(item?.image),
        sizes: normalizeSizes(item?.sizes),
        price: parseVndPrice(item?.price),
        date: Number(item?.date) || 0,
        bestseller: Boolean(item?.bestseller),
    };
}

// CHANGE: gop DB + assets, uu tien product tu DB neu trung id
function mergeProducts(apiProducts = [], assetProducts = []) {
    const mergedMap = new Map();

    assetProducts.forEach((item, idx) => {
        const normalized = normalizeProduct(item, `asset-${idx}`);
        mergedMap.set(normalized._id, normalized);
    });

    apiProducts.forEach((item, idx) => {
        const normalized = normalizeProduct(item, `api-${idx}`);
        mergedMap.set(normalized._id, normalized);
    });

    return Array.from(mergedMap.values());
}

const ShopContextProvider = ({ children }) => {
    const currency = '';
    const delivery_fee = 30000;

    // CHANGE: them fallback backend URL khi frontend chua co .env
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState(() => getInitialToken());

    // CHANGE: cart khoi tao theo dung user token hien tai
    const [cartItems, setCartItems] = useState(() => {
        const initialToken = getInitialToken();
        const storageKey = getCartStorageKeyByToken(initialToken);
        return loadCartFromStorage(storageKey);
    });

    const navigate = useNavigate();

    // CHANGE: token doi -> nap gio dung cua user do
    useEffect(() => {
        const storageKey = getCartStorageKeyByToken(token);
        const nextCart = loadCartFromStorage(storageKey);
        setCartItems(nextCart);
    }, [token]);

    // CHANGE: luu cart theo key rieng tung user
    useEffect(() => {
        const storageKey = getCartStorageKeyByToken(token);
        localStorage.setItem(storageKey, JSON.stringify(cartItems));
    }, [cartItems, token]);

    // CHANGE: cart update theo functional setState de tranh stale state
    const addToCart = useCallback((itemId, size) => {
        if (!itemId || !size) return;

        setCartItems((prev) => {
            const cartData = structuredClone(prev || {});

            if (!cartData[itemId]) {
                cartData[itemId] = {};
            }

            cartData[itemId][size] = (Number(cartData[itemId][size]) || 0) + 1;
            return cartData;
        });
    }, []);

    const removeFromCart = useCallback((itemId, size) => {
        if (!itemId || !size) return;

        setCartItems((prev) => {
            const cartData = structuredClone(prev || {});

            if (!cartData[itemId]) return cartData;

            delete cartData[itemId][size];

            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }

            return cartData;
        });
    }, []);

    const updateCartQty = useCallback((itemId, size, qty) => {
        if (!itemId || !size) return;

        const n = Number(qty);

        setCartItems((prev) => {
            const cartData = structuredClone(prev || {});

            if (!cartData[itemId]) return cartData;

            if (!n || n <= 0) {
                delete cartData[itemId][size];

                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            } else {
                cartData[itemId][size] = n;
            }

            return cartData;
        });
    }, []);

    const getCartCount = useCallback(() => {
        let count = 0;

        for (const itemId in cartItems) {
            for (const size in cartItems[itemId]) {
                count += Number(cartItems[itemId][size]) || 0;
            }
        }

        return count;
    }, [cartItems]);

    const getCartAmount = useCallback(() => {
        let totalAmount = 0;

        for (const itemId in cartItems) {
            const itemInfo = products.find(
                (p) => String(p._id || p.id) === String(itemId),
            );

            if (!itemInfo) continue;

            const itemPrice = parseVndPrice(itemInfo.price);

            for (const size in cartItems[itemId]) {
                totalAmount += itemPrice * (Number(cartItems[itemId][size]) || 0);
            }
        }

        return totalAmount;
    }, [cartItems, products]);

    // CHANGE: gop san pham DB + assets; API loi thi dung assets
    const getProductsData = useCallback(async () => {
        try {
            const requestToken =
                token || localStorage.getItem('adminToken') || '';

            const config = requestToken ? { headers: { token: requestToken } } : {};
            const response = await axios.get(
                `${backendUrl}/api/product/list`,
                config,
            );

            const payload = response?.data;
            const apiProducts = resolveProductsPayload(payload);

            if (payload?.success === true || apiProducts.length > 0) {
                const mergedProducts = mergeProducts(apiProducts, localProducts);
                setProducts(mergedProducts);
                return;
            }

            setProducts(mergeProducts([], localProducts));
        } catch (error) {
            console.error('getProductsData error:', error);
            setProducts(mergeProducts([], localProducts));
        }
    }, [backendUrl, token]);

    useEffect(() => {
        getProductsData();
    }, [getProductsData]);

    // CHANGE: dong bo size trong cart theo sizes hien tai cua product
    const reconcileCartItems = useCallback(() => {
        if (!Array.isArray(products) || products.length === 0) return;

        setCartItems((prev) => {
            const currentCart = prev || {};
            const nextCart = {};
            let changed = false;

            for (const itemId in currentCart) {
                const itemInfo = products.find(
                    (p) => String(p._id || p.id) === String(itemId),
                );

                for (const size in currentCart[itemId]) {
                    const qty = Number(currentCart[itemId][size]) || 0;
                    if (qty <= 0) {
                        changed = true;
                        continue;
                    }

                    let normalizedSize = size;
                    if (
                        itemInfo &&
                        Array.isArray(itemInfo.sizes) &&
                        itemInfo.sizes.length > 0 &&
                        !itemInfo.sizes.includes(size)
                    ) {
                        normalizedSize = itemInfo.sizes[0];
                        changed = true;
                    }

                    if (!nextCart[itemId]) nextCart[itemId] = {};
                    nextCart[itemId][normalizedSize] =
                        (Number(nextCart[itemId][normalizedSize]) || 0) + qty;
                }
            }

            if (!changed) return prev;
            return nextCart;
        });
    }, [products]);

    useEffect(() => {
        reconcileCartItems();
    }, [reconcileCartItems]);

    // CHANGE: gom logic dang xuat dung chung
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken('');
        navigate('/login');
    }, [navigate]);

    // CHANGE: bo sung dependency de tranh stale context value
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
            backendUrl,
            getProductsData,
            token,
            setToken,
            logout,
        }),
        [
            products,
            cartItems,
            addToCart,
            removeFromCart,
            updateCartQty,
            getCartCount,
            getCartAmount,
            navigate,
            search,
            showSearch,
            backendUrl,
            getProductsData,
            token,
            logout,
        ],
    );

    return (
        <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
    );
};

export default ShopContextProvider;
