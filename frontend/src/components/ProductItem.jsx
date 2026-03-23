import { Link } from 'react-router-dom';

function formatVndPrice(price) {
    const n = Number(price);
    if (!Number.isFinite(n)) return String(price ?? '');
    return `${n.toLocaleString('vi-VN')} VNĐ`;
}

const ProductItem = ({ id, image, name, price }) => {
    // CHANGE: lay anh an toan cho ca image array va image string
    const imageSrc = Array.isArray(image)
        ? image[0]
        : image || 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image';

    return (
        <Link className="text-gray-700 cursor-pointer" to={`/product/${id}`}>
            <div className="overflow-hidden">
                <img
                    className="hover:scale-110 transition ease-in-out w-full"
                    src={imageSrc}
                    alt={name}
                />
            </div>
            <p className="pt-3 pb-1 text-sm">{name}</p>
            {/* CHANGE: format gia thong nhat */}
            <p className="text-sm font-medium">{formatVndPrice(price)}</p>
        </Link>
    );
};

export default ProductItem;
