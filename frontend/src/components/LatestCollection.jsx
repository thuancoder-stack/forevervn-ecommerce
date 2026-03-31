import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const LatestCollection = () => {
    const { products } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);

    useEffect(() => {
        setLatestProducts(products.slice(0, 20));
    }, [products]);

    return (
        <section className='py-10 sm:py-14'>
            <div className="mb-8 text-center sm:mb-10">
                <Title text1="Latest" text2="Collection" />
            </div>

            <p className='mx-auto mb-8 max-w-2xl text-center text-sm leading-7 text-slate-500 sm:mb-10 sm:text-base'>
                Khám phá những sản phẩm mới nhất trong bộ sưu tập của chúng tôi.
                Phong cách hiện đại, chất lượng cao, giá cả hợp lý.
            </p>

            <div className='grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                {latestProducts.map((item, index) => (
                    <ProductItem
                        key={index}
                        id={item._id}
                        image={item.image}
                        name={item.name}
                        price={item.price}
                        oldPrice={item.oldPrice}
                    />
                ))}
            </div>
        </section>
    )
}

export default LatestCollection
