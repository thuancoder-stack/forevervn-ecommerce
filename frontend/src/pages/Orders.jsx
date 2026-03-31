import React, { useCallback, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'

const ORDER_REFRESH_INTERVAL_MS = 10000

const STATUS_DOT_STYLES = {
  'Order Placed': 'bg-sky-500',
  Packing: 'bg-amber-500',
  Shipped: 'bg-violet-500',
  'Out for Delivery': 'bg-orange-500',
  Delivered: 'bg-emerald-500',
  Cancelled: 'bg-rose-500',
}

function mapOrdersToItems(orders = []) {
  return orders
    .flatMap((order) =>
      (Array.isArray(order?.items) ? order.items : []).map((item, itemIndex) => ({
        ...item,
        orderId: order?._id,
        orderKey: `${order?._id || 'order'}-${item?._id || item?.name || 'item'}-${itemIndex}`,
        status: order?.status,
        payment: order?.payment,
        paymentMethod: order?.paymentMethod,
        date: order?.date,
        amount: order?.amount,
      })),
    )
    .sort((a, b) => (Number(b?.date) || 0) - (Number(a?.date) || 0))
}

const Orders = () => {
  const { backendUrl, token, currency, navigate, logout } = useContext(ShopContext)
  const [orderData, setOrderData] = useState([])
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accountLoading, setAccountLoading] = useState(true)

  const handleUnauthorized = useCallback(
    (message) => {
      const normalized = String(message || '').toLowerCase()
      const isUnauthorized =
        normalized.includes('not authorized') ||
        normalized.includes('invalid token') ||
        normalized.includes('jwt')

      if (!isUnauthorized) return false

      logout?.()
      return true
    },
    [logout],
  )

  const fetchCurrentAccount = useCallback(async () => {
    if (!token) {
      setAccount(null)
      setAccountLoading(false)
      return null
    }

    try {
      setAccountLoading(true)

      const response = await axios.post(
        `${backendUrl}/api/user/me`,
        {},
        { headers: { token } },
      )

      if (response?.data?.success) {
        setAccount(response.data.user || null)
        return response.data.user || null
      }

      if (handleUnauthorized(response?.data?.message)) return null
      setAccount(null)
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || ''
      if (handleUnauthorized(message)) return null
      console.error(error)
      setAccount(null)
    } finally {
      setAccountLoading(false)
    }

    return null
  }, [backendUrl, handleUnauthorized, token])

  const fetchOrderData = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) {
        setOrderData([])
        setLoading(false)
        return []
      }

      try {
        if (!silent) {
          setLoading(true)
        }

        const response = await axios.post(
          `${backendUrl}/api/order/userorders`,
          {},
          { headers: { token } },
        )

        if (response?.data?.success) {
          const mappedOrders = mapOrdersToItems(response.data.orders)
          setOrderData(mappedOrders)
          return mappedOrders
        }

        if (handleUnauthorized(response?.data?.message)) return []
      } catch (error) {
        const message = error?.response?.data?.message || error?.message || ''
        if (handleUnauthorized(message)) return []
        console.error(error)
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }

      return []
    },
    [backendUrl, handleUnauthorized, token],
  )
  
  const handleCancelOrder = async (orderId) => {
    if (!token || !orderId) return;
    
    if (!window.confirm('Bạn có chắc chắn muốn huỷ đơn hàng này không?')) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/order/cancel`,
        { orderId },
        { headers: { token } }
      );

      if (response?.data?.success) {
        toast.success('Đã huỷ đơn hàng thành công');
        fetchOrderData({ silent: true });
      } else {
        toast.error(response?.data?.message || 'Không thể huỷ đơn hàng');
      }
    } catch (error) {
       toast.error(error?.response?.data?.message || 'Lỗi khi huỷ đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderData = useCallback(() => {
    fetchOrderData()
  }, [fetchOrderData])

  useEffect(() => {
    if (!token) {
      setAccount(null)
      setOrderData([])
      setLoading(false)
      setAccountLoading(false)
      return undefined
    }

    fetchCurrentAccount()
    fetchOrderData()

    const intervalId = window.setInterval(() => {
      fetchOrderData({ silent: true })
    }, ORDER_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [fetchCurrentAccount, fetchOrderData, token])

  const getStatusDotClass = (status) => STATUS_DOT_STYLES[status] || 'bg-gray-400'

  const getItemImage = (imageValue) => {
    if (Array.isArray(imageValue)) {
      return imageValue[0] || 'https://dummyimage.com/120x160/e5e7eb/6b7280&text=No+Image'
    }

    return imageValue || 'https://dummyimage.com/120x160/e5e7eb/6b7280&text=No+Image'
  }

  const isLoggedIn = Boolean(token)
  const isInitialLoading = isLoggedIn && (loading || accountLoading)
  const visibleOrders = isLoggedIn ? orderData : []

  return (
    <div className='space-y-6 py-4 sm:space-y-8 sm:py-6'>
      <section className='section-shell px-5 py-6 sm:px-8 sm:py-8'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <Title text1={'MY'} text2={'ORDERS'} />
            <p className='mt-4 text-sm leading-7 text-slate-500 sm:text-base'>
              {account?.email
                ? `Current account: ${account.email}. Order status syncs from admin automatically every 10 seconds.`
                : 'Order status syncs from admin automatically every 10 seconds.'}
            </p>
          </div>

          {isLoggedIn ? (
            <button
              onClick={loadOrderData}
              disabled={loading}
              className='inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white disabled:opacity-60'
              type='button'
            >
              {loading ? 'Loading...' : 'Refresh Status'}
            </button>
          ) : null}
        </div>
      </section>

      <section className='space-y-4'>
        {!isLoggedIn ? (
          <div className='section-shell px-6 py-12 text-center'>
            <p className='text-base font-semibold text-slate-900'>Please sign in to view the orders placed by your account.</p>
            <button
              onClick={() => navigate('/login')}
              className='mt-5 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white'
              type='button'
            >
              Go To Login
            </button>
          </div>
        ) : isInitialLoading ? (
          <div className='section-shell px-6 py-12 text-center text-sm text-slate-500'>
            Loading your orders...
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className='section-shell px-6 py-12 text-center'>
            <p className='text-base font-semibold text-slate-900'>No orders found for this account.</p>
            {account?.email ? (
              <p className='mt-2 text-sm text-slate-400'>Signed in as {account.email}</p>
            ) : null}
            <p className='mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500'>
              Orders only appear for the same account that placed them. If admin can see the order but this page is empty, sign in with that account here.
            </p>
            <button
              onClick={() => navigate('/login')}
              className='mt-5 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white'
              type='button'
            >
              Switch Account
            </button>
          </div>
        ) : (
          visibleOrders.map((item) => (
            <article
              key={item.orderKey}
              className='section-shell flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between'
            >
              <div className='flex items-start gap-4 sm:gap-5'>
                <img
                  className='h-24 w-20 rounded-[20px] object-cover'
                  src={getItemImage(item.image)}
                  alt={item.name || 'Product'}
                />

                <div>
                  <p className='text-lg font-semibold text-slate-900'>{item.name}</p>
                  <p className='mt-1 text-xs uppercase tracking-[0.18em] text-slate-400'>
                    Order #{String(item.orderId || '').slice(-8).toUpperCase()}
                  </p>

                  <div className='mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500'>
                    <p>
                      {currency}
                      {Number(item.price || 0).toLocaleString('vi-VN')} VND
                    </p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Size: {item.size || 'Free'}</p>
                    {item.color && (
                      <p className='flex items-center gap-1.5'>
                        <span
                          className='inline-block h-3 w-3 rounded-full border border-slate-200'
                          style={{ backgroundColor: item.color.toLowerCase() }}
                        />
                        {item.color}
                      </p>
                    )}
                  </div>

                  <p className='mt-2 text-sm text-slate-500'>
                    Date:{' '}
                    <span>
                      {item.date ? new Date(item.date).toLocaleString('vi-VN') : '-'}
                    </span>
                  </p>

                  <p className='mt-2 text-sm text-slate-500'>
                    Payment:{' '}
                    <span>
                      {item.paymentMethod || 'COD'} {item.payment ? '(Paid)' : '(Pending)'}
                    </span>
                  </p>
                </div>
              </div>

              <div className='flex flex-col gap-3 lg:min-w-[220px] lg:items-end'>
                <div className='flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-slate-700'>
                  <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(item.status)}`} />
                  {item.status || 'Unknown'}
                </div>

                <button
                  onClick={loadOrderData}
                  className='rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white'
                  type='button'
                >
                  Track Order
                </button>
                
                {(item.status === 'Order Placed' || item.status === 'Packing') && (
                  <button
                    onClick={() => handleCancelOrder(item.orderId)}
                    className='rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-500 hover:text-white'
                    type='button'
                  >
                    Huỷ đơn hàng
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

export default Orders
