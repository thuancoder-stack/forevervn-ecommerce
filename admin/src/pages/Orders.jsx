import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  Empty,
  Popconfirm,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import { backendUrl as defaultBackendUrl } from '../config'
import {
  adminAntdTheme,
  compactStatCardClass,
  compactStatsRowClass,
  getSelectPopupContainer,
  nativeSelectClass,
  pageShellClass,
} from '../lib/adminAntd'

const { Title, Text } = Typography

const ORDER_STATUSES = ['Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered', 'Received', 'Cancelled']
const REFRESH_INTERVAL_MS = 10000

const STATUS_COLORS = {
  'Order Placed': 'processing',
  Packing: 'gold',
  Shipped: 'purple',
  'Out for Delivery': 'orange',
  Delivered: 'success',
  Received: 'success',
  Cancelled: 'error',
}

const Orders = ({ token, backendUrl: backendUrlFromProps }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [removingId, setRemovingId] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [],
  )

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const handleUnauthorized = useCallback((message) => {
    const normalized = (message || '').toLowerCase()
    if (!normalized.includes('not authorized')) return false

    toast.error('Session expired, please login again')
    localStorage.removeItem('token')
    setTimeout(() => window.location.reload(), 400)
    return true
  }, [])

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!apiBaseUrl || !token) {
        setOrders([])
        setLoading(false)
        return
      }

      try {
        if (!silent) {
          setLoading(true)
        }

        const { data } = await axios.post(
          `${apiBaseUrl}/api/order/list`,
          {},
          { headers: { token }, timeout: 20000 },
        )

        if (data?.success) {
          setOrders(Array.isArray(data.orders) ? data.orders : [])
          return
        }

        if (handleUnauthorized(data?.message)) return
        if (!silent) {
          toast.error(data?.message || 'Cannot load orders')
        }
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Cannot load orders'
        if (handleUnauthorized(message)) return
        if (!silent) {
          toast.error(message)
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [apiBaseUrl, handleUnauthorized, token],
  )

  useEffect(() => {
    fetchOrders()

    if (!token) return undefined

    const intervalId = window.setInterval(() => {
      fetchOrders({ silent: true })
    }, REFRESH_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [fetchOrders, token])

  const handleStatusChange = async (orderId, nextStatus) => {
    if (!orderId || !nextStatus || !apiBaseUrl || !token || updatingId === orderId) return

    const previousStatus = orders.find((order) => order._id === orderId)?.status

    setUpdatingId(orderId)
    setOrders((prev) =>
      prev.map((order) => (order._id === orderId ? { ...order, status: nextStatus } : order)),
    )

    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api/order/status`,
        { orderId, status: nextStatus },
        { headers: { token }, timeout: 20000 },
      )

      if (data?.success) {
        toast.success(data.message || 'Order status updated')
        fetchOrders({ silent: true })
        return
      }

      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: previousStatus } : order)),
      )

      if (handleUnauthorized(data?.message)) return
      toast.error(data?.message || 'Cannot update order status')
    } catch (error) {
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: previousStatus } : order)),
      )

      const message = error.response?.data?.message || error.message || 'Cannot update order status'
      if (handleUnauthorized(message)) return
      toast.error(message)
    } finally {
      setUpdatingId('')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!orderId || !apiBaseUrl || !token || removingId) return

    try {
      setRemovingId(orderId)
      const { data } = await axios.post(
        `${apiBaseUrl}/api/order/delete`,
        { orderId },
        { headers: { token } },
      )

      if (data?.success) {
        toast.success(data.message || 'Order deleted')
        fetchOrders({ silent: true })
      } else {
        if (handleUnauthorized(data?.message)) return
        toast.error(data?.message || 'Cannot delete order')
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Cannot delete order'
      if (handleUnauthorized(message)) return
      toast.error(message)
    } finally {
      setRemovingId('')
    }
  }

  const visibleOrders = useMemo(() => {
    let filtered = [...orders]
    if (statusFilter !== 'All') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }
    return filtered.sort((a, b) => (Number(b?.date) || 0) - (Number(a?.date) || 0))
  }, [orders, statusFilter])

  const formatCustomerName = (address = {}) =>
    address?.fullName || [address?.firstName, address?.lastName].filter(Boolean).join(' ') || 'Unknown customer'

  const formatAddress = (address = {}) => {
    if (address?.province) {
      return [address?.addressDetail, address?.ward, address?.district, address?.province]
        .filter(Boolean)
        .join(', ')
    }

    return [address?.street, address?.city, address?.state].filter(Boolean).join(', ') || 'No address provided'
  }

  const getItemCount = (items = []) =>
    items.reduce((total, item) => total + (Number(item?.quantity) || 0), 0)

  const exportToCsv = () => {
    if (!visibleOrders.length) {
      toast.info('No orders to export')
      return
    }

    const headers = ['Order ID', 'Customer Name', 'Address', 'Items', 'Amount', 'Status', 'Date']

    const rows = visibleOrders.map((order) =>
      [
        `"${String(order?._id || '').slice(-8).toUpperCase()}"`,
        `"${formatCustomerName(order?.address)}"`,
        `"${formatAddress(order?.address)}"`,
        `"${(order.items || []).map((item) => `${item.name} x ${item.quantity}`).join(', ')}"`,
        `"${currencyFormatter.format(Number(order?.amount) || 0)}"`,
        `"${order?.status}"`,
        `"${new Date(order.date).toLocaleString('vi-VN')}"`,
      ].join(', '),
    )

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const stats = useMemo(() => {
    const pending = orders.filter((order) => ['Order Placed', 'Packing'].includes(order?.status)).length
    const delivered = orders.filter((order) => ['Delivered', 'Received'].includes(order?.status)).length
    const revenue = orders
      .filter((order) => order?.status !== 'Cancelled')
      .reduce((total, order) => total + (Number(order?.amount) || 0), 0)

    return [
      {
        key: 'total',
        title: 'Total Orders',
        value: orders.length,
        icon: <ShoppingCartOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'pending',
        title: 'Pending Fulfillment',
        value: pending,
        icon: <ClockCircleOutlined style={{ color: '#f59e0b' }} />,
      },
      {
        key: 'delivered',
        title: 'Delivered',
        value: delivered,
        icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'revenue',
        title: 'Live Revenue',
        value: currencyFormatter.format(revenue),
        icon: <WalletOutlined style={{ color: '#2563eb' }} />,
      },
    ]
  }, [currencyFormatter, orders])

  const columns = useMemo(
    () => [
      {
        title: 'Order',
        key: 'order',
        width: 170,
        render: (_, order) => (
          <div>
            <Text strong style={{ color: '#0f172a' }}>
              #{String(order?._id || '').slice(-8).toUpperCase()}
            </Text>
            <div>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {order?.date ? new Date(order.date).toLocaleString('vi-VN') : '-'}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Customer',
        key: 'customer',
        width: 280,
        render: (_, order) => (
          <div>
            <Text strong style={{ color: '#0f172a' }}>
              {formatCustomerName(order?.address)}
            </Text>
            <div>
              <Text style={{ fontSize: 12, color: '#64748b' }}>{formatAddress(order?.address)}</Text>
            </div>
            {order?.address?.phone ? (
              <div>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{order.address.phone}</Text>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: 'Items',
        key: 'items',
        width: 320,
        render: (_, order) => (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>{getItemCount(order?.items || [])} items</Text>
            </div>
            <Space size={[6, 6]} wrap>
              {(Array.isArray(order?.items) ? order.items : []).map((item, index) => (
                <Tag
                  key={`${order?._id || 'order'}-${item?._id || item?.name || 'item'}-${index}`}
                  style={{
                    marginInlineEnd: 0,
                    borderRadius: 999,
                    paddingInline: 10,
                    paddingBlock: 4,
                    borderColor: '#f1f5f9',
                    color: '#475569',
                    background: '#f8fafc',
                  }}
                >
                  {`${item?.name || 'Product'} x ${Number(item?.quantity) || 0}`}
                  {item?.size ? ` | ${item.size}` : ''}
                </Tag>
              ))}
            </Space>
          </div>
        ),
      },
      {
        title: 'Payment',
        key: 'payment',
        width: 180,
        render: (_, order) => (
          <div>
            <Text strong style={{ color: '#0f172a' }}>
              {currencyFormatter.format(Number(order?.amount) || 0)}
            </Text>
            <div>
              <Text style={{ fontSize: 12, color: '#64748b' }}>{order?.paymentMethod || 'COD'}</Text>
            </div>
            <div style={{ marginTop: 6 }}>
              <Tag color={order?.payment ? 'success' : 'gold'} style={{ borderRadius: 999, fontWeight: 600 }}>
                {order?.payment ? 'Paid' : 'Pending'}
              </Tag>
            </div>
          </div>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 220,
        render: (_, order) => {
          const orderId = String(order?._id || '')
          const statusOptions = ORDER_STATUSES.includes(order?.status)
            ? ORDER_STATUSES
            : [order?.status, ...ORDER_STATUSES].filter(Boolean)

          return (
            <div>
              <div style={{ marginBottom: 10 }}>
                <Tag color={STATUS_COLORS[order?.status] || 'default'} style={{ borderRadius: 999, fontWeight: 600 }}>
                  {order?.status || 'Unknown'}
                </Tag>
              </div>
              <select
                value={order?.status || ORDER_STATUSES[0]}
                onChange={(event) => handleStatusChange(orderId, event.target.value)}
                disabled={updatingId === orderId}
                className={nativeSelectClass}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )
        },
      },
      {
        title: 'Action',
        key: 'action',
        width: 110,
        align: 'center',
        render: (_, order) =>
          order?.status === 'Cancelled' ? (
            <Popconfirm
              title='Delete cancelled order'
              description='This will permanently remove the order record.'
              okText='Delete'
              cancelText='Cancel'
              okButtonProps={{ danger: true, loading: removingId === order?._id }}
              onConfirm={() => handleDeleteOrder(order?._id)}
            >
              <Button type='text' danger shape='circle' icon={<DeleteOutlined />} />
            </Popconfirm>
          ) : (
            <Text type='secondary' style={{ fontSize: 12 }}>
              -
            </Text>
          ),
      },
    ],
    [currencyFormatter, handleStatusChange, removingId, updatingId],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Orders Flow
            </Title>
            <Text type='secondary'>Monitor fulfillment, update statuses and export the current order feed.</Text>
          </div>

          <Space size={12} wrap>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${nativeSelectClass} min-w-[180px]`}
            >
              <option value='All'>All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button size='large' icon={<ReloadOutlined />} loading={loading} onClick={() => fetchOrders()}>
              Refresh orders
            </Button>
            <Button size='large' icon={<ExportOutlined />} onClick={exportToCsv}>
              Export CSV
            </Button>
          </Space>
        </div>

        <div className={compactStatsRowClass}>
          {stats.map((item) => (
            <Card key={item.key} bordered={false} className={compactStatCardClass}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: '#0f172a' }} />
            </Card>
          ))}
        </div>

        <Card
          bordered={false}
          className='shadow-sm'
          title={
            <div>
              <div className='font-semibold text-slate-900'>Order Directory</div>
              <div className='text-xs font-normal text-slate-400'>Auto-refreshes every 10 seconds from the live database.</div>
            </div>
          }
        >
          <Table
            rowKey='_id'
            columns={columns}
            dataSource={visibleOrders}
            loading={loading}
            size='middle'
            pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }}
            scroll={{ x: 1280 }}
            locale={{
              emptyText: <Empty description='No orders found' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default Orders
