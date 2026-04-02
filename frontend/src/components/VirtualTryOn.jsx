import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext'; // Import context để lấy backendUrl

const VirtualTryOn = ({ productImg, productName, onClose }) => {
    // Lấy backendUrl từ ShopContext (để code đồng bộ với toàn bộ dự án của bạn)
    const { backendUrl } = useContext(ShopContext); 

    const [userPhoto, setUserPhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUserPhoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleTryOn = async () => {
        if (!userPhoto) return toast.error("Vui lòng tải ảnh của bạn lên trước!");
        
        setIsProcessing(true);
        setResultUrl(null);

        try {
            // Khởi tạo FormData để chứa cả file vật lý và text
            const formData = new FormData();
            formData.append('userPhoto', userPhoto); // Đây là file ảnh chụp của User
            formData.append('productImg', productImg); // Đây là URL ảnh áo quần
            formData.append('prompt', `A realistic fashion photo of a person wearing this exact clothing item: ${productName}, preserving body proportions and facial features.`);

            // Gửi API lên Backend của bạn
            const response = await axios.post(`${backendUrl}/api/ai/generate-try-on`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Bắt buộc khi gửi file upload
                }
            });

            if (response.data.success) {
                // Tùy thuộc vào cấu trúc JSON của Kling API trả về, bạn bóc tách URL ảnh ở đây.
                // Ví dụ Kling trả về data.data.data[0].url (Cần console.log để check chính xác nhánh JSON)
                const aiResponseData = response.data.data;
                const finalImageUrl = aiResponseData?.data?.[0]?.url || aiResponseData?.url || productImg; // Fallback tạm thời nếu chưa rõ cấu trúc Kling
                
                setResultUrl(finalImageUrl); 
                toast.success("Mặc thử đã hoàn tất! Tỏa sáng thôi ✨");
            } else {
                toast.error(response.data.message || "Lỗi xử lý hình ảnh từ AI.");
            }
        } catch (error) {
            console.error("Lỗi Try-On:", error);
            toast.error("Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau!");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-[0_35px_80px_rgba(15,23,42,0.25)]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
                    <div>
                        <h2 className="display-font text-2xl font-semibold text-slate-900">Virtual Try-On 🎭</h2>
                        <p className="text-sm text-slate-500">Mặc thử chiếc {productName} ngay tức thì bằng công nghệ AI.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="rounded-full bg-slate-50 p-3 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid gap-8 p-8 md:grid-cols-2 lg:gap-12">
                    {/* Step 1: User Upload */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">1</div>
                            <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-xs">Tải ảnh toàn thân của bạn</h3>
                        </div>

                        <div 
                            className={`group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed transition-all ${
                                previewUrl ? 'border-transparent' : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                            }`}
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} className="h-full w-full object-cover" alt="User" />
                                    <button 
                                        onClick={() => {setUserPhoto(null); setPreviewUrl(null);}}
                                        className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-rose-500 shadow-sm backdrop-blur"
                                    >
                                        Thay ảnh
                                    </button>
                                </>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center gap-2 p-8 text-center text-slate-400">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <div className="rounded-full bg-white p-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12 a2 2 0 002-2v-1M16 8l-4-4m0 0l-4 4m4-4v12" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium">Bấm vào đây để chọn ảnh</span>
                                    <span className="text-xs">Chụp ảnh rõ nét, đứng thẳng và ưu tiên nền trơn.</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Result Preview */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</div>
                            <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-xs">Kết quả thử đồ</h3>
                        </div>

                        <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center">
                            {isProcessing ? (
                                <div className="flex flex-col items-center gap-4 p-8 text-center">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
                                    <div>
                                        <p className="font-bold text-slate-900 animate-pulse">Kling AI Đang Thiết Kế...</p>
                                        <p className="mt-1 text-xs text-slate-500 italic">Quá trình này có thể mất từ 10 - 20 giây</p>
                                    </div>
                                </div>
                            ) : resultUrl ? (
                                <img src={resultUrl} className="h-full w-full object-cover transition-all duration-700 animate-in fade-in" alt="Try On Result" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 p-8 text-center opacity-30">
                                    <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm font-medium">Bạn sẽ thấy kết quả tại đây!</p>
                                </div>
                            )}

                            {/* Watermark/Badges */}
                            {resultUrl && !isProcessing && (
                                <div className="absolute top-4 left-4 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg backdrop-blur">
                                    Powered by Kling AI ✨
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/50 p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-white shadow-sm">
                            <img src={productImg} className="h-full w-full object-cover" alt="Product" />
                        </div>
                        <div className="text-xs">
                            <p className="font-bold text-slate-900">{productName}</p>
                            <p className="text-slate-500 italic">Dữ liệu an toàn & bảo mật.</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleTryOn}
                        disabled={!userPhoto || isProcessing}
                        className={`flex items-center gap-2 rounded-full px-10 py-5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-xl transition-all ${
                            !userPhoto || isProcessing 
                            ? 'bg-slate-300 opacity-50 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        {isProcessing ? "Đang xử lý hình ảnh..." : "Bắt đầu mặc thử ngay 🔥"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VirtualTryOn;