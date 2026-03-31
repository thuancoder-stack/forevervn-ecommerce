import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Swiper, SwiperSlide } from 'swiper/react';
// Import thêm EffectCoverflow
import { Autoplay, Pagination, Navigation, EffectCoverflow } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow'; // CSS cho hiệu ứng 3D
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const BannerSlider = () => {
    const { banners, navigate } = useContext(ShopContext);

    if (!banners || banners.length === 0) {
        return null; // Không hiển thị nếu không có banner
    }

    // 1. Sắp xếp banner theo thuộc tính order (từ nhỏ đến lớn)
    const sortedBanners = [...banners].sort(
        (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
    );

    return (
        // Bỏ overflow-hidden ở thẻ bọc ngoài cùng để bóng 3D không bị cắt
        <div className="relative w-full group py-6 lg:py-10"> 
            <Swiper
                effect={'coverflow'} // Bật hiệu ứng 3D
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'} // Để auto để mình tự set width cho từng slide
                loop={true} // Lặp lại vô tận cho mượt
                coverflowEffect={{
                    rotate: 0, // Độ nghiêng (để 0 cho phẳng giống Apple/hiện đại)
                    stretch: 0, // Khoảng cách giữa các slide
                    depth: 150, // Chiều sâu 3D (càng lớn slide hai bên càng lùi sâu)
                    modifier: 2.5, // Tỉ lệ nhân lên của các thông số trên
                    slideShadows: true, // Bóng đổ ở các slide hai bên
                }}
                autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                    bulletClass: 'swiper-pagination-bullet !bg-gray-300 !opacity-100 mt-10',
                    bulletActiveClass: 'swiper-pagination-bullet-active !bg-black !w-8 !rounded-full transition-all duration-300',
                }}
                navigation={{
                    nextEl: '.swiper-button-next-custom',
                    prevEl: '.swiper-button-prev-custom',
                }}
                modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
                className="mySwiper !pb-14" // Thêm padding bottom để chừa chỗ cho pagination
            >
                {sortedBanners.map((item, index) => (
                    // Định dạng lại kích thước cho từng slide, slide không được chiếm 100% màn hình thì mới thấy 3D
                    <SwiperSlide 
                        key={item._id || index} 
                        className="w-[85%] sm:w-[75%] lg:w-[65%] max-w-[1000px]"
                    >
                        <div 
                            className="relative w-full h-[250px] sm:h-[400px] lg:h-[500px] cursor-pointer overflow-hidden rounded-[24px] lg:rounded-[32px] shadow-xl border border-slate-100/50"
                            onClick={() => item.link && navigate(item.link)}
                        >
                            <img 
                                src={item.image} 
                                alt={item.title || 'Banner'} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {item.title && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-12 lg:p-16">
                                    <h2 className="display-font text-white text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-[-0.02em] drop-shadow-lg">
                                        {item.title}
                                    </h2>
                                    {item.link && (
                                        <button className="w-fit bg-white text-black px-6 py-2 sm:px-8 sm:py-3 rounded-full font-bold text-sm sm:text-base hover:bg-black hover:text-white transition-colors duration-300">
                                            Khám phá ngay
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Custom Navigation Buttons (Nút bấm hai bên) */}
            <button className="swiper-button-prev-custom absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-white/40 backdrop-blur-md text-black opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg disabled:opacity-0">
                <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
            </button>
            <button className="swiper-button-next-custom absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-white/40 backdrop-blur-md text-black opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg disabled:opacity-0">
                <ChevronRight size={24} className="sm:w-8 sm:h-8" />
            </button>
        </div>
    );
};

export default BannerSlider;