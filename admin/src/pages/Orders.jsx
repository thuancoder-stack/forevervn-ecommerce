import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'

const ORDER_STATUSES = ['Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered']

const Order = () => {
  const [orders, setOrders] = useState([])

  // Placeholder data — replace with API call
  useEffect(() => {
    setOrders([
      {
        id: 1,
        items: [{ name: 'Slim Fit T-Shirt', quantity: 2, size: 'M' }],
        address: { firstName: 'John', lastName: 'Doe', street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipcode: '10001', phone: '555-0101' },
        paymentMethod: 'COD',
        payment: false,
        date: Date.now(),
        amount: 50,
        status: 'Order Placed',
      },
      {
        id: 2,
        items: [{ name: 'Floral Dress', quantity: 1, size: 'S' }],
        address: { firstName: 'Jane', lastName: 'Smith', street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'USA', zipcode: '90001', phone: '555-0202' },
        paymentMethod: 'Stripe',
        payment: true,
        date: Date.now() - 86400000,
        amount: 40,
        status: 'Shipped',
      },
    ])
  }, [])

  const handleStatusChange = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  return (
    <div className='p-6 w-full'>
      <p className='mb-4 font-semibold text-lg'>Orders</p>

      <div className='flex flex-col gap-4'>
        {orders.map(order => (
          <div
            key={order.id}
            className='grid grid-cols-1 md:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-4 border border-gray-200 rounded-md p-4 bg-white shadow-sm text-sm'
          >
            {/* Parcel Icon */}
            <div className='flex items-start'>
              <img className='w-12' src={assets.parcel_icon} alt='order' />
            </div>

            {/* Items + Address */}
            <div>
              <div className='mb-2'>
                {order.items.map((item, i) => (
                  <p key={i} className='font-medium'>
                    {item.name} x {item.quantity} <span className='text-gray-500'>({item.size})</span>
                    {i < order.items.length - 1 && ','}
                  </p>
                ))}
              </div>
              <p className='text-gray-600'>
                {order.address.firstName} {order.address.lastName}
              </p>
              <p className='text-gray-500 text-xs'>
                {order.address.street}, {order.address.city}, {order.address.state}, {order.address.country} {order.address.zipcode}
              </p>
              <p className='text-gray-500 text-xs mt-1'>{order.address.phone}</p>
            </div>

            {/* Payment */}
            <div className='flex flex-col gap-1'>
              <p>Items: {order.items.reduce((a, i) => a + i.quantity, 0)}</p>
              <p>Method: {order.paymentMethod}</p>
              <p>
                Payment:{' '}
                <span className={order.payment ? 'text-green-500 font-medium' : 'text-red-400 font-medium'}>
                  {order.payment ? 'Done' : 'Pending'}
                </span>
              </p>
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>

            {/* Amount */}
            <div className='flex items-center'>
              <p className='font-semibold text-base'>${order.amount}</p>
            </div>

            {/* Status Selector */}
            <div className='flex items-center'>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className='border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-pink-400 w-full'
              >
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <p className='text-center text-gray-400 py-10'>No orders found.</p>
        )}
      </div>
    </div>
  )
}

export default Order
