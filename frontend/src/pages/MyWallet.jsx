import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Title from '../components/Title';
import { useLanguage } from '../context/LanguageContext';

const copy = {
    vi: {
        title1: 'VÍ',
        title2: 'CỦA TÔI',
        balance: 'Số dư ví khả dụng',
        topup: 'Nạp tiền',
        topupAmount: 'Nhập số tiền cần nạp (VND)',
        history: 'Lịch sử giao dịch',
        emptyHistory: 'Chưa có giao dịch nào',
        pending: 'Đang tải...',
        minAmount: 'Tối thiểu 10,000đ',
        processing: 'Đang tạo mã QR...'
    },
    en: {
        title1: 'MY',
        title2: 'WALLET',
        balance: 'Available Balance',
        topup: 'Top Up',
        topupAmount: 'Enter amount to top up (VND)',
        history: 'Transaction History',
        emptyHistory: 'No transactions yet',
        pending: 'Loading...',
        minAmount: 'Minimum 10,000 VND',
        processing: 'Generating QR...'
    }
};

const MyWallet = () => {
    const { backendUrl, token, navigate } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copy[language];

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topupAmount, setTopupAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchWalletInfo = async () => {
        if (!token) return;
        try {
            const { data } = await axios.post(`${backendUrl}/api/wallet/info`, {}, { headers: { token } });
            if (data.success) {
                setBalance(data.balance);
                setTransactions(data.transactions);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchWalletInfo();

        const intervalId = setInterval(fetchWalletInfo, 10000);
        return () => clearInterval(intervalId);
    }, [token, navigate, backendUrl]);

    const handleTopUp = async () => {
        if (!topupAmount || Number(topupAmount) < 10000) {
            toast.error(t.minAmount);
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await axios.post(
                `${backendUrl}/api/wallet/topup`,
                { amount: Number(topupAmount) },
                { headers: { token } }
            );

            if (data.success && data.checkoutUrl) {
                const { checkoutUrl, checkoutFields } = data;
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = checkoutUrl;
                
                Object.entries(checkoutFields).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    form.appendChild(input);
                });
                
                document.body.appendChild(form);
                form.submit();
            } else {
                toast.error(data.message || 'Lỗi tạo giao dịch nạp tiền');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-20 text-slate-500">{t.pending}</div>;

    return (
        <div className="max-w-4xl mx-auto border-t pt-14 mb-[100px] px-4 font-inter">
            <div className="text-2xl mb-8">
                <Title text1={t.title1} text2={t.title2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Panel Số dư */}
                <div 
                    className="rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between h-[280px]"
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {/* SVG Mạch điện nền (Background Pattern) */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                    <path d="M10 10 L30 10 L30 30 M70 10 L50 10 L50 40 L30 40 M90 50 L70 50 L70 80 L90 80 M10 90 L30 90 L30 70 L10 70" stroke="#fff" strokeWidth="1" fill="none" />
                                    <circle cx="10" cy="10" r="2" fill="#fff" />
                                    <circle cx="30" cy="30" r="2" fill="#fff" />
                                    <circle cx="70" cy="10" r="2" fill="#fff" />
                                    <circle cx="30" cy="40" r="2" fill="#fff" />
                                    <circle cx="90" cy="50" r="2" fill="#fff" />
                                    <circle cx="90" cy="80" r="2" fill="#fff" />
                                    <circle cx="10" cy="90" r="2" fill="#fff" />
                                </pattern>
                                <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </radialGradient>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#circuit)" />
                            <circle cx="75%" cy="40%" r="150" fill="url(#glow)" />
                        </svg>
                    </div>

                    {/* Chip Icon */}
                    <div className="absolute right-8 top-16 w-16 h-12 rounded-lg border border-slate-600 shadow-inner flex flex-col justify-evenly opacity-80" style={{ background: 'linear-gradient(to right, #cbd5e1, #94a3b8, #cbd5e1)'}}>
                        <div className="w-full h-[1px] bg-slate-600"></div>
                        <div className="w-full h-[1px] bg-slate-600"></div>
                        <div className="w-full h-[1px] bg-slate-600 mb-0"></div>
                    </div>
                    
                    {/* Phần nội dung trên (Số dư) */}
                    <div className="p-8 relative z-10 flex-1">
                        <p className="font-semibold text-xs mb-1 uppercase tracking-wider" style={{ color: '#d4af37' }}>{t.balance}</p>
                        <h2 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#facc15', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance)}
                        </h2>
                        
                        <div className="flex gap-2 mt-4 absolute" style={{ bottom: '20px' }}>
                            {[50000, 100000, 200000, 500000].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => setTopupAmount(String(amt))}
                                    className="bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-colors border border-white/20 shadow-sm"
                                >
                                    +{new Intl.NumberFormat('vi-VN').format(amt)}đ
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phần viền kim loại (Metallic Footer) */}
                    <div 
                        className="relative z-10 px-6 py-4 flex gap-3 items-center backdrop-blur-md"
                        style={{
                            background: 'linear-gradient(to bottom, #f8fafc, #cbd5e1, #94a3b8)',
                            borderTop: '2px solid rgba(255,255,255,0.5)'
                        }}
                    >
                        <input
                            type="number"
                            min="10000"
                            placeholder={t.topupAmount}
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            className="bg-slate-900/10 text-slate-900 placeholder:text-slate-600 border border-slate-900/20 rounded-full px-5 py-3 outline-none text-sm font-semibold flex-1 h-[44px] shadow-inner focus:border-slate-400 focus:bg-white/50 transition-colors"
                        />
                        <button
                            onClick={handleTopUp}
                            disabled={submitting}
                            className="bg-white text-slate-900 rounded-full px-6 py-3 text-sm font-bold shadow-md hover:bg-slate-50 transition-all disabled:opacity-50 h-[44px] whitespace-nowrap"
                        >
                            {submitting ? t.processing : t.topup}
                        </button>
                    </div>
                </div>

                {/* Panel Lịch sử */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t.history}</h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {transactions.length === 0 ? (
                            <p className="text-center text-slate-500 my-10">{t.emptyHistory}</p>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx._id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'Credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {tx.type === 'Credit' ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7 7 7-7"/></svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{tx.description}</p>
                                            <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</p>
                                        </div>
                                    </div>
                                    <div className={`font-bold text-sm ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {tx.type === 'Credit' ? '+' : '-'} {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyWallet;
