import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Star } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import ReviewSystem from '../components/ReviewSystem';
import VideoReview from '../components/VideoReview';
import VirtualTryOn from '../components/VirtualTryOn';

function formatVndPrice(price) {
    const n = Number(price);
    if (!Number.isFinite(n)) return String(price ?? '');
    return `${n.toLocaleString('vi-VN')} VNĐ`;
}

function ensureImageArray(imageValue) {
    if (Array.isArray(imageValue) && imageValue.length > 0) return imageValue;
    if (typeof imageValue === 'string' && imageValue.trim()) return [imageValue.trim()];
    return ['https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image'];
}

function ensureSizeArray(sizeValue) {
    if (Array.isArray(sizeValue) && sizeValue.length > 0) return sizeValue;
    return ['Free'];
}

const Product = () => {
    const { productId } = useParams();
    const { products, addToCart, getProductStock, logBehavior } = useContext(ShopContext);
    const [stock, setStock] = useState(0);

    const [productData, setProductData] = useState(false);
    const [image, setImage] = useState('');
    const [size, setSize] = useState('');
    const [color, setColor] = useState('');
    const [showVTO, setShowVTO] = useState(false);
    const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });

    const fetchProductData = async () => {
        const item = products.find(
            (p) => String(p._id ?? p.id) === String(productId),
        );

        if (!item) {
            setProductData(false);
            setImage('');
            setSize('');
            return;
        }

        const normalizedImages = ensureImageArray(item.image);
        const normalizedSizes = ensureSizeArray(item.sizes);
        const normalizedColors = Array.isArray(item.colors) ? item.colors : [];
        
        const normalizedProduct = {
            ...item,
            image: normalizedImages,
            sizes: normalizedSizes,
            colors: normalizedColors,
        };
        
        setProductData(normalizedProduct);
        setImage(normalizedImages[0]);
        setSize(normalizedSizes[0]);
        setColor(normalizedColors[0] || '');

        // TikTok Thumbnail Extraction
        if (item.videoUrl && item.videoUrl.includes('tiktok.com') && normalizedImages[0].includes('dummyimage.com')) {
            axios.get(`https://www.tiktok.com/oembed?url=${item.videoUrl}`)
                .then(res => {
                    if(res.data && res.data.thumbnail_url) {
                        setImage(res.data.thumbnail_url);
                        setProductData(prev => ({...prev, image: [res.data.thumbnail_url]}));
                    }
                })
                .catch(err => console.log('Lỗi extract frame tiktok', err));
        }
    };

    useEffect(() => {
        fetchProductData();
        if (productId) {
            getProductStock(productId).then(setStock);
            
            // Save to Recently Viewed
            try {
                let rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                rv = rv.filter(id => id !== productId); // Remove if exists
                rv.unshift(productId); // Add to beginning
                if (rv.length > 6) rv.pop(); // Keep max 6
                localStorage.setItem('recentlyViewed', JSON.stringify(rv));
            } catch (err) {}
            
            // Analytics: Ghi nhận lượt xem sản phẩm
            logBehavior('VIEW_PRODUCT', productId, { category: productData?.category });
        }
        window.scrollTo(0, 0);
    }, [productId, products, getProductStock, logBehavior, productData?.category]);

    // SEO Optimization
    useEffect(() => {
        if (productData) {
            document.title = `${productData.name} | ForeverVN - High-End Fashion`;
            
            // Update Meta Description
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = "description";
                document.getElementsByTagName('head')[0].appendChild(metaDesc);
            }
            metaDesc.content = `Mua sắm ${productData.name} chính hãng với giá tốt nhất. Trải nghiệm thử đồ ảo và chất lượng hàng đầu.`;
        }
    }, [productData]);

    // Image Magnifier State
    const [magnifierStyle, setMagnifierStyle] = useState({ display: 'none', top: 0, left: 0, backgroundPosition: '0% 0%' });

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left - window.pageXOffset) / width) * 100;
        const y = ((e.pageY - top - window.pageYOffset) / height) * 100;
        setMagnifierStyle({
            display: 'block',
            top: e.pageY - top - window.pageYOffset - 75, // 75 is half of magnifier size
            left: e.pageX - left - window.pageXOffset - 75,
            backgroundPosition: `${x}% ${y}%`,
            backgroundImage: `url(${image})`
        });
    };

    const handleMouseLeave = () => setMagnifierStyle({ display: 'none' });

    return productData ? (
        <div className="space-y-8 py-4 sm:space-y-10 sm:py-6">
            <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
                    <div className="grid gap-4 lg:grid-cols-[110px_minmax(0,1fr)]">
                        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto">
                            {productData.image.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => setImage(item)}
                                    className={`overflow-hidden rounded-[22px] border bg-white ${
                                        image === item
                                            ? 'border-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.12)]'
                                            : 'border-[var(--border)]'
                                    }`}
                                    type="button"
                                >
                                    <img
                                        src={item}
                                        className="h-24 w-20 object-cover lg:h-28 lg:w-full"
                                        alt={productData.name}
                                    />
                                </button>
                            ))}
                        </div>

                        <div 
                            className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-3 shadow-[0_22px_45px_rgba(15,23,42,0.1)] cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <img
                                className="aspect-[4/5] w-full rounded-[22px] object-cover"
                                src={image}
                                alt={productData.name}
                            />
                            {/* Magnifier Glass */}
                            <div 
                                className="pointer-events-none absolute h-40 w-40 rounded-full border-4 border-white shadow-xl bg-no-repeat bg-[length:300%_300%]"
                                style={{
                                    ...magnifierStyle,
                                    zIndex: 10
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Product Details
                            </p>
                            <h1 className="display-font mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">
                                {productData.name}
                            </h1>
                            <div className="mt-2 flex items-center gap-3">
                                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    <div className={`h-2 w-2 rounded-full ${stock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                    {stock > 0 ? `Còn hàng (${stock})` : 'Hết hàng'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={16} 
                                        fill={i < Math.round(reviewStats.averageRating && reviewStats.averageRating > 0 ? reviewStats.averageRating : 5) ? "#fbbf24" : "none"} 
                                        stroke={i < Math.round(reviewStats.averageRating && reviewStats.averageRating > 0 ? reviewStats.averageRating : 5) ? "#fbbf24" : "#cbd5e1"} 
                                    />
                                ))}
                            </div>
                            <span className="pl-1 font-bold">({reviewStats.totalReviews}) <span className="text-xs text-slate-400 font-normal">Đánh giá</span></span>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="text-3xl font-semibold text-slate-900">
                                {formatVndPrice(productData.price)}
                            </p>
                            {productData.oldPrice > productData.price && (
                                <>
                                    <p className="text-lg text-slate-400 line-through">
                                        {formatVndPrice(productData.oldPrice)}
                                    </p>
                                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
                                        -{Math.round(((productData.oldPrice - productData.price) / productData.oldPrice) * 100)}%
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                            {productData.description}
                        </p>

                        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Select Size
                            </p>

                            <div className="mt-4 flex flex-wrap gap-3">
                                {productData.sizes.map((item, index) => (
                                    <button
                                        onClick={() => setSize(item)}
                                        className={`rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                                            item === size
                                                ? 'bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                : 'border border-[var(--border)] bg-slate-50 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                                        }`}
                                        key={index}
                                        type="button"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {productData.colors && productData.colors.length > 0 && (
                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Select Color
                                </p>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    {productData.colors.map((item, index) => (
                                        <button
                                            onClick={() => setColor(item)}
                                            className={`group relative flex items-center gap-3 rounded-full border px-5 py-3 text-sm font-semibold transition-all ${
                                                item === color
                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                    : 'border-[var(--border)] bg-slate-50 text-slate-600 hover:border-slate-900'
                                            }`}
                                            key={index}
                                            type="button"
                                        >
                                            <div 
                                                className="h-4 w-4 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: item.toLowerCase() }}
                                            />
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <button
                                onClick={() => {
                                    if (!size) return toast.error('Vui long chon size!');
                                    if (productData.colors?.length > 0 && !color) return toast.error('Vui long chon mau!');
                                    
                                    addToCart(productData._id ?? productData.id, size, color);
                                    toast.success('Da them vao gio hang!');
                                }}
                                className="rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800"
                                type="button"
                            >
                                Add To Cart
                            </button>

                            <button 
                                onClick={() => setShowVTO(true)}
                                className="group relative overflow-hidden rounded-full border-2 border-indigo-600 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white sm:px-6"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Mặc thử ảo ✨
                                </span>
                            </button>

                            <div className="rounded-full border border-[var(--border)] bg-white px-5 py-4 text-sm text-slate-500">
                                100% original product
                            </div>
                        </div>

                        {/* Virtual Try-On Modal */}
                        {showVTO && (
                            <VirtualTryOn 
                                productImg={image} 
                                productName={productData.name} 
                                onClose={() => setShowVTO(false)} 
                            />
                        )}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 text-sm text-slate-500">
                                Cash on delivery is available on this product.
                            </div>
                            <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 text-sm text-slate-500">
                                Easy return and exchange policy within 7 days.
                            </div>
                            <div className="rounded-[22px] border border-[var(--border)] bg-white p-4 text-sm text-slate-500">
                                Carefully curated quality for everyday wear.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <VideoReview videoUrl={productData.videoUrl} />

            <section className="section-shell overflow-hidden">
                <div className="flex flex-wrap border-b border-[var(--border)] bg-white/70">
                    <b className="border-r border-[var(--border)] px-8 py-5 text-base font-bold text-slate-900">
                        Mô tả sản phẩm
                    </b>
                </div>

                <div className="px-8 py-10 text-lg leading-loose text-slate-600 sm:px-12 bg-white">
                    <div dangerouslySetInnerHTML={{ __html: productData.description.replace(/\n/g, '<br/>') }} />
                </div>
            </section>

            <ReviewSystem productId={productData._id || productData.id} onReviewsLoaded={setReviewStats} />

            <RecentlyViewedProducts currentId={productData._id || productData.id} />

            <RelatedProducts
                category={productData.category}
                subCategory={productData.subCategory}
            />
        </div>
    ) : (
        <div className="py-20 text-center text-slate-400">Loading product...</div>
    );
};

const RecentlyViewedProducts = ({ currentId }) => {
    const { products } = useContext(ShopContext);
    const [recentProducts, setRecentProducts] = useState([]);

    useEffect(() => {
        try {
            const rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            // Filter out current product and map to product objects
            const list = rv
                .filter(id => id !== currentId)
                .map(id => products.find(p => String(p._id || p.id) === String(id)))
                .filter(Boolean); // remove undefined
            
            setRecentProducts(list.slice(0, 5));
        } catch (err) { }
    }, [currentId, products]);

    if (recentProducts.length === 0) return null;

    return (
        <div className="mt-20">
            <div className="text-center text-3xl py-2">
                <div className="inline-flex gap-2 items-center mb-3">
                    <p className="text-gray-500 font-medium">RECENTLY</p>
                    <p className="text-gray-700 font-medium">VIEWED</p>
                    <p className="w-8 sm:w-12 h-[1px] sm:h-[2px] bg-gray-700"></p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 mt-6">
                {recentProducts.map((item, index) => (
                    <div key={index} className="text-gray-700 cursor-pointer group flex flex-col gap-2 relative">
                        <a href={`/product/${item._id || item.id}`} className="block overflow-hidden relative rounded-xl border border-[var(--border)] bg-[var(--surface-color)] p-2 transition-all group-hover:border-pink-200 shadow-sm hover:shadow-md">
                            <div className="overflow-hidden rounded-lg bg-pink-50/50">
                                <img
                                    className="hover:scale-105 transition-transform duration-500 ease-in-out w-full h-[180px] sm:h-[220px] object-cover"
                                    src={item.image?.[0] || 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image'}
                                    alt={item.name}
                                />
                            </div>
                        </a>
                        <p className="pt-3 pb-1 text-sm font-bold truncate px-1 group-hover:text-pink-600 transition-colors uppercase tracking-wide">{item.name}</p>
                        <p className="text-sm font-mono text-gray-500 font-medium px-1">
                            {Number(item.price).toLocaleString('vi-VN')} VNĐ
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Product;
