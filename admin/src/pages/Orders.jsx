import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { backendUrl as defaultBackendUrl } from '../config'

const ORDER_STATUSES = ['Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered']
const REFRESH_INTERVAL_MS = 10000

const STATUS_STYLES = {
  'Order Placed': 'border-sky-200 bg-sky-50 text-sky-700',
  Packing: 'border-amber-200 bg-amber-50 text-amber-700',
  Shipped: 'border-violet-200 bg-violet-50 text-violet-700',
  'Out for Delivery': 'border-orange-200 bg-orange-50 text-orange-700',
  Delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const Orders = ({ token, backendUrl: backendUrlFromProps }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')

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

  const visibleOrders = useMemo(
    () => [...orders].sort((a, b) => (Number(b?.date) || 0) - (Number(a?.date) || 0)),
    [orders],
  )

  const formatCustomerName = (address = {}) =>
    [address?.firstName, address?.lastName].filter(Boolean).join(' ') || 'Unknown customer'

  const formatAddress = (address = {}) =>
    [address?.street, address?.city, address?.state, address?.country, address?.zipcode]
      .filter(Boolean)
      .join(', ')

  const getItemCount = (items = []) =>
    items.reduce((total, item) => total + (Number(item?.quantity) || 0), 0)

  const getStatusBadgeClass = (status) =>
    STATUS_STYLES[status] || 'border-gray-200 bg-gray-50 text-gray-600'

  return (
    <div className='w-full px-4 py-6 md:px-6'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-xl font-semibold text-gray-800'>Orders</p>
          <p className='text-sm text-gray-500'>Admin and frontend sync order status from the database every 10 seconds.</p>
        </div>

        <button
          onClick={() => fetchOrders()}
          disabled={loading}
          className='inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {loading ? 'Loading...' : 'Refresh orders'}
        </button>
      </div>

      {loading ? (
        <div className='rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm'>
          Loading orders...
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className='rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-400 shadow-sm'>
          No orders found.
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {visibleOrders.map((order, index) => {
            const statusOptions = ORDER_STATUSES.includes(order?.status)
              ? ORDER_STATUSES
              : [order?.status, ...ORDER_STATUSES].filter(Boolean)
            const orderId = String(order?._id || '')
            const isUpdating = updatingId === orderId

            return (
              <div
                key={orderId || index}
                className={`grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors ${
                  index % 2 === 0 ? 'hover:border-rose-200' : 'hover:border-sky-200'
                } lg:grid-cols-[72px_minmax(0,2.2fr)_minmax(0,1.15fr)_220px]`}
              >
                <div className='flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 via-white to-sky-50'>
                  <img className='w-10' src={assets.parcel_icon} alt='order' />
                </div>

                <div className='min-w-0 space-y-3'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm font-semibold text-gray-800'>Order #{orderId.slice(-8).toUpperCase()}</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(order?.status)}`}>
                      {order?.status || 'Unknown'}
                    </span>
                  </div>

                  <div className='space-y-1 text-sm text-gray-600'>
                    {(Array.isArray(order?.items) ? order.items : []).map((item, itemIndex) => (
                      <p key={`${orderId}-${item?._id || item?.name || 'item'}-${itemIndex}`}>
                        {item?.name || 'Product'} x {Number(item?.quantity) || 0}
                        {item?.size ? ` (${item.size})` : ''}
                      </p>
                    ))}
                  </div>

                  <div className='space-y-1 text-sm text-gray-600'>
                    <p className='font-medium text-gray-800'>{formatCustomerName(order?.address)}</p>
                    <p>{formatAddress(order?.address) || 'No address provided'}</p>
                    {order?.address?.phone ? <p>{order.address.phone}</p> : null}
                  </div>
                </div>

                <div className='grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-1'>
                  <p>
                    <span className='font-medium text-gray-800'>Items:</span> {getItemCount(order?.items || [])}
                  </p>
                  <p>
                    <span className='font-medium text-gray-800'>Method:</span> {order?.paymentMethod || 'COD'}
                  </p>
                  <p>
                    <span className='font-medium text-gray-800'>Payment:</span>{' '}
                    <span className={order?.payment ? 'text-emerald-600' : 'text-amber-600'}>
                      {order?.payment ? 'Done' : 'Pending'}
                    </span>
                  </p>
                  <p>
                    <span className='font-medium text-gray-800'>Date:</span>{' '}
                    {order?.date ? new Date(order.date).toLocaleString('vi-VN') : '-'}
                  </p>
                </div>

                <div className='flex flex-col justify-between gap-4'>
                  <div>
                    <p className='text-xs uppercase tracking-[0.16em] text-gray-400'>Total</p>
                    <p className='mt-1 text-xl font-semibold text-emerald-700'>
                      {currencyFormatter.format(Number(order?.amount) || 0)}
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400'>
                      Update status
                    </label>
                    <select
                      value={order?.status || ORDER_STATUSES[0]}
                      onChange={(event) => handleStatusChange(orderId, event.target.value)}
                      disabled={isUpdating}
                      className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <p className='text-xs text-gray-400'>
                      {isUpdating
                        ? 'Updating order status...'
                        : 'Changes are saved to the database and reflected on the frontend automatically.'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Orders