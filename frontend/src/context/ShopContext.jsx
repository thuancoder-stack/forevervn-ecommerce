import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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

function normalizeCartData(cartValue) {
    if (!cartValue || typeof cartValue !== 'object' || Array.isArray(cartValue)) {
        return {};
    }

    const normalized = {};

    for (const itemId in cartValue) {
        const sizeMap = cartValue[itemId];
        if (!sizeMap || typeof sizeMap !== 'object' || Array.isArray(sizeMap)) continue;

        for (const size in sizeMap) {
            const colorMap = sizeMap[size];
            // Backward compatibility: if colorMap is a number, wrap it in 'Any'
            if (typeof colorMap === 'number') {
                if (!normalized[itemId]) normalized[itemId] = {};
                if (!normalized[itemId][size]) normalized[itemId][size] = {};
                normalized[itemId][size]['Any'] = colorMap;
                continue;
            }

            if (!colorMap || typeof colorMap !== 'object' || Array.isArray(colorMap)) continue;

            for (const color in colorMap) {
                const qty = Number(colorMap[color]);
                if (!Number.isFinite(qty) || qty <= 0) continue;

                if (!normalized[itemId]) normalized[itemId] = {};
                if (!normalized[itemId][size]) normalized[itemId][size] = {};
                normalized[itemId][size][color] = qty;
            }
        }
    }

    return normalized;
}

function hasCartEntries(cartValue) {
    return Object.keys(normalizeCartData(cartValue)).length > 0;
}

function mergeCartData(...sources) {
    const merged = {};

    sources.forEach((source) => {
        const normalizedSource = normalizeCartData(source);

        for (const itemId in normalizedSource) {
            if (!merged[itemId]) merged[itemId] = {};

            for (const size in normalizedSource[itemId]) {
                if (!merged[itemId][size]) merged[itemId][size] = {};

                for (const color in normalizedSource[itemId][size]) {
                    const qty = Number(normalizedSource[itemId][size][color]) || 0;
                    if (qty <= 0) continue;
                    merged[itemId][size][color] = qty;
                }
            }
        }
    });

    return normalizeCartData(merged);
}

function serializeCartData(cartValue) {
    const normalized = normalizeCartData(cartValue);
    const itemIds = Object.keys(normalized).sort();
    const chunks = [];

    itemIds.forEach((itemId) => {
        const sizes = Object.keys(normalized[itemId] || {}).sort();

        sizes.forEach((size) => {
            const colors = Object.keys(normalized[itemId][size] || {}).sort();

            colors.forEach((color) => {
                chunks.push(`${itemId}::${size}::${color}::${Number(normalized[itemId][size][color]) || 0}`);
            });
        });
    });

    return chunks.join('|');
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
        colors: Array.isArray(item?.colors) ? item.colors : [],
        videoUrl: String(item?.videoUrl ?? ''),
        price: parseVndPrice(item?.price),
        oldPrice: parseVndPrice(item?.oldPrice),
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

    return Array.from(mergedMap.values()).sort((a, b) => {
        const dateDiff = (Number(b?.date) || 0) - (Number(a?.date) || 0);
        if (dateDiff !== 0) return dateDiff;

        return String(a?.name || '').localeCompare(String(b?.name || ''));
    });
}

const ShopContextProvider = ({ children }) => {
    const currency = '';
    
    // CHANGE: them fallback backend URL khi frontend chua co .env
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    const [delivery_fee, setDeliveryFee] = useState(30000);
    const [vouchers, setVouchers] = useState([]);
    const [appliedVoucher, setAppliedVoucher] = useState(null);

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // NEW
    const [subCategories, setSubCategories] = useState([]); // NEW
    const [banners, setBanners] = useState([]);
    const [token, setToken] = useState(() => getInitialToken());

    const getBanners = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/banner/list');
            if (response.data.success) {
                setBanners(response.data.banners.filter(b => b.status));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const getReviews = async (productId) => {
        try {
            const response = await axios.get(backendUrl + `/api/review-user/list?productId=${productId}`);
            if (response.data.success) {
                return response.data.reviews;
            }
            return [];
        } catch (error) {
            console.log(error);
            return [];
        }
    };

    const getProductStock = useCallback(async (productId, size = '', color = '') => {
        try {
            const params = new URLSearchParams();
            if (size) params.set('size', size);
            if (color) params.set('color', color);

            const response = await axios.get(
                `${backendUrl}/api/product/stock/${productId}${params.toString() ? `?${params.toString()}` : ''}`,
            );
            if (response.data.success) {
                return response.data.stock;
            }
            return 0;
        } catch (error) {
            console.error('getProductStock error:', error);
            return 0;
        }
    }, [backendUrl]);

    const addReview = async (formData) => {
        try {
            const config = token ? { headers: { token } } : {};
            const response = await axios.post(backendUrl + '/api/review-user/add', formData, config);
            return response.data;
        } catch (error) {
            console.log(error);
            return { success: false, message: error.message };
        }
    };

    useEffect(() => {
        getBanners();
    }, []);

    // CHANGE: cart khoi tao theo dung user token hien tai
    const [cartItems, setCartItems] = useState(() => {
        const initialToken = getInitialToken();
        const storageKey = getCartStorageKeyByToken(initialToken);
        return normalizeCartData(loadCartFromStorage(storageKey));
    });
    const [isCartHydrated, setIsCartHydrated] = useState(false);
    const cartItemsRef = useRef(cartItems);
    const cartSyncRequestRef = useRef(0);

    const navigate = useNavigate();

    useEffect(() => {
        cartItemsRef.current = normalizeCartData(cartItems);
    }, [cartItems]);

    // CHANGE: token doi -> nap cart tu DB (neu login), fallback localStorage
    // Neu DB cart rong ma local cart co data thi day local cart len DB
    useEffect(() => {
        let cancelled = false;

        const hydrateCart = async () => {
            setIsCartHydrated(false);

            const authToken = token || localStorage.getItem('token') || '';
            const storageKey = getCartStorageKeyByToken(authToken);
            const localCart = normalizeCartData(loadCartFromStorage(storageKey));

            if (!authToken) {
                const mergedGuestCart = mergeCartData(localCart, cartItemsRef.current);
                if (!cancelled) {
                    setCartItems(mergedGuestCart);
                    setIsCartHydrated(true);
                }
                return;
            }

            try {
                const response = await axios.post(
                    `${backendUrl}/api/cart/get`,
                    {},
                    { headers: { token: authToken } },
                );

                if (response?.data?.success) {
                    const remoteCart = normalizeCartData(response.data.cartData);
                    const latestStoredCart = normalizeCartData(loadCartFromStorage(storageKey));
                    const runtimeCart = normalizeCartData(cartItemsRef.current);
                    const nextCart = mergeCartData(remoteCart, latestStoredCart, runtimeCart);

                    if (!cancelled) {
                        setCartItems(nextCart);
                    }

                    if (serializeCartData(nextCart) !== serializeCartData(remoteCart)) {
                        try {
                            await axios.post(
                                `${backendUrl}/api/cart/update`,
                                { cartData: nextCart },
                                { headers: { token: authToken } },
                            );
                        } catch (syncError) {
                            console.error('initial cart sync error:', syncError);
                        }
                    }
                } else if (!cancelled) {
                    setCartItems(mergeCartData(localCart, cartItemsRef.current));
                }
            } catch (error) {
                console.error('getUserCart error:', error);
                if (!cancelled) {
                    setCartItems(mergeCartData(localCart, cartItemsRef.current));
                }
            } finally {
                if (!cancelled) {
                    setIsCartHydrated(true);
                }
            }
        };

        hydrateCart();

        return () => {
            cancelled = true;
        };
    }, [backendUrl, token]);

    // CHANGE: luu cart theo key rieng tung user
    useEffect(() => {
        const authToken = token || localStorage.getItem('token') || '';
        const storageKey = getCartStorageKeyByToken(authToken);
        localStorage.setItem(storageKey, JSON.stringify(normalizeCartData(cartItems)));
    }, [cartItems, token]);

    // CHANGE: khi cart update thi dong bo cartData len database
    const syncCartToDatabase = useCallback(
        async (nextCart, authToken) => {
            if (!authToken) return;

            const requestCart = normalizeCartData(nextCart);
            const requestSignature = serializeCartData(requestCart);
            const syncRequestId = ++cartSyncRequestRef.current;

            try {
                const response = await axios.post(
                    `${backendUrl}/api/cart/update`,
                    { cartData: requestCart },
                    { headers: { token: authToken } },
                );

                if (response?.data?.cartData && syncRequestId === cartSyncRequestRef.current) {
                    const serverCart = normalizeCartData(response.data.cartData);
                    const serverSignature = serializeCartData(serverCart);
                    const currentSignature = serializeCartData(cartItemsRef.current);
                    const shouldApplyServerCart =
                        serverSignature !== currentSignature &&
                        (response?.data?.success !== true || serverSignature !== requestSignature);

                    if (shouldApplyServerCart) {
                        setCartItems(serverCart);
                    }
                }

                if (response?.data?.success !== true) {
                    console.error(
                        'syncCartToDatabase failed:',
                        response?.data?.message || 'Unknown error',
                    );
                }
            } catch (error) {
                console.error('syncCartToDatabase error:', error);
            }
        },
        [backendUrl],
    );

    useEffect(() => {
        const authToken = token || localStorage.getItem('token') || '';

        if (!authToken || !isCartHydrated) return;

        const timeoutId = setTimeout(() => {
            syncCartToDatabase(normalizeCartData(cartItems), authToken);
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [cartItems, isCartHydrated, syncCartToDatabase, token]);

    const logBehavior = useCallback(async (actionType, targetId, metadata = {}) => {
        try {
            const authToken = token || localStorage.getItem('token') || '';
            const guestId = localStorage.getItem('guestId') || `guest_${Math.random().toString(36).substring(2, 9)}`;
            if (!localStorage.getItem('guestId')) localStorage.setItem('guestId', guestId);

            await axios.post(`${backendUrl}/api/user/log-behavior`, {
                actionType,
                targetId,
                metadata,
                guestId
            }, { headers: authToken ? { token: authToken } : {} });
        } catch (error) {
            // Implent silent fail for analytics
            console.error('Behavior log failed', error);
        }
    }, [backendUrl, token]);

    const getCartVariantQty = useCallback(
        (itemId, size, color = 'Any') => Number(cartItems?.[itemId]?.[size]?.[color] || 0),
        [cartItems],
    );

    // CHANGE: cart update theo functional setState de tranh stale state
    const addToCart = useCallback(async (itemId, size, color = 'Any') => {
        if (!itemId || !size) {
            return { success: false, message: 'Missing product selection' };
        }

        const normalizedColor = color || 'Any';
        const currentQty = getCartVariantQty(itemId, size, normalizedColor);
        const availableStock = await getProductStock(itemId, size, normalizedColor);

        if (availableStock <= 0) {
            return { success: false, message: 'This variant is out of stock', stock: 0 };
        }

        if (currentQty + 1 > availableStock) {
            return {
                success: false,
                message: `Only ${availableStock} item(s) left for this variant`,
                stock: availableStock,
                quantity: currentQty,
            };
        }

        setCartItems((prev) => {
            const cartData = structuredClone(prev || {});

            if (!cartData[itemId]) {
                cartData[itemId] = {};
            }
            if (!cartData[itemId][size]) {
                cartData[itemId][size] = {};
            }

            cartData[itemId][size][normalizedColor] =
                (Number(cartData[itemId][size][normalizedColor]) || 0) + 1;
            return cartData;
        });

        logBehavior('ADD_TO_CART', itemId, { size, color: normalizedColor });

        return {
            success: true,
            stock: availableStock,
            quantity: currentQty + 1,
        };
    }, [getCartVariantQty, getProductStock, logBehavior]);

    const removeFromCart = useCallback((itemId, size, color = 'Any') => {
        if (!itemId || !size) return;

        setCartItems((prev) => {
            const cartData = structuredClone(prev || {});

            if (!cartData[itemId] || !cartData[itemId][size]) return cartData;

            delete cartData[itemId][size][color];

            if (Object.keys(cartData[itemId][size]).length === 0) {
                delete cartData[itemId][size];
            }
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }

            return cartData;
        });

        // Log action
        logBehavior('REMOVE_FROM_CART', itemId, { size, color });
    }, [logBehavior]);

    const updateCartQty = useCallback(async (itemId, size, color, qty) => {
        if (!itemId || !size || !color) {
            return { success: false, message: 'Missing product selection' };
        }

        const n = Number(qty);

        if (!n || n <= 0) {
            setCartItems((prev) => {
                const cartData = structuredClone(prev || {});

                if (!cartData[itemId] || !cartData[itemId][size]) return cartData;

                delete cartData[itemId][size][color];

                if (Object.keys(cartData[itemId][size]).length === 0) {
                    delete cartData[itemId][size];
                }
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }

                return cartData;
            });

            return { success: true, quantity: 0 };
        }

        const availableStock = await getProductStock(itemId, size, color);

        if (availableStock <= 0) {
            setCartItems((prev) => {
                const cartData = structuredClone(prev || {});

                if (!cartData[itemId] || !cartData[itemId][size]) return cartData;

                delete cartData[itemId][size][color];

                if (Object.keys(cartData[itemId][size]).length === 0) {
                    delete cartData[itemId][size];
                }
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }

                return cartData;
            });

            return {
                success: false,
                quantity: 0,
                stock: 0,
                message: 'This variant is out of stock',
            };
        }

        const acceptedQty = Math.min(n, availableStock);

        setCartItems((prev) => {
            const cartData = structuredClone(prev || {});

            if (!cartData[itemId] || !cartData[itemId][size]) return cartData;
            cartData[itemId][size][color] = acceptedQty;
            return cartData;
        });

        if (acceptedQty !== n) {
            return {
                success: false,
                quantity: acceptedQty,
                stock: availableStock,
                message: `Only ${availableStock} item(s) left for this variant`,
            };
        }

        return { success: true, quantity: acceptedQty, stock: availableStock };
    }, [getProductStock]);

    const getCartCount = useCallback(() => {
        let count = 0;

        for (const itemId in cartItems) {
            const itemInfo = products.find(
                (p) => String(p._id || p.id) === String(itemId),
            );

            if (!itemInfo) continue;

            for (const size in cartItems[itemId]) {
                for (const color in cartItems[itemId][size]) {
                    count += Number(cartItems[itemId][size][color]) || 0;
                }
            }
        }

        return count;
    }, [cartItems, products]);

    const getCartAmount = useCallback(() => {
        let totalAmount = 0;

        for (const itemId in cartItems) {
            const itemInfo = products.find(
                (p) => String(p._id || p.id) === String(itemId),
            );

            if (!itemInfo) continue;

            const itemPrice = parseVndPrice(itemInfo.price);

            for (const size in cartItems[itemId]) {
                for (const color in cartItems[itemId][size]) {
                    totalAmount += itemPrice * (Number(cartItems[itemId][size][color]) || 0);
                }
            }
        }

        return totalAmount;
    }, [cartItems, products]);

    // CHANGE: gio chi lay san pham tu database, khong dung local assets nua
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
                const normalizedProducts = apiProducts.map((item, idx) => 
                    normalizeProduct(item, `api-${idx}`)
                );

                // Sort newest first
                normalizedProducts.sort((a, b) => (Number(b?.date) || 0) - (Number(a?.date) || 0));
                
                setProducts(normalizedProducts);
                return;
            }

            setProducts([]);
        } catch (error) {
            console.error('getProductsData error:', error);
            setProducts([]);
        }
    }, [backendUrl, token]);

    useEffect(() => {
        getProductsData();
    }, [getProductsData]);

    const getSystemData = useCallback(async () => {
        try {
            const [configRes, vouchersRes, catRes, subRes] = await Promise.all([
                axios.get(`${backendUrl}/api/system/config`),
                axios.get(`${backendUrl}/api/system/voucher/list`),
                axios.get(`${backendUrl}/api/category/list`),
                axios.get(`${backendUrl}/api/sub-category/list`)
            ]);
            
            if (configRes.data?.success && configRes.data?.config) {
                if (configRes.data.config.deliveryFee !== undefined) {
                    setDeliveryFee(configRes.data.config.deliveryFee);
                }
            }
            if (vouchersRes.data?.success && Array.isArray(vouchersRes.data?.vouchers)) {
                setVouchers(vouchersRes.data.vouchers.filter(v => v.isActive));
            }
            if (catRes.data?.success) {
                setCategories(catRes.data.categories.filter(c => c.status));
            }
            if (subRes.data?.success) {
                setSubCategories(subRes.data.subCategories.filter(s => s.status));
            }
        } catch(error) {
            console.error('getSystemData error:', error);
        }
    }, [backendUrl]);

    useEffect(() => {
        getSystemData();
    }, [getSystemData]);

    const getDiscountAmount = useCallback(() => {
        if (!appliedVoucher) return 0;
        const total = getCartAmount();
        return Math.floor(total * (appliedVoucher.discountPercent / 100));
    }, [appliedVoucher, getCartAmount]);

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
                    for (const color in currentCart[itemId][size]) {
                        const qty = Number(currentCart[itemId][size][color]) || 0;
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

                        let normalizedColor = color;
                        if (
                            itemInfo &&
                            Array.isArray(itemInfo.colors) &&
                            itemInfo.colors.length > 0 &&
                            color !== 'Any' &&
                            !itemInfo.colors.includes(color)
                        ) {
                            normalizedColor = itemInfo.colors[0];
                            changed = true;
                        }

                        if (!nextCart[itemId]) nextCart[itemId] = {};
                        if (!nextCart[itemId][normalizedSize]) nextCart[itemId][normalizedSize] = {};
                        
                        nextCart[itemId][normalizedSize][normalizedColor] =
                            (Number(nextCart[itemId][normalizedSize][normalizedColor]) || 0) + qty;
                    }
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
            setDeliveryFee,
            vouchers,
            appliedVoucher,
            setAppliedVoucher,
            getDiscountAmount,
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
            banners,
            getBanners,
            getReviews,
            addReview,
            token,
            setToken,
            logout,
            categories,
            subCategories,
            getProductStock,
            logBehavior,
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
            delivery_fee,
            setDeliveryFee,
            vouchers,
            appliedVoucher,
            getDiscountAmount,
            categories,
            subCategories,
            getProductStock,
            logBehavior,
        ],
    );

    return (
        <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
    );
};

export default ShopContextProvider;

