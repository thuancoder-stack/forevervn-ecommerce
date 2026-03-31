export const regions = {
    "Miền Bắc": [
        "Hà Nội", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai", "Điện Biên", "Lai Châu", "Sơn La", "Yên Bái",
        "Hoà Bình", "Thái Nguyên", "Lạng Sơn", "Quảng Ninh", "Bắc Giang", "Phú Thọ", "Vĩnh Phúc", "Bắc Ninh", "Hải Dương",
        "Hải Phòng", "Hưng Yên", "Thái Bình", "Hà Nam", "Nam Định", "Ninh Bình"
    ],
    "Miền Trung": [
        "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi",
        "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"
    ],
    "Miền Nam": [
        "TP Hồ Chí Minh", "Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "Long An", "Tiền Giang",
        "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "An Giang", "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng",
        "Bạc Liêu", "Cà Mau"
    ]
};

export const getRegionByProvince = (provinceName) => {
    if (!provinceName) return null;
    const p = provinceName.replace(/^(Tỉnh|Thành phố)\s+/i, "").trim();
    for (const region in regions) {
        if (regions[region].some(prov => p.includes(prov) || prov.includes(p))) {
            return region;
        }
    }
    return null;
};

export const getShippingFeeByRegion = (region) => {
    switch (region) {
        case "Miền Bắc": return 45000;
        case "Miền Trung": return 30000;
        case "Miền Nam": return 45000;
        default: return 30000; // Default
    }
};
