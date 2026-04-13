import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { backendUrl as defaultBackendUrl } from '../config'
import { useAdminLocale } from '../lib/adminLocale'
import {
  adminAntdTheme,
  compactStatCardClass,
  compactStatsRowClass,
  getSelectPopupContainer,
  compactStatsRowClass,
  getSelectPopupContainer,
  nativeSelectClass,
  pageShellClass,
} from '../lib/adminAntd'

const { Text } = Typography

const ORDER_STATUSES = ['Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered', 'Received', 'Return Requested', 'Returning', 'Returned', 'Cancelled']
const REFRESH_INTERVAL_MS = 10000

const STATUS_COLORS = {
  'Order Placed': 'processing',
  Packing: 'gold',
  Shipped: 'purple',
  'Out for Delivery': 'orange',
  Delivered: 'success',
  Received: 'success',
  'Return Requested': 'warning',
  Returning: 'warning',
  Returned: 'default',
  Cancelled: 'error',
}

const STATUS_PIE_COLORS = {
  'Order Placed': '#60a5fa',
  Packing: '#f59e0b',
  Shipped: '#8b5cf6',
  'Out for Delivery': '#fb923c',
  Delivered: '#22c55e',
  Received: '#14b8a6',
  'Return Requested': '#facc15',
  Returning: '#eab308',
  Returned: '#94a3b8',
  Cancelled: '#f87171',
}

