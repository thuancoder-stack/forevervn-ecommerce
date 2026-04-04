export const formatMoney = (price, language = 'vi') => {
    const n = Number(price);
    if (!Number.isFinite(n)) return String(price ?? '');

    return language === 'vi'
        ? `${n.toLocaleString('vi-VN')} VN\u0110`
        : `${n.toLocaleString('en-US')} VND`;
};

export const formatDate = (value, language = 'vi') => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(date);
};
