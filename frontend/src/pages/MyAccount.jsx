import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import PhoneField from '../components/PhoneField';
import { buildAddressSummary, emptyAddress, sanitizeAddressPayload } from '../lib/address';
import { formatPhoneValue, splitPhoneValue } from '../lib/phone';

const normalizeName = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^(Tinh|Thanh pho)\s+/i, '')
        .trim()
        .toLowerCase();

const copy = {
    vi: {
        title: 'T\u00e0i Kho\u1ea3n C\u1ee7a T\u00f4i',
        subtitle: 'Qu\u1ea3n l\u00fd h\u1ed3 s\u01a1, m\u1eadt kh\u1ea9u v\u00e0 s\u1ed5 \u0111\u1ecba ch\u1ec9 giao h\u00e0ng.',
        loadFailed: 'Kh\u00f4ng th\u1ec3 t\u1ea3i h\u1ed3 s\u01a1.',
        superAdmin: 'Qu\u1ea3n tr\u1ecb cao nh\u1ea5t',
        staff: 'Nh\u00e2n vi\u00ean',
        customer: 'Kh\u00e1ch h\u00e0ng',
        displayName: 'T\u00ean hi\u1ec3n th\u1ecb',
        yourName: 'T\u00ean c\u1ee7a b\u1ea1n',
        changePassword: '\u0110\u1ed5i m\u1eadt kh\u1ea9u',
        newPassword: 'M\u1eadt kh\u1ea9u m\u1edbi',
        confirmPassword: 'X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u m\u1edbi',
        saveProfile: 'L\u01b0u h\u1ed3 s\u01a1',
        saving: '\u0110ang l\u01b0u...',
        savedAddresses: '\u0110\u1ecba ch\u1ec9 \u0111\u00e3 l\u01b0u',
        addressNote: 'Ch\u1ecdn \u0111\u1ecba ch\u1ec9 m\u1eb7c \u0111\u1ecbnh \u0111\u1ec3 checkout nhanh h\u01a1n.',
        addNew: 'Th\u00eam m\u1edbi',
        noAddress: 'B\u1ea1n ch\u01b0a l\u01b0u \u0111\u1ecba ch\u1ec9 n\u00e0o.',
        savedAddress: '\u0110\u1ecba ch\u1ec9 \u0111\u00e3 l\u01b0u',
        default: 'M\u1eb7c \u0111\u1ecbnh',
        setDefault: '\u0110\u1eb7t m\u1eb7c \u0111\u1ecbnh',
        edit: 'Ch\u1ec9nh s\u1eeda',
        delete: 'X\u00f3a',
        editAddress: 'Ch\u1ec9nh s\u1eeda \u0111\u1ecba ch\u1ec9',
        addAddress: 'Th\u00eam \u0111\u1ecba ch\u1ec9 m\u1edbi',
        addressBookNote: 'L\u01b0u s\u1ed5 \u0111\u1ecba ch\u1ec9 s\u1eb5n s\u00e0ng cho checkout, gi\u1ed1ng ki\u1ec3u marketplace.',
        addressLabel: 'Nh\u00e3n \u0111\u1ecba ch\u1ec9 (V\u00ed d\u1ee5: Nh\u00e0 ri\u00eang, V\u0103n ph\u00f2ng)',
        fullName: 'H\u1ecd v\u00e0 t\u00ean',
        phone: 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i',
        email: 'Email',
        province: 'Ch\u1ecdn t\u1ec9nh / th\u00e0nh',
        district: 'Ch\u1ecdn qu\u1eadn / huy\u1ec7n',
        ward: 'Ch\u1ecdn ph\u01b0\u1eddng / x\u00e3',
        detail: 'S\u1ed1 nh\u00e0, t\u00ean \u0111\u01b0\u1eddng',
        setDefaultDelivery: '\u0110\u1eb7t l\u00e0m \u0111\u1ecba ch\u1ec9 giao h\u00e0ng m\u1eb7c \u0111\u1ecbnh',
        cancelEdit: 'H\u1ee7y ch\u1ec9nh s\u1eeda',
        updateAddress: 'C\u1eadp nh\u1eadt \u0111\u1ecba ch\u1ec9',
        saveAddress: 'L\u01b0u \u0111\u1ecba ch\u1ec9',
        saveAddressing: '\u0110ang l\u01b0u...',
        profileMismatch: 'M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp',
        profileUpdated: 'C\u1eadp nh\u1eadt h\u1ed3 s\u01a1 th\u00e0nh c\u00f4ng',
        profileError: 'Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt h\u1ed3 s\u01a1',
        addressSaved: 'L\u01b0u \u0111\u1ecba ch\u1ec9 th\u00e0nh c\u00f4ng',
        addressDeleted: 'X\u00f3a \u0111\u1ecba ch\u1ec9 th\u00e0nh c\u00f4ng',
        addressDefaulted: '\u0110\u00e3 \u0111\u1ed5i \u0111\u1ecba ch\u1ec9 m\u1eb7c \u0111\u1ecbnh',
        addressDeleteConfirm: 'X\u00f3a \u0111\u1ecba ch\u1ec9 n\u00e0y?',
    },
    en: {
        title: 'My Account',
        subtitle: 'Manage profile, password and saved delivery addresses.',
        loadFailed: 'Failed to load profile.',
        superAdmin: 'Super Admin',
        staff: 'Staff',
        customer: 'Customer',
        displayName: 'Display Name',
        yourName: 'Your name',
        changePassword: 'Change password',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
        saveProfile: 'Save profile',
        saving: 'Saving...',
        savedAddresses: 'Saved addresses',
        addressNote: 'Choose a default address for faster checkout.',
        addNew: 'Add new',
        noAddress: 'You have not saved any address yet.',
        savedAddress: 'Saved address',
        default: 'Default',
        setDefault: 'Set default',
        edit: 'Edit',
        delete: 'Delete',
        editAddress: 'Edit address',
        addAddress: 'Add a new address',
        addressBookNote: 'Save a checkout-ready address book, similar to marketplace apps.',
        addressLabel: 'Address label (e.g. Home, Office)',
        fullName: 'Full name',
        phone: 'Phone number',
        email: 'Email address',
        province: 'Choose province',
        district: 'Choose district',
        ward: 'Choose ward',
        detail: 'House number, street name',
        setDefaultDelivery: 'Set as default delivery address',
        cancelEdit: 'Cancel edit',
        updateAddress: 'Update address',
        saveAddress: 'Save address',
        saveAddressing: 'Saving...',
        profileMismatch: 'Password confirmation does not match',
        profileUpdated: 'Profile updated successfully',
        profileError: 'Unable to update profile',
        addressSaved: 'Address saved successfully',
        addressDeleted: 'Address deleted successfully',
        addressDefaulted: 'Default address updated',
        addressDeleteConfirm: 'Delete this address?',
    },
};
const MyAccount = () => {
    const { token, navigate, backendUrl } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copy[language];

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [addressSaving, setAddressSaving] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [addressForm, setAddressForm] = useState(emptyAddress);
    const [editingAddressId, setEditingAddressId] = useState('');
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProv, setSelectedProv] = useState('');
    const [selectedDist, setSelectedDist] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [phoneCode, setPhoneCode] = useState('+84');
    const [phoneNumber, setPhoneNumber] = useState('');

    const addresses = useMemo(() => userData?.addresses || [], [userData?.addresses]);

    const syncPhoneState = (rawPhone = '') => {
        const parsed = splitPhoneValue(rawPhone);
        setPhoneCode(parsed.countryCode);
        setPhoneNumber(parsed.phoneNumber);
        return formatPhoneValue(parsed.countryCode, parsed.phoneNumber);
    };

    const handlePhoneCodeChange = (nextCode) => {
        setPhoneCode(nextCode);
        setAddressForm((prev) => ({
            ...prev,
            phone: formatPhoneValue(nextCode, phoneNumber),
        }));
    };

    const handlePhoneNumberChange = (nextNumber) => {
        setPhoneNumber(nextNumber);
        setAddressForm((prev) => ({
            ...prev,
            phone: formatPhoneValue(phoneCode, nextNumber),
        }));
    };

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
        } catch (error) {
            console.error('Error fetching districts:', error);
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
        } catch (error) {
            console.error('Error fetching wards:', error);
            setWards([]);
            return [];
        }
    };

    const resetAddressForm = () => {
        setAddressForm(emptyAddress);
        setPhoneCode('+84');
        setPhoneNumber('');
        setEditingAddressId('');
        setSelectedProv('');
        setSelectedDist('');
        setSelectedWard('');
        setDistricts([]);
        setWards([]);
    };

    const hydrateAddressSelection = async (address) => {
        const provinceCode =
            provinces.find((item) => normalizeName(item.name) === normalizeName(address?.province))?.code || '';
        setSelectedProv(provinceCode ? String(provinceCode) : '');

        const nextDistricts = await loadDistricts(provinceCode);
        const districtCode =
            nextDistricts.find((item) => normalizeName(item.name) === normalizeName(address?.district))?.code || '';
        setSelectedDist(districtCode ? String(districtCode) : '');

        const nextWards = await loadWards(districtCode);
        const wardCode =
            nextWards.find((item) => normalizeName(item.name) === normalizeName(address?.ward))?.code || '';
        setSelectedWard(wardCode ? String(wardCode) : '');
    };

    useEffect(() => {
        axios
            .get('https://provinces.open-api.vn/api/p/')
            .then(({ data }) => setProvinces(data || []))
            .catch((error) => console.error('Error fetching provinces:', error));
    }, []);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const { data } = await axios.post(
                    `${backendUrl}/api/user/me`,
                    {},
                    { headers: { token } },
                );

                if (data.success) {
                    setUserData(data.user);
                    setProfileForm((prev) => ({ ...prev, name: data.user.name }));
                } else {
                    toast.error(data.message || t.loadFailed);
                }
            } catch (error) {
                toast.error(error.message || t.loadFailed);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [backendUrl, navigate, t.loadFailed, token]);

    const handleProfileChange = (e) => {
        setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddressFieldChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const onProvinceChange = async (e) => {
        const provinceCode = e.target.value;
        const provinceName = provinces.find((item) => String(item.code) === String(provinceCode))?.name || '';

        setSelectedProv(provinceCode);
        setSelectedDist('');
        setSelectedWard('');
        setWards([]);
        setAddressForm((prev) => ({
            ...prev,
            province: provinceName,
            district: '',
            ward: '',
        }));

        await loadDistricts(provinceCode);
    };

    const onDistrictChange = async (e) => {
        const districtCode = e.target.value;
        const districtName = districts.find((item) => String(item.code) === String(districtCode))?.name || '';

        setSelectedDist(districtCode);
        setSelectedWard('');
        setAddressForm((prev) => ({
            ...prev,
            district: districtName,
            ward: '',
        }));

        await loadWards(districtCode);
    };

    const onWardChange = (e) => {
        const wardCode = e.target.value;
        const wardName = wards.find((item) => String(item.code) === String(wardCode))?.name || '';

        setSelectedWard(wardCode);
        setAddressForm((prev) => ({ ...prev, ward: wardName }));
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
            toast.error(t.profileMismatch);
            return;
        }

        try {
            setUpdating(true);
            const { data } = await axios.put(
                `${backendUrl}/api/user/profile`,
                {
                    name: profileForm.name,
                    newPassword: profileForm.newPassword,
                },
                { headers: { token } },
            );

            if (data.success) {
                toast.success(data.message || t.profileUpdated);
                setProfileForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
                setUserData((prev) => (prev ? { ...prev, name: profileForm.name } : prev));
            } else {
                toast.error(data.message || t.profileError);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t.profileError);
        } finally {
            setUpdating(false);
        }
    };

    const handleAddressSave = async (e) => {
        e.preventDefault();

        try {
            setAddressSaving(true);
            const payload = sanitizeAddressPayload(addressForm);
            const { data } = await axios.post(
                `${backendUrl}/api/user/address/save`,
                {
                    addressId: editingAddressId || undefined,
                    address: payload,
                    setAsDefault: payload.isDefault,
                },
                { headers: { token } },
            );

            if (data.success) {
                toast.success(data.message || t.addressSaved);
                setUserData((prev) => (prev ? { ...prev, addresses: data.addresses || [] } : prev));
                resetAddressForm();
                return;
            }

            toast.error(data.message || t.addressSaved);
        } catch (error) {
            toast.error(error.response?.data?.message || t.addressSaved);
        } finally {
            setAddressSaving(false);
        }
    };

    const startEditAddress = async (address) => {
        const normalizedPhone = syncPhoneState(address?.phone || '');
        setEditingAddressId(String(address?._id || ''));
        setAddressForm({
            label: address?.label || '',
            fullName: address?.fullName || '',
            email: address?.email || '',
            phone: normalizedPhone,
            province: address?.province || '',
            district: address?.district || '',
            ward: address?.ward || '',
            addressDetail: address?.addressDetail || '',
            isDefault: Boolean(address?.isDefault),
        });

        await hydrateAddressSelection(address);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm(t.addressDeleteConfirm)) return;

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/user/address/delete`,
                { addressId },
                { headers: { token } },
            );

            if (data.success) {
                toast.success(data.message || t.addressDeleted);
                setUserData((prev) => (prev ? { ...prev, addresses: data.addresses || [] } : prev));
                if (String(editingAddressId) === String(addressId)) {
                    resetAddressForm();
                }
                return;
            }

            toast.error(data.message || t.addressDeleted);
        } catch (error) {
            toast.error(error.response?.data?.message || t.addressDeleted);
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/user/address/default`,
                { addressId },
                { headers: { token } },
            );

            if (data.success) {
                toast.success(data.message || t.addressDefaulted);
                setUserData((prev) => (prev ? { ...prev, addresses: data.addresses || [] } : prev));
                if (String(editingAddressId) === String(addressId)) {
                    setAddressForm((prev) => ({ ...prev, isDefault: true }));
                }
                return;
            }

            toast.error(data.message || t.addressDefaulted);
        } catch (error) {
            toast.error(error.response?.data?.message || t.addressDefaulted);
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
        return <div className="text-center py-20 text-slate-500">{t.loadFailed}</div>;
    }

    const roleLabel =
        userData.role === 'Admin' ? t.superAdmin : userData.role === 'Employee' ? t.staff : t.customer;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl pr-title">
                    {t.title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-6">
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
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <form onSubmit={handleProfileUpdate} className="flex flex-col gap-6">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {t.displayName}
                                    </label>
                                    <input
                                        required
                                        name="name"
                                        value={profileForm.name}
                                        onChange={handleProfileChange}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                                        type="text"
                                        placeholder={t.yourName}
                                    />
                                </div>

                                <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-5 mt-2">
                                    <h3 className="mb-4 text-sm font-bold text-rose-900">{t.changePassword}</h3>

                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-rose-700">
                                                {t.newPassword}
                                            </label>
                                            <input
                                                name="newPassword"
                                                value={profileForm.newPassword}
                                                onChange={handleProfileChange}
                                                className="w-full rounded-xl border border-rose-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                                                type="password"
                                                placeholder="........"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-rose-700">
                                                {t.confirmPassword}
                                            </label>
                                            <input
                                                name="confirmPassword"
                                                value={profileForm.confirmPassword}
                                                onChange={handleProfileChange}
                                                className="w-full rounded-xl border border-rose-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                                                type="password"
                                                placeholder="........"
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
                                        {updating ? t.saving : t.saveProfile}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">{t.savedAddresses}</h2>
                                    <p className="mt-1 text-sm text-slate-500">{t.addressNote}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetAddressForm}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                >
                                    {t.addNew}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4 p-6 sm:p-8">
                            {addresses.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                                    {t.noAddress}
                                </div>
                            ) : (
                                addresses.map((address) => (
                                    <div
                                        key={address._id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/60 px-5 py-5"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-semibold text-slate-900">
                                                        {address.label || t.savedAddress}
                                                    </h3>
                                                    {address.isDefault ? (
                                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                                                            {t.default}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-2 text-sm font-medium text-slate-700">
                                                    {address.fullName} | {address.phone}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">{address.email}</p>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    {buildAddressSummary(address)}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {!address.isDefault ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetDefaultAddress(address._id)}
                                                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                                    >
                                                        {t.setDefault}
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => startEditAddress(address)}
                                                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                                >
                                                    {t.edit}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAddress(address._id)}
                                                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-600 hover:bg-rose-100"
                                                >
                                                    {t.delete}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm h-fit">
                    <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {editingAddressId ? t.editAddress : t.addAddress}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{t.addressBookNote}</p>
                    </div>

                    <form onSubmit={handleAddressSave} className="grid gap-4 p-6 sm:p-8">
                        <input
                            name="label"
                            value={addressForm.label}
                            onChange={handleAddressFieldChange}
                            className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                            type="text"
                            placeholder={t.addressLabel}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <input
                                name="fullName"
                                value={addressForm.fullName}
                                onChange={handleAddressFieldChange}
                                className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                type="text"
                                placeholder={t.fullName}
                                required
                            />
                            <PhoneField
                                countryCode={phoneCode}
                                phoneNumber={phoneNumber}
                                onCountryCodeChange={handlePhoneCodeChange}
                                onPhoneNumberChange={handlePhoneNumberChange}
                                placeholder={t.phone}
                                required
                                selectClassName="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white"
                                inputClassName="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                            />
                        </div>

                        <input
                            name="email"
                            value={addressForm.email}
                            onChange={handleAddressFieldChange}
                            className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                            type="email"
                            placeholder={t.email}
                            required
                        />

                        <div className="grid gap-4 sm:grid-cols-3">
                            <select
                                value={selectedProv}
                                onChange={onProvinceChange}
                                className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white"
                                required
                            >
                                <option value="">{t.province}</option>
                                {provinces.map((province) => (
                                    <option key={province.code} value={province.code}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedDist}
                                onChange={onDistrictChange}
                                disabled={!selectedProv}
                                className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white disabled:opacity-50"
                                required
                            >
                                <option value="">{t.district}</option>
                                {districts.map((district) => (
                                    <option key={district.code} value={district.code}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedWard}
                                onChange={onWardChange}
                                disabled={!selectedDist}
                                className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none bg-white disabled:opacity-50"
                                required
                            >
                                <option value="">{t.ward}</option>
                                {wards.map((ward) => (
                                    <option key={ward.code} value={ward.code}>
                                        {ward.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <input
                            name="addressDetail"
                            value={addressForm.addressDetail}
                            onChange={handleAddressFieldChange}
                            className="rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                            type="text"
                            placeholder={t.detail}
                            required
                        />

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                            <input
                                name="isDefault"
                                checked={addressForm.isDefault}
                                onChange={handleAddressFieldChange}
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            {t.setDefaultDelivery}
                        </label>

                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                            {editingAddressId ? (
                                <button
                                    type="button"
                                    onClick={resetAddressForm}
                                    className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                >
                                    {t.cancelEdit}
                                </button>
                            ) : null}
                            <button
                                disabled={addressSaving}
                                type="submit"
                                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                            >
                                {addressSaving
                                    ? t.saveAddressing
                                    : editingAddressId
                                      ? t.updateAddress
                                      : t.saveAddress}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;
