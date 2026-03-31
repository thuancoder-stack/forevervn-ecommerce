import React from 'react';
import { Award, Video, ExternalLink } from 'lucide-react';

const VideoReview = ({ videoUrl }) => {
    if (!videoUrl) return null;

    // Helper to extract TikTok Video ID
    const getTikTokId = (url) => {
        const regex = /\/video\/(\d+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const tiktokId = getTikTokId(videoUrl);
    const isTikTok = videoUrl.includes('tiktok.com');

    return (
        <div className="mt-16 bg-gradient-to-br from-slate-900 via-slate-800 to-black p-8 sm:p-12 lg:p-16 rounded-[48px] overflow-hidden relative group">
            <div className="flex flex-col lg:flex-row items-center gap-12 sm:gap-16">
                <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                        <Award size={20} className="text-amber-400" />
                        <span className="text-white text-sm font-bold uppercase tracking-wider">Top Review Spotlight</span>
                    </div>
                    <h2 className="text-white text-3xl sm:text-5xl lg:text-6xl font-black leading-tight">
                        Kiểm chứng từ <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Chuyên gia</span>
                    </h2>
                    <p className="text-slate-300 text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-2xl">
                        "Hãy xem video đánh giá chi tiết từ các chuyên gia thời trang để có cái nhìn chân thực nhất về chất lượng và kiểu dáng sản phẩm này."
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-fit mt-4">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                            <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center border border-pink-400 shadow-lg shadow-pink-500/20">
                                <Video size={24} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-bold text-base leading-none">{isTikTok ? 'TikTok Verified' : 'HD Quality'}</p>
                                <p className="text-slate-400 text-sm mt-1">Sắc nét từng chi tiết</p>
                            </div>
                        </div>
                        
                        {isTikTok && (
                            <a 
                                href={videoUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-3xl border border-white/10 transition-all font-bold"
                            >
                                <ExternalLink size={20} />
                                Xem trên TikTok
                            </a>
                        )}
                    </div>
                </div>

                <div className="lg:w-1/2 flex justify-center w-full relative">
                    <div className="relative w-full aspect-[9/16] max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl shadow-black ring-8 ring-white/10 bg-black">
                        {isTikTok && tiktokId ? (
                            <iframe
                                src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                                className="w-full h-full border-0"
                                allow="encrypted-media; picture-in-picture"
                                allowFullScreen
                                title="TikTok Review"
                            />
                        ) : (
                            <video 
                                src={videoUrl} 
                                controls 
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                </div>
            </div>
            
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent scale-150" />
            </div>
        </div>
    );
};

export default VideoReview;
