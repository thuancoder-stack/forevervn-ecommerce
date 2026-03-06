// 1. Import hooks và các component cần dùng
import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const BestSeller = () => {

    // 2. Lấy danh sách sản phẩm từ kho dữ liệu chung
    const { products } = useContext(ShopContext);

    // 3. State chứa 5 sản phẩm bestseller
    const [bestSeller, setBestSeller] = useState([]);

    // 4. Khi products thay đổi → lọc và lấy 5 SP bestseller
    useEffect(() => {
        const bestProduct = products.filter((item) => item.bestseller); // lọc SP có bestseller: true
        setBestSeller(bestProduct.slice(0, 5));                          // chỉ lấy 5 cái đầu
    }, [products]); // dependency: chạy lại khi products thay đổi

    return (
        <div className='my-10'>

            {/* 5. Tiêu đề + mô tả */}
            <div className='text-center text-3xl py-8'>
                <Title text1={'BEST'} text2={'SELLERS'} />
                <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>
                    Những sản phẩm được yêu thích nhất...
                </p>
            </div>

            {/* 6. Grid render 5 sản phẩm */}
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {bestSeller.map((item, index) => (
                    <ProductItem
                        key={index}       // React cần key để phân biệt các phần tử
                        id={item._id}     // dùng để tạo link /product/:id
                        name={item.name}
                        image={item.image}
                        price={item.price}
                    />
                ))}
            </div>

        </div>
    )
}

export default BestSeller
