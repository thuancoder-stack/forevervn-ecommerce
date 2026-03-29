import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl as defaultBackendUrl } from '../config'
import { DollarSign, ShoppingBag, Boxes, CircleCheckBig, Package } from 'lucide-react'
import { assets } from '../assets/assets'

const getStatusClass = (status) => {
  if (status === 'Delivered') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'Shipped' || status === 'Out for Delivery') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'Packing') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-gray-200 bg-gray-50 text-gray-600'
}

const Dashboard = ({ token, backendUrl: backendUrlFromProps }) => {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [],
  )

  const handleUnauthorized = useCallback((message) => {
    const normalized = (message || '').toLowerCase()
    if (!normalized.includes('not authorized')) return false

    toast.error('Session expired, please login again')
    localStorage.removeItem('token')
    setTimeout(() => window.location.reload(), 400)
    return true
  }, [])

  const fetchData = useCallback(async () => {
    if (!apiBaseUrl || !token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [productRes, orderRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/product/list`, { headers: { token }, timeout: 20000 }),
        axios.post(`${apiBaseUrl}/api/order/list`, {}, { headers: { token }, timeout: 20000 }),
      ])

      if (productRes.data?.success) {
        setProducts(Array.isArray(productRes.data.products) ? productRes.data.products : [])
      } else {
        if (handleUnauthorized(productRes.data?.message)) return
        toast.error(productRes.data?.message || 'Cannot load products')
      }

      if (orderRes.data?.success) {
        setOrders(Array.isArray(orderRes.data.orders) ? orderRes.data.orders : [])
      } else {
        if (handleUnauthorized(orderRes.data?.message)) return
        toast.error(orderRes.data?.message || 'Cannot load orders')
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Cannot load dashboard'
      if (handleUnauthorized(message)) return
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, handleUnauthorized, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totals = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order?.amount) || 0), 0)
    const activeOrders = orders.filter((order) => order?.status !== 'Delivered').length
    const categoryCount = new Set(products.map((item) => item?.category).filter(Boolean)).size
    const deliveredCount = orders.filter((order) => order?.status === 'Delivered').length

    return [
      {
        label: 'Total Revenue',
        value: currencyFormatter.format(totalRevenue),
        note: `${orders.length} orders total`,
        icon: DollarSign,
        color: 'text-pink-600',
        bg: 'bg-pink-50',
      },
      {
        label: 'Active Orders',
        value: activeOrders,
        note: `${deliveredCount} delivered`,
        icon: ShoppingBag,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
      },
      {
        label: 'Products Listed',
        value: products.length,
        note: `${categoryCount} categories active`,
        icon: Boxes,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
      },
      {
        label: 'Paid Orders',
        value: orders.filter((order) => order?.payment).length,
        note: loading ? 'Syncing data...' : 'Live from database',
        icon: CircleCheckBig,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
    ]
  }, [currencyFormatter, loading, orders, products])

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => (Number(b?.date) || 0) - (Number(a?.date) || 0))
        .slice(0, 5),
    [orders],
  )

  const getCustomerName = (address = {}) =>
    [address?.firstName, address?.lastName].filter(Boolean).join(' ') || 'Unknown customer'

  return (
    <div className='w-full px-4 py-6 md:px-6'>
      <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-xl font-semibold text-gray-800'>Overview Dashboard</p>
          <p className='text-sm text-gray-500'>Here's what's happening in your store today.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className='inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-[1240px]'>
        {totals.map(({ label, value, note, icon: Icon, color, bg }, index) => (
          <div key={label} className='flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md'>
            <div className='flex items-center justify-between pb-3'>
              <h3 className='text-sm font-medium text-gray-600'>{label}</h3>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <div className='text-2xl font-bold text-gray-800'>{value}</div>
            <p className='mt-2 text-xs text-gray-400'>{note}</p>
          </div>
        ))}
      </div>

      <div className='max-w-[1240px]'>
        <p className='mb-4 text-lg font-semibold text-gray-800'>Recent Orders</p>
        
        <div className='w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
          <div className='hidden grid-cols-[80px_1fr_1fr_1fr_140px] items-center border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 px-6 py-3 text-[13px] font-semibold text-gray-700 md:grid'>
            <span>Icon</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Total</span>
            <span className='text-right'>Status</span>
          </div>

          {loading ? (
            <div className='px-6 py-12 text-center text-sm text-gray-500'>
              Loading recent orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className='px-6 py-12 text-center text-sm text-gray-500'>
              No recent orders found.
            </div>
          ) : (
            <div className='divide-y divide-gray-100'>
              {recentOrders.map((order, index) => {
                const customer = getCustomerName(order?.address)
                return (
                  <div
                    key={order?._id}
                    className={`grid md:grid-cols-[80px_1fr_1fr_1fr_140px] items-center p-4 md:px-6 md:py-3 text-[13px] transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    } hover:bg-sky-50/50`}
                  >
                    <div className='hidden md:flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-sky-50'>
                      <Package size={20} className='text-gray-400' />
                    </div>

                    <div className='mb-2 md:mb-0'>
                      <p className='font-medium text-gray-800'>{customer}</p>
                      <p className='text-[11px] text-gray-400 md:hidden'>
                        #{String(order?._id || '').slice(-8).toUpperCase()}
                      </p>
                    </div>

                    <div className='mb-2 md:mb-0 text-gray-600'>
                      {order?.date ? new Date(order.date).toLocaleDateString('vi-VN') : '-'}
                    </div>

                    <div className='mb-3 md:mb-0 font-semibold text-emerald-700'>
                      {currencyFormatter.format(Number(order?.amount) || 0)}
                    </div>

                    <div className='md:text-right'>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClass(order?.status)}`}>
                        {order?.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
