import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PictureOutlined,
  SearchOutlined,
  ShoppingOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  AutoComplete,
  Empty,
  Input,
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

const List = ({ token, setToken, backendUrl: backendUrlFromProps }) => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('All')

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
    if (Array.isArray(imageValue)) return imageValue[0] || ''
    return imageValue || ''
  }

  const normalizedProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b?.date || 0) - (a?.date || 0))
        .map((item) => ({
          id: item?._id,
          name: item?.name || '-',
          category: item?.category || '-',
          price: Number(item?.price || 0),
          oldPrice: Number(item?.oldPrice || 0),
          image: normalizeImage(item?.image),
          raw: item,
        })),
    [products],
  )

  const categoryOptions = useMemo(() => {
    const values = Array.from(new Set(normalizedProducts.map((item) => item.category).filter(Boolean)))
    return ['All', ...values]
  }, [normalizedProducts])

  const visibleProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return normalizedProducts.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword)

      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [categoryFilter, normalizedProducts, searchTerm])

  const searchSuggestions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return []

    return normalizedProducts
      .filter((item) => {
        const haystack = `${item.name} ${item.category}`.toLowerCase()
        return haystack.includes(keyword)
      })
      .slice(0, 7)
      .map((item) => ({
        value: item.name,
        productId: item.id,
        label: (
          <div className='flex items-center gap-3 py-1'>
            <div className='flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50'>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  width={36}
                  height={36}
                  className='h-full w-full object-contain p-1'
                />
              ) : (
                <PictureOutlined style={{ color: '#cbd5e1', fontSize: 14 }} />
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='truncate font-medium text-slate-900'>{item.name}</div>
              <div className='text-xs text-slate-400'>{item.category}</div>
            </div>
            <div className='text-xs font-semibold text-slate-500'>
              {currencyFormatter.format(item.price)}
            </div>
          </div>
        ),
      }))
  }, [currencyFormatter, normalizedProducts, searchTerm])

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

  const exportToCsv = async () => {
    if (!apiBaseUrl || !token) return

    try {
      const { data } = await axios.get(`${apiBaseUrl}/api/product/inventory`, {
        headers: { token },
        timeout: 20000,
      })

      if (!data.success || !data.inventory.length) {
        toast.info('No inventory data to export')
        return
      }

      const headers = ['Product Name', 'Category', 'Sub-Category', 'Size', 'Color', 'Total Stock']
      const rows = data.inventory.map((item) =>
        [
          `"${item.productName}"`,
          `"${item.category}"`,
          `"${item.subCategory}"`,
          `"${item.size}"`,
          `"${item.color}"`,
          item.totalStock,
        ].join(','),
      )

      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `inventory_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Export failed'
      if (handleUnauthorized(message)) return
      toast.error(message)
    }
  }

  const stats = useMemo(() => {
    const onSaleCount = normalizedProducts.filter((item) => item.oldPrice > item.price).length
    const avgPrice = normalizedProducts.length
      ? Math.round(normalizedProducts.reduce((sum, item) => sum + item.price, 0) / normalizedProducts.length)
      : 0

    return [
      {
        key: 'total',
        title: 'Total Products',
        value: normalizedProducts.length,
        icon: <ShoppingOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'categories',
        title: 'Categories',
        value: Math.max(categoryOptions.length - 1, 0),
        icon: <AppstoreOutlined style={{ color: '#2563eb' }} />,
      },
      {
        key: 'sale',
        title: 'On Sale',
        value: onSaleCount,
        icon: <TagsOutlined style={{ color: '#f97316' }} />,
      },
      {
        key: 'avg',
        title: 'Avg Price',
        value: currencyFormatter.format(avgPrice),
        icon: <TagsOutlined style={{ color: '#16a34a' }} />,
      },
    ]
  }, [categoryOptions.length, currencyFormatter, normalizedProducts])

  const columns = useMemo(
    () => [
      {
        title: 'Product',
        key: 'product',
        width: 340,
        render: (_, product) => (
          <div className='flex items-start gap-3'>
            <div
              className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50'
              style={{ width: 56, height: 56, minWidth: 56 }}
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  width={56}
                  height={56}
                  style={{ width: 56, height: 56, objectFit: 'cover' }}
                  className='h-14 w-14'
                />
              ) : (
                <PictureOutlined style={{ color: '#cbd5e1', fontSize: 14 }} />
              )}
            </div>
            <div className='min-w-0 pt-0.5'>
              <Text
                strong
                style={{
                  color: '#0f172a',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {product.name}
              </Text>
              <div>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>#{String(product.id || '').slice(-8).toUpperCase()}</Text>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        width: 170,
        render: (value) => (
          <Tag color='blue' style={{ borderRadius: 999, fontWeight: 600 }}>
            {value}
          </Tag>
        ),
      },
      {
        title: 'Price',
        key: 'price',
        width: 180,
        render: (_, product) => (
          <div>
            <Text strong style={{ color: '#16a34a' }}>
              {currencyFormatter.format(product.price)}
            </Text>
            {product.oldPrice > product.price ? (
              <div>
                <Text delete style={{ fontSize: 12, color: '#94a3b8' }}>
                  {currencyFormatter.format(product.oldPrice)}
                </Text>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: 'State',
        key: 'state',
        width: 140,
        render: (_, product) =>
          product.oldPrice > product.price ? (
            <Tag color='magenta' style={{ borderRadius: 999, fontWeight: 600 }}>
              Sale
            </Tag>
          ) : (
            <Tag color='default' style={{ borderRadius: 999, fontWeight: 600 }}>
              Regular
            </Tag>
          ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 150,
        align: 'center',
        render: (_, product) => (
          <Space size={8}>
            <Button
              type='text'
              shape='circle'
              icon={<EditOutlined />}
              onClick={() => navigate(`/update/${product.id}`)}
              style={{ color: '#2563eb' }}
            />
            <Popconfirm
              title='Remove product'
              description='This will remove the product from the catalog.'
              okText='Remove'
              cancelText='Cancel'
              okButtonProps={{ danger: true, loading: removingId === product.id }}
              onConfirm={() => handleRemove(product.id)}
            >
              <Button type='text' shape='circle' danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [currencyFormatter, navigate, removingId],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Product Catalog
            </Title>
            <Text type='secondary'>Browse inventory entries, jump into edits and export stock rows for operations.</Text>
          </div>

          <Space size={12} wrap>
            <AutoComplete
              value={searchTerm}
              options={searchSuggestions}
              open={searchDropdownOpen && searchSuggestions.length > 0}
              onSelect={(value) => {
                setSearchTerm(value)
                setCategoryFilter('All')
                setSearchDropdownOpen(false)
              }}
              onBlur={() => {
                window.setTimeout(() => setSearchDropdownOpen(false), 120)
              }}
              style={{ width: 320 }}
            >
              <Input
                size='large'
                allowClear
                placeholder='Search product or category'
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchTerm}
                onFocus={() => setSearchDropdownOpen(searchSuggestions.length > 0)}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setSearchTerm(nextValue)
                  setSearchDropdownOpen(Boolean(nextValue.trim()))
                }}
              />
            </AutoComplete>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={`${nativeSelectClass} min-w-[170px]`}
            >
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value === 'All' ? 'All categories' : value}
                </option>
              ))}
            </select>
            <Button size='large' icon={<ExportOutlined />} onClick={exportToCsv} disabled={loading}>
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
              <div className='font-semibold text-slate-900'>Product Directory</div>
              <div className='text-xs font-normal text-slate-400'>Current catalog pulled from the product list endpoint.</div>
            </div>
          }
        >
          <Table
            rowKey='id'
            columns={columns}
            dataSource={visibleProducts}
            loading={loading}
            size='middle'
            pagination={{ pageSize: 7, showSizeChanger: false, size: 'small' }}
            scroll={{ x: 900 }}
            locale={{
              emptyText: <Empty description='No products found' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default List
