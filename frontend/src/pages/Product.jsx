import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import { toast } from 'react-toastify';
const Product = () => {
    const { productId } = useParams();
    const { products, currency, addToCart } = useContext(ShopContext);

    const [productData, setProductData] = useState(false);
    const [image, setImage] = useState('');
    const [size, setSize] = useState('');

    const fetchProductData = async () => {
        products.map((item) => {
            if (item._id === productId) {
                setProductData(item);
                setImage(item.image[0]);
                console.log(item);
                return null;
            }
        });
    };

    useEffect(() => {
        fetchProductData();
        window.scrollTo(0, 0);
        setSize('');
    }, [productId, products]);

    return productData ? (
        <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
            {/* ── Phần trên: Ảnh + Thông tin ── */}
            <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
                {/* Cột ảnh thumbnail */}
                <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
                    <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
                        {productData.image.map((item, index) => (
                            <img
                                onClick={() => setImage(item)}
                                src={item}
                                key={index}
                                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                                alt=""
                            />
                        ))}
                    </div>

                    {/* Ảnh chính */}
                    <div className="w-full sm:w-[80%]">
                        <img
                            className="w-full h-auto"
                            src={image}
                            alt={productData.name}
                        />
                    </div>
                </div>

                {/* Cột thông tin sản phẩm */}
                <div className="flex-1">
                    <h1 className="font-medium text-2xl mt-2">
                        {productData.name}
                    </h1>

                    {/* Rating ← SỬA w-3.5 */}
                    <div className="flex items-center gap-1 mt-2">
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img
                            src={assets.star_dull_icon}
                            alt=""
                            className="w-3.5"
                        />
                        <p className="pl-2">(122)</p>
                    </div>

                    {/* Giá */}
                    <p className="mt-5 text-3xl font-medium">
                        {currency}
                        {productData.price}
                    </p>

                    {/* Mô tả */}
                    <p className="mt-5 text-gray-500 md:w-4/5">
                        {productData.description}
                    </p>

                    {/* Chọn size */}
                    <div className="flex flex-col gap-4 my-8">
                        <p>Select Size</p>
                        <div className="flex gap-2">
                            {productData.sizes.map((item, index) => (
                                <button
                                    onClick={() => setSize(item)}
                                    className={`border py-2 px-4 bg-gray-100 
                                        ${item === size ? 'border-orange-500 bg-orange-100' : ''}`}
                                    key={index}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nút Add to Cart */}
                    <button
                        onClick={() => {
                            if (!size) return toast.error('Vui lòng chọn size!');
                            addToCart(productData._id, size);
                            toast.success('Đã thêm vào giỏ hàng!');
                        }}
                        className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700"
                    >
                        ADD TO CART
                    </button>

                    <hr className="mt-8 sm:w-4/5" />

                    {/* Thông tin giao hàng */}
                    <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
                        <p>100% Original product.</p>
                        <p>Cash on delivery is available on this product.</p>
                        <p>Easy return and exchange policy within 7 days.</p>
                    </div>
                </div>
            </div>

            {/* ── Phần dưới: Description & Reviews ── */}
            <div className="mt-20">
                <div className="flex">
                    <b className="border px-5 py-3 text-sm">Description</b>
                    <p className="border px-5 py-3 text-sm">Reviews (122)</p>
                </div>
                <div className="flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500">
                    <p>
                        An e-commerce website is an online platform that
                        facilitates the buying and selling of products or
                        services over the internet.
                    </p>
                    <p>
                        E-commerce websites typically display products or
                        services along with detailed descriptions, images,
                        prices, and any available variations (such as sizes or
                        colors).
                    </p>
                </div>
                {/* Related Products */}
                <RelatedProducts
                    category={productData.category}
                    subCategory={productData.subCategory}
                />
            </div>
        </div>
    ) : (
        <div className="opacity-0"></div>
    );
};

export default Product;
