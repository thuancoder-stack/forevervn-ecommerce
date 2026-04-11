import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';
import { useLanguage } from '../context/LanguageContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';

const LatestCollection = () => {
    const { products } = useContext(ShopContext);
    const { language } = useLanguage();
    const [latestProducts, setLatestProducts] = useState([]);

    useEffect(() => {
        setLatestProducts(products.slice(0, 20));
    }, [products]);

    const copy = useMemo(
        () =>
            language === 'vi'
                ? {
                      title1: 'Mới nhất',
                      title2: 'Bộ sưu tập',
                      description:
                          'Khám phá những sản phẩm mới nhất trong bộ sưu tập của chúng tôi. Phong cách hiện đại, chất lượng cao và mức giá hợp lý.',
                  }
                : {
                      title1: 'Latest',
                      title2: 'Collection',
                      description:
                          'Discover the newest arrivals in our collection with a balance of modern style, refined quality and accessible pricing.',
                  },
        [language],
    );

    return (
        <section className='py-12 sm:py-16'>
            <div className="mb-10 text-center sm:mb-12">
                <Title text1={copy.title1} text2={copy.title2} />
                <p className='mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[#8a7f72] sm:text-base'>
                    {copy.description}
                </p>
            </div>

            <div className='relative group px-2 sm:px-4'>
                <Swiper
                    modules={[Navigation]}
                    navigation={{
                        nextEl: '.latest-next',
                        prevEl: '.latest-prev',
                    }}
                    spaceBetween={16}
                    slidesPerView={2}
                    breakpoints={{
                        640: { slidesPerView: 3, spaceBetween: 20 },
                        1024: { slidesPerView: 4, spaceBetween: 24 },
                        1280: { slidesPerView: 5, spaceBetween: 24 }
                    }}
                    className="!pb-6"
                >
                    {latestProducts.map((item, index) => (
                        <SwiperSlide key={index} className="h-auto">
                            <ProductItem
                                id={item._id}
                                image={item.image}
                                name={item.name}
                                price={item.price}
                                oldPrice={item.oldPrice}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Navigation Buttons */}
                <button className="latest-prev absolute -left-2 sm:-left-6 top-[35%] z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-[#1a1a1a] transition-all hover:scale-110 disabled:opacity-0 disabled:cursor-not-allowed">
                    <ChevronLeft strokeWidth={1} className="h-8 w-8 sm:h-10 sm:w-10 opacity-70 hover:opacity-100" />
                </button>
                <button className="latest-next absolute -right-2 sm:-right-6 top-[35%] z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-[#1a1a1a] transition-all hover:scale-110 disabled:opacity-0 disabled:cursor-not-allowed">
                    <ChevronRight strokeWidth={1} className="h-8 w-8 sm:h-10 sm:w-10 opacity-70 hover:opacity-100" />
                </button>
            </div>
        </section>
    );
};

export default LatestCollection;
