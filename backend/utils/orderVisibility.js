const PENDING_BANKING_ORDER_QUERY = {
    paymentMethod: 'Banking',
    payment: false,
};

const buildVisibleOrderQuery = (baseQuery = {}, options = {}) => {
    const normalizedBaseQuery =
        baseQuery && typeof baseQuery === 'object' && !Array.isArray(baseQuery) ? baseQuery : {};
    const includePendingBanking = Boolean(options?.includePendingBanking);

    if (includePendingBanking) {
        return normalizedBaseQuery;
    }

    if (Object.keys(normalizedBaseQuery).length === 0) {
        return {
            $nor: [PENDING_BANKING_ORDER_QUERY],
        };
    }

    return {
        $and: [
            normalizedBaseQuery,
            {
                $nor: [PENDING_BANKING_ORDER_QUERY],
            },
        ],
    };
};

const isVisibleOrder = (order, options = {}) => {
    if (Boolean(options?.includePendingBanking)) {
        return true;
    }

    return !(String(order?.paymentMethod || '') === 'Banking' && !Boolean(order?.payment));
};

export { buildVisibleOrderQuery, isVisibleOrder };
