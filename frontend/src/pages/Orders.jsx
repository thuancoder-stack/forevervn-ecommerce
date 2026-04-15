import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import Title from '../components/Title';
import { formatMoney } from '../lib/locale';

const ORDER_REFRESH_INTERVAL_MS = 10000;

const STATUS_DOT_STYLES = {
    'Pending Payment': 'bg-amber-400',
    'Order Placed': 'bg-sky-500',
    Packing: 'bg-amber-500',
    Shipped: 'bg-violet-500',
    'Out for Delivery': 'bg-orange-500',
    Delivered: 'bg-emerald-500',
    Received: 'bg-emerald-600',
    Cancelled: 'bg-rose-500',
};

const FILTER_STATUSES = ['All', 'Pending Payment', 'Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const copy = {
    vi: {
        title1: 'ĐƠN',
        title2: 'HÀNG',
        subtitleWithEmail: (email) => `Theo dõi trạng thái đơn hàng của tài khoản ${email}. Dữ liệu đồng bộ tự động mỗi 10 giây.`,
        subtitle: 'Theo dõi trạng thái đơn hàng và quay lại mua nhanh các món bạn đã thích.',
        searchPlaceholder: 'Tìm theo mã đơn, tên sản phẩm...',
        allStatuses: 'Tất cả trạng thái',
        refresh: 'Làm mới',
        refreshing: 'Đang tải...',
        signInRequired: 'Vui lòng đăng nhập để xem đơn hàng',
        goToLogin: 'Đến đăng nhập',
        loading: 'Đang tải đơn hàng...',
        noOrders: 'Chưa có đơn hàng nào cho tài khoản này.',
        noOrdersFiltered: 'Không có đơn hàng phù hợp bộ lọc hiện tại.',
        signedInAs: (email) => `Đang đăng nhập bằng ${email}`,
        switchAccount: 'Đổi tài khoản',
        orderCode: 'Mã đơn',
        placedAt: 'Đặt lúc',
        shippingTo: 'Giao tới',
        total: 'Tổng cộng',
        payment: 'Thanh toán',
        cod: 'COD',
        paid: 'Đã thanh toán',
        pending: 'Chưa thanh toán',
        quantity: 'SL',
        size: 'Size',
        color: 'Màu',
        viewProduct: 'Xem sản phẩm',
        confirmReceived: 'Đã nhận được hàng',
        buyAgain: 'Mua lại',
        cancelOrder: 'Hủy đơn hàng',
        trackOrder: 'Theo dõi đơn',
        itemsCount: (count) => `${count} sản phẩm`,
        orderCancelled: 'Đã hủy đơn hàng thành công',
        cancelFailed: 'Không thể hủy đơn hàng',
        cancelConfirm: 'Bạn có chắc muốn hủy đơn hàng này không?',
        confirmReceivedSuccess: 'Đã xác nhận nhận hàng',
        confirmReceivedFailed: 'Không thể xác nhận nhận hàng',
        productUnavailable: 'Sản phẩm này hiện không còn để xem lại',
        buyAgainSuccess: (count) => `Đã thêm ${count} sản phẩm vào giỏ`,
        buyAgainPartial: (added, skipped) => `Đã thêm ${added} sản phẩm, ${skipped} sản phẩm không đủ tồn kho`,
        buyAgainFailed: 'Các sản phẩm này hiện không còn đủ tồn kho để mua lại',
        unknown: 'Không xác định',
        filterSummary: (count) => `${count} đơn hàng`,
        statuses: {
            All: 'Tất cả',
            'Order Placed': 'Đã đặt',
            Packing: 'Đang đóng gói',
            Shipped: 'Đã gửi hàng',
            'Out for Delivery': 'Đang giao',
            Delivered: 'Đã giao',
            Received: 'Đã nhận hàng',
            Cancelled: 'Đã hủy',
            'Return Requested': 'Yêu cầu trả hàng',
            Returning: 'Đang trả hàng',
            Returned: 'Đã hoàn trả',
        },
        returnOrder: 'Trả hàng/Hoàn tiền',
        returnReasonPlaceholder: 'Vui lòng ghi rõ lý do trả hàng (hàng lỗi, rách, không đúng mẫu...)...',
        returnImages: 'Tải ảnh minh chứng (tối đa 4 ảnh)',
        returnImagesHint: 'Chọn tối đa 4 ảnh để shop duyệt nhanh hơn.',
        returnImagesLimit: 'Tối đa 4 ảnh / Max 4 images',
        returnSuccess: 'Đã gửi yêu cầu, vui lòng chờ duyệt',
        returnFailed: 'Không thể gửi yêu cầu',
        returnReasonLabel: 'Lý do hoàn trả',
        returnReasonHint: 'Mô tả rõ lỗi sản phẩm, sai size hoặc lý do bạn muốn hoàn.',
        returnOrderSummary: 'Thông tin đơn hoàn',
        submitReturn: 'Gửi yêu cầu',
        cancel: 'Đóng',
        refundMethodTitle: 'Phương thức hoàn tiền',
        refundWallet: 'Hoàn về ví điện tử',
        refundWalletHint: 'Nhận tiền nhanh sau khi shop xác nhận hoàn tất.',
        refundBank: 'Hoàn về tài khoản ngân hàng',
        refundBankHint: 'Dùng khi bạn muốn nhận tiền trực tiếp qua ngân hàng.',
        bankDetailsTitle: 'Thông tin tài khoản nhận hoàn',
        bankName: 'Tên ngân hàng',
        accountNumber: 'Số tài khoản',
        accountName: 'Tên chủ tài khoản',
        bankDetailsRequired: 'Vui lòng nhập đủ thông tin tài khoản hoàn tiền',
        removeImage: 'Xóa',
    },
    en: {
        title1: 'MY',
        title2: 'ORDERS',
        subtitleWithEmail: (email) => `Track the orders linked to ${email}. Status updates sync automatically every 10 seconds.`,
        subtitle: 'Track every order status and quickly buy the pieces you want again.',
        searchPlaceholder: 'Search by order code or product name...',
        allStatuses: 'All statuses',
        refresh: 'Refresh',
        refreshing: 'Loading...',
        signInRequired: 'Please sign in to view your orders',
        goToLogin: 'Go To Login',
        loading: 'Loading your orders...',
        noOrders: 'No orders found for this account.',
        noOrdersFiltered: 'No orders match the current search or filter.',
        signedInAs: (email) => `Signed in as ${email}`,
        switchAccount: 'Switch Account',
        orderCode: 'Order code',
        placedAt: 'Placed at',
        shippingTo: 'Ship to',
        total: 'Total',
        payment: 'Payment',
        cod: 'COD',
        paid: 'Paid',
        pending: 'Pending',
        quantity: 'Qty',
        size: 'Size',
        color: 'Color',
        viewProduct: 'View product',
        confirmReceived: 'Received order',
        buyAgain: 'Buy Again',
        cancelOrder: 'Cancel Order',
        trackOrder: 'Track Order',
        itemsCount: (count) => `${count} item${count === 1 ? '' : 's'}`,
        orderCancelled: 'Order cancelled successfully',
        cancelFailed: 'Unable to cancel order',
        cancelConfirm: 'Are you sure you want to cancel this order?',
        confirmReceivedSuccess: 'Order confirmed as received',
        confirmReceivedFailed: 'Unable to confirm receipt',
        productUnavailable: 'This product is no longer available to preview',
        buyAgainSuccess: (count) => `Added ${count} item${count === 1 ? '' : 's'} to cart`,
        buyAgainPartial: (added, skipped) => `Added ${added} item${added === 1 ? '' : 's'} to cart, ${skipped} item${skipped === 1 ? '' : 's'} could not be added due to stock limits`,
        buyAgainFailed: 'These items are no longer available in stock',
        unknown: 'Unknown',
        filterSummary: (count) => `${count} orders`,
        statuses: {
            All: 'All',
            'Order Placed': 'Order Placed',
            Packing: 'Packing',
            Shipped: 'Shipped',
            'Out for Delivery': 'Out for Delivery',
            Delivered: 'Delivered',
            Received: 'Received',
            Cancelled: 'Cancelled',
            'Return Requested': 'Return Requested',
            Returning: 'Returning',
            Returned: 'Returned',
        },
        returnOrder: 'Return/Refund',
        returnReasonPlaceholder: 'Please detail the reason (defective, wrong size, torn...)...',
        returnImages: 'Upload evidence images (max 4)',
        returnImagesHint: 'Upload up to 4 photos that clearly show the issue.',
        returnImagesLimit: 'Max 4 images',
        returnSuccess: 'Return request submitted, pending review',
        returnFailed: 'Unable to submit request',
        returnReasonLabel: 'Return reason',
        returnReasonHint: 'Describe the issue clearly so the shop can review faster.',
        returnOrderSummary: 'Return order summary',
        submitReturn: 'Submit Request',
        cancel: 'Close',
        refundMethodTitle: 'Refund Method',
        refundWallet: 'Transfer to E-Wallet (Instant)',
        refundWalletHint: 'Fastest option after the return is confirmed.',
        refundBank: 'Bank Transfer (Takes time)',
        refundBankHint: 'Use this if you want the refund sent to your bank account.',
        bankDetailsTitle: 'Refund account details',
        bankName: 'Bank Name',
        accountNumber: 'Account Number',
        accountName: 'Account Holder Name',
        bankDetailsRequired: 'Please enter complete bank account details',
        removeImage: 'Remove',
    },
};

