import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';

function formatVndPrice(price) {
    const n = Number(price);
    if (!Number.isFinite(n)) return String(price ?? '');
    return `${n.toLocaleString('vi-VN')} VNĐ`;
}

function getSafeImage(imageValue) {
    if (Array.isArray(imageValue) && imageValue.length > 0) return imageValue[0];
    if (typeof imageValue === 'string' && imageValue.trim()) return imageValue;
    return 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image';
}

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
    } = useContext(ShopContext);

    const [voucherInput, setVoucherInput] = useState('');
    const [voucherError, setVoucherError] = useState('');

    const handleApplyVoucher = () => {
        setVoucherError('');
        if (!voucherInput.trim()) return;

        const code = voucherInput.trim().toUpperCase();
        const found = vouchers.find(v => v.code === code);
        
        if (!found) {
            setVoucherError('Mã voucher không hợp lệ hoặc đã hết hạn.');
            return;
        }

        setAppliedVoucher(found);
        setVoucherInput('');
    };

    const [cartData, setCartData] = useState([]);

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
                        });
                    }
                }
            }
        }

        setCartData(tempData);
    }, [cartItems]);

    return (
        <div className="space-y-6 py-4 sm:space-y-8 sm:py-6">
            <div className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <Title text1={'YOUR'} text2={'CART'} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="space-y-4">
                    {cartData.length === 0 ? (
                        <div className="section-shell px-6 py-12 text-center">
                            <p className="text-xl font-semibold text-slate-900">Giỏ hàng trống</p>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                Hãy thêm một vài sản phẩm để tiếp tục mua sắm với trải nghiệm checkout mới.
                            </p>
                        </div>
                    ) : (
                        cartData.map((item, index) => {
                            const productData = products.find(
                                (p) => String(p._id ?? p.id) === String(item._id),
                            );

                            if (!productData) return null;

                            const imageSrc = getSafeImage(productData.image);
                            const availableSizes =
                                Array.isArray(productData.sizes) &&
                                productData.sizes.length > 0
                                    ? productData.sizes
                                    : ['Free'];

                            const displaySize = availableSizes.includes(item.size)
                                ? item.size
                                : availableSizes[0];

                            return (
                                <article
                                    key={`${item._id}-${item.size}-${index}`}
                                    className="section-shell flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-start gap-4 sm:gap-5">
                                        <img
                                            className="h-24 w-20 rounded-[20px] object-cover"
                                            src={imageSrc}
                                            alt={productData.name}
                                        />

                                        <div>
                                            <p className="text-base font-semibold text-slate-900 sm:text-lg">
                                                {productData.name}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                <p>{formatVndPrice(productData.price)}</p>
                                                <p className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                                                    Size {displaySize}
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
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <input
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val <= 0 || e.target.value === '') {
                                                    removeFromCart(item._id, item.size, item.color);
                                                } else {
                                                    updateCartQty(item._id, item.size, item.color, val);
                                                }
                                            }}
                                            className="w-20 rounded-full border border-[var(--border)] px-4 py-3 text-center text-sm outline-none"
                                            type="number"
                                            min={0}
                                            value={item.quantity}
                                        />

                                        <button
                                            onClick={() => removeFromCart(item._id, item.size, item.color)}
                                            className="rounded-full border border-[var(--border)] p-3 hover:bg-slate-900"
                                            type="button"
                                        >
                                            <img
                                                className="w-4"
                                                src={assets.bin_icon}
                                                alt="Xoa"
                                            />
                                        </button>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </section>

                <aside className="lg:sticky lg:top-[140px] lg:h-fit">
                    <div className="section-shell p-6 sm:p-7">
                        <Title text1={'CART'} text2={'TOTALS'} />

                        <div className="mt-6 space-y-4 text-sm text-slate-600">
                            
                            {/* Hot Vouchers UI */}
                            {vouchers.filter(v => v.showAsHot).length > 0 && (
                                <div className="mb-4 rounded-xl bg-orange-50 p-4 border border-orange-100">
                                    <p className="text-orange-800 font-semibold mb-2 flex items-center gap-1">🎇 MÃ HOT HÔM NAY</p>
                                    <div className="flex flex-col gap-2">
                                        {vouchers.filter(v => v.showAsHot).map(v => (
                                            <div key={v._id} className="flex justify-between items-center bg-white p-2 rounded border border-orange-100 border-dashed">
                                                <div>
                                                    <span className="font-mono font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded mr-2">{v.code}</span>
                                                    <span className="text-xs text-orange-800">- {v.discountPercent}% OFF</span>
                                                </div>
                                                <button onClick={() => { setVoucherInput(v.code); setVoucherError(''); }} className="text-xs font-semibold text-orange-600 hover:text-orange-700">DÙNG</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Voucher Input */}
                            <div className="flex flex-col gap-2 pb-2">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={voucherInput}
                                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                                        placeholder="Nhập mã giảm giá..." 
                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-800 font-mono uppercase"
                                    />
                                    <button 
                                        onClick={handleApplyVoucher}
                                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                                    >
                                        ÁP DỤNG
                                    </button>
                                </div>
                                {voucherError && <p className="text-xs text-red-500">{voucherError}</p>}
                                {appliedVoucher && (
                                    <div className="flex justify-between items-center rounded bg-emerald-50 px-3 py-2 border border-emerald-100">
                                        <p className="text-xs font-medium text-emerald-700">
                                            Đã áp dụng mã <span className="font-mono font-bold bg-emerald-100 px-1 rounded">{appliedVoucher.code}</span>
                                        </p>
                                        <button onClick={() => setAppliedVoucher(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs" title="Gỡ mã">✕</button>
                                    </div>
                                )}
                            </div>
                            
                            <hr className="border-slate-100" />

                            <div className="flex justify-between">
                                <p>Tạm tính</p>
                                <p>{formatVndPrice(getCartAmount())}</p>
                            </div>

                            {appliedVoucher && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <p>Giảm giá ({appliedVoucher.discountPercent}%)</p>
                                    <p>-{formatVndPrice(getDiscountAmount())}</p>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <p>Phí giao hàng</p>
                                <p>{formatVndPrice(delivery_fee)}</p>
                            </div>

                            <div className="rounded-[22px] bg-slate-900 px-5 py-4 text-base font-semibold text-white">
                                <div className="flex justify-between">
                                    <p>Tổng cộng</p>
                                    <p>{formatVndPrice(getCartAmount() - getDiscountAmount() + delivery_fee)}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/place-order')}
                            className="mt-6 w-full rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            disabled={cartData.length === 0}
                        >
                            Proceed To Checkout
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Cart;
