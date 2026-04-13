import React, { useMemo } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Marquee = () => {
    const { language } = useLanguage();

    const items = useMemo(() => {
        if (language === 'vi') {
            return [
                "FREESHIP TỪ 500K",
                "GIẢM 5% KHÁCH MỚI",
                "GIAO HÀNG 2H",
                "ĐỔI TRẢ 7 NGÀY"
            ];
        }
        return [
            "FREE SHIP 500K",
            "5% OFF FIRST ORDER",
            "2H DELIVERY",
            "7-DAY RETURNS"
        ];
    }, [language]);

    // Lặp lại nhiều lần để đủ dài cho vùng hiển thị
    const renderItems = () => {
        return items.map((text, i) => (
            <div key={`item-${i}`} className="marquee-item flex items-center shrink-0 uppercase">
                <span>{text}</span>
                <Sparkles className="marquee-separator w-5 h-5 mx-8 text-slate-300" />
            </div>
        ));
    };

    return (
        <div 
            className="w-full bg-[#0b0f19] text-white py-3.5 mt-10 rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.15)] select-none flex overflow-hidden border border-white/10" 
            dir="ltr"
        >
            <div className="marquee-content flex items-center shrink-0">
                {renderItems()}
            </div>
            <div className="marquee-content flex items-center shrink-0" aria-hidden="true">
                {renderItems()}
            </div>
            <div className="marquee-content flex items-center shrink-0" aria-hidden="true">
                {renderItems()}
            </div>
        </div>
    );
};

export default Marquee;
