import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const RelatedProducts = ({ category, subCategory }) => {
    const { products } = useContext(ShopContext);
    const [related, setRelated] = useState([]);

    useEffect(() => {
        if (products.length > 0) {
            let productsCopy = products.slice();

            productsCopy = productsCopy.filter((item) => category === item.category);
            productsCopy = productsCopy.filter((item) => subCategory === item.subCategory);

            setRelated(productsCopy.slice(0, 5));
        }
    }, [category, products, subCategory]);

    return (
        <section className='py-10 sm:py-14'>
            <div className='mb-8 text-center sm:mb-10'>
                <Title text1={'RELATED'} text2={'PRODUCTS'} />
            </div>

            <div className='grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-5'>
                {related.map((item, index) => (
                    <ProductItem
                        key={index}
                        id={item._id}
                        name={item.name}
                        price={item.price}
                        oldPrice={item.oldPrice}
                        image={item.image}
                    />
                ))}
            </div>
        </section>
    )
}

export default RelatedProducts