const Orders = ({ token, backendUrl: backendUrlFromProps }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [removingId, setRemovingId] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const { t, statusLabel } = useAdminLocale()

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

    toast.error(t('orders.sessionExpired'))
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
      toast.error(data?.message || t('orders.loadFailed'))
        }
      } catch (error) {
        const message = error.response?.data?.message || error.message || t('orders.loadFailed')
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
        toast.success(data.message || t('orders.statusUpdated'))
        fetchOrders({ silent: true })
        return
      }

      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: previousStatus } : order)),
      )

      if (handleUnauthorized(data?.message)) return
      toast.error(data?.message || t('orders.statusUpdateFailed'))
    } catch (error) {
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: previousStatus } : order)),
      )

      const message = error.response?.data?.message || error.message || t('orders.statusUpdateFailed')
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
        toast.success(data.message || t('orders.deleted'))
        fetchOrders({ silent: true })
      } else {
        if (handleUnauthorized(data?.message)) return
        toast.error(data?.message || t('orders.deleteFailed'))
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || t('orders.deleteFailed')
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
    address?.fullName || [address?.firstName, address?.lastName].filter(Boolean).join(' ') || t('orders.unknownCustomer')

  const formatAddress = (address = {}) => {
    if (address?.province) {
      return [address?.addressDetail, address?.ward, address?.district, address?.province]
        .filter(Boolean)
        .join(', ')
    }

    return [address?.street, address?.city, address?.state].filter(Boolean).join(', ') || t('orders.noAddress')
  }

  const getItemCount = (items = []) =>
    items.reduce((total, item) => total + (Number(item?.quantity) || 0), 0)

  const exportToCsv = () => {
    if (!visibleOrders.length) {
      toast.info(t('orders.exportEmpty'))
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

  const orderStatusOverview = useMemo(() => {
    const counts = ORDER_STATUSES.map((status) => ({
      name: status,
      value: orders.filter((order) => order?.status === status).length,
      color: STATUS_PIE_COLORS[status] || '#cbd5e1',
    }))

    const activeCounts = counts.filter((item) => item.value > 0)
    const revenue = orders
      .filter((order) => order?.status !== 'Cancelled')
      .reduce((total, order) => total + (Number(order?.amount) || 0), 0)

    return {
      totalOrders: orders.length,
      revenue,
      counts,
      activeCounts,
      chartData:
        activeCounts.length > 0
          ? activeCounts
          : [{ name: 'No orders', value: 1, color: '#e2e8f0' }],
    }
  }, [currencyFormatter, orders])

  const columns = useMemo(
    () => [
      {
        title: t('orders.order'),
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
        title: t('orders.customer'),
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
        title: t('orders.items'),
        key: 'items',
        width: 320,
        render: (_, order) => (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>{getItemCount(order?.items || [])} {t('orders.itemsCount')}</Text>
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
                  {`${item?.name || t('orders.productFallback')} x ${Number(item?.quantity) || 0}`}
                  {item?.size ? ` | ${item.size}` : ''}
                </Tag>
              ))}
            </Space>
          </div>
        ),
      },
      {
        title: t('orders.payment'),
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
                {order?.payment ? t('orders.paid') : t('orders.pending')}
              </Tag>
            </div>
          </div>
        ),
      },
      {
        title: t('orders.status'),
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
                  {statusLabel(order?.status || 'Unknown')}
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
        title: t('orders.action'),
        key: 'action',
        width: 110,
        align: 'center',
        render: (_, order) =>
          order?.status === 'Cancelled' ? (
            <Popconfirm
              title={t('orders.deleteTitle')}
              description={t('orders.deleteDescription')}
              okText={t('orders.delete')}
              cancelText={t('orders.cancel')}
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
    [currencyFormatter, handleStatusChange, removingId, statusLabel, t, updatingId],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-3 flex justify-end'>
          <Space size={12} wrap>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${nativeSelectClass} min-w-[180px]`}
            >
              <option value='All'>{t('orders.allStatuses')}</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
            <Button size='large' icon={<ReloadOutlined />} loading={loading} onClick={() => fetchOrders()}>
              {t('orders.refresh')}
            </Button>
            <Button size='large' icon={<ExportOutlined />} onClick={exportToCsv}>
              {t('orders.export')}
            </Button>
          </Space>
        </div>

        <div className={`${compactStatsRowClass} items-stretch`}>
          <Card bordered={false} className='min-w-[430px] flex-[2.2] shadow-sm'>
            <div className='flex h-full items-center justify-center'>
              <div className='h-[220px] w-full max-w-[300px] shrink-0'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={orderStatusOverview.chartData}
                        dataKey='value'
                        nameKey='name'
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke='none'
                        labelLine={orderStatusOverview.totalOrders > 0}
                        label={({ cx, cy, midAngle, outerRadius, percent, value }) => {
                          if (!orderStatusOverview.totalOrders) return null
                          const RADIAN = Math.PI / 180
                          const radius = Number(outerRadius) + 18
                          const x = Number(cx) + radius * Math.cos(-midAngle * RADIAN)
                          const y = Number(cy) + radius * Math.sin(-midAngle * RADIAN)

                          return (
                            <text
                              x={x}
                              y={y}
                              fill='#64748b'
                              textAnchor={x > Number(cx) ? 'start' : 'end'}
                              dominantBaseline='central'
                              style={{ fontSize: 12, fontWeight: 500 }}
                            >
                              {`${value} (${Math.round(percent * 100)}%)`}
                            </text>
                          )
                        }}
                      >
                        {orderStatusOverview.chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} ${t('orders.ordersLabel')}`, statusLabel(name)]}
                        contentStyle={{
                          borderRadius: 16,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
                        }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card bordered={false} className={compactStatCardClass}>
            <Statistic
              title={t('orders.liveRevenue')}
              value={currencyFormatter.format(orderStatusOverview.revenue)}
              prefix={<WalletOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ color: '#0f172a' }}
            />
            <div className='mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
              {t('orders.revenueHelp')}
            </div>
          </Card>
        </div>

        <Card
          bordered={false}
            className='shadow-sm'
            title={
              <div>
              <div className='font-semibold text-slate-900'>{t('orders.orderDirectory')}</div>
              <div className='text-xs font-normal text-slate-400'>{t('orders.orderDirectoryHelp')}</div>
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
              emptyText: <Empty description={t('orders.noOrders')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </Card>
      </div>
    </ConfigProvider>
  )
}

export default Orders
