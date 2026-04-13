import React, { useMemo } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Marquee = () => {
    const { language } = useLanguage();

    const items = useMemo(() => {
        if (language === 'vi') {
            return [
                "FREESHIP ĐƠN TỪ 500KVNĐ",
                "MÃ GIẢM GIÁ 5% CHO KHÁCH HÀNG MỚI",
                "GIAO HÀNG HỎA TỐC 2H NỘI THÀNH",
                "ĐỔI TRẢ DỄ DÀNG TRONG 7 NGÀY"
            ];
        }
        return [
            "FREE SHIPPING ON ORDERS OVER 500K",
            "5% OFF FOR FIRST TIME CUSTOMERS",
            "2H EXPRESS DELIVERY IN METRO AREAS",
            "EASY 7-DAY RETURN POLICY"
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
            className="w-[100vw] relative left-1/2 -translate-x-1/2 bg-[#0b0f19] text-white py-4 shadow-[0_12px_24px_rgba(0,0,0,0.15)] select-none flex overflow-hidden border-y border-white/10" 
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
