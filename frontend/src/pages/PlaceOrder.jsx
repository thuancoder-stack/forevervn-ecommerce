import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import Title from '../components/Title';
import { getRegionByProvince, getShippingFeeByRegion } from '../data/regions';
import { buildAddressSummary, emptyAddress, isAddressComplete, sanitizeAddressPayload } from '../lib/address';
import { formatMoney } from '../lib/locale';

const copy = {
    vi: {
        delivery1: 'THÔNG TIN',
        delivery2: 'GIAO HÀNG',
        cart1: 'TỔNG',
        cart2: 'THANH TOÁN',
        payment1: 'PHƯƠNG THỨC',
        payment2: 'THANH TOÁN',
        loadAccountError: 'Không thể tải thông tin tài khoản',
        signInRequired: 'Vui lòng đăng nhập để đặt hàng',
        emptyCart: 'Giỏ hàng đang trống',
        stockIssueToast: 'Vui lòng chỉnh lại các sản phẩm đã hết hàng hoặc vượt tồn kho trước khi đặt hàng',
        addressIncomplete: 'Vui lòng điền đầy đủ thông tin giao hàng',
        saveAddressError: 'Không thể lưu địa chỉ trước khi thanh toán',
        orderSuccess: 'Đặt hàng thành công',
        orderFailed: 'Không thể đặt hàng',
        serverError: 'Không thể kết nối tới máy chủ',
        savedAddresses: 'Địa chỉ đã lưu',
        savedAddressesNote: 'Chọn nhanh một địa chỉ có sẵn hoặc thêm địa chỉ mới cho đơn này.',
        newAddress: 'Địa chỉ mới',
        newAddressTitle: 'Địa chỉ mới',
        newAddressNote: 'Nhập một địa chỉ giao hàng khác cho đơn này.',
        useSavedAddress: 'Dùng địa chỉ đã lưu',
        selectedAddress: 'Địa chỉ giao hàng đã chọn',
        defaultBadge: 'Mặc định',
        addressLabel: 'Nhãn địa chỉ',
        addressLabelPlaceholder: 'Tên gọi như Nhà riêng, Văn phòng...',
        fullName: 'Họ và tên',
        phone: 'Số điện thoại',
        email: 'Email',
        province: 'Chọn tỉnh / thành',
        district: 'Chọn quận / huyện',
        ward: 'Chọn phường / xã',
        addressDetail: 'Số nhà, tên đường',
        saveToAccount: 'Lưu địa chỉ này vào tài khoản',
        makeDefault: 'Đặt làm địa chỉ mặc định',
        stockIssuesBox: 'Một số sản phẩm không còn đủ tồn kho. Hãy quay lại giỏ hàng để điều chỉnh trước khi thanh toán.',
        subtotal: 'Tạm tính',
        discount: (value) => `Giảm giá (${value}%)`,
        shipping: 'Phí giao hàng',
        total: 'Tổng cộng',
        cashOnDelivery: 'THANH TOÁN KHI NHẬN HÀNG',
        processing: 'Đang xử lý...',
        placeOrder: 'Đặt Hàng',
        savedAddressLabel: 'Địa chỉ đã lưu',
    },
    en: {
        delivery1: 'DELIVERY',
        delivery2: 'INFORMATION',
        cart1: 'CART',
        cart2: 'TOTALS',
        payment1: 'PAYMENT',
        payment2: 'METHOD',
        loadAccountError: 'Unable to load account information',
        signInRequired: 'Please sign in to place an order',
        emptyCart: 'Your cart is empty',
        stockIssueToast: 'Please fix sold-out or over-limit items before placing the order',
        addressIncomplete: 'Please complete your delivery information',
        saveAddressError: 'Unable to save address before checkout',
        orderSuccess: 'Order placed successfully',
        orderFailed: 'Unable to place order',
        serverError: 'Unable to connect to server',
        savedAddresses: 'Saved addresses',
        savedAddressesNote: 'Choose one quickly or add a new address for this order.',
        newAddress: 'New address',
        newAddressTitle: 'New address',
        newAddressNote: 'Enter a different destination for this order.',
        useSavedAddress: 'Use saved address',
        selectedAddress: 'Selected delivery address',
        defaultBadge: 'Default',
        addressLabel: 'Address label',
        addressLabelPlaceholder: 'Label like Home, Office...',
        fullName: 'Full name',
        phone: 'Phone number',
        email: 'Email address',
        province: 'Choose province',
        district: 'Choose district',
        ward: 'Choose ward',
        addressDetail: 'House number, street name',
        saveToAccount: 'Save this address to my account',
        makeDefault: 'Make this my default address',
        stockIssuesBox: 'Some items are no longer available in the requested quantity. Please go back to the cart and adjust them before checkout.',
        subtotal: 'Subtotal',
        discount: (value) => `Discount (${value}%)`,
        shipping: 'Shipping fee',
        total: 'Total',
        cashOnDelivery: 'CASH ON DELIVERY',
        processing: 'Processing...',
        placeOrder: 'Place Order',
        savedAddressLabel: 'Saved address',
    },
};

