import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Star, User, Camera, Send, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const ReviewSystem = ({ productId }) => {
    const { getReviews, addReview, token, backendUrl } = useContext(ShopContext);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchReviews = async () => {
        setFetching(true);
        const data = await getReviews(productId);
        setReviews(data);
        setFetching(false);
    };

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 5) {
            toast.error("Bạn chỉ có thể tải lên tối đa 5 ảnh.");
            return;
        }
        setImages([...images, ...files]);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const onSubmitReview = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast.error("Vui lòng nhập nhận xét.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('rating', rating);
            formData.append('comment', comment);
            formData.append('userName', 'Khách hàng'); // In a real app, get from user profile

            images.forEach((img) => {
                formData.append('images', img);
            });

            const res = await addReview(formData);
            if (res.success) {
                toast.success("Cảm ơn bạn đã đánh giá!");
                setComment('');
                setImages([]);
                setRating(5);
                fetchReviews();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Gửi đánh giá thất bại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-20 border-t border-slate-100 pt-16">
            <div className="flex flex-col lg:flex-row gap-16">
                {/* Review Form */}
                <div className="lg:w-1/3 space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Đánh giá sản phẩm</h2>
                        <p className="text-slate-500 mt-2 text-lg">Hệ thống luôn lắng nghe ý kiến từ bạn để cải thiện chất lượng dịch vụ.</p>
                    </div>

                    <form onSubmit={onSubmitReview} className="space-y-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                        <div>
                            <p className="font-bold text-slate-800 mb-4 text-base">Chọn số sao</p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button 
                                        key={num} 
                                        type="button" 
                                        onClick={() => setRating(num)}
                                        className="transition-transform active:scale-95"
                                    >
                                        <Star 
                                            size={32} 
                                            fill={num <= rating ? "#fbbf24" : "none"} 
                                            stroke={num <= rating ? "#fbbf24" : "#cbd5e1"} 
                                            className="drop-shadow-sm"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="font-bold text-slate-800 mb-4 text-base">Nhận xét của bạn</p>
                            <textarea 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-white border border-slate-100 rounded-2xl p-4 min-h-[120px] outline-none focus:ring-4 focus:ring-black/5 transition-all text-sm leading-relaxed"
                                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                            />
                        </div>

                        <div>
                            <p className="font-bold text-slate-800 mb-4 text-base">Hình ảnh thực tế (Tối đa 5)</p>
                            <div className="flex flex-wrap gap-3">
                                {images.map((img, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                                        <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-all text-slate-400">
                                        <Camera size={20} />
                                        <span className="text-[10px] font-bold mt-1">Thêm ảnh</span>
                                        <input type="file" multiple accept="image/*" onChange={handleImageChange} hidden />
                                    </label>
                                )}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            {loading ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                    </form>
                </div>

                {/* Reviews List */}
                <div className="flex-1 space-y-12">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-slate-900">
                            Tất cả đánh giá 
                            <span className="ml-3 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
                                {reviews.length}
                            </span>
                        </h3>
                    </div>

                    {fetching ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-slate-300" size={40} />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-20 text-center">
                            <div className="w-20 h-20 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Star size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-medium text-lg italic">"Hãy là người đầu tiên đánh giá sản phẩm này!"</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {reviews.map((item, index) => (
                                <div key={index} className="group relative">
                                    <div className="flex gap-6">
                                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-50">
                                            <User size={28} className="text-slate-400" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                                <h4 className="font-bold text-slate-900 text-lg">{item.userName}</h4>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            size={14} 
                                                            fill={i < item.rating ? "#fbbf24" : "none"} 
                                                            stroke={i < item.rating ? "#fbbf24" : "#d1d5db"} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium mb-4">{new Date(item.date).toLocaleDateString()}</p>
                                            <p className="text-slate-700 leading-relaxed text-lg mb-6">{item.comment}</p>
                                            
                                            {item.images && item.images.length > 0 && (
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                                    {item.images.map((img, i) => (
                                                        <img 
                                                            key={i} 
                                                            src={img} 
                                                            className="w-24 h-32 sm:w-32 sm:h-44 object-cover rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-105 cursor-zoom-in" 
                                                            alt="" 
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-5 left-20 right-0 h-px bg-slate-100 group-last:hidden" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewSystem;
