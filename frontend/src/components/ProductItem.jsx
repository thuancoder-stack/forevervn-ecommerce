import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/locale';

const copyByLanguage = {
    vi: {
        collection: 'BỘ SƯU TẬP FOREVER',
        view: 'XEM CHI TIẾT',
        sale: 'VỪA GIẢM',
    },
    en: {
        collection: 'FOREVER COLLECTION',
        view: 'QUICK VIEW',
        sale: 'MARKDOWN',
    },
};

const ProductItem = ({ id, image, name, price, oldPrice }) => {
    const { language } = useLanguage();
    const t = copyByLanguage[language];

    const imageSrc = Array.isArray(image)
        ? image[0]
        : image || 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image';

    return (
        <Link
            className="group block h-full cursor-pointer"
            to={`/product/${id}`}
        >
            <article className="relative flex h-full flex-col overflow-hidden transition-all duration-700 hover:-translate-y-1">
                {/* Image Section - Editorial Style */}
                <div className="relative overflow-hidden bg-[#f4ebd9]/20" style={{ paddingBottom: '133%' /* 3:4 aspect ratio */ }}>
                    {oldPrice > price && (
                        <div className="absolute left-3 top-3 z-10 bg-black/90 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold text-white tracking-[0.15em]">
                            {t.sale}
                        </div>
                    )}
                    <img
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
                        src={imageSrc}
                        alt={name}
                    />
                    
                    {/* Ultra-premium slide-up bar overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full bg-white/95 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-[#1a1a1a] shadow-[0_-4px_24px_rgba(0,0,0,0.05)] backdrop-blur transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
                        {t.view}
                    </div>
                    {/* Dark gradient for text contrast at bottom if needed */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                </div>

                {/* Text Details Section - Minimalist & Sleek */}
                <div className="flex flex-col pt-4 sm:pt-5 pb-2">
                    <p className="mb-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9b8d7a]">
                        {t.collection}
                    </p>

                    <h3 className="mb-2 line-clamp-2 text-xs sm:text-[14px] font-medium leading-[1.6] text-[#2d2620] transition-colors group-hover:text-black">
                        {name}
                    </h3>

                    <div className="mt-auto flex flex-wrap items-baseline gap-2.5">
                        <p className="text-[14px] sm:text-[15px] font-bold text-[#1a1f25]">
                            {formatMoney(price, language)}
                        </p>
                        {oldPrice > price && (
                            <p className="text-[11px] font-medium text-[#b0a698] line-through">
                                {formatMoney(oldPrice, language)}
                            </p>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
};

export default ProductItem;
