import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import { formatMoney } from '../lib/locale';

function getSafeImage(imageValue) {
    if (Array.isArray(imageValue) && imageValue.length > 0) return imageValue[0];
    if (typeof imageValue === 'string' && imageValue.trim()) return imageValue;
    return 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image';
}

const copy = {
    vi: {
        title1: 'GI\u1ece',
        title2: 'H\u00c0NG',
        totals1: 'T\u1ed4NG',
        totals2: 'TI\u1ec0N',
        emptyTitle: 'Gi\u1ecf h\u00e0ng \u0111ang tr\u1ed1ng',
        emptyDesc: 'H\u00e3y th\u00eam v\u00e0i s\u1ea3n ph\u1ea9m \u0111\u1ec3 ti\u1ebfp t\u1ee5c thanh to\u00e1n.',
        size: 'Size',
        checkingStock: '\u0110ang ki\u1ec3m tra t\u1ed3n kho',
        stockLeft: (value) => `C\u00f2n ${value}`,
        outOfStock: 'H\u1ebft h\u00e0ng',
        soldOutMessage: 'Bi\u1ebfn th\u1ec3 n\u00e0y \u0111\u00e3 h\u1ebft h\u00e0ng. H\u00e3y x\u00f3a tr\u01b0\u1edbc khi thanh to\u00e1n.',
        limitMessage: (value) => `B\u1ea1n ch\u1ec9 c\u00f3 th\u1ec3 mua t\u1ed1i \u0111a ${value} s\u1ea3n ph\u1ea9m cho bi\u1ebfn th\u1ec3 n\u00e0y.`,
        hotVouchers: 'M\u00e3 hot h\u00f4m nay',
        use: 'D\u00d9NG',
        enterVoucher: 'Nh\u1eadp m\u00e3 gi\u1ea3m gi\u00e1...',
        apply: '\u00c1P D\u1ee4NG',
        voucherInvalid: 'M\u00e3 voucher kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c \u0111\u00e3 h\u1ebft h\u1ea1n.',
        voucherApplied: '\u0110\u00e3 \u00e1p d\u1ee5ng m\u00e3',
        removeVoucher: 'G\u1ee1 m\u00e3',
        stockIssues: 'Vui l\u00f2ng ch\u1ec9nh l\u1ea1i c\u00e1c s\u1ea3n ph\u1ea9m \u0111\u00e3 h\u1ebft h\u00e0ng ho\u1eb7c v\u01b0\u1ee3t t\u1ed3n kho tr\u01b0\u1edbc khi thanh to\u00e1n.',
        subtotal: 'T\u1ea1m t\u00ednh',
        discount: (value) => `Gi\u1ea3m gi\u00e1 (${value}%)`,
        shipping: 'Ph\u00ed giao h\u00e0ng',
        total: 'T\u1ed5ng c\u1ed9ng',
        checkout: 'Ti\u1ebfn H\u00e0nh Thanh To\u00e1n',
        quantityExceeded: 'S\u1ed1 l\u01b0\u1ee3ng v\u01b0\u1ee3t qu\u00e1 t\u1ed3n kho',
        remove: 'X\u00f3a',
    },
    en: {
        title1: 'YOUR',
        title2: 'CART',
        totals1: 'CART',
        totals2: 'TOTALS',
        emptyTitle: 'Your cart is empty',
        emptyDesc: 'Add a few products to continue with checkout.',
        size: 'Size',
        checkingStock: 'Checking stock',
        stockLeft: (value) => `${value} left`,
        outOfStock: 'Out of stock',
        soldOutMessage: 'This variant is sold out. Remove it before checkout.',
        limitMessage: (value) => `You can only buy up to ${value} item(s) for this variant.`,
        hotVouchers: "Today's hot vouchers",
        use: 'USE',
        enterVoucher: 'Enter voucher code...',
        apply: 'APPLY',
        voucherInvalid: 'Voucher code is invalid or expired.',
        voucherApplied: 'Applied voucher',
        removeVoucher: 'Remove voucher',
        stockIssues: 'Please adjust sold-out or over-limit items before checkout.',
        subtotal: 'Subtotal',
        discount: (value) => `Discount (${value}%)`,
        shipping: 'Shipping fee',
        total: 'Total',
        checkout: 'Proceed To Checkout',
        quantityExceeded: 'Quantity exceeds stock',
        remove: 'Remove',
    },
};
const Cart = () => {
    const {
        products,
        cartItems,
        updateCartQty,
        removeFromCart,
        getCartAmount,
        delivery_fee,
        vouchers,
        appliedVoucher,
        setAppliedVoucher,
        getDiscountAmount,
        navigate,
        getProductStock,
    } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copy[language];

    const [voucherInput, setVoucherInput] = useState('');
    const [voucherError, setVoucherError] = useState('');
    const [cartData, setCartData] = useState([]);
    const [stockMap, setStockMap] = useState({});

    const handleApplyVoucher = () => {
        setVoucherError('');
        if (!voucherInput.trim()) return;

        const code = voucherInput.trim().toUpperCase();
        const found = vouchers.find((v) => v.code === code);

        if (!found) {
            setVoucherError(t.voucherInvalid);
            return;
        }

        setAppliedVoucher(found);
        setVoucherInput('');
    };

    useEffect(() => {
        const tempData = [];

        for (const itemId in cartItems) {
            for (const size in cartItems[itemId]) {
                for (const color in cartItems[itemId][size]) {
                    const qty = Number(cartItems[itemId][size][color]) || 0;
                    if (qty > 0) {
                        tempData.push({
                            _id: itemId,
                            size,
                            color,
                            quantity: qty,
                            key: `${itemId}__${size}__${color}`,
                        });
                    }
                }
            }
        }

        setCartData(tempData);
    }, [cartItems]);

    useEffect(() => {
        let cancelled = false;

        const loadStocks = async () => {
            if (cartData.length === 0) {
                setStockMap({});
                return;
            }

            const entries = await Promise.all(
                cartData.map(async (item) => {
                    const stock = await getProductStock(item._id, item.size, item.color);
                    return [item.key, stock];
                }),
            );

            if (!cancelled) {
                setStockMap(Object.fromEntries(entries));
            }
        };

        loadStocks();

        return () => {
            cancelled = true;
        };
    }, [cartData, getProductStock]);

    const stockIssues = useMemo(
        () =>
            cartData.filter((item) => {
                if (!Object.prototype.hasOwnProperty.call(stockMap, item.key)) return false;
                const available = Number(stockMap[item.key] || 0);
                return available <= 0 || item.quantity > available;
            }),
        [cartData, stockMap],
    );

    const hasStockIssues = stockIssues.length > 0;

    const handleQuantityChange = async (item, nextValue) => {
        const numericValue = Number(nextValue);

        if (!nextValue || numericValue <= 0) {
            await updateCartQty(item._id, item.size, item.color, 0);
            return;
        }

        const result = await updateCartQty(item._id, item.size, item.color, numericValue);
        if (!result?.success) {
            toast.error(result?.message || t.quantityExceeded);
        }
    };

    return (
        <div className="space-y-6 py-4 sm:space-y-8 sm:py-6">
            <div className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <Title text1={t.title1} text2={t.title2} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="space-y-4">
                    {cartData.length === 0 ? (
                        <div className="section-shell px-6 py-12 text-center">
                            <p className="text-xl font-semibold text-slate-900">{t.emptyTitle}</p>
                            <p className="mt-3 text-sm leading-7 text-slate-500">{t.emptyDesc}</p>
                        </div>
                    ) : (
                        cartData.map((item, index) => {
                            const productData = products.find(
                                (p) => String(p._id ?? p.id) === String(item._id),
                            );

                            if (!productData) return null;

                            const imageSrc = getSafeImage(productData.image);
                            const availableSizes =
                                Array.isArray(productData.sizes) && productData.sizes.length > 0
                                    ? productData.sizes
                                    : ['Free'];
                            const displaySize = availableSizes.includes(item.size)
                                ? item.size
                                : availableSizes[0];
                            const hasLoadedStock = Object.prototype.hasOwnProperty.call(stockMap, item.key);
                            const availableStock = hasLoadedStock ? Number(stockMap[item.key] || 0) : null;
                            const isUnavailable = availableStock !== null && availableStock <= 0;
                            const isExceeded =
                                availableStock !== null && item.quantity > availableStock && availableStock > 0;

                            return (
                                <article
                                    key={`${item._id}-${item.size}-${index}`}
                                    className="section-shell flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/product/${item._id}`)}
                                        className="flex items-start gap-4 text-left sm:gap-5"
                                    >
                                        <img
                                            className="h-24 w-20 rounded-[20px] object-cover transition hover:opacity-90"
                                            src={imageSrc}
                                            alt={productData.name}
                                        />

                                        <div>
                                            <p className="text-base font-semibold text-slate-900 transition hover:text-slate-700 sm:text-lg">
                                                {productData.name}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                <p>{formatMoney(productData.price, language)}</p>
                                                <p className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                                                    {t.size} {displaySize}
                                                </p>
                                                {item.color && item.color !== 'Any' && (
                                                    <p className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1">
                                                        <span
                                                            className="inline-block h-3 w-3 rounded-full border border-slate-200"
                                                            style={{ backgroundColor: item.color.toLowerCase() }}
                                                        />
                                                        {item.color}
                                                    </p>
                                                )}
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        availableStock === null
                                                            ? 'bg-slate-100 text-slate-500'
                                                            : availableStock > 0
                                                              ? 'bg-emerald-100 text-emerald-700'
                                                              : 'bg-rose-100 text-rose-700'
                                                    }`}
                                                >
                                                    {availableStock === null
                                                        ? t.checkingStock
                                                        : availableStock > 0
                                                          ? t.stockLeft(availableStock)
                                                          : t.outOfStock}
                                                </span>
                                            </div>

                                            {(isUnavailable || isExceeded) && (
                                                <p className="mt-3 text-sm font-medium text-rose-600">
                                                    {isUnavailable
                                                        ? t.soldOutMessage
                                                        : t.limitMessage(availableStock)}
                                                </p>
                                            )}
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <input
                                            onChange={(e) => handleQuantityChange(item, e.target.value)}
                                            className="w-20 rounded-full border border-[var(--border)] px-4 py-3 text-center text-sm outline-none"
                                            type="number"
                                            min={0}
                                            max={availableStock === null ? undefined : Math.max(availableStock, 0)}
                                            value={item.quantity}
                                        />

                                        <button
                                            onClick={() => removeFromCart(item._id, item.size, item.color)}
                                            className="rounded-full border border-[var(--border)] p-3 hover:bg-slate-900"
                                            type="button"
                                            title={t.remove}
                                        >
                                            <img className="w-4" src={assets.bin_icon} alt={t.remove} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </section>

                <aside className="lg:sticky lg:top-[140px] lg:h-fit">
                    <div className="section-shell p-6 sm:p-7">
                        <Title text1={t.totals1} text2={t.totals2} />

                        <div className="mt-6 space-y-4 text-sm text-slate-600">
                            {vouchers.filter((v) => v.showAsHot).length > 0 && (
                                <div className="mb-4 rounded-xl bg-orange-50 p-4 border border-orange-100">
                                    <p className="text-orange-800 font-semibold mb-2">{t.hotVouchers}</p>
                                    <div className="flex flex-col gap-2">
                                        {vouchers
                                            .filter((v) => v.showAsHot)
                                            .map((v) => (
                                                <div
                                                    key={v._id}
                                                    className="flex justify-between items-center bg-white p-2 rounded border border-orange-100 border-dashed"
                                                >
                                                    <div>
                                                        <span className="font-mono font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded mr-2">
                                                            {v.code}
                                                        </span>
                                                        <span className="text-xs text-orange-800">
                                                            - {v.discountPercent}% OFF
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setVoucherInput(v.code);
                                                            setVoucherError('');
                                                        }}
                                                        className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                                                    >
                                                        {t.use}
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 pb-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={voucherInput}
                                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                                        placeholder={t.enterVoucher}
                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-800 font-mono uppercase"
                                    />
                                    <button
                                        onClick={handleApplyVoucher}
                                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                                    >
                                        {t.apply}
                                    </button>
                                </div>
                                {voucherError && <p className="text-xs text-red-500">{voucherError}</p>}
                                {appliedVoucher && (
                                    <div className="flex justify-between items-center rounded bg-emerald-50 px-3 py-2 border border-emerald-100">
                                        <p className="text-xs font-medium text-emerald-700">
                                            {t.voucherApplied}{' '}
                                            <span className="font-mono font-bold bg-emerald-100 px-1 rounded">
                                                {appliedVoucher.code}
                                            </span>
                                        </p>
                                        <button
                                            onClick={() => setAppliedVoucher(null)}
                                            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                                            title={t.removeVoucher}
                                        >
                                            x
                                        </button>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {hasStockIssues && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {t.stockIssues}
                                </div>
                            )}

                            <div className="flex justify-between">
                                <p>{t.subtotal}</p>
                                <p>{formatMoney(getCartAmount(), language)}</p>
                            </div>

                            {appliedVoucher && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <p>{t.discount(appliedVoucher.discountPercent)}</p>
                                    <p>-{formatMoney(getDiscountAmount(), language)}</p>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <p>{t.shipping}</p>
                                <p>{formatMoney(delivery_fee, language)}</p>
                            </div>

                            <div className="rounded-[22px] bg-slate-900 px-5 py-4 text-base font-semibold text-white">
                                <div className="flex justify-between">
                                    <p>{t.total}</p>
                                    <p>{formatMoney(getCartAmount() - getDiscountAmount() + delivery_fee, language)}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/place-order')}
                            className="mt-6 w-full rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            disabled={cartData.length === 0 || hasStockIssues}
                        >
                            {t.checkout}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Cart;
