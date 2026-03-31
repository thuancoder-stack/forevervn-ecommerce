import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { getRegionByProvince, getShippingFeeByRegion } from '../data/regions';

const initialAddress = {
    fullName: '',
    email: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    addressDetail: ''
};

const PlaceOrder = () => {
    const {
        products,
        cartItems,
        getCartAmount,
        delivery_fee,
        currency,
        backendUrl,
        token,
        updateCartQty,
        appliedVoucher,
        getDiscountAmount,
        setDeliveryFee
    } = useContext(ShopContext);

    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialAddress);
    const [loading, setLoading] = useState(false);
    
    // Cascading address state 
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProv, setSelectedProv] = useState('');
    const [selectedDist, setSelectedDist] = useState('');
    const [selectedWard, setSelectedWard] = useState('');

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const { data } = await axios.get('https://provinces.open-api.vn/api/p/');
                setProvinces(data);
            } catch (err) {
                console.error('Error fetching provinces:', err);
            }
        };
        fetchProvinces();
    }, []);

    const onProvinceChange = async (e) => {
        const provCode = e.target.value;
        const provName = provinces.find(p => p.code == provCode)?.name || '';
        
        setSelectedProv(provCode);
        setSelectedDist('');
        setSelectedWard('');
        setDistricts([]);
        setWards([]);

        setFormData(prev => ({ ...prev, province: provName }));

        // Update shipping fee
        const region = getRegionByProvince(provName);
        const fee = getShippingFeeByRegion(region);
        setDeliveryFee(fee);

        if (provCode) {
            try {
                const { data } = await axios.get(`https://provinces.open-api.vn/api/p/${provCode}?depth=2`);
                setDistricts(data.districts || []);
            } catch (err) {
                console.error('Error fetching districts:', err);
            }
        }
    };

    const onDistrictChange = async (e) => {
        const distCode = e.target.value;
        const distName = districts.find(d => d.code == distCode)?.name || '';
        
        setSelectedDist(distCode);
        setSelectedWard('');
        setWards([]);

        setFormData(prev => ({ ...prev, district: distName }));

        if (distCode) {
            try {
                const { data } = await axios.get(`https://provinces.open-api.vn/api/d/${distCode}?depth=2`);
                setWards(data.wards || []);
            } catch (err) {
                console.error('Error fetching wards:', err);
            }
        }
    };

    const onWardChange = (e) => {
        const wardCode = e.target.value;
        const wardName = wards.find(w => w.code == wardCode)?.name || '';
        setSelectedWard(wardCode);
        setFormData(prev => ({ ...prev, ward: wardName }));
    };

    const orderItems = useMemo(() => {
        const items = [];

        for (const itemId in cartItems) {
            const productInfo = products.find(
                (product) => String(product._id || product.id) === String(itemId)
            );

            if (!productInfo) continue;

            for (const size in cartItems[itemId]) {
                for (const color in cartItems[itemId][size]) {
                    const quantity = Number(cartItems[itemId][size][color]) || 0;
                    if (quantity <= 0) continue;

                    items.push({
                        _id: productInfo._id,
                        name: productInfo.name,
                        price: productInfo.price,
                        image: productInfo.image,
                        size,
                        color: color === 'Any' ? '' : color,
                        quantity
                    });
                }
            }
        }

        return items;
    }, [cartItems, products]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const clearLocalCart = () => {
        for (const itemId in cartItems) {
            for (const size in cartItems[itemId]) {
                for (const color in cartItems[itemId][size]) {
                    updateCartQty(itemId, size, color, 0);
                }
            }
        }
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        if (!token) {
            toast.error('Vui long dang nhap de dat hang');
            navigate('/login');
            return;
        }

        if (orderItems.length === 0) {
            toast.error('Gio hang dang trong');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                address: formData,
                items: orderItems,
                amount: getCartAmount() - getDiscountAmount() + delivery_fee,
                discount: getDiscountAmount(),
                voucherCode: appliedVoucher ? appliedVoucher.code : ''
            };

            const response = await axios.post(
                `${backendUrl}/api/order/place`,
                payload,
                { headers: { token } }
            );

            if (response?.data?.success) {
                clearLocalCart();
                toast.success('Dat hang COD thanh cong');
                navigate('/orders');
                return;
            }

            toast.error(response?.data?.message || 'Khong the dat hang');
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Khong the ket noi server';

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={onSubmitHandler}
            className="grid gap-6 py-4 sm:py-6 lg:grid-cols-[minmax(0,1fr)_380px]"
        >
            <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <div className="mb-8">
                    <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="sm:col-span-2 rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                        type="text"
                        placeholder="Họ và tên"
                        required
                    />
                    <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="sm:col-span-2 rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                        type="email"
                        placeholder="Email address"
                        required
                    />
                    
                    {/* Multi-select for Vietnam address */}
                    <select
                        value={selectedProv}
                        onChange={onProvinceChange}
                        className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white"
                        required
                    >
                        <option value="">Chọn Tỉnh / Thành</option>
                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>

                    <select
                        value={selectedDist}
                        onChange={onDistrictChange}
                        disabled={!selectedProv}
                        className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white disabled:opacity-50"
                        required
                    >
                        <option value="">Chọn Quận / Huyện</option>
                        {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>

                    <select
                        value={selectedWard}
                        onChange={onWardChange}
                        disabled={!selectedDist}
                        className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white disabled:opacity-50"
                        required
                    >
                        <option value="">Chọn Xã / Phường</option>
                        {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>

                    <input
                        name="addressDetail"
                        value={formData.addressDetail}
                        onChange={handleChange}
                        className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                        type="text"
                        placeholder="Số nhà, tên đường"
                        required
                    />

                    <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="sm:col-span-2 rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                        type="text"
                        placeholder="Số điện thoại"
                        required
                    />
                </div>
            </section>

            <aside className="lg:sticky lg:top-[140px] lg:h-fit">
                <div className="section-shell p-6 sm:p-7">
                    <Title text1={'CART'} text2={'TOTALS'} />

                    <div className="mt-6 space-y-4 text-sm text-slate-600">
                        <div className="flex justify-between">
                            <p>Tạm tính</p>
                            <p>
                                {currency}
                                {getCartAmount().toLocaleString('vi-VN')} VND
                            </p>
                        </div>

                        {appliedVoucher && (
                            <div className="flex justify-between text-emerald-600 font-medium">
                                <p>Giảm giá ({appliedVoucher.discountPercent}%)</p>
                                <p>
                                    -{currency}
                                    {getDiscountAmount().toLocaleString('vi-VN')} VND
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <p>Phí giao hàng</p>
                            <p>
                                {currency}
                                {delivery_fee.toLocaleString('vi-VN')} VND
                            </p>
                        </div>

                        <div className="rounded-[22px] bg-slate-900 px-5 py-4 text-base font-semibold text-white">
                            <div className="flex justify-between">
                                <p>Tổng cộng</p>
                                <p>
                                    {currency}
                                    {(getCartAmount() - getDiscountAmount() + delivery_fee).toLocaleString('vi-VN')} VND
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 rounded-[24px] border border-[var(--border)] bg-white p-5">
                        <Title text1={'PAYMENT'} text2={'METHOD'} />

                        <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                            <p className="text-sm font-medium text-slate-600">
                                CASH ON DELIVERY
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                    >
                        {loading ? 'Processing...' : 'Place Order'}
                    </button>
                </div>
            </aside>
        </form>
    );
};

export default PlaceOrder;
