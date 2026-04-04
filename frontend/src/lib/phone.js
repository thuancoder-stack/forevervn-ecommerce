export const COUNTRY_PHONE_CODES = [
    { label: 'VN', code: '+84' },
    { label: 'US', code: '+1' },
    { label: 'CA', code: '+1' },
    { label: 'UK', code: '+44' },
    { label: 'AU', code: '+61' },
    { label: 'SG', code: '+65' },
    { label: 'TH', code: '+66' },
    { label: 'JP', code: '+81' },
    { label: 'KR', code: '+82' },
    { label: 'CN', code: '+86' },
    { label: 'FR', code: '+33' },
    { label: 'DE', code: '+49' },
];

const DEFAULT_COUNTRY_CODE = '+84';

const knownCodes = [...new Set(COUNTRY_PHONE_CODES.map((item) => item.code))].sort(
    (left, right) => right.length - left.length,
);

export const sanitizePhoneNumber = (value = '') =>
    String(value || '')
        .replace(/\D/g, '')
        .slice(0, 15);

export const normalizeCountryCode = (value = DEFAULT_COUNTRY_CODE) => {
    const digits = String(value || '')
        .replace(/[^\d]/g, '')
        .slice(0, 4);

    return digits ? `+${digits}` : DEFAULT_COUNTRY_CODE;
};

export const formatPhoneValue = (countryCode = DEFAULT_COUNTRY_CODE, phoneNumber = '') => {
    const normalizedCode = normalizeCountryCode(countryCode);
    const digits = sanitizePhoneNumber(phoneNumber);

    return digits ? `${normalizedCode} ${digits}` : '';
};

export const splitPhoneValue = (value = '', defaultCode = DEFAULT_COUNTRY_CODE) => {
    const normalizedDefaultCode = normalizeCountryCode(defaultCode);
    const raw = String(value || '').trim();

    if (!raw) {
        return {
            countryCode: normalizedDefaultCode,
            phoneNumber: '',
        };
    }

    const compact = raw
        .replace(/\s+/g, '')
        .replace(/(?!^)\+/g, '');

    if (compact.startsWith('+')) {
        const matchedCode = knownCodes.find((code) => compact.startsWith(code));
        if (matchedCode) {
            return {
                countryCode: matchedCode,
                phoneNumber: sanitizePhoneNumber(compact.slice(matchedCode.length)),
            };
        }

        const genericMatch = compact.match(/^(\+\d{1,4})(.*)$/);
        if (genericMatch) {
            return {
                countryCode: normalizeCountryCode(genericMatch[1]),
                phoneNumber: sanitizePhoneNumber(genericMatch[2]),
            };
        }
    }

    return {
        countryCode: normalizedDefaultCode,
        phoneNumber: sanitizePhoneNumber(raw),
    };
};

export const normalizePhoneValue = (value = '', defaultCode = DEFAULT_COUNTRY_CODE) => {
    const { countryCode, phoneNumber } = splitPhoneValue(value, defaultCode);
    return formatPhoneValue(countryCode, phoneNumber);
};
