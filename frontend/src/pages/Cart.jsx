import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import Title from '../components/Title'
import { useNavigate } from 'react-router-dom'

const Cart = () => {
    const { products, currency, cartItems, updateCartQty, removeFromCart, getCartAmount, delivery_fee, navigate } = useContext(ShopContext);
    const [cartData, setCartData] = useState([]);

    // ── Chuyển cartItems object → array để render ──────────────
    // cartItems: { "aaaab": { "M": 2, "L": 1 } }
    // → [{ _id:"aaaab", size:"M", quantity:2 }, { _id:"aaaab", size:"L", quantity:1 }]
    useEffect(() => {
        const tempData = [];
        for (const itemId in cartItems) {
            for (const size in cartItems[itemId]) {
                if (cartItems[itemId][size] > 0) {
                    tempData.push({
                        _id: itemId,
                        size: size,
                        quantity: cartItems[itemId][size],
                    });
                }
            }
        }
        setCartData(tempData);
    }, [cartItems]); // ← tự cập nhật mỗi khi giỏ thay đổi

    return (
        <div className='border-t pt-14'>

            {/* ── Tiêu đề ── */}
            <div className='text-2xl mb-3'>
                <Title text1={'YOUR'} text2={'CART'} />
            </div>

            {/* ── Danh sách sản phẩm ── */}
            <div>
                {cartData.length === 0 ? (
                    <p className='text-gray-500 text-center py-10'>
                        Giỏ hàng trống 🛒
                    </p>
                ) : (
                    cartData.map((item, index) => {
                        // Tìm thông tin sản phẩm từ products
                        const productData = products.find(p => p._id === item._id);
                        if (!productData) return null;

                        return (
                            <div key={index}
                                className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'
                            >
                                {/* Ảnh + Tên + Size */}
                                <div className='flex items-start gap-6'>
                                    <img
                                        className='w-16 sm:w-20'
                                        src={productData.image[0]}
                                        alt={productData.name}
                                    />
                                    <div>
                                        <p className='text-xs sm:text-lg font-medium'>
                                            {productData.name}
                                        </p>
                                        <div className='flex items-center gap-5 mt-2'>
                                            <p>{productData.price}</p>
                                            <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>
                                                {item.size}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Input số lượng */}
                                <input
                                  onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (val <= 0 || e.target.value === '') {
                                          removeFromCart(item._id, item.size); // ← tự xóa khi về 0
                                      } else {
                                          updateCartQty(item._id, item.size, val);
                                      }
                                  }}
                                  className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1'
                                  type="number"
                                  min={0}  // ← đổi min thành 0
                                  value={item.quantity}
                              />

                                {/* Nút xóa */}
                                <img
                                    onClick={() => removeFromCart(item._id, item.size)}
                                    className='w-4 mr-4 sm:w-5 cursor-pointer'
                                    src={assets.bin_icon}
                                    alt="Xóa"
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Tổng tiền ── */}
            <div className='flex justify-end my-20'>
                <div className='w-full sm:w-[450px]'>
                    <div className='w-full'>
                        <div className='text-2xl'>
                            <Title text1={'CART'} text2={'TOTALS'} />
                        </div>

                        <div className='flex flex-col gap-2 mt-2 text-sm'>
                            <div className='flex justify-between'>
                                <p>Subtotal</p>
                                <p>{getCartAmount().toLocaleString('vi-VN')} VNĐ</p>
                            </div>
                            <hr />
                            <div className='flex justify-between'>
                                <p>Shipping Fee</p>
                                <p>{delivery_fee.toLocaleString('vi-VN')} VNĐ</p>
                            </div>
                            <hr />
                            <div className='flex justify-between font-bold text-base'>
                                <p>Total</p>
                                <p>
                                    {(getCartAmount() + delivery_fee).toLocaleString('vi-VN')} VNĐ
                                </p>
                            </div>
                        </div>

                        <div className='w-full text-end'>
                            <button
                                onClick={() => navigate('/place-order')} 
                                className='bg-black text-white text-sm my-8 px-8 py-3'
                            >
                                PROCEED TO CHECKOUT
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Cart