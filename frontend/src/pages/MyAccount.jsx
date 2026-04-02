import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyAccount = () => {
    const { token, navigate, backendUrl } = useContext(ShopContext);
    
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const { data } = await axios.post(`${backendUrl}/api/user/me`, {}, { headers: { token } });
                if (data.success) {
                    setUserData(data.user);
                    setFormData(prev => ({ ...prev, name: data.user.name }));
                } else {
                    toast.error(data.message || 'Cannot load profile');
                }
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token, navigate, backendUrl]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            return toast.error("Mật khẩu xác nhận không khớp!");
        }

        try {
            setUpdating(true);
            const { data } = await axios.put(`${backendUrl}/api/user/profile`, {
                name: formData.name,
                newPassword: formData.newPassword
            }, { headers: { token } });

            if (data.success) {
                toast.success(data.message);
                setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
                setUserData(prev => ({ ...prev, name: formData.name }));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!userData) {
        return <div className="text-center py-20 text-slate-500">Failed to load profile.</div>;
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl pr-title">My Account</h1>
                <p className="mt-2 text-sm text-slate-500">Quản lý tài khoản và bảo mật</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-50 bg-slate-50/50 p-6 sm:px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white uppercase shadow-inner">
                            {userData.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{userData.name}</h2>
                            <p className="text-sm font-medium text-slate-500">{userData.email}</p>
                            <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                {userData.role === 'Admin' ? 'Super Admin' : (userData.role === 'Employee' ? 'Staff' : 'Customer')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                Tên Hiển Thị
                            </label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                                type="text"
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-5 mt-2">
                            <h3 className="mb-4 text-sm font-bold text-rose-900 flex items-center gap-2">
                                Đổi Mật Khẩu
                                <span className="text-xs font-normal text-rose-500">(Bỏ trống nếu không đổi)</span>
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-rose-700">Mật khẩu cá nhân mới</label>
                                    <input
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-rose-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-rose-700">Xác nhận mật khẩu</label>
                                    <input
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-rose-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                disabled={updating}
                                type="submit"
                                className="rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(15,23,42,0.15)] transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_14px_30px_rgba(15,23,42,0.25)] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {updating ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;
