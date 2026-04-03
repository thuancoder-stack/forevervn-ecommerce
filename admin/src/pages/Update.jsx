import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BgColorsOutlined,
  DollarCircleOutlined,
  FireOutlined,
  InboxOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { Button, Card, ConfigProvider, Input, Space, Statistic, Switch, Tag, Typography } from 'antd'
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
const { TextArea } = Input

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const MAX_IMAGE_SIZE_MB = 10

const Update = ({ token, setToken, backendUrl: backendUrlFromProps }) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [images, setImages] = useState([null, null, null, null])
  const [existingImages, setExistingImages] = useState([null, null, null, null])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [oldPrice, setOldPrice] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [bestseller, setBestseller] = useState(false)
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [videoUrl, setVideoUrl] = useState('')
  const [customSize, setCustomSize] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProd, setIsLoadingProd] = useState(true)
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [allSubCategories, setAllSubCategories] = useState([])

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const previewUrls = useMemo(
    () =>
      images.map((file, index) =>
        file ? URL.createObjectURL(file) : existingImages[index] || null,
      ),
    [existingImages, images],
  )

  const galleryCount = useMemo(
    () => previewUrls.filter((_, index) => Boolean(images[index] || existingImages[index])).length,
    [existingImages, images, previewUrls],
  )

  const categoryOptions = useMemo(() => {
    const options = categories.map((item) => ({ value: item.name, label: item.name }))
    if (category && !options.find((item) => item.value === category)) {
      return [{ value: category, label: `${category} (current)` }, ...options]
    }
    return options
  }, [categories, category])

  const subCategoryOptions = useMemo(() => {
    const options = subCategories.map((item) => ({ value: item.name, label: item.name }))
    if (subCategory && !options.find((item) => item.value === subCategory)) {
      return [{ value: subCategory, label: `${subCategory} (current)` }, ...options]
    }
    return options
  }, [subCategories, subCategory])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url, index) => {
        if (typeof url === 'string' && url.startsWith('blob:') && images[index]) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [images, previewUrls])

  useEffect(() => {
    const fetchProduct = async () => {
      if (!apiBaseUrl || !id) return

      setIsLoadingProd(true)
      try {
        const { data } = await axios.post(`${apiBaseUrl}/api/product/single`, { productId: id })
        if (data?.success && data?.product) {
          const product = data.product
          setName(product.name || '')
          setDescription(product.description || '')
          setPrice(product.price || '')
          setOldPrice(product.oldPrice || '')
          setCategory(product.category || '')
          setSubCategory(product.subCategory || '')
          setBestseller(product.bestseller || false)
          setSizes(product.sizes || [])
          setColors(product.colors || [])
          setVideoUrl(product.videoUrl || '')

          if (Array.isArray(product.image)) {
            const loadedImages = [null, null, null, null]
            product.image.forEach((imageUrl, index) => {
              if (index < 4) loadedImages[index] = imageUrl
            })
            setExistingImages(loadedImages)
          }
        } else {
          toast.error(data?.message || 'Could not load product details')
          navigate('/list')
        }
      } catch (error) {
        toast.error(error.message || 'Error loading product')
      } finally {
        setIsLoadingProd(false)
      }
    }

    fetchProduct()
  }, [apiBaseUrl, id, navigate])

  const fetchData = useCallback(async () => {
    if (!apiBaseUrl) return

    try {
      const [catRes, subRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/category/list`),
        axios.get(`${apiBaseUrl}/api/sub-category/list`),
      ])

      if (catRes.data.success) {
        setCategories(catRes.data.categories.filter((item) => item.status))
      }

      if (subRes.data.success) {
        setAllSubCategories(subRes.data.subCategories.filter((item) => item.status))
      }
    } catch (error) {
      console.error('Error fetching category data:', error)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const parent = categories.find((item) => item.name === category)
    if (parent) {
      const filtered = allSubCategories.filter((item) => item.categoryId?._id === parent._id)
      setSubCategories(filtered)
      return
    }

    setSubCategories([])
  }, [allSubCategories, category, categories])

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

  const resetReplacementImages = () => {
    setImages([null, null, null, null])
  }

  const renderUploadSlot = (index, hasImage) => {
    const previewUrl = previewUrls[index]

    if (previewUrl) {
      return (
        <img
          src={previewUrl}
          alt={`product-upload-${index + 1}`}
          width={80}
          height={80}
          className={`h-full w-full ${hasImage ? 'object-contain p-2' : 'object-cover'}`}
        />
      )
    }

    return (
      <div className='flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-50 text-slate-400'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm'>
          <InboxOutlined style={{ fontSize: 16, color: '#94a3b8' }} />
        </div>
        <span className='text-[10px] font-medium'>Upload</span>
      </div>
    )
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

  const toggleColor = (color) => {
    const formattedColor = color.trim()
    if (!formattedColor) return

    setColors((prev) =>
      prev.includes(formattedColor) ? prev.filter((item) => item !== formattedColor) : [...prev, formattedColor],
    )
  }

  const addCustomColor = () => {
    const color = customColor.trim()
    if (!color) return

    setColors((prev) => (prev.includes(color) ? prev : [...prev, color]))
    setCustomColor('')
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
      formData.append('productId', id)
      formData.append('name', name.trim())
      formData.append('description', description.trim())
      formData.append('price', numericPrice)
      formData.append('oldPrice', Number(oldPrice) || 0)
      formData.append('category', category)
      formData.append('subCategory', subCategory)
      formData.append('bestseller', bestseller)
      formData.append('sizes', JSON.stringify(sizes))
      formData.append('colors', JSON.stringify(colors))
      formData.append('videoUrl', videoUrl)

      images.forEach((file, index) => {
        if (file) {
          formData.append(`image${index + 1}`, file)
        }
      })

      const { data } = await axios.post(`${apiBaseUrl}/api/product/update`, formData, {
        headers: { token },
        timeout: 20000,
      })

      if (data?.success) {
        toast.success(data.message || 'Product updated')
        navigate('/list')
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
        toast.error(error.response?.data?.message || error.message || 'Cap nhat san pham that bai')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = [
    {
      key: 'gallery',
      title: 'Gallery Slots',
      value: galleryCount,
      icon: <PictureOutlined style={{ color: '#ec4899' }} />,
    },
    {
      key: 'sizes',
      title: 'Sizes Enabled',
      value: sizes.length,
      icon: <TagsOutlined style={{ color: '#2563eb' }} />,
    },
    {
      key: 'colors',
      title: 'Colors Assigned',
      value: colors.length,
      icon: <BgColorsOutlined style={{ color: '#f97316' }} />,
    },
  ]

  if (isLoadingProd) {
    return (
      <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
        <div className={pageShellClass}>
          <Card bordered={false} className='shadow-sm' loading />
        </div>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <form onSubmit={onSubmitHandler}>
        <div className={pageShellClass}>
          <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
            <div>
              <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
                Update Product
              </Title>
              <Text type='secondary'>
                Edit the live catalog item, refresh media slots and keep pricing or category mapping current.
              </Text>
            </div>

            <Space size={12} wrap>
              <Button size='large' icon={<RollbackOutlined />} onClick={() => navigate('/list')}>
                Back to List
              </Button>
              <Button
                type='primary'
                size='large'
                htmlType='submit'
                loading={isSubmitting}
                icon={<SaveOutlined />}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Space>
          </div>

          <div className={compactStatsRowClass}>
            {stats.map((item) => (
              <Card key={item.key} bordered={false} className={compactStatCardClass}>
                <Statistic
                  title={item.title}
                  value={item.value}
                  prefix={item.icon}
                  valueStyle={{ color: '#0f172a' }}
                />
              </Card>
            ))}
          </div>

          <div className='grid gap-4 xl:grid-cols-2 2xl:grid-cols-3'>
            <Card
              bordered={false}
              className='shadow-sm'
              title={
                <Space size={10}>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500'>
                    <DollarCircleOutlined />
                  </div>
                  <div>
                    <div className='font-semibold text-slate-900'>Product Details</div>
                    <div className='text-xs font-normal text-slate-400'>
                      Update copy, pricing and the product's catalog assignment.
                    </div>
                  </div>
                </Space>
              }
            >
              <div className='space-y-4'>
                <div>
                  <Text strong style={{ color: '#0f172a' }}>
                    Product Name
                  </Text>
                  <Input
                    size='large'
                    className='mt-2'
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder='Enter product name'
                    required
                  />
                </div>

                <div>
                  <Text strong style={{ color: '#0f172a' }}>
                    Product Description
                  </Text>
                  <TextArea
                    className='mt-2'
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder='Write product description here'
                    required
                  />
                </div>

                <div className='grid gap-3 md:grid-cols-2'>
                  <div>
                    <Text strong style={{ color: '#0f172a' }}>
                      Category
                    </Text>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className={`mt-2 ${nativeSelectClass}`}
                    >
                      {!category ? <option value=''>Select category</option> : null}
                      {categoryOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Text strong style={{ color: '#0f172a' }}>
                      Sub Category
                    </Text>
                    <select
                      value={subCategory}
                      onChange={(event) => setSubCategory(event.target.value)}
                      className={`mt-2 ${nativeSelectClass}`}
                    >
                      {!subCategory ? <option value=''>Select sub-category</option> : null}
                      {subCategoryOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Text strong style={{ color: '#0f172a' }}>
                      Sell Price
                    </Text>
                    <Input
                      size='large'
                      className='mt-2'
                      type='number'
                      min={0}
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder='250000'
                      required
                    />
                  </div>

                  <div>
                    <Text strong style={{ color: '#0f172a' }}>
                      Original Price
                    </Text>
                    <Input
                      size='large'
                      className='mt-2'
                      type='number'
                      min={0}
                      value={oldPrice}
                      onChange={(event) => setOldPrice(event.target.value)}
                      placeholder='300000'
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card
              bordered={false}
              className='shadow-sm'
              title={
                <Space size={10}>
                  <div className='flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-500'>
                    <PictureOutlined />
                  </div>
                  <div>
                    <div className='font-semibold text-slate-900'>Media Gallery</div>
                    <div className='text-xs font-normal text-slate-400'>
                      Replace slots compactly without stretching the screen.
                    </div>
                  </div>
                </Space>
              }
              extra={
                <Button size='small' onClick={resetReplacementImages}>
                  Reset
                </Button>
              }
            >
              <div className='rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700'>
                New uploads replace the whole gallery in the database. Leave slots unchanged to keep current images.
              </div>

              <div className='mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4'>
                {images.map((file, index) => {
                  const hasImage = Boolean(file || existingImages[index])
                  return (
                    <div key={`image-${index}`} className='rounded-2xl border border-slate-100 bg-slate-50 p-2'>
                      <label htmlFor={`image${index + 1}`} className='block cursor-pointer'>
                        <div className='relative h-20 overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white'>
                          {renderUploadSlot(index, hasImage)}
                          <div className='absolute inset-x-1.5 bottom-1.5 rounded-lg bg-white/95 px-2 py-1 text-center text-[10px] font-semibold text-slate-500 shadow-sm'>
                            {file
                              ? `New ${index + 1}`
                              : existingImages[index]
                                ? `Current ${index + 1}`
                                : `Slot ${index + 1}`}
                          </div>
                        </div>
                      </label>

                      <input
                        id={`image${index + 1}`}
                        type='file'
                        hidden
                        accept='image/*'
                        onChange={(event) => handleImageChange(index, event)}
                      />

                      <div className='mt-1 flex items-center justify-between gap-2'>
                        <Text type='secondary' style={{ fontSize: 11 }}>
                          {MAX_IMAGE_SIZE_MB}MB max
                        </Text>
                        {file ? (
                          <Button type='text' danger size='small' onClick={() => setImageAt(index, null)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className='mt-3'>
                <Text strong style={{ color: '#0f172a' }}>
                  TikTok Video URL
                </Text>
                <Input
                  size='large'
                  className='mt-2'
                  prefix={<PlayCircleOutlined style={{ color: '#94a3b8' }} />}
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder='https://www.tiktok.com/@user/video/...'
                />
                <Text type='secondary' style={{ display: 'block', marginTop: 6, fontSize: 11 }}>
                  He thong se tu dong lay link HD khong logo.
                </Text>
              </div>
            </Card>

            <Card
              bordered={false}
              className='shadow-sm'
              title={
                <Space size={10}>
                  <div className='flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-500'>
                    <TagsOutlined />
                  </div>
                  <div>
                    <div className='font-semibold text-slate-900'>Variants & Merchandising</div>
                    <div className='text-xs font-normal text-slate-400'>
                      Keep colors, sizes and bestseller state visible in one panel.
                    </div>
                  </div>
                </Space>
              }
            >
              <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <BgColorsOutlined style={{ color: '#f97316' }} />
                      <Text strong style={{ color: '#0f172a' }}>
                        Product Colors
                      </Text>
                    </div>
                    <div className='flex gap-2'>
                      <Input
                        size='large'
                        value={customColor}
                        onChange={(event) => setCustomColor(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            addCustomColor()
                          }
                        }}
                        placeholder='Add color: Black, Red, #FF0000...'
                      />
                      <Button size='large' onClick={addCustomColor} icon={<PlusOutlined />}>
                        Add
                      </Button>
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {colors.length ? (
                        colors.map((color) => (
                          <Tag
                            key={color}
                            closable
                            onClose={(event) => {
                              event.preventDefault()
                              toggleColor(color)
                            }}
                            style={{
                              borderRadius: 999,
                              padding: '6px 12px',
                              borderColor: '#fed7aa',
                              backgroundColor: '#fff7ed',
                              color: '#ea580c',
                              fontWeight: 600,
                            }}
                          >
                            {color}
                          </Tag>
                        ))
                      ) : (
                        <Text type='secondary'>No colors selected</Text>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center gap-2'>
                      <TagsOutlined style={{ color: '#2563eb' }} />
                      <Text strong style={{ color: '#0f172a' }}>
                        Product Sizes
                      </Text>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {DEFAULT_SIZES.map((size) => (
                        <Button
                          key={size}
                          size='middle'
                          type={sizes.includes(size) ? 'primary' : 'default'}
                          className='!rounded-full !px-4'
                          onClick={() => toggleSize(size)}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>

                    <div className='mt-3 flex gap-2'>
                      <Input
                        size='large'
                        value={customSize}
                        onChange={(event) => setCustomSize(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            addCustomSize()
                          }
                        }}
                        placeholder='Add custom size: 3XL, 41...'
                      />
                      <Button size='large' onClick={addCustomSize} icon={<PlusOutlined />}>
                        Add
                      </Button>
                    </div>

                    <div className='mt-3 flex flex-wrap gap-2'>
                      {sizes.length ? (
                        sizes.map((size) => (
                          <Tag
                            key={size}
                            closable
                            onClose={(event) => {
                              event.preventDefault()
                              toggleSize(size)
                            }}
                            style={{
                              borderRadius: 999,
                              padding: '6px 12px',
                              borderColor: '#bfdbfe',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              fontWeight: 600,
                            }}
                          >
                            {size}
                          </Tag>
                        ))
                      ) : (
                        <Text type='secondary'>No size selected</Text>
                      )}
                    </div>
                  </div>

                  <div className='rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <FireOutlined style={{ color: '#ec4899' }} />
                          <Text strong style={{ color: '#0f172a' }}>
                            Bestseller Placement
                          </Text>
                        </div>
                        <Text type='secondary' style={{ display: 'block', marginTop: 6 }}>
                          Keep this product in highlighted bestseller collections when enabled.
                        </Text>
                      </div>
                      <Switch checked={bestseller} onChange={setBestseller} />
                    </div>
                  </div>
                </div>
              </Card>
          </div>

          <Card bordered={false} className='mt-6 shadow-sm'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <div className='font-semibold text-slate-900'>Apply product changes</div>
                <div className='text-sm text-slate-500'>
                  Save the latest pricing, gallery and variant updates back to the live product record.
                </div>
              </div>

              <Space size={12} wrap>
                <Button size='large' onClick={() => navigate('/list')}>
                  Cancel
                </Button>
                <Button
                  type='primary'
                  size='large'
                  htmlType='submit'
                  loading={isSubmitting}
                  icon={<SaveOutlined />}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      </form>
    </ConfigProvider>
  )
}

export default Update