const normalizeColor = (value) => String(value || 'Any');
const normalizeSize = (value) => String(value || 'Free');
const EMPTY_BANK_DETAILS = { bankName: '', accountNumber: '', accountName: '' };

const Orders = () => {
    const { backendUrl, token, logout, navigate, products, cartItems, updateCartQty, getProductStock } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copy[language];
    const location = useLocation();
    const pendingPaymentLabel = language === 'vi' ? 'Chờ thanh toán' : 'Pending Payment';
    const retryPaymentLabel = language === 'vi' ? 'Thanh toán lại' : 'Pay Again';
    const retryPaymentFailedLabel = language === 'vi' ? 'Không thể tạo lại phiên thanh toán' : 'Unable to recreate the payment session';
    const paymentExpiresAtLabel = language === 'vi' ? 'Hết hạn lúc' : 'Expires at';
    const paymentWindowExpiredLabel = language === 'vi' ? 'Phiên thanh toán đã hết hạn' : 'Payment window expired';
    const sepayCancelledLabel =
        language === 'vi'
            ? 'Bạn đã thoát khỏi SePay. Đơn vẫn đang chờ thanh toán, bạn có thể thanh toán lại trước khi hết hạn.'
            : 'You exited SePay. This order is still pending and can be paid again before it expires.';
    const sepayErrorLabel =
        language === 'vi'
            ? 'Thanh toán SePay chưa hoàn tất. Bạn có thể thanh toán lại trước khi hết hạn.'
            : 'The SePay payment was not completed. You can try paying again before it expires.';
    const paymentConfirmedLabel =
        language === 'vi' ? 'SePay đã xác nhận thanh toán thành công' : 'SePay payment confirmed successfully';

    const [orders, setOrders] = useState([]);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accountLoading, setAccountLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [confirmingId, setConfirmingId] = useState('');
    const [buyingAgainId, setBuyingAgainId] = useState('');
    const [retryingId, setRetryingId] = useState('');
    
    // Return Request State
    const [returnModalOrder, setReturnModalOrder] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [returnImages, setReturnImages] = useState([]);
    const [refundMethod, setRefundMethod] = useState('Wallet');
    const [bankDetails, setBankDetails] = useState({ ...EMPTY_BANK_DETAILS });
    const [submittingReturn, setSubmittingReturn] = useState(false);

    const returnImagePreviews = useMemo(
        () =>
            returnImages.map((file, index) => ({
                id: `${file.name}-${file.size}-${index}`,
                name: file.name,
                url: URL.createObjectURL(file),
            })),
        [returnImages],
    );

    useEffect(() => {
        return () => {
            returnImagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
        };
    }, [returnImagePreviews]);

    const isBankRefundInvalid =
        refundMethod === 'Bank' &&
        ['bankName', 'accountNumber', 'accountName'].some((key) => !String(bankDetails[key] || '').trim());

    const closeReturnModal = useCallback(() => {
        setReturnModalOrder(null);
        setReturnReason('');
        setReturnImages([]);
        setRefundMethod('Wallet');
        setBankDetails({ ...EMPTY_BANK_DETAILS });
    }, []);

    const openReturnModal = useCallback((order) => {
        setReturnModalOrder(order);
        setReturnReason('');
        setReturnImages([]);
        setRefundMethod('Wallet');
        setBankDetails({ ...EMPTY_BANK_DETAILS });
    }, []);

    const handleReturnImagesChange = useCallback(
        (event) => {
            const files = Array.from(event.target.files || []);

            if (files.length > 4) {
                toast.error(t.returnImagesLimit);
                event.target.value = '';
                return;
            }

            setReturnImages(files);
        },
        [t.returnImagesLimit],
    );

    const handleRemoveReturnImage = useCallback((index) => {
        setReturnImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    }, []);

    const statusLabel = useCallback(
        (status) => {
            if (status === 'Pending Payment') return pendingPaymentLabel;
            return t.statuses[status] || status || t.unknown;
        },
        [pendingPaymentLabel, t.statuses, t.unknown],
    );

    const handleUnauthorized = useCallback(
        (message) => {
            const normalized = String(message || '').toLowerCase();
            const isUnauthorized = normalized.includes('not authorized') || normalized.includes('invalid token') || normalized.includes('jwt');

            if (!isUnauthorized) return false;
            logout?.();
            return true;
        },
        [logout],
    );

    const fetchCurrentAccount = useCallback(async () => {
        if (!token) {
            setAccount(null);
            setAccountLoading(false);
            return null;
        }

        try {
            setAccountLoading(true);
            const response = await axios.post(`${backendUrl}/api/user/me`, {}, { headers: { token } });

            if (response?.data?.success) {
                setAccount(response.data.user || null);
                return response.data.user || null;
            }

            if (handleUnauthorized(response?.data?.message)) return null;
            setAccount(null);
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || '';
            if (handleUnauthorized(message)) return null;
            console.error(error);
            setAccount(null);
        } finally {
            setAccountLoading(false);
        }

        return null;
    }, [backendUrl, handleUnauthorized, token]);

    const fetchOrderData = useCallback(
        async ({ silent = false } = {}) => {
            if (!token) {
                setOrders([]);
                setLoading(false);
                return [];
            }

            try {
                if (!silent) setLoading(true);
                const response = await axios.post(`${backendUrl}/api/order/userorders`, {}, { headers: { token } });

                if (response?.data?.success) {
                    const nextOrders = Array.isArray(response.data.orders)
                        ? response.data.orders.sort((a, b) => (Number(b?.date) || 0) - (Number(a?.date) || 0))
                        : [];
                    setOrders(nextOrders);
                    return nextOrders;
                }

                if (handleUnauthorized(response?.data?.message)) return [];
            } catch (error) {
                const message = error?.response?.data?.message || error?.message || '';
                if (handleUnauthorized(message)) return [];
                console.error(error);
            } finally {
                if (!silent) setLoading(false);
            }

            return [];
        },
        [backendUrl, handleUnauthorized, token],
    );

    useEffect(() => {
        if (!token) {
            setAccount(null);
            setOrders([]);
            setLoading(false);
            setAccountLoading(false);
            return undefined;
        }

        fetchCurrentAccount();
        fetchOrderData();

        const intervalId = window.setInterval(() => {
            fetchOrderData({ silent: true });
        }, ORDER_REFRESH_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [fetchCurrentAccount, fetchOrderData, token]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sepayStatus = String(params.get('sepay_status') || '').trim().toLowerCase();

        if (!sepayStatus) return;

        if (sepayStatus === 'success') {
            toast.success(paymentConfirmedLabel);
        } else if (sepayStatus === 'cancelled') {
            toast.info(sepayCancelledLabel);
        } else if (sepayStatus === 'error') {
            toast.info(sepayErrorLabel);
        }

        navigate('/orders', { replace: true });
    }, [location.search, navigate, paymentConfirmedLabel, sepayCancelledLabel, sepayErrorLabel]);

    const normalizedOrders = useMemo(
        () => orders.map((order) => ({ ...order, status: order?.status || 'Order Placed', items: Array.isArray(order?.items) ? order.items : [] })),
        [orders],
    );

    const matchesStatusFilter = useCallback(
        (orderStatus) => {
            if (statusFilter === 'All') return true;
            if (statusFilter === 'Delivered') return ['Delivered', 'Received'].includes(orderStatus);
            return orderStatus === statusFilter;
        },
        [statusFilter],
    );

    const visibleOrders = useMemo(() => {
        const keyword = String(search || '').trim().toLowerCase();

        return normalizedOrders.filter((order) => {
            if (!matchesStatusFilter(order.status)) return false;
            if (!keyword) return true;

            const haystack = [
                String(order?._id || '').slice(-8),
                statusLabel(order.status),
                order?.address?.fullName,
                ...(order.items || []).map((item) => item?.name),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(keyword);
        });
    }, [matchesStatusFilter, normalizedOrders, search, statusLabel]);

    const isLoggedIn = Boolean(token);
    const isInitialLoading = isLoggedIn && (loading || accountLoading);

    const loadOrderData = useCallback(() => {
        fetchOrderData();
    }, [fetchOrderData]);

    const formatPaymentExpiry = useCallback(
        (value) => {
            if (!value) return '';

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return '';

            return date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
        },
        [language],
    );

    const handleCancelOrder = async (orderId) => {
        if (!token || !orderId) return;
        if (!window.confirm(t.cancelConfirm)) return;

        try {
            setLoading(true);
            const response = await axios.post(`${backendUrl}/api/order/cancel`, { orderId }, { headers: { token } });

            if (response?.data?.success) {
                toast.success(response.data.message || t.orderCancelled);
                fetchOrderData({ silent: true });
            } else {
                toast.error(response?.data?.message || t.cancelFailed);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || t.cancelFailed);
        } finally {
            setLoading(false);
        }
    };

    const handleRetryPayment = async (orderId) => {
        if (!token || !orderId || retryingId) return;

        try {
            setRetryingId(orderId);
            const response = await axios.post(
                `${backendUrl}/api/order/retry-sepay`,
                { orderId },
                { headers: { token } },
            );

            if (!response?.data?.success || !response.data.checkoutUrl || !response.data.checkoutFields) {
                toast.error(response?.data?.message || retryPaymentFailedLabel);
                return;
            }

            const { checkoutUrl, checkoutFields } = response.data;
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
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || retryPaymentFailedLabel);
        } finally {
            setRetryingId('');
        }
    };

    const handleConfirmReceived = async (orderId) => {
        if (!token || !orderId || confirmingId) return;

        try {
            setConfirmingId(orderId);
            const response = await axios.post(`${backendUrl}/api/order/confirm-received`, { orderId }, { headers: { token } });

            if (response?.data?.success) {
                toast.success(response.data.message || t.confirmReceivedSuccess);
                fetchOrderData({ silent: true });
                return;
            }

            toast.error(response?.data?.message || t.confirmReceivedFailed);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.confirmReceivedFailed);
        } finally {
            setConfirmingId('');
        }
    };

    const openProductDetail = (item) => {
        const productId = String(item?._id || item?.id || '');

        if (!productId) {
            toast.info(t.productUnavailable);
            return;
        }

        const hasLiveProduct = products.some(
            (product) => String(product?._id || product?.id || '') === productId,
        );

        if (!hasLiveProduct) {
            navigate('/collection');
            return;
        }

        navigate(`/product/${productId}`);
    };

    const handleBuyAgain = async (order) => {
        if (!order?._id || buyingAgainId) return;

        try {
            setBuyingAgainId(order._id);

            let addedCount = 0;
            let skippedCount = 0;

            for (const item of order.items || []) {
                const productId = String(item?._id || item?.id || '');
                if (!productId) {
                    skippedCount += Number(item?.quantity || 0);
                    continue;
                }

                const normalizedSize = normalizeSize(item?.size);
                const normalizedColor = normalizeColor(item?.color);
                const requestedQty = Number(item?.quantity || 0) || 1;
                const currentQty = Number(cartItems?.[productId]?.[normalizedSize]?.[normalizedColor] || 0);
                const availableStock = await getProductStock(productId, normalizedSize, normalizedColor);

                if (availableStock <= currentQty) {
                    skippedCount += requestedQty;
                    continue;
                }

                const targetQty = Math.min(currentQty + requestedQty, availableStock);
                const result = await updateCartQty(productId, normalizedSize, normalizedColor, targetQty);
                const acceptedQty = Number(result?.quantity ?? targetQty);
                const delta = Math.max(acceptedQty - currentQty, 0);

                addedCount += delta;
                skippedCount += Math.max(requestedQty - delta, 0);
            }

            if (addedCount > 0 && skippedCount > 0) {
                toast.info(t.buyAgainPartial(addedCount, skippedCount));
                navigate('/cart');
                return;
            }

            if (addedCount > 0) {
                toast.success(t.buyAgainSuccess(addedCount));
                navigate('/cart');
                return;
            }

            toast.error(t.buyAgainFailed);
        } catch (error) {
            toast.error(error?.message || t.buyAgainFailed);
        } finally {
            setBuyingAgainId('');
        }
    };

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        if (!token || !returnModalOrder || !returnReason.trim() || submittingReturn) return;
        if (isBankRefundInvalid) {
            toast.error(t.bankDetailsRequired);
            return;
        }

        try {
            setSubmittingReturn(true);
            const formData = new FormData();
            formData.append('orderId', returnModalOrder._id);
            formData.append('reason', returnReason.trim());

            for (let i = 0; i < returnImages.length; i++) {
                formData.append(`image${i + 1}`, returnImages[i]);
            }
            formData.append('refundMethod', refundMethod);
            if (refundMethod === 'Bank') {
                formData.append(
                    'bankDetails',
                    JSON.stringify({
                        bankName: String(bankDetails.bankName || '').trim(),
                        accountNumber: String(bankDetails.accountNumber || '').trim(),
                        accountName: String(bankDetails.accountName || '').trim(),
                    }),
                );
            }

            const response = await axios.post(`${backendUrl}/api/return/request`, formData, { headers: { token } });

            if (response?.data?.success) {
                toast.success(t.returnSuccess || response.data.message);
                closeReturnModal();
                fetchOrderData({ silent: true });
            } else {
                toast.error(response?.data?.message || t.returnFailed);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || t.returnFailed);
        } finally {
            setSubmittingReturn(false);
        }
    };

    const getStatusDotClass = (status) => STATUS_DOT_STYLES[status] || 'bg-gray-400';

    const getItemImage = (imageValue) => {
        if (Array.isArray(imageValue)) {
            return imageValue[0] || 'https://dummyimage.com/120x160/e5e7eb/6b7280&text=No+Image';
        }

        return imageValue || 'https://dummyimage.com/120x160/e5e7eb/6b7280&text=No+Image';
    };

    const renderStatusChip = (status) => (
        <div className='flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-700'>
            <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(status)}`} />
            {statusLabel(status)}
        </div>
    );

    return (
        <div className='space-y-6 py-4 sm:space-y-8 sm:py-6'>
            <section className='section-shell px-5 py-6 sm:px-8 sm:py-8'>
                <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
                    <div>
                        <Title text1={t.title1} text2={t.title2} />
                        <p className='mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base'>
                            {account?.email ? t.subtitleWithEmail(account.email) : t.subtitle}
                        </p>
                    </div>

                    {isLoggedIn ? (
                        <button
                            onClick={loadOrderData}
                            disabled={loading}
                            className='inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white disabled:opacity-60'
                            type='button'
                        >
                            {loading ? t.refreshing : t.refresh}
                        </button>
                    ) : null}
                </div>

                {isLoggedIn ? (
                    <div className='mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]'>
                        <input
                            type='text'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t.searchPlaceholder}
                            className='rounded-full border border-[var(--border)] bg-white px-5 py-4 text-sm outline-none shadow-[0_10px_24px_rgba(15,23,42,0.05)]'
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className='rounded-full border border-[var(--border)] bg-white px-5 py-4 text-sm outline-none shadow-[0_10px_24px_rgba(15,23,42,0.05)]'
                        >
                            <option value='All'>{t.allStatuses}</option>
                            {FILTER_STATUSES.filter((status) => status !== 'All').map((status) => (
                                <option key={status} value={status}>
                                    {statusLabel(status)}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}
            </section>

            <section className='space-y-4'>
                {!isLoggedIn ? (
                    <div className='section-shell px-6 py-12 text-center'>
                        <p className='text-base font-semibold text-slate-900'>{t.signInRequired}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className='mt-5 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white'
                            type='button'
                        >
                            {t.goToLogin}
                        </button>
                    </div>
                ) : isInitialLoading ? (
                    <div className='section-shell px-6 py-12 text-center text-sm text-slate-500'>{t.loading}</div>
                ) : visibleOrders.length === 0 ? (
                    <div className='section-shell px-6 py-12 text-center'>
                        <p className='text-base font-semibold text-slate-900'>
                            {search || statusFilter !== 'All' ? t.noOrdersFiltered : t.noOrders}
                        </p>
                        {account?.email ? <p className='mt-2 text-sm text-slate-400'>{t.signedInAs(account.email)}</p> : null}
                        <button
                            onClick={() => navigate('/login')}
                            className='mt-5 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white'
                            type='button'
                        >
                            {t.switchAccount}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className='px-2 text-sm font-medium text-slate-500'>{t.filterSummary(visibleOrders.length)}</div>

                        {visibleOrders.map((order) => {
                            const status = order.status || 'Order Placed';
                            const isPendingPayment = status === 'Pending Payment' && order?.paymentMethod === 'Banking' && !order?.payment;
                            const paymentExpiryText = formatPaymentExpiry(order?.paymentExpiresAt);
                            const canCancel = ['Order Placed', 'Packing'].includes(status);
                            const canRetryPayment = isPendingPayment;
                            const canConfirmReceived = status === 'Delivered';
                            const canBuyAgain = ['Delivered', 'Received'].includes(status);
                            const canReturn = ['Delivered', 'Received'].includes(status);

                            return (
                                <article key={order._id} className='section-shell overflow-hidden px-5 py-5 sm:px-6 sm:py-6'>
                                    <div className='flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between'>
                                        <div className='space-y-3'>
                                            <div className='flex flex-wrap items-center gap-3'>
                                                {renderStatusChip(status)}
                                                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
                                                    {t.itemsCount((order.items || []).length)}
                                                </span>
                                            </div>

                                            <div className='space-y-1.5 text-sm text-slate-500'>
                                                <p><span className='font-semibold text-slate-900'>{t.orderCode}:</span> #{String(order._id || '').slice(-8).toUpperCase()}</p>
                                                <p><span className='font-semibold text-slate-900'>{t.placedAt}:</span> {order.date ? new Date(order.date).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}</p>
                                                <p><span className='font-semibold text-slate-900'>{t.shippingTo}:</span> {order?.address?.fullName}</p>
                                                <p className='max-w-3xl leading-6'>
                                                    {[
                                                        order?.address?.addressDetail,
                                                        order?.address?.ward,
                                                        order?.address?.district,
                                                        order?.address?.province,
                                                    ].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className='space-y-2 text-sm lg:text-right'>
                                            <p className='font-semibold text-slate-900'>{t.total}: {formatMoney(Number(order?.amount || 0), language)}</p>
                                            <p className='text-slate-500'>
                                                {t.payment}:{' '}
                                                <span className='font-medium text-slate-700'>
                                                    {order?.paymentMethod || t.cod} {order?.payment ? `(${t.paid})` : `(${t.pending})`}
                                                </span>
                                            </p>
                                            {isPendingPayment ? (
                                                <p className='text-xs text-amber-600'>
                                                    {paymentExpiryText
                                                        ? `${paymentExpiresAtLabel}: ${paymentExpiryText}`
                                                        : paymentWindowExpiredLabel}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className='space-y-4 py-5'>
                                        {(order.items || []).map((item, index) => {
                                            const itemColor = normalizeColor(item?.color);

                                            return (
                                                <div
                                                    key={`${order._id}-${String(item?._id || item?.id || item?.name || index)}-${index}`}
                                                    className='flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between'
                                                >
                                                    <div className='flex items-start gap-4'>
                                                        <button type='button' onClick={() => openProductDetail(item)} className='shrink-0'>
                                                            <img
                                                                className='h-24 w-20 rounded-[18px] object-cover'
                                                                src={getItemImage(item.image)}
                                                                alt={item.name || 'Product'}
                                                            />
                                                        </button>

                                                        <div>
                                                            <button
                                                                type='button'
                                                                onClick={() => openProductDetail(item)}
                                                                className='text-left text-base font-semibold text-slate-900 transition hover:text-slate-600'
                                                            >
                                                                {item.name}
                                                            </button>

                                                            <div className='mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500'>
                                                                <p>{formatMoney(Number(item.price || 0), language)}</p>
                                                                <p>{t.quantity}: {Number(item.quantity || 0)}</p>
                                                                <p>{t.size}: {item.size || 'Free'}</p>
                                                                {itemColor && itemColor !== 'Any' ? <p>{t.color}: {itemColor}</p> : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className='flex flex-wrap gap-2 sm:justify-end'>
                                                        <button
                                                            type='button'
                                                            onClick={() => openProductDetail(item)}
                                                            className='rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-900 hover:text-white'
                                                        >
                                                            {t.viewProduct}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className='flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5'>
                                        <button
                                            onClick={loadOrderData}
                                            className='rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white'
                                            type='button'
                                        >
                                            {t.trackOrder}
                                        </button>

                                        {canRetryPayment ? (
                                            <button
                                                onClick={() => handleRetryPayment(order._id)}
                                                disabled={retryingId === order._id}
                                                className='rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-500 hover:text-white disabled:opacity-60'
                                                type='button'
                                            >
                                                {retryPaymentLabel}
                                            </button>
                                        ) : null}

                                        {canConfirmReceived ? (
                                            <button
                                                onClick={() => handleConfirmReceived(order._id)}
                                                disabled={confirmingId === order._id}
                                                className='rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-500 hover:text-white disabled:opacity-60'
                                                type='button'
                                            >
                                                {t.confirmReceived}
                                            </button>
                                        ) : null}

                                        {canBuyAgain ? (
                                            <button
                                                onClick={() => handleBuyAgain(order)}
                                                disabled={buyingAgainId === order._id}
                                                className='rounded-full border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white disabled:opacity-60'
                                                type='button'
                                            >
                                                {t.buyAgain}
                                            </button>
                                        ) : null}

                                        {canReturn ? (
                                            <button
                                                onClick={() => openReturnModal(order)}
                                                className='rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-500 hover:text-white'
                                                type='button'
                                            >
                                                {t.returnOrder}
                                            </button>
                                        ) : null}

                                        {canCancel ? (
                                            <button
                                                onClick={() => handleCancelOrder(order._id)}
                                                className='rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-500 hover:text-white'
                                                type='button'
                                            >
                                                {t.cancelOrder}
                                            </button>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </>
                )}
            </section>

            {returnModalOrder && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm'>
                    <div className='flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl'>
                        <div className='flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7'>
                            <h3 className='text-lg font-bold text-slate-900'>
                                {t.returnOrder} - #{String(returnModalOrder._id).slice(-8).toUpperCase()}
                            </h3>
                            <button
                                onClick={closeReturnModal}
                                className='rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                </svg>
                            </button>
                        </div>
                        <div className='flex-1 overflow-y-auto px-6 py-5 sm:px-7'>
                            <div className='space-y-5'>
                                <div className='rounded-3xl border border-slate-200 bg-slate-50/80 p-4'>
                                    <div className='flex flex-wrap items-start justify-between gap-3'>
                                        <div>
                                            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>{t.returnOrderSummary}</p>
                                            <p className='mt-2 text-lg font-bold text-slate-900'>#{String(returnModalOrder._id).slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div className='rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm'>
                                            {t.itemsCount((returnModalOrder.items || []).length)} • {formatMoney(Number(returnModalOrder.amount || 0), language)}
                                        </div>
                                    </div>

                                    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                                        {(returnModalOrder.items || []).slice(0, 2).map((item, index) => (
                                            <div
                                                key={`${String(item?._id || item?.id || item?.name || index)}-${index}`}
                                                className='flex items-center gap-3 rounded-2xl bg-white p-3'
                                            >
                                                <img
                                                    src={getItemImage(item.image)}
                                                    alt={item.name || 'Product'}
                                                    className='h-16 w-14 rounded-2xl object-cover'
                                                />
                                                <div className='min-w-0'>
                                                    <p className='truncate text-sm font-semibold text-slate-900'>{item.name}</p>
                                                    <p className='mt-1 text-xs text-slate-500'>
                                                        {formatMoney(Number(item.price || 0), language)} • {t.quantity}: {Number(item.quantity || 0)}
                                                    </p>
                                                    <p className='mt-1 text-xs text-slate-400'>
                                                        {t.size}: {item.size || 'Free'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className='mb-2 text-sm font-semibold text-slate-700'>{t.returnReasonLabel}</p>
                                    <p className='mb-3 text-xs text-slate-500'>{t.returnReasonHint}</p>
                                    <textarea
                                        className='min-h-[136px] w-full rounded-3xl border border-slate-200 px-4 py-4 text-sm outline-none transition focus:border-slate-400'
                                        placeholder={t.returnReasonPlaceholder}
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className='rounded-3xl border border-slate-200 p-4'>
                                    <div className='flex flex-wrap items-center justify-between gap-3'>
                                        <div>
                                            <p className='text-sm font-semibold text-slate-700'>{t.returnImages}</p>
                                            <p className='mt-1 text-xs text-slate-500'>{t.returnImagesHint}</p>
                                        </div>
                                        <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'>
                                            {returnImages.length}/4
                                        </span>
                                    </div>

                                    <input
                                        type='file'
                                        multiple
                                        accept='image/*'
                                        onChange={handleReturnImagesChange}
                                        className='mt-4 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-100'
                                    />

                                    {returnImagePreviews.length > 0 && (
                                        <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
                                            {returnImagePreviews.map((image, index) => (
                                                <div key={image.id} className='group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50'>
                                                    <img src={image.url} className='h-24 w-full object-cover' alt={image.name} />
                                                    <button
                                                        type='button'
                                                        onClick={() => handleRemoveReturnImage(index)}
                                                        className='absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100'
                                                    >
                                                        {t.removeImage}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className='rounded-3xl border border-slate-200 p-4'>
                                    <p className='text-sm font-semibold text-slate-700'>{t.refundMethodTitle}</p>
                                    <div className='mt-4 space-y-3'>
                                        <label
                                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                                                refundMethod === 'Wallet'
                                                    ? 'border-emerald-300 bg-emerald-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                name='refundMethod'
                                                type='radio'
                                                checked={refundMethod === 'Wallet'}
                                                onChange={() => setRefundMethod('Wallet')}
                                                className='mt-1 h-4 w-4 text-emerald-500'
                                            />
                                            <div>
                                                <p className='text-sm font-semibold text-slate-900'>{t.refundWallet}</p>
                                                <p className='mt-1 text-xs text-slate-500'>{t.refundWalletHint}</p>
                                            </div>
                                        </label>

                                        <label
                                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                                                refundMethod === 'Bank'
                                                    ? 'border-amber-300 bg-amber-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                name='refundMethod'
                                                type='radio'
                                                checked={refundMethod === 'Bank'}
                                                onChange={() => setRefundMethod('Bank')}
                                                className='mt-1 h-4 w-4 text-amber-500'
                                            />
                                            <div>
                                                <p className='text-sm font-semibold text-slate-900'>{t.refundBank}</p>
                                                <p className='mt-1 text-xs text-slate-500'>{t.refundBankHint}</p>
                                            </div>
                                        </label>
                                    </div>

                                    {refundMethod === 'Bank' && (
                                        <div className='mt-4 rounded-2xl bg-slate-50 p-4'>
                                            <p className='mb-3 text-sm font-semibold text-slate-700'>{t.bankDetailsTitle}</p>
                                            <div className='grid gap-3 sm:grid-cols-2'>
                                                <input
                                                    type='text'
                                                    placeholder={t.bankName}
                                                    value={bankDetails.bankName}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                    className='w-full rounded-xl border border-slate-200 p-3 text-sm outline-none'
                                                    required
                                                />
                                                <input
                                                    type='text'
                                                    placeholder={t.accountNumber}
                                                    value={bankDetails.accountNumber}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                    className='w-full rounded-xl border border-slate-200 p-3 text-sm outline-none'
                                                    required
                                                />
                                                <input
                                                    type='text'
                                                    placeholder={t.accountName}
                                                    value={bankDetails.accountName}
                                                    onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                                    className='w-full rounded-xl border border-slate-200 p-3 text-sm outline-none sm:col-span-2'
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-5 sm:px-7'>
                            <button
                                onClick={closeReturnModal}
                                className='rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100'
                                type='button'
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleReturnSubmit}
                                disabled={submittingReturn || !returnReason.trim() || isBankRefundInvalid}
                                className='rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50'
                                type='button'
                            >
                                {submittingReturn ? '...' : t.submitReturn}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
