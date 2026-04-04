import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';
import { useLanguage } from '../context/LanguageContext';

const BestSeller = () => {
    const { products } = useContext(ShopContext);
    const { language } = useLanguage();
    const [bestSeller, setBestSeller] = useState([]);

    useEffect(() => {
        const bestProduct = products.filter((item) => item.bestseller);
        setBestSeller(bestProduct.slice(0, 5));
    }, [products]);

    const copy = useMemo(
        () =>
            language === 'vi'
                ? {
                      title1: 'BÁN CHẠY',
                      title2: 'NHẤT',
                      description:
                          'Những sản phẩm được yêu thích nhất, nổi bật về phong cách và chất lượng.',
                  }
                : {
                      title1: 'BEST',
                      title2: 'SELLERS',
                      description:
                          'The most loved pieces, selected for standout style and dependable quality.',
                  },
        [language],
    );

    return (
        <section className='py-10 sm:py-14'>
            <div className='mb-8 text-center sm:mb-10'>
                <Title text1={copy.title1} text2={copy.title2} />
                <p className='mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base'>
                    {copy.description}
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
    );
};

export default BestSeller;
