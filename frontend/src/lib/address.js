import { normalizePhoneValue } from './phone';

export const emptyAddress = {
    label: '',
    fullName: '',
    email: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    addressDetail: '',
    isDefault: false,
};

export const sanitizeAddressPayload = (address = {}) => ({
    label: String(address.label || '').trim(),
    fullName: String(address.fullName || '').trim(),
    email: String(address.email || '').trim(),
    phone: normalizePhoneValue(address.phone),
    province: String(address.province || '').trim(),
    district: String(address.district || '').trim(),
    ward: String(address.ward || '').trim(),
    addressDetail: String(address.addressDetail || '').trim(),
    isDefault: Boolean(address.isDefault),
});

export const buildAddressSummary = (address = {}) =>
    [
        address?.addressDetail,
        address?.ward,
        address?.district,
        address?.province,
    ]
        .filter(Boolean)
        .join(', ');

export const isAddressComplete = (address = {}) => {
    const payload = sanitizeAddressPayload(address);
    const requiredFields = [
        'fullName',
        'email',
        'phone',
        'province',
        'district',
        'ward',
        'addressDetail',
    ];

    return requiredFields.every((field) => payload[field].length > 0);
};
