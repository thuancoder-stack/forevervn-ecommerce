import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { backendUrl as defaultBackendUrl } from '../config'

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const MAX_IMAGE_SIZE_MB = 5

const Add = ({ token, setToken, backendUrl: backendUrlFromProps }) => {
  const [images, setImages] = useState([null, null, null, null])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Men')
  const [subCategory, setSubCategory] = useState('Topwear')
  const [bestseller, setBestseller] = useState(false)
  const [sizes, setSizes] = useState([])
  const [customSize, setCustomSize] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const previewUrls = useMemo(
    () => images.map((file) => (file ? URL.createObjectURL(file) : assets.upload_area)),
    [images],
  )

  useEffect(
    () => () => {
      previewUrls.forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    },
    [previewUrls],
  )

  const setImageAt = (index, file) => {
    setImages((prev) => prev.map((item, i) => (i === index ? file : item)))
  }

  const handleImageChange = (index, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Chi chap nhan file anh')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Anh vuot qua ${MAX_IMAGE_SIZE_MB}MB`)
      event.target.value = ''
      return
    }

    setImageAt(index, file)
  }

  const toggleSize = (rawSize) => {
    const size = rawSize.trim().toUpperCase()
    if (!size) return

    setSizes((prev) =>
      prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size],
    )
  }

  const addCustomSize = () => {
    const size = customSize.trim().toUpperCase()
    if (!size) return

    setSizes((prev) => (prev.includes(size) ? prev : [...prev, size]))
    setCustomSize('')
  }

  const resetForm = () => {
    setImages([null, null, null, null])
    setName('')
    setDescription('')
    setPrice('')
    setCategory('Men')
    setSubCategory('Topwear')
    setBestseller(false)
    setSizes([])
    setCustomSize('')
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!apiBaseUrl) {
      toast.error('Thieu VITE_BACKEND_URL trong admin/.env')
      return
    }

    if (!token) {
      toast.error('Token khong hop le, vui long dang nhap lai')
      return
    }

    if (!images.some(Boolean)) {
      toast.error('Vui long chon it nhat 1 anh san pham')
      return
    }

    if (!sizes.length) {
      toast.error('Vui long chon it nhat 1 size')
      return
    }

    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error('Gia san pham phai lon hon 0')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('description', description.trim())
      formData.append('price', numericPrice)
      formData.append('category', category)
      formData.append('subCategory', subCategory)
      formData.append('bestseller', bestseller)
      formData.append('sizes', JSON.stringify(sizes))

      images.forEach((file, index) => {
        if (file) {
          formData.append(`image${index + 1}`, file)
        }
      })

      const { data } = await axios.post(`${apiBaseUrl}/api/product/add`, formData, {
        headers: { token },
        timeout: 20000,
      })

      if (data?.success) {
        toast.success(data.message || 'Product added')
        resetForm()
      } else {
        if ((data?.message || '').toLowerCase().includes('not authorized')) {
          toast.error('Phien dang nhap het han, vui long dang nhap lai')
          setToken?.('')
          localStorage.removeItem('token')
          setTimeout(() => window.location.reload(), 500)
          return
        }
        toast.error(data?.message || 'Khong the them san pham')
      }
    } catch (error) {
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error'
      if (isNetworkError) {
        toast.error(`Khong ket noi backend ${apiBaseUrl}. Hay bat backend va kiem tra CORS.`)
      } else {
        toast.error(error.response?.data?.message || error.message || 'Them san pham that bai')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex w-full flex-col items-start gap-4 p-6'>
      <div>
        <p className='mb-2 font-medium'>Upload Image</p>
        <div className='flex flex-wrap gap-2'>
          {images.map((file, index) => (
            <div
              key={`image-${index}`}
              className='flex flex-col items-center gap-1'
              style={{ width: '110px' }}
            >
              <label
                htmlFor={`image${index + 1}`}
                className='cursor-pointer'
                style={{ display: 'block', width: '110px', height: '110px' }}
              >
                <div
                  className='overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50'
                  style={{ width: '100%', height: '100%' }}
                >
                  <img
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: file ? 'contain' : 'cover',
                      padding: file ? '4px' : '0',
                    }}
                    src={previewUrls[index]}
                    alt={`image-${index + 1}`}
                  />
                </div>
              </label>
              <input
                onChange={(event) => handleImageChange(index, event)}
                type='file'
                id={`image${index + 1}`}
                hidden
                accept='image/*'
              />
              {file ? (
                <button
                  type='button'
                  onClick={() => setImageAt(index, null)}
                  className='text-xs text-red-500 hover:text-red-600'
                >
                  Remove
                </button>
              ) : (
                <span className='text-[10px] text-gray-400'>Max {MAX_IMAGE_SIZE_MB}MB</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className='w-full max-w-[500px]'>
        <p className='mb-2 font-medium'>Product Name</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className='w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-400'
          type='text'
          placeholder='Enter product name'
          required
        />
      </div>

      <div className='w-full max-w-[500px]'>
        <p className='mb-2 font-medium'>Product Description</p>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className='w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-400'
          rows={4}
          placeholder='Write product description here'
          required
        />
      </div>

      <div className='flex w-full max-w-[500px] flex-wrap gap-4'>
        <div className='min-w-[120px] flex-1'>
          <p className='mb-2 font-medium'>Category</p>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className='w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none'
          >
            <option value='Men'>Men</option>
            <option value='Women'>Women</option>
            <option value='Kids'>Kids</option>
          </select>
        </div>

        <div className='min-w-[120px] flex-1'>
          <p className='mb-2 font-medium'>Sub Category</p>
          <select
            value={subCategory}
            onChange={(event) => setSubCategory(event.target.value)}
            className='w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none'
          >
            <option value='Topwear'>Topwear</option>
            <option value='Bottomwear'>Bottomwear</option>
            <option value='Winterwear'>Winterwear</option>
          </select>
        </div>

        <div className='min-w-[120px] flex-1'>
          <p className='mb-2 font-medium'>Price</p>
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className='w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-400'
            type='number'
            placeholder='250000'
            min={0}
            required
          />
        </div>
      </div>

      <div className='w-full max-w-[500px]'>
        <p className='mb-2 font-medium'>Product Sizes</p>
        <div className='mb-2 flex flex-wrap gap-2'>
          {DEFAULT_SIZES.map((size) => (
            <span
              key={size}
              onClick={() => toggleSize(size)}
              className={`cursor-pointer rounded border px-4 py-1 text-sm font-medium transition-colors ${
                sizes.includes(size)
                  ? 'border-pink-500 bg-pink-500 text-white'
                  : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-pink-400'
              }`}
            >
              {size}
            </span>
          ))}
        </div>

        <div className='mb-2 flex gap-2'>
          <input
            value={customSize}
            onChange={(event) => setCustomSize(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustomSize()
              }
            }}
            className='w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-400'
            type='text'
            placeholder='Add custom size: 3XL, 41...'
          />
          <button
            type='button'
            onClick={addCustomSize}
            className='rounded border border-pink-400 px-4 py-2 text-sm font-medium text-pink-500 hover:bg-pink-50'
          >
            Add
          </button>
        </div>

        <div className='flex flex-wrap gap-2'>
          {sizes.length ? (
            sizes.map((size) => (
              <button
                key={size}
                type='button'
                onClick={() => toggleSize(size)}
                className='rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600'
              >
                {size} x
              </button>
            ))
          ) : (
            <span className='text-xs text-gray-500'>No size selected</span>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <input
          type='checkbox'
          id='bestseller'
          checked={bestseller}
          onChange={(event) => setBestseller(event.target.checked)}
          className='h-4 w-4 accent-pink-500'
        />
        <label htmlFor='bestseller' className='cursor-pointer text-sm font-medium'>
          Add to Bestseller
        </label>
      </div>

      <button
        type='submit'
        disabled={isSubmitting}
        className='rounded bg-pink-500 px-8 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {isSubmitting ? 'ADDING...' : 'ADD PRODUCT'}
      </button>
    </form>
  )
}

export default Add
