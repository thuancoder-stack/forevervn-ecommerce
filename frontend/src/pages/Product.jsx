import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Star } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import RelatedProducts from '../components/RelatedProducts';
import ReviewSystem from '../components/ReviewSystem';
import VideoReview from '../components/VideoReview';
import VirtualTryOn from '../components/VirtualTryOn';
import { formatMoney } from '../lib/locale';

const copyByLanguage = {
    vi: {
        pageTitleSuffix: 'ForeverVN - Th\u1eddi trang cao c\u1ea5p',
        metaDescription: (name) =>
            `Mua ${name} v\u1edbi ch\u1ea5t l\u01b0\u1ee3ng \u0111\u01b0\u1ee3c ch\u1ecdn l\u1ecdc, size r\u00f5 r\u00e0ng v\u00e0 h\u1ed7 tr\u1ee3 giao h\u00e0ng nhanh t\u1eeb ForeverVN.`,
        productDetails: 'Chi ti\u1ebft s\u1ea3n ph\u1ea9m',
        checkingAvailability: '\u0110ang ki\u1ec3m tra t\u1ed3n kho',
        inStock: (count) => `C\u00f2n h\u00e0ng (${count} c\u00e1i)`,
        selectedVariantOutOfStock: 'Phi\u00ean b\u1ea3n \u0111ang ch\u1ecdn \u0111\u00e3 h\u1ebft h\u00e0ng',
        outOfStock: 'H\u1ebft h\u00e0ng',
        inCart: (count) => `Trong gi\u1ecf: ${count}`,
        reviews: '\u0111\u00e1nh gi\u00e1',
        selectSize: 'Ch\u1ecdn size',
        selectColor: 'Ch\u1ecdn m\u00e0u',
        chooseSizeToast: 'Vui l\u00f2ng ch\u1ecdn size',
        chooseColorToast: 'Vui l\u00f2ng ch\u1ecdn m\u00e0u',
        checkingStockToast: '\u0110ang ki\u1ec3m tra t\u1ed3n kho, vui l\u00f2ng ch\u1edd m\u1ed9t ch\u00fat',
        variantOutOfStockToast: 'Phi\u00ean b\u1ea3n n\u00e0y \u0111\u00e3 h\u1ebft h\u00e0ng',
        limitToast: (count) => `B\u1ea1n \u0111ang \u0111\u1eb7t qu\u00e1 s\u1ed1 l\u01b0\u1ee3ng. Ch\u1ec9 c\u00f2n ${count} s\u1ea3n ph\u1ea9m.`,
        unableToAdd: 'Kh\u00f4ng th\u1ec3 th\u00eam s\u1ea3n ph\u1ea9m n\u00e0y',
        addedToCart: '\u0110\u00e3 th\u00eam v\u00e0o gi\u1ecf',
        addToCart: 'Th\u00eam v\u00e0o gi\u1ecf',
        buyNow: 'Mua ngay',
        virtualTryOn: 'Th\u1eed \u0111\u1ed3 \u1ea3o',
        originalProduct: 'H\u00e0ng ch\u00ednh h\u00e3ng 100%',
        codAvailable: 'H\u1ed7 tr\u1ee3 thanh to\u00e1n khi nh\u1eadn h\u00e0ng cho s\u1ea3n ph\u1ea9m n\u00e0y.',
        easyReturn: 'H\u1ed7 tr\u1ee3 \u0111\u1ed5i tr\u1ea3 trong 7 ng\u00e0y.',
        curatedQuality: 'Ch\u1ea5t l\u01b0\u1ee3ng \u0111\u01b0\u1ee3c ch\u1ecdn l\u1ecdc cho nhu c\u1ea7u m\u1eb7c h\u1eb1ng ng\u00e0y.',
        productDescription: 'M\u00f4 t\u1ea3 s\u1ea3n ph\u1ea9m',
        loadingProduct: '\u0110ang t\u1ea3i s\u1ea3n ph\u1ea9m...',
        recentlyViewed: 'S\u1ea3n ph\u1ea9m v\u1eeba xem',
    },
    en: {
        pageTitleSuffix: 'ForeverVN - High-End Fashion',
        metaDescription: (name) =>
            `Shop ${name} with curated quality, clear sizing and fast delivery support from ForeverVN.`,
        productDetails: 'Product Details',
        checkingAvailability: 'Checking availability',
        inStock: (count) => `In stock (${count} left)`,
        selectedVariantOutOfStock: 'Selected variant out of stock',
        outOfStock: 'Out of stock',
        inCart: (count) => `In cart: ${count}`,
        reviews: 'reviews',
        selectSize: 'Select Size',
        selectColor: 'Select Color',
        chooseSizeToast: 'Please choose a size',
        chooseColorToast: 'Please choose a color',
        checkingStockToast: 'Checking stock, please wait a moment',
        variantOutOfStockToast: 'This variant is out of stock',
        limitToast: (count) => `You are ordering too many items. Only ${count} left.`,
        unableToAdd: 'Unable to add this item',
        addedToCart: 'Added to cart',
        addToCart: 'Add To Cart',
        buyNow: 'Buy Now',
        virtualTryOn: 'Virtual Try-On',
        originalProduct: '100% original product',
        codAvailable: 'Cash on delivery is available on this product.',
        easyReturn: 'Easy return and exchange policy within 7 days.',
        curatedQuality: 'Carefully curated quality for everyday wear.',
        productDescription: 'Product Description',
        loadingProduct: 'Loading product...',
        recentlyViewed: 'Recently Viewed',
    },
};

function ensureImageArray(imageValue) {
    if (Array.isArray(imageValue) && imageValue.length > 0) return imageValue;
    if (typeof imageValue === 'string' && imageValue.trim()) return [imageValue.trim()];
    return ['https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image'];
}

function ensureSizeArray(sizeValue) {
    if (Array.isArray(sizeValue) && sizeValue.length > 0) return sizeValue;
    return ['Free'];
}

function normalizeCatalogText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function getVariantKey(size, color = 'Any') {
    return `${String(size || '')}__${String(color || 'Any')}`;
}

function isTryOnEligibleProduct(product) {
    if (!product) return false;

    const catalogText = normalizeCatalogText(
        [product.name, product.category, product.subCategory].filter(Boolean).join(' '),
    );

    const blockedKeywords = [
        'accessor',
        'phu kien',
        'bag',
        'watch',
        'belt',
        'glass',
        'kinh',
        'hat',
        'mu',
        'shoe',
        'giay',
        'dep',
        'sock',
        'wallet',
        'jewelry',
        'jewellery',
    ];

    if (blockedKeywords.some((keyword) => catalogText.includes(keyword))) {
        return false;
    }

    const clothingKeywords = [
        'topwear',
        'bottomwear',
        'winterwear',
        'shirt',
        'tee',
        't-shirt',
        'tshirt',
        'jacket',
        'coat',
        'hoodie',
        'dress',
        'skirt',
        'jean',
        'jeans',
        'pants',
        'trousers',
        'shorts',
        'blazer',
        'sweater',
        'cardigan',
        'ao',
        'quan',
        'vay',
        'dam',
        'khoac',
    ];

    return clothingKeywords.some((keyword) => catalogText.includes(keyword));
}

const Product = () => {
    const { productId } = useParams();
    const { products, cartItems, addToCart, getProductStock, logBehavior, navigate } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copyByLanguage[language];

    const [productData, setProductData] = useState(null);
    const [image, setImage] = useState('');
    const [size, setSize] = useState('');
    const [color, setColor] = useState('Any');
    const [variantStocks, setVariantStocks] = useState({});
    const [variantLoading, setVariantLoading] = useState(false);
    const [showVTO, setShowVTO] = useState(false);
    const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
    const [magnifierStyle, setMagnifierStyle] = useState({
        display: 'none',
        top: 0,
        left: 0,
        backgroundPosition: '0% 0%',
    });

    const mainImageRef = useRef(null);

    useEffect(() => {
        const item = products.find((p) => String(p._id ?? p.id) === String(productId));

        if (!item) {
            setProductData(null);
            setImage('');
            setSize('');
            setColor('Any');
            return;
        }

        const normalizedImages = ensureImageArray(item.image);
        const normalizedSizes = ensureSizeArray(item.sizes);
        const normalizedColors = Array.isArray(item.colors) ? item.colors : [];

        const normalizedProduct = {
            ...item,
            image: normalizedImages,
            sizes: normalizedSizes,
            colors: normalizedColors,
        };

        setProductData(normalizedProduct);
        setImage(normalizedImages[0]);
        setSize(normalizedSizes[0] || 'Free');
        setColor(normalizedColors[0] || 'Any');

        if (item.videoUrl && item.videoUrl.includes('tiktok.com') && normalizedImages[0].includes('dummyimage.com')) {
            axios
                .get(`https://www.tiktok.com/oembed?url=${item.videoUrl}`)
                .then((res) => {
                    if (res.data?.thumbnail_url) {
                        setImage(res.data.thumbnail_url);
                        setProductData((prev) => (prev ? { ...prev, image: [res.data.thumbnail_url] } : prev));
                    }
                })
                .catch(() => {});
        }
    }, [productId, products]);

    useEffect(() => {
        if (!productId) return;

        try {
            let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            recentlyViewed = recentlyViewed.filter((id) => String(id) !== String(productId));
            recentlyViewed.unshift(productId);
            if (recentlyViewed.length > 6) recentlyViewed.pop();
            localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
        } catch {}

        window.scrollTo(0, 0);
    }, [productId]);

    useEffect(() => {
        if (productId && productData?.category) {
            logBehavior('VIEW_PRODUCT', productId, { category: productData.category });
        }
    }, [logBehavior, productData?.category, productId]);

    useEffect(() => {
        if (!productData) return;

        document.title = `${productData.name} | ${t.pageTitleSuffix}`;

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.getElementsByTagName('head')[0].appendChild(metaDesc);
        }

        metaDesc.content = t.metaDescription(productData.name);
    }, [productData, t]);

    useEffect(() => {
        if (!productId || !size) {
            return;
        }
    }, [productId, size]);

    const variantOptions = useMemo(() => {
        if (!productData) return [];

        const sizeOptions = ensureSizeArray(productData.sizes);
        const colorOptions =
            Array.isArray(productData.colors) && productData.colors.length > 0
                ? productData.colors
                : ['Any'];

        return sizeOptions.flatMap((variantSize) =>
            colorOptions.map((variantColor) => ({
                size: variantSize,
                color: variantColor || 'Any',
                key: getVariantKey(variantSize, variantColor || 'Any'),
            })),
        );
    }, [productData]);

    useEffect(() => {
        if (!productId || variantOptions.length === 0) {
            setVariantStocks({});
            return;
        }

        let cancelled = false;
        setVariantLoading(true);

        Promise.all(
            variantOptions.map(async (variant) => [
                variant.key,
                await getProductStock(productId, variant.size, variant.color),
            ]),
        )
            .then((entries) => {
                if (cancelled) return;
                setVariantStocks(Object.fromEntries(entries));
            })
            .finally(() => {
                if (!cancelled) {
                    setVariantLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [getProductStock, productId, variantOptions]);

    const canUseVirtualTryOn = useMemo(() => isTryOnEligibleProduct(productData), [productData]);

    useEffect(() => {
        if (!canUseVirtualTryOn) {
            setShowVTO(false);
        }
    }, [canUseVirtualTryOn]);

    const currentVariantQty = useMemo(
        () => Number(cartItems?.[productId]?.[size]?.[color || 'Any'] || 0),
        [cartItems, color, productId, size],
    );

    const selectedVariantStock = useMemo(() => {
        const variantKey = getVariantKey(size, color || 'Any');
        if (!Object.prototype.hasOwnProperty.call(variantStocks, variantKey)) return null;
        return Number(variantStocks[variantKey] || 0);
    }, [color, size, variantStocks]);

    const hasAnyAvailableVariant = useMemo(
        () => variantOptions.some((variant) => Number(variantStocks[variant.key] || 0) > 0),
        [variantOptions, variantStocks],
    );

    useEffect(() => {
        if (variantOptions.length === 0 || Object.keys(variantStocks).length === 0) return;

        const selectedKey = getVariantKey(size, color || 'Any');
        const selectedStock = Number(variantStocks[selectedKey] || 0);
        if (selectedStock > 0) return;

        const firstAvailable = variantOptions.find((variant) => Number(variantStocks[variant.key] || 0) > 0);
        if (!firstAvailable) return;

        if (firstAvailable.size !== size) setSize(firstAvailable.size);
        if (firstAvailable.color !== (color || 'Any')) setColor(firstAvailable.color);
    }, [color, size, variantOptions, variantStocks]);

    const availableToAdd =
        selectedVariantStock === null ? null : Math.max(selectedVariantStock - currentVariantQty, 0);
    const stockStatusLabel =
        selectedVariantStock === null || variantLoading
            ? t.checkingAvailability
            : selectedVariantStock > 0
              ? t.inStock(selectedVariantStock)
              : hasAnyAvailableVariant
                ? t.selectedVariantOutOfStock
                : t.outOfStock;

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left - window.pageXOffset) / width) * 100;
        const y = ((e.pageY - top - window.pageYOffset) / height) * 100;

        setMagnifierStyle({
            display: 'block',
            top: e.pageY - top - window.pageYOffset - 75,
            left: e.pageX - left - window.pageXOffset - 75,
            backgroundPosition: `${x}% ${y}%`,
            backgroundImage: `url(${image})`,
        });
    };

    const handleMouseLeave = () =>
        setMagnifierStyle({
            display: 'none',
            top: 0,
            left: 0,
            backgroundPosition: '0% 0%',
        });

    const validatePurchaseSelection = () => {
        if (!size) {
            toast.error(t.chooseSizeToast);
            return false;
        }

        if (productData?.colors?.length > 0 && !color) {
            toast.error(t.chooseColorToast);
            return false;
        }

        if (selectedVariantStock === null) {
            toast.info(t.checkingStockToast);
            return false;
        }

        if (availableToAdd <= 0) {
            if (Number(selectedVariantStock || 0) > 0) {
                toast.error(t.limitToast(selectedVariantStock));
            } else {
                toast.error(t.variantOutOfStockToast);
            }
            return false;
        }

        return true;
    };

    const animateProductToCart = () => {
        const sourceImage = mainImageRef.current?.querySelector('img');
        const cartTarget = document.querySelector('[data-cart-target="true"]');

        if (!sourceImage || !cartTarget) return;

        const sourceRect = sourceImage.getBoundingClientRect();
        const targetRect = cartTarget.getBoundingClientRect();
        const flyShell = document.createElement('div');
        const flyGlow = document.createElement('div');
        const flyImage = document.createElement('img');
        const flyBadge = document.createElement('div');

        Object.assign(flyShell.style, {
            position: 'fixed',
            top: `${sourceRect.top}px`,
            left: `${sourceRect.left}px`,
            width: `${sourceRect.width}px`,
            height: `${sourceRect.height}px`,
            pointerEvents: 'none',
            zIndex: '9999',
            transformOrigin: 'center center',
        });

        Object.assign(flyGlow.style, {
            position: 'absolute',
            inset: '-8px',
            borderRadius: '32px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.26) 0%, rgba(99,102,241,0) 72%)',
            filter: 'blur(8px)',
            opacity: '0.85',
        });

        flyImage.src = image || sourceImage.currentSrc || sourceImage.src;
        Object.assign(flyImage.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '24px',
            boxShadow: '0 24px 50px rgba(15, 23, 42, 0.18)',
        });

        flyBadge.textContent = '+1';
        Object.assign(flyBadge.style, {
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '34px',
            height: '34px',
            padding: '0 10px',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.08em',
            boxShadow: '0 14px 28px rgba(15, 23, 42, 0.18)',
        });

        flyShell.appendChild(flyGlow);
        flyShell.appendChild(flyImage);
        flyShell.appendChild(flyBadge);
        document.body.appendChild(flyShell);

        const deltaX =
            targetRect.left +
            targetRect.width / 2 -
            (sourceRect.left + sourceRect.width / 2);
        const deltaY =
            targetRect.top +
            targetRect.height / 2 -
            (sourceRect.top + sourceRect.height / 2);

        const lift = Math.max(72, Math.min(150, Math.abs(deltaX) * 0.16 + 82));

        const shellAnimation = flyShell.animate(
            [
                {
                    transform: 'translate3d(0, 0, 0) scale(1) rotate(0deg)',
                    opacity: 1,
                    filter: 'blur(0px)',
                },
                {
                    transform: `translate3d(${deltaX * 0.35}px, ${deltaY * 0.18 - lift}px, 0) scale(0.76) rotate(7deg)`,
                    opacity: 0.98,
                    filter: 'blur(0px)',
                    offset: 0.42,
                },
                {
                    transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.12) rotate(12deg)`,
                    opacity: 0.14,
                    filter: 'blur(1.5px)',
                },
            ],
            {
                duration: 760,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'forwards',
            },
        );

        flyGlow.animate(
            [
                { opacity: 0.65, transform: 'scale(0.92)' },
                { opacity: 1, transform: 'scale(1.08)', offset: 0.35 },
                { opacity: 0, transform: 'scale(0.4)' },
            ],
            {
                duration: 760,
                easing: 'ease-out',
                fill: 'forwards',
            },
        );

        flyBadge.animate(
            [
                { transform: 'translateY(0px) scale(1)', opacity: 1 },
                { transform: 'translateY(-10px) scale(1.04)', opacity: 1, offset: 0.4 },
                { transform: 'translateY(-18px) scale(0.9)', opacity: 0 },
            ],
            {
                duration: 760,
                easing: 'ease-out',
                fill: 'forwards',
            },
        );

        cartTarget.animate(
            [
                { transform: 'scale(1)', boxShadow: '0 0 0 rgba(99,102,241,0)' },
                { transform: 'scale(1.16)', boxShadow: '0 0 0 10px rgba(99,102,241,0.12)' },
                { transform: 'scale(1)', boxShadow: '0 0 0 rgba(99,102,241,0)' },
            ],
            {
                duration: 520,
                delay: 360,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
        );

        const pulse = document.createElement('div');
        Object.assign(pulse.style, {
            position: 'fixed',
            top: `${targetRect.top + targetRect.height / 2 - 18}px`,
            left: `${targetRect.left + targetRect.width / 2 - 18}px`,
            width: '36px',
            height: '36px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.18)',
            border: '1px solid rgba(99, 102, 241, 0.24)',
            pointerEvents: 'none',
            zIndex: '9998',
        });
        document.body.appendChild(pulse);
        const pulseAnimation = pulse.animate(
            [
                { transform: 'scale(0.4)', opacity: 0.8 },
                { transform: 'scale(1.8)', opacity: 0 },
            ],
            {
                duration: 520,
                delay: 360,
                easing: 'ease-out',
                fill: 'forwards',
            },
        );

        const cleanup = () => {
            if (flyShell.parentNode) {
                flyShell.parentNode.removeChild(flyShell);
            }
            if (pulse.parentNode) {
                pulse.parentNode.removeChild(pulse);
            }
        };

        shellAnimation.addEventListener('finish', cleanup, { once: true });
        pulseAnimation.addEventListener('finish', cleanup, { once: true });
        window.setTimeout(cleanup, 1200);
    };

    const buildSelectedOrderItem = () => ({
        _id: productData?._id ?? productData?.id,
        name: productData?.name,
        price: productData?.price,
        image: productData?.image,
        size,
        color: color === 'Any' ? '' : color,
        quantity: 1,
    });

    const handleAddToCart = async () => {
        if (!validatePurchaseSelection()) return;

        const result = await addToCart(productData._id ?? productData.id, size, color || 'Any');

        if (!result?.success) {
            if (Number(result?.stock || 0) > 0) {
                toast.error(t.limitToast(result.stock));
            } else {
                toast.error(result?.message || t.unableToAdd);
            }
            return;
        }

        animateProductToCart();
        toast.success(t.addedToCart);
    };

    const handleBuyNow = () => {
        if (!validatePurchaseSelection()) return;

        navigate('/place-order', {
            state: {
                buyNowItem: buildSelectedOrderItem(),
            },
        });
    };

    if (!productData) {
        return <div className="py-20 text-center text-slate-400">{t.loadingProduct}</div>;
    }

    return (
        <div className="space-y-8 py-4 sm:space-y-10 sm:py-6">
            <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
                    <div className="grid gap-4 lg:grid-cols-[110px_minmax(0,1fr)]">
                        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto">
                            {productData.image.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => setImage(item)}
                                    className={`overflow-hidden rounded-[22px] border bg-white ${
                                        image === item
                                            ? 'border-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.12)]'
                                            : 'border-[var(--border)]'
                                    }`}
                                    type="button"
                                >
                                    <img
                                        src={item}
                                        className="h-24 w-20 object-cover lg:h-28 lg:w-full"
                                        alt={productData.name}
                                    />
                                </button>
                            ))}
                        </div>

                        <div
                            ref={mainImageRef}
                            className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-3 shadow-[0_22px_45px_rgba(15,23,42,0.1)] cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <img
                                className="aspect-[4/5] w-full rounded-[22px] object-cover"
                                src={image}
                                alt={productData.name}
                            />
                            <div
                                className="pointer-events-none absolute h-40 w-40 rounded-full border-4 border-white shadow-xl bg-no-repeat bg-[length:300%_300%]"
                                style={{
                                    ...magnifierStyle,
                                    zIndex: 10,
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                                {t.productDetails}
                            </p>
                            <h1 className="display-font mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">
                                {productData.name}
                            </h1>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <span
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                            selectedVariantStock !== null && selectedVariantStock > 0
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                    }`}
                                >
                                    <div
                                        className={`h-2 w-2 rounded-full ${
                                            selectedVariantStock !== null && selectedVariantStock > 0
                                                ? 'bg-emerald-500 animate-pulse'
                                                : 'bg-rose-500'
                                        }`}
                                    />
                                    {stockStatusLabel}
                                </span>

                                {currentVariantQty > 0 ? (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                        {t.inCart(currentVariantQty)}
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        fill={
                                            i <
                                            Math.round(
                                                reviewStats.averageRating && reviewStats.averageRating > 0
                                                    ? reviewStats.averageRating
                                                    : 5,
                                            )
                                                ? '#fbbf24'
                                                : 'none'
                                        }
                                        stroke={
                                            i <
                                            Math.round(
                                                reviewStats.averageRating && reviewStats.averageRating > 0
                                                    ? reviewStats.averageRating
                                                    : 5,
                                            )
                                                ? '#fbbf24'
                                                : '#cbd5e1'
                                        }
                                    />
                                ))}
                            </div>
                            <span className="pl-1 font-bold">
                                ({reviewStats.totalReviews}){' '}
                                <span className="text-xs text-slate-400 font-normal">{t.reviews}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="text-3xl font-semibold text-slate-900">
                                {formatMoney(productData.price, language)}
                            </p>
                            {productData.oldPrice > productData.price && (
                                <>
                                    <p className="text-lg text-slate-400 line-through">
                                        {formatMoney(productData.oldPrice, language)}
                                    </p>
                                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
                                        -
                                        {Math.round(
                                            ((productData.oldPrice - productData.price) / productData.oldPrice) * 100,
                                        )}
                                        %
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                            {productData.description}
                        </p>

                        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {t.selectSize}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-3">
                                {productData.sizes.map((item, index) => (
                                    <button
                                        onClick={() => {
                                            setSize(item);

                                            if (productData.colors?.length) {
                                                const currentColor = color || 'Any';
                                                const sameColorKey = getVariantKey(item, currentColor);
                                                if (Number(variantStocks[sameColorKey] || 0) > 0) return;

                                                const fallbackVariant = variantOptions.find(
                                                    (variant) =>
                                                        variant.size === item &&
                                                        Number(variantStocks[variant.key] || 0) > 0,
                                                );

                                                if (fallbackVariant) {
                                                    setColor(fallbackVariant.color);
                                                }
                                            }
                                        }}
                                        className={`rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                                            item === size
                                                ? 'bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                : 'border border-[var(--border)] bg-slate-50 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                                        }`}
                                        key={index}
                                        type="button"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {productData.colors && productData.colors.length > 0 && (
                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    {t.selectColor}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    {productData.colors.map((item, index) => (
                                        <button
                                            onClick={() => setColor(item)}
                                            className={`group relative flex items-center gap-3 rounded-full border px-5 py-3 text-sm font-semibold transition-all ${
                                                item === color
                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                    : 'border-[var(--border)] bg-slate-50 text-slate-600 hover:border-slate-900'
                                            }`}
                                            key={index}
                                            type="button"
                                        >
                                            <div
                                                className="h-4 w-4 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: item.toLowerCase() }}
                                            />
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <button
                                onClick={handleAddToCart}
                                disabled={availableToAdd === null || availableToAdd <= 0}
                                className="rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                type="button"
                            >
                                {availableToAdd !== null && availableToAdd > 0 ? t.addToCart : t.outOfStock}
                            </button>

                            <button
                                onClick={handleBuyNow}
                                disabled={availableToAdd === null || availableToAdd <= 0}
                                className="rounded-full border border-slate-900 bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-900 shadow-[0_18px_36px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:shadow-none"
                                type="button"
                            >
                                {t.buyNow}
                            </button>

                            {canUseVirtualTryOn && (
                                <button
                                    onClick={() => setShowVTO(true)}
                                    className="group relative overflow-hidden rounded-full border-2 border-indigo-600 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white sm:px-6"
                                    type="button"
                                >
                                    <span className="relative z-10 flex items-center gap-2">{t.virtualTryOn}</span>
                                </button>
                            )}

                            <div className="rounded-full border border-[var(--border)] bg-white px-5 py-4 text-sm text-slate-500">
                                {t.originalProduct}
                            </div>
                        </div>

                        {showVTO && canUseVirtualTryOn && (
                            <VirtualTryOn
                                productImg={image}
                                productName={productData.name}
                                onClose={() => setShowVTO(false)}
                            />
                        )}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 text-sm text-slate-500">
                                {t.codAvailable}
                            </div>
                            <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 text-sm text-slate-500">
                                {t.easyReturn}
                            </div>
                            <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 text-sm text-slate-500">
                                {t.curatedQuality}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <VideoReview videoUrl={productData.videoUrl} />

            <section className="section-shell overflow-hidden">
                <div className="flex flex-wrap border-b border-[var(--border)] bg-white/70">
                    <b className="border-r border-[var(--border)] px-8 py-5 text-base font-bold text-slate-900">
                        {t.productDescription}
                    </b>
                </div>

                <div className="px-8 py-10 text-lg leading-loose text-slate-600 sm:px-12 bg-white">
                    <div dangerouslySetInnerHTML={{ __html: productData.description.replace(/\n/g, '<br/>') }} />
                </div>
            </section>

            <ReviewSystem productId={productData._id || productData.id} onReviewsLoaded={setReviewStats} />

            <RecentlyViewedProducts currentId={productData._id || productData.id} />

            <RelatedProducts
                category={productData.category}
                subCategory={productData.subCategory}
            />
        </div>
    );
};

const RecentlyViewedProducts = ({ currentId }) => {
    const { products } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copyByLanguage[language];
    const [recentProducts, setRecentProducts] = useState([]);

    useEffect(() => {
        try {
            const rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            const list = rv
                .filter((id) => String(id) !== String(currentId))
                .map((id) => products.find((p) => String(p._id || p.id) === String(id)))
                .filter(Boolean);

            setRecentProducts(list.slice(0, 5));
        } catch {}
    }, [currentId, products]);

    if (recentProducts.length === 0) return null;

    return (
        <div className="mt-20">
            <div className="text-center text-3xl py-2">
                <div className="inline-flex gap-2 items-center mb-3">
                    <p className="text-gray-700 font-medium">{t.recentlyViewed}</p>
                    <p className="w-8 sm:w-12 h-[1px] sm:h-[2px] bg-gray-700"></p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 mt-6">
                {recentProducts.map((item, index) => (
                    <div key={index} className="text-gray-700 cursor-pointer group flex flex-col gap-2 relative">
                        <a
                            href={`/product/${item._id || item.id}`}
                            className="block overflow-hidden relative rounded-xl border border-[var(--border)] bg-[var(--surface-color)] p-2 transition-all group-hover:border-pink-200 shadow-sm hover:shadow-md"
                        >
                            <div className="overflow-hidden rounded-lg bg-pink-50/50">
                                <img
                                    className="hover:scale-105 transition-transform duration-500 ease-in-out w-full h-[180px] sm:h-[220px] object-cover"
                                    src={item.image?.[0] || 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image'}
                                    alt={item.name}
                                />
                            </div>
                        </a>
                        <p className="pt-3 pb-1 text-sm font-bold truncate px-1 group-hover:text-pink-600 transition-colors uppercase tracking-wide">
                            {item.name}
                        </p>
                        <p className="text-sm font-mono text-gray-500 font-medium px-1">
                            {formatMoney(item.price, language)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Product;
