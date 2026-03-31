import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const BestSeller = () => {
    const { products } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);

    useEffect(() => {
        const bestProduct = products.filter((item) => item.bestseller);
        setBestSeller(bestProduct.slice(0, 5));
    }, [products]);

    return (
        <section className='py-10 sm:py-14'>
            <div className='mb-8 text-center sm:mb-10'>
                <Title text1={'BEST'} text2={'SELLERS'} />
                <p className='mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base'>
                    Những sản phẩm được yêu thích nhất, nổi bật về phong cách và chất lượng.
                </p>
            </div>

            <div className='grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-5'>
                {bestSeller.map((item, index) => (
                    <ProductItem
                        key={index}
                        id={item._id}
                        name={item.name}
                        image={item.image}
                        price={item.price}
                        oldPrice={item.oldPrice}
                    />
                ))}
            </div>
        </section>
    )
}

export default BestSeller
