import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { backendUrl as defaultBackendUrl } from '../config'

const List = ({ token, setToken, backendUrl: backendUrlFromProps }) => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState('')

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

  const handleUnauthorized = useCallback(
    (message) => {
      const normalized = (message || '').toLowerCase()
      if (!normalized.includes('not authorized')) return false

      toast.error('Session expired, please login again')
      setToken?.('')
      localStorage.removeItem('token')
      setTimeout(() => window.location.reload(), 400)
      return true
    },
    [setToken],
  )

  const normalizeImage = (imageValue) => {
    if (Array.isArray(imageValue)) return imageValue[0] || assets.upload_area
    return imageValue || assets.upload_area
  }

  const visibleProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b?.date || 0) - (a?.date || 0))
        .map((item) => ({
          id: item?._id,
          name: item?.name || '-',
          category: item?.category || '-',
          price: Number(item?.price || 0),
          image: normalizeImage(item?.image),
        })),
    [products],
  )

  const fetchProducts = useCallback(async () => {
    if (!apiBaseUrl || !token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data } = await axios.get(`${apiBaseUrl}/api/product/list`, {
        headers: { token },
        timeout: 20000,
      })

      if (data?.success) {
        setProducts(Array.isArray(data.products) ? data.products : [])
        return
      }

      if (handleUnauthorized(data?.message)) return
      toast.error(data?.message || 'Cannot load products')
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Cannot load products'
      if (handleUnauthorized(message)) return
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, handleUnauthorized, token])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleRemove = async (id) => {
    if (!id || removingId || !apiBaseUrl || !token) return

    try {
      setRemovingId(id)
      const { data } = await axios.post(
        `${apiBaseUrl}/api/product/remove`,
        { id },
        { headers: { token }, timeout: 20000 },
      )

      if (data?.success) {
        toast.success(data.message || 'Product removed')
        setProducts((prev) => prev.filter((item) => item._id !== id))
        return
      }

      if (handleUnauthorized(data?.message)) return
      toast.error(data?.message || 'Remove failed')
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Remove failed'
      if (handleUnauthorized(message)) return
      toast.error(message)
    } finally {
      setRemovingId('')
    }
  }

  return (
    <div className='w-full px-4 py-6 md:px-6'>
      <p className='mb-4 text-xl font-semibold text-gray-800'>All Products List</p>

      <div className='w-full max-w-[1020px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='grid grid-cols-[90px_2fr_1fr_1fr_100px] items-center border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 px-4 py-3 text-[13px] font-semibold text-gray-700'>
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span className='text-center'>Action</span>
        </div>

        {loading ? (
          <div className='grid grid-cols-[90px_2fr_1fr_1fr_90px] px-4 py-8 text-center text-sm text-gray-500'>
            <span className='col-span-5'>Loading products...</span>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className='grid grid-cols-[90px_2fr_1fr_1fr_90px] px-4 py-8 text-center text-sm text-gray-500'>
            <span className='col-span-5'>No products found.</span>
          </div>
        ) : (
          visibleProducts.map((product, index) => (
            <div
              key={product.id}
              className={`grid min-h-[76px] grid-cols-[90px_2fr_1fr_1fr_100px] items-center border-b border-gray-100 px-4 py-2 text-[13px] text-gray-700 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
              } hover:bg-rose-50/50`}
            >
              <div className='flex justify-start'>
                <div className='flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50'>
                  <img
                    src={product.image}
                    alt={product.name}
                    className='h-full w-full object-contain p-1'
                  />
                </div>
              </div>

              <span className='pr-3 font-medium text-gray-700'>{product.name}</span>
              <span className='text-gray-600'>{product.category}</span>
              <span className='font-semibold text-emerald-700'>{currencyFormatter.format(product.price)}</span>

              <div className='flex items-center justify-center gap-1'>
                <button
                  onClick={() => navigate(`/update/${product.id}`)}
                  className='inline-flex h-8 w-12 items-center justify-center rounded-lg border border-transparent text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50'
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemove(product.id)}
                  disabled={removingId === product.id}
                  className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-base font-semibold leading-none text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40'
                >
                  {removingId === product.id ? '...' : 'X'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default List