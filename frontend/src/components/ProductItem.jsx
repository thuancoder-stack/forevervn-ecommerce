import { Link } from 'react-router-dom';

function formatVndPrice(price) {
    const n = Number(price);
    if (!Number.isFinite(n)) return String(price ?? '');
    return `${n.toLocaleString('vi-VN')} VNĐ`;
}

const ProductItem = ({ id, image, name, price, oldPrice }) => {
    const imageSrc = Array.isArray(image)
        ? image[0]
        : image || 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image';

    return (
        <Link
            className="group block cursor-pointer text-slate-700"
            to={`/product/${id}`}
        >
            <article className="section-shell h-full overflow-hidden rounded-[24px] border-white/70 bg-white/90">
                <div className="relative overflow-hidden bg-slate-50">
                    {oldPrice > price && (
                        <div className="absolute top-3 left-3 z-10 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg">
                            SALE
                        </div>
                    )}
                    <img
                        className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        src={imageSrc}
                        alt={name}
                    />
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
                        Forever Collection
                    </p>

                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold leading-6 text-slate-800 sm:text-base">
                            {name}
                        </p>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition duration-300 group-hover:bg-slate-900 group-hover:text-white">
                            View
                        </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2">
                        <p className="text-sm font-bold text-slate-900 sm:text-base">
                            {formatVndPrice(price)}
                        </p>
                        {oldPrice > price && (
                            <p className="text-xs text-slate-400 line-through">
                                {formatVndPrice(oldPrice)}
                            </p>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
};

export default ProductItem;
