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
        navigate,
    } = useContext(ShopContext);

    const [cartData, setCartData] = useState([]);

    // CHANGE: chuyen cart object -> list de render
    useEffect(() => {
        const tempData = [];

        for (const itemId in cartItems) {
            for (const size in cartItems[itemId]) {
                const qty = Number(cartItems[itemId][size]) || 0;
                if (qty > 0) {
                    tempData.push({
                        _id: itemId,
                        size,
                        quantity: qty,
                    });
                }
            }
        }

        setCartData(tempData);
    }, [cartItems]);

    return (
        <div className="border-t pt-14">
            <div className="text-2xl mb-3">
                <Title text1={'YOUR'} text2={'CART'} />
            </div>

            <div>
                {cartData.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">Gio hang trong</p>
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

                        // CHANGE: neu size trong cart cu khong con hop le thi hien size co ban
                        const displaySize = availableSizes.includes(item.size)
                            ? item.size
                            : availableSizes[0];

                        return (
                            <div
                                key={`${item._id}-${item.size}-${index}`}
                                className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
                            >
                                <div className="flex items-start gap-6">
                                    <img
                                        className="w-16 sm:w-20"
                                        src={imageSrc}
                                        alt={productData.name}
                                    />

                                    <div>
                                        <p className="text-xs sm:text-lg font-medium">
                                            {productData.name}
                                        </p>

                                        <div className="flex items-center gap-5 mt-2">
                                            {/* CHANGE: format gia dong nhat */}
                                            <p>{formatVndPrice(productData.price)}</p>
                                            <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">
                                                {displaySize}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <input
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val <= 0 || e.target.value === '') {
                                            removeFromCart(item._id, item.size);
                                        } else {
                                            updateCartQty(item._id, item.size, val);
                                        }
                                    }}
                                    className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                                    type="number"
                                    min={0}
                                    value={item.quantity}
                                />

                                <img
                                    onClick={() => removeFromCart(item._id, item.size)}
                                    className="w-4 mr-4 sm:w-5 cursor-pointer"
                                    src={assets.bin_icon}
                                    alt="Xoa"
                                />
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex justify-end my-20">
                <div className="w-full sm:w-[450px]">
                    <div className="w-full">
                        <div className="text-2xl">
                            <Title text1={'CART'} text2={'TOTALS'} />
                        </div>

                        <div className="flex flex-col gap-2 mt-2 text-sm">
                            <div className="flex justify-between">
                                <p>Subtotal</p>
                                <p>{formatVndPrice(getCartAmount())}</p>
                            </div>
                            <hr />
                            <div className="flex justify-between">
                                <p>Shipping Fee</p>
                                <p>{formatVndPrice(delivery_fee)}</p>
                            </div>
                            <hr />
                            <div className="flex justify-between font-bold text-base">
                                <p>Total</p>
                                <p>{formatVndPrice(getCartAmount() + delivery_fee)}</p>
                            </div>
                        </div>

                        <div className="w-full text-end">
                            <button
                                onClick={() => navigate('/place-order')}
                                className="bg-black text-white text-sm my-8 px-8 py-3"
                            >
                                PROCEED TO CHECKOUT
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
