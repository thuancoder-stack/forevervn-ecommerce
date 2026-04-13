import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const translations = {
  vi: {
    navbar: {
      panel: 'Bảng điều khiển quản trị',
      workspace: 'Không gian vận hành cửa hàng',
      light: 'Sáng',
      dark: 'Tối',
      logout: 'Đăng xuất',
    },
    sidebar: {
      groups: {
        CORE: 'Chính',
        CATALOG: 'Danh mục',
        COMMERCE: 'Thương mại',
      },
      items: {
        dashboard: 'Tổng quan',
        employees: 'Nhân viên',
        customers: 'Khách hàng',
        categories: 'Danh mục',
        subCategories: 'Danh mục con',
        add: 'Thêm sản phẩm',
        list: 'Danh sách sản phẩm',
        banners: 'Banner',
        reviews: 'Đánh giá',
        importBatch: 'Nhập kho',
        bulkOperation: 'Smart Ops',
        vouchers: 'Voucher',
        orders: 'Đơn hàng',
        returns: 'Hoàn trả',
        auditLogs: 'Nhật ký',
      },
    },
    login: {
      admin: 'Quản trị',
      eyebrow: 'Bảng điều khiển',
      titleMain: 'Điều hành gọn,',
      titleAccent: 'tập trung hơn.',
      description: 'Quản lý sản phẩm, đơn hàng và hiệu suất cửa hàng trong một không gian gọn gàng hơn.',
      chips: [
        'Đăng sản phẩm với cấu trúc gọn hơn',
        'Duyệt tồn kho và đơn hàng nhanh hơn',
        'Giữ logic backend cũ, chỉ làm sạch giao diện quản trị',
      ],
      secureAccess: 'Truy cập bảo mật',
      signIn: 'Đăng nhập',
      signInDescription: 'Dùng tài khoản quản trị để tiếp tục.',
      email: 'Email',
      emailPlaceholder: 'ban@example.com',
      password: 'Mật khẩu',
      showPassword: 'Hiện mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
      submit: 'Đăng nhập',
      welcomeBack: 'Chào mừng quay lại',
      loginFailed: 'Đăng nhập thất bại',
      noBackend: 'Thiếu VITE_BACKEND_URL trong .env',
      noToken: 'Máy chủ chưa trả về token',
      copyright: 'Forever. Đã đăng ký bản quyền.',
    },
    orders: {
      allStatuses: 'Tất cả trạng thái',
      refresh: 'Làm mới',
      export: 'Xuất CSV',
      liveRevenue: 'Doanh thu thực',
      revenueHelp: 'Doanh thu không tính đơn đã hủy và tự cập nhật theo dữ liệu hiện tại.',
      orderDirectory: 'Danh sách đơn hàng',
      orderDirectoryHelp: 'Tự làm mới mỗi 10 giây từ dữ liệu đang chạy.',
      noOrders: 'Chưa có đơn hàng',
      order: 'Đơn hàng',
      customer: 'Khách hàng',
      items: 'Sản phẩm',
      payment: 'Thanh toán',
      status: 'Trạng thái',
      action: 'Thao tác',
      paid: 'Đã thanh toán',
      pending: 'Chờ thanh toán',
      itemsCount: 'sản phẩm',
      unknownCustomer: 'Khách chưa xác định',
      noAddress: 'Chưa có địa chỉ',
      productFallback: 'Sản phẩm',
      ordersLabel: 'đơn',
      deleteTitle: 'Xóa đơn đã hủy',
      deleteDescription: 'Thao tác này sẽ xóa vĩnh viễn đơn hàng.',
      delete: 'Xóa',
      cancel: 'Hủy',
      exportEmpty: 'Không có đơn để xuất',
      loadFailed: 'Không tải được đơn hàng',
      statusUpdated: 'Đã cập nhật trạng thái đơn hàng',
      statusUpdateFailed: 'Không thể cập nhật trạng thái đơn hàng',
      deleted: 'Đã xóa đơn hàng',
      deleteFailed: 'Không thể xóa đơn hàng',
      sessionExpired: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
    },
    statuses: {
      'Order Placed': 'Đã đặt hàng',
      Packing: 'Đang đóng gói',
      Shipped: 'Đã gửi hàng',
      'Out for Delivery': 'Đang giao',
      Delivered: 'Đã giao',
      Received: 'Đã nhận',
      'Return Requested': 'Yêu cầu trả hàng',
      Returning: 'Đang gửi trả',
      Returned: 'Đã hoàn trả',
      Cancelled: 'Đã hủy',
      'No orders': 'Chưa có đơn',
    },
  },
  en: {
    navbar: {
      panel: 'Admin dashboard',
      workspace: 'Commerce operations workspace',
      light: 'Light',
      dark: 'Dark',
      logout: 'Logout',
    },
    sidebar: {
      groups: {
        CORE: 'Core',
        CATALOG: 'Catalog',
        COMMERCE: 'Commerce',
      },
      items: {
        dashboard: 'Dashboard',
        employees: 'Employees',
        customers: 'Customers',
        categories: 'Categories',
        subCategories: 'Sub-categories',
        add: 'Add items',
        list: 'List items',
        banners: 'Banners',
        reviews: 'Reviews',
        importBatch: 'Imports Hub',
        bulkOperation: 'Smart Ops',
        vouchers: 'Vouchers',
        orders: 'Orders',
        returns: 'Returns',
        auditLogs: 'Audit Logs',
      },
    },
    login: {
      admin: 'Admin',
      eyebrow: 'Admin Panel',
      titleMain: 'Clean control,',
      titleAccent: 'sharper focus.',
      description: 'Manage products, orders and store performance from one refined editorial dashboard.',
      chips: [
        'Product publishing with cleaner structure',
        'Faster inventory and order review',
        'Same backend logic, cleaner admin surface',
      ],
      secureAccess: 'Secure Access',
      signIn: 'Login',
      signInDescription: 'Use your admin credentials to continue.',
      email: 'Email address',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      submit: 'Login',
      welcomeBack: 'Welcome back!',
      loginFailed: 'Login failed',
      noBackend: 'Missing VITE_BACKEND_URL in .env',
      noToken: 'Server did not return a token',
      copyright: 'Forever. All rights reserved.',
    },
    orders: {
      allStatuses: 'All statuses',
      refresh: 'Refresh',
      export: 'Export CSV',
      liveRevenue: 'Live Revenue',
      revenueHelp: 'Revenue excludes cancelled orders and updates with the current feed.',
      orderDirectory: 'Order Directory',
      orderDirectoryHelp: 'Auto-refreshes every 10 seconds from the live database.',
      noOrders: 'No orders found',
      order: 'Order',
      customer: 'Customer',
      items: 'Items',
      payment: 'Payment',
      status: 'Status',
      action: 'Action',
      paid: 'Paid',
      pending: 'Pending',
      itemsCount: 'items',
      unknownCustomer: 'Unknown customer',
      noAddress: 'No address provided',
      productFallback: 'Product',
      ordersLabel: 'orders',
      deleteTitle: 'Delete cancelled order',
      deleteDescription: 'This action permanently removes the order record.',
      delete: 'Delete',
      cancel: 'Cancel',
      exportEmpty: 'No orders to export',
      loadFailed: 'Cannot load orders',
      statusUpdated: 'Order status updated',
      statusUpdateFailed: 'Cannot update order status',
      deleted: 'Order deleted',
      deleteFailed: 'Cannot delete order',
      sessionExpired: 'Session expired, please login again',
    },
    statuses: {
      'Order Placed': 'Order Placed',
      Packing: 'Packing',
      Shipped: 'Shipped',
      'Out for Delivery': 'Out for Delivery',
      Delivered: 'Delivered',
      Received: 'Received',
      'Return Requested': 'Return Requested',
      Returning: 'Returning',
      Returned: 'Returned',
      Cancelled: 'Cancelled',
      'No orders': 'No orders',
    },
  },
}

const AdminLocaleContext = createContext(null)

const getByPath = (source, path) =>
  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source)

export const AdminLocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => localStorage.getItem('admin-locale') || 'vi')

  useEffect(() => {
    localStorage.setItem('admin-locale', locale)
  }, [locale])

  const value = useMemo(() => {
    const dictionary = translations[locale] || translations.en

    return {
      locale,
      setLocale,
      toggleLocale: () => setLocale((prev) => (prev === 'vi' ? 'en' : 'vi')),
      t: (path, fallback = '') => getByPath(dictionary, path) ?? fallback,
      statusLabel: (status) => getByPath(dictionary, `statuses.${status}`) ?? status,
    }
  }, [locale])

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>
}

export const useAdminLocale = () => {
  const context = useContext(AdminLocaleContext)
  if (!context) {
    throw new Error('useAdminLocale must be used within AdminLocaleProvider')
  }
  return context
}