const PlaceOrder = () => {
    const {
        products,
        cartItems,
        delivery_fee,
        backendUrl,
        token,
        updateCartQty,
        appliedVoucher,
        setDeliveryFee,
        getProductStock,
    } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copy[language];

    const navigate = useNavigate();
    const location = useLocation();
    const buyNowItem = location.state?.buyNowItem || null;
    const isBuyNowMode = Boolean(buyNowItem);

    const [formData, setFormData] = useState(emptyAddress);
    const [loading, setLoading] = useState(false);
    const [accountLoading, setAccountLoading] = useState(true);
    const [stockMap, setStockMap] = useState({});
    const [saveNewAddress, setSaveNewAddress] = useState(true);
    const [makeDefaultAddress, setMakeDefaultAddress] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProv, setSelectedProv] = useState('');
    const [selectedDist, setSelectedDist] = useState('');
    const [selectedWard, setSelectedWard] = useState('');

    useEffect(() => {
        axios
            .get('https://provinces.open-api.vn/api/p/')
            .then(({ data }) => setProvinces(data || []))
            .catch((err) => console.error('Error fetching provinces:', err));
    }, []);

    const loadDistricts = async (provinceCode) => {
        if (!provinceCode) {
            setDistricts([]);
            return [];
        }

        try {
            const { data } = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const nextDistricts = data?.districts || [];
            setDistricts(nextDistricts);
            return nextDistricts;
        } catch (err) {
            console.error('Error fetching districts:', err);
            setDistricts([]);
            return [];
        }
    };

    const loadWards = async (districtCode) => {
        if (!districtCode) {
            setWards([]);
            return [];
        }

        try {
            const { data } = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const nextWards = data?.wards || [];
            setWards(nextWards);
            return nextWards;
        } catch (err) {
            console.error('Error fetching wards:', err);
            setWards([]);
            return [];
        }
    };

    useEffect(() => {
        if (!token) {
            setAccountLoading(false);
            return;
        }

        const fetchAccount = async () => {
            try {
                const { data } = await axios.post(`${backendUrl}/api/user/me`, {}, { headers: { token } });
                if (!data.success) {
                    toast.error(data.message || t.loadAccountError);
                    return;
                }

                const user = data.user || {};
                const nextAddresses = Array.isArray(user.addresses) ? user.addresses : [];
                const defaultAddress = nextAddresses.find((item) => item.isDefault) || nextAddresses[0] || null;

                setSavedAddresses(nextAddresses);
                setFormData((prev) => ({
                    ...prev,
                    fullName: defaultAddress?.fullName || user.name || prev.fullName,
                    email: defaultAddress?.email || user.email || prev.email,
                    phone: defaultAddress?.phone || prev.phone,
                    province: defaultAddress?.province || prev.province,
                    district: defaultAddress?.district || prev.district,
                    ward: defaultAddress?.ward || prev.ward,
                    addressDetail: defaultAddress?.addressDetail || prev.addressDetail,
                }));

                if (defaultAddress?._id) {
                    setSelectedAddressId(String(defaultAddress._id));
                    setUseNewAddress(false);
                    const region = getRegionByProvince(defaultAddress?.province);
                    setDeliveryFee(getShippingFeeByRegion(region));
                } else {
                    setUseNewAddress(true);
                    setSaveNewAddress(true);
                }
            } catch (error) {
                toast.error(error.message || t.loadAccountError);
            } finally {
                setAccountLoading(false);
            }
        };

        fetchAccount();
    }, [backendUrl, setDeliveryFee, t.loadAccountError, token]);

    const orderItems = useMemo(() => {
        if (buyNowItem) {
            return [{
                ...buyNowItem,
                quantity: Number(buyNowItem.quantity || 1),
                color: buyNowItem.color || 'Any',
                size: buyNowItem.size || 'Free',
                _id: buyNowItem._id || buyNowItem.id,
            }];
        }

        const items = [];
        for (const itemId in cartItems) {
            const productInfo = products.find((product) => String(product._id || product.id) === String(itemId));
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
                        color: color || 'Any',
                        quantity,
                    });
                }
            }
        }
        return items;
    }, [buyNowItem, cartItems, products]);

    useEffect(() => {
        let cancelled = false;
        const loadStocks = async () => {
            if (orderItems.length === 0) {
                setStockMap({});
                return;
            }
            const entries = await Promise.all(orderItems.map(async (item) => {
                const stock = await getProductStock(item._id, item.size, item.color);
                return [`${item._id}__${item.size}__${item.color}`, stock];
            }));
            if (!cancelled) setStockMap(Object.fromEntries(entries));
        };
        loadStocks();
        return () => {
            cancelled = true;
        };
    }, [getProductStock, orderItems]);

    const stockIssues = useMemo(
        () => orderItems.filter((item) => {
            const key = `${item._id}__${item.size}__${item.color}`;
            if (!Object.prototype.hasOwnProperty.call(stockMap, key)) return false;
            const stock = Number(stockMap[key] || 0);
            return stock <= 0 || item.quantity > stock;
        }),
        [orderItems, stockMap],
    );

    const orderSubtotal = useMemo(
        () => orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
        [orderItems],
    );

    const discountAmount = useMemo(() => {
        if (!appliedVoucher) return 0;
        return Math.floor(orderSubtotal * ((Number(appliedVoucher.discountPercent) || 0) / 100));
    }, [appliedVoucher, orderSubtotal]);

    const selectedSavedAddress = useMemo(
        () => savedAddresses.find((address) => String(address._id) === String(selectedAddressId)) || null,
        [savedAddresses, selectedAddressId],
    );

    const activeAddress = useMemo(
        () => (useNewAddress ? sanitizeAddressPayload(formData) : selectedSavedAddress),
        [formData, selectedSavedAddress, useNewAddress],
    );

    const clearLocalCart = () => {
        for (const itemId in cartItems) {
            for (const size in cartItems[itemId]) {
                for (const color in cartItems[itemId][size]) {
                    updateCartQty(itemId, size, color, 0);
                }
            }
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onProvinceChange = async (e) => {
        const provCode = e.target.value;
        const provName = provinces.find((p) => String(p.code) === String(provCode))?.name || '';

        setSelectedProv(provCode);
        setSelectedDist('');
        setSelectedWard('');
        setDistricts([]);
        setWards([]);
        setFormData((prev) => ({ ...prev, province: provName, district: '', ward: '' }));

        const region = getRegionByProvince(provName);
        setDeliveryFee(getShippingFeeByRegion(region));
        await loadDistricts(provCode);
    };

    const onDistrictChange = async (e) => {
        const distCode = e.target.value;
        const distName = districts.find((d) => String(d.code) === String(distCode))?.name || '';

        setSelectedDist(distCode);
        setSelectedWard('');
        setWards([]);
        setFormData((prev) => ({ ...prev, district: distName, ward: '' }));

        await loadWards(distCode);
    };

    const onWardChange = (e) => {
        const wardCode = e.target.value;
        const wardName = wards.find((w) => String(w.code) === String(wardCode))?.name || '';
        setSelectedWard(wardCode);
        setFormData((prev) => ({ ...prev, ward: wardName }));
    };

    const startNewAddressFlow = () => {
        setUseNewAddress(true);
        setSelectedAddressId('');
        setSaveNewAddress(true);
        setMakeDefaultAddress(savedAddresses.length === 0);
        setSelectedProv('');
        setSelectedDist('');
        setSelectedWard('');
        setDistricts([]);
        setWards([]);
        setFormData((prev) => ({
            ...emptyAddress,
            fullName: prev.fullName || '',
            email: prev.email || '',
        }));
    };

    const useSelectedAddress = (address) => {
        setSelectedAddressId(String(address?._id || ''));
        setUseNewAddress(false);
        const region = getRegionByProvince(address?.province);
        setDeliveryFee(getShippingFeeByRegion(region));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (loading) return;
        if (!token) {
            toast.error(t.signInRequired);
            navigate('/login');
            return;
        }
        if (orderItems.length === 0) {
            toast.error(t.emptyCart);
            return;
        }
        if (stockIssues.length > 0) {
            toast.error(t.stockIssueToast);
            return;
        }
        if (!activeAddress || !isAddressComplete(activeAddress)) {
            toast.error(t.addressIncomplete);
            return;
        }

        try {
            setLoading(true);

            if (useNewAddress && saveNewAddress) {
                const saveResponse = await axios.post(
                    `${backendUrl}/api/user/address/save`,
                    {
                        address: {
                            ...sanitizeAddressPayload(formData),
                            isDefault: makeDefaultAddress,
                        },
                        setAsDefault: makeDefaultAddress,
                    },
                    { headers: { token } },
                );

                if (!saveResponse.data?.success) {
                    toast.error(saveResponse.data?.message || t.saveAddressError);
                    return;
                }

                setSavedAddresses(saveResponse.data.addresses || []);
            }

            const payload = {
                address: sanitizeAddressPayload(activeAddress),
                items: orderItems.map((item) => ({
                    ...item,
                    color: item.color === 'Any' ? '' : item.color,
                })),
                amount: orderSubtotal - discountAmount + delivery_fee,
                discount: discountAmount,
                voucherCode: appliedVoucher ? appliedVoucher.code : '',
            };

            const response = await axios.post(`${backendUrl}/api/order/place`, payload, { headers: { token } });

            if (response?.data?.success) {
                if (!isBuyNowMode) {
                    clearLocalCart();
                }
                toast.success(t.orderSuccess);
                navigate('/orders');
                return;
            }

            toast.error(response?.data?.message || t.orderFailed);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || t.serverError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className="grid gap-6 py-4 sm:py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="space-y-6">
                <div className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                    <div className="mb-8">
                        <Title text1={t.delivery1} text2={t.delivery2} />
                    </div>
                    <div className="space-y-5">
                        {!accountLoading && savedAddresses.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{t.savedAddresses}</h3>
                                        <p className="mt-1 text-sm text-slate-500">{t.savedAddressesNote}</p>
                                    </div>
                                    <button type="button" onClick={startNewAddressFlow} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 hover:border-slate-900 hover:text-slate-900">
                                        {t.newAddress}
                                    </button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {savedAddresses.map((address) => {
                                        const isSelected = !useNewAddress && String(selectedAddressId) === String(address._id);
                                        return (
                                            <button
                                                key={address._id}
                                                type="button"
                                                onClick={() => useSelectedAddress(address)}
                                                className={`rounded-2xl border px-4 py-4 text-left transition ${isSelected ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-900'}`}
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold">{address.label || t.savedAddressLabel}</span>
                                                    {address.isDefault ? (
                                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${isSelected ? 'bg-white/15 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {t.defaultBadge}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-2.5 text-[13px] font-medium leading-5">{address.fullName}</p>
                                                <p className="mt-0.5 text-[13px] leading-5">{address.phone}</p>
                                                <p className="mt-0.5 text-[13px] leading-5">{address.email}</p>
                                                <p className="mt-2 text-[13px] leading-5 opacity-90">{buildAddressSummary(address)}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        {useNewAddress || savedAddresses.length === 0 ? (
                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 sm:p-6">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{t.newAddressTitle}</h3>
                                        <p className="mt-1 text-sm text-slate-500">{t.newAddressNote}</p>
                                    </div>
                                    {savedAddresses.length > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const defaultAddress = savedAddresses.find((item) => item.isDefault) || savedAddresses[0];
                                                if (defaultAddress) useSelectedAddress(defaultAddress);
                                            }}
                                            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                        >
                                            {t.useSavedAddress}
                                        </button>
                                    ) : null}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <input name="label" value={formData.label} onChange={handleChange} className="sm:col-span-2 rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none" type="text" placeholder={t.addressLabelPlaceholder} />
                                    <input name="fullName" value={formData.fullName} onChange={handleChange} className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none" type="text" placeholder={t.fullName} required={useNewAddress || savedAddresses.length === 0} />
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none" type="text" placeholder={t.phone} required={useNewAddress || savedAddresses.length === 0} />
                                    <input name="email" value={formData.email} onChange={handleChange} className="sm:col-span-2 rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none" type="email" placeholder={t.email} required={useNewAddress || savedAddresses.length === 0} />

                                    <select value={selectedProv} onChange={onProvinceChange} className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white" required={useNewAddress || savedAddresses.length === 0}>
                                        <option value="">{t.province}</option>
                                        {provinces.map((province) => (
                                            <option key={province.code} value={province.code}>{province.name}</option>
                                        ))}
                                    </select>

                                    <select value={selectedDist} onChange={onDistrictChange} disabled={!selectedProv} className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white disabled:opacity-50" required={useNewAddress || savedAddresses.length === 0}>
                                        <option value="">{t.district}</option>
                                        {districts.map((district) => (
                                            <option key={district.code} value={district.code}>{district.name}</option>
                                        ))}
                                    </select>

                                    <select value={selectedWard} onChange={onWardChange} disabled={!selectedDist} className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white disabled:opacity-50" required={useNewAddress || savedAddresses.length === 0}>
                                        <option value="">{t.ward}</option>
                                        {wards.map((ward) => (
                                            <option key={ward.code} value={ward.code}>{ward.name}</option>
                                        ))}
                                    </select>

                                    <input name="addressDetail" value={formData.addressDetail} onChange={handleChange} className="sm:col-span-2 rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none" type="text" placeholder={t.addressDetail} required={useNewAddress || savedAddresses.length === 0} />
                                </div>

                                <div className="mt-4 space-y-3">
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                        <input type="checkbox" checked={saveNewAddress} onChange={(e) => setSaveNewAddress(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                                        {t.saveToAccount}
                                    </label>
                                    {saveNewAddress ? (
                                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                            <input type="checkbox" checked={makeDefaultAddress} onChange={(e) => setMakeDefaultAddress(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                                            {t.makeDefault}
                                        </label>
                                    ) : null}
                                </div>
                            </div>
                        ) : selectedSavedAddress ? (
                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 sm:p-6">
                                <h3 className="text-lg font-semibold text-slate-900">{t.selectedAddress}</h3>
                                <p className="mt-4 text-sm font-medium text-slate-900">{selectedSavedAddress.fullName} | {selectedSavedAddress.phone}</p>
                                <p className="mt-1 text-sm text-slate-500">{selectedSavedAddress.email}</p>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{buildAddressSummary(selectedSavedAddress)}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
            <aside className="lg:sticky lg:top-[140px] lg:h-fit">
                <div className="section-shell p-6 sm:p-7">
                    <Title text1={t.cart1} text2={t.cart2} />

                    <div className="mt-6 space-y-4 text-sm text-slate-600">
                        {stockIssues.length > 0 ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {t.stockIssuesBox}
                            </div>
                        ) : null}

                        <div className="flex justify-between">
                            <p>{t.subtotal}</p>
                            <p>{formatMoney(orderSubtotal, language)}</p>
                        </div>

                        {appliedVoucher && (
                            <div className="flex justify-between text-emerald-600 font-medium">
                                <p>{t.discount(appliedVoucher.discountPercent)}</p>
                                <p>-{formatMoney(discountAmount, language)}</p>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <p>{t.shipping}</p>
                            <p>{formatMoney(delivery_fee, language)}</p>
                        </div>

                        <div className="rounded-[22px] bg-slate-900 px-5 py-4 text-base font-semibold text-white">
                            <div className="flex justify-between">
                                <p>{t.total}</p>
                                <p>{formatMoney(orderSubtotal - discountAmount + delivery_fee, language)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 rounded-[24px] border border-[var(--border)] bg-white p-5">
                        <Title text1={t.payment1} text2={t.payment2} />
                        <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                            <p className="text-sm font-medium text-slate-600">{t.cashOnDelivery}</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || accountLoading || orderItems.length === 0 || stockIssues.length > 0 || !activeAddress || !isAddressComplete(activeAddress)}
                        className="mt-6 w-full rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                    >
                        {loading ? t.processing : t.placeOrder}
                    </button>
                </div>
            </aside>
        </form>
    );
};

export default PlaceOrder;
