import React, { useState, useCallback, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl as defaultBackendUrl } from '../config'
import {
  AppstoreOutlined,
  FileTextOutlined,
  PercentageOutlined,
  ThunderboltOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  Form,
  InputNumber,
  Space,
  Statistic,
  Typography,
  Upload,
} from 'antd'
import {
  adminAntdTheme,
  compactStatCardClass,
  compactStatsRowClass,
  getSelectPopupContainer,
  nativeSelectClass,
  pageShellClass,
} from '../lib/adminAntd'

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

const BulkOperation = ({ token, backendUrl: backendUrlFromProps }) => {
  const [discountPercent, setDiscountPercent] = useState('')
  const [discountCategory, setDiscountCategory] = useState('')
  const [discountSubCategory, setDiscountSubCategory] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const [csvFile, setCsvFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const [categories, setCategories] = useState([])
  const [allSubCategories, setAllSubCategories] = useState([])
  const [filteredSubCategories, setFilteredSubCategories] = useState([])

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const fetchFilters = useCallback(async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/category/list`),
        axios.get(`${apiBaseUrl}/api/sub-category/list`),
      ])

      if (catRes.data.success) {
        setCategories(catRes.data.categories)
      }
      if (subRes.data.success) {
        setAllSubCategories(subRes.data.subCategories)
      }
    } catch {}
  }, [apiBaseUrl])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  useEffect(() => {
    if (discountCategory) {
      const parent = categories.find((category) => category.name === discountCategory)
      if (parent) {
        setFilteredSubCategories(allSubCategories.filter((sub) => sub.categoryId?._id === parent._id))
      } else {
        setFilteredSubCategories([])
      }
    } else {
      setFilteredSubCategories([])
    }
    setDiscountSubCategory('')
  }, [discountCategory, categories, allSubCategories])

  const applyDiscount = async () => {
    if (!discountPercent || discountPercent <= 0 || discountPercent >= 100) {
      toast.error('Discount percentage must be between 1% and 99%')
      return
    }

    if (
      !window.confirm(
        `You are about to apply ${discountPercent}% discount to ${
          discountCategory ? `products in ${discountCategory}` : 'all products'
        }. Continue?`,
      )
    ) {
      return
    }

    try {
      setIsApplying(true)
      const { data } = await axios.post(
        `${apiBaseUrl}/api/product/bulk-discount`,
        {
          category: discountCategory,
          subCategory: discountSubCategory,
          discountPercent: Number(discountPercent),
        },
        { headers: { token } },
      )

      if (data.success) {
        toast.success(data.message)
        setDiscountPercent('')
        setDiscountCategory('')
        setDiscountSubCategory('')
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to apply bulk discount')
    } finally {
      setIsApplying(false)
    }
  }

  const handleFileUpload = async () => {
    if (!csvFile) {
      toast.error('Please choose a CSV file')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', csvFile)

      const { data } = await axios.post(`${apiBaseUrl}/api/product/bulk-import`, formData, {
        headers: {
          token,
          'Content-Type': 'multipart/form-data',
        },
      })

      if (data.success) {
        toast.success(data.message)
        setCsvFile(null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'CSV upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const stats = useMemo(() => {
    const categoryCount = categories.length
    const subCategoryCount = allSubCategories.length
    const scopedCount = discountCategory ? filteredSubCategories.length : allSubCategories.length

    return [
      {
        key: 'categories',
        title: 'Main Categories',
        value: categoryCount,
        icon: <AppstoreOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'subCategories',
        title: 'Sub-Categories',
        value: subCategoryCount,
        icon: <AppstoreOutlined style={{ color: '#2563eb' }} />,
      },
      {
        key: 'scope',
        title: 'Current Scope',
        value: scopedCount,
        icon: <ThunderboltOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'csv',
        title: 'CSV Ready',
        value: csvFile ? 1 : 0,
        icon: <FileTextOutlined style={{ color: '#f97316' }} />,
      },
    ]
  }, [allSubCategories.length, categories.length, csvFile, discountCategory, filteredSubCategories.length])

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6'>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Smart Operations
          </Title>
          <Text type='secondary'>Run high-impact admin actions for promotions and catalog imports without touching product records one by one.</Text>
        </div>

        <div className={compactStatsRowClass}>
          {stats.map((item) => (
            <Card key={item.key} bordered={false} className={compactStatCardClass}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: '#0f172a' }} />
            </Card>
          ))}
        </div>

        <div className='grid gap-6 xl:grid-cols-2'>
          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <Space size={10}>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500'>
                  <PercentageOutlined />
                </div>
                <div>
                  <div className='font-semibold text-slate-900'>Bulk Discount</div>
                  <div className='text-xs font-normal text-slate-400'>Apply one discount percentage to a filtered scope of products.</div>
                </div>
              </Space>
            }
          >
            <div className='mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
              This action overwrites current selling prices and stores previous prices as strike-through references. Use it carefully.
            </div>

            <Form layout='vertical' onFinish={applyDiscount} requiredMark={false}>
              <div className='grid gap-4 md:grid-cols-2'>
                <Form.Item label='Main Category'>
                  <select
                    value={discountCategory}
                    onChange={(event) => setDiscountCategory(event.target.value)}
                    className={nativeSelectClass}
                  >
                    <option value=''>All categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Form.Item>

                <Form.Item label='Sub-Category'>
                  <select
                    value={discountSubCategory}
                    onChange={(event) => setDiscountSubCategory(event.target.value)}
                    className={nativeSelectClass}
                  >
                    <option value=''>All sub-categories</option>
                    {filteredSubCategories.map((sub) => (
                      <option key={sub._id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </Form.Item>
              </div>

              <Form.Item
                label='Discount Percentage'
                rules={[{ required: true }]}
              >
                <InputNumber
                  size='large'
                  min={1}
                  max={99}
                  style={{ width: '100%' }}
                  placeholder='50'
                  value={discountPercent === '' ? null : Number(discountPercent)}
                  onChange={(value) => setDiscountPercent(value ?? '')}
                />
              </Form.Item>

              <Button type='primary' htmlType='submit' size='large' loading={isApplying} icon={<ThunderboltOutlined />}>
                Apply Discount
              </Button>
            </Form>
          </Card>

          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <Space size={10}>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500'>
                  <UploadOutlined />
                </div>
                <div>
                  <div className='font-semibold text-slate-900'>CSV Import</div>
                  <div className='text-xs font-normal text-slate-400'>Upload product rows in bulk from a UTF-8 CSV template.</div>
                </div>
              </Space>
            }
          >
            <Paragraph style={{ color: '#64748b', marginTop: 0 }}>
              Expected columns: <code>name</code>, <code>description</code>, <code>price</code>, <code>oldPrice</code>, <code>category</code>, <code>subCategory</code>, <code>sizes</code>, <code>colors</code>, <code>videoUrl</code>, <code>bestseller</code>, <code>image</code>.
            </Paragraph>

            <Dragger
              multiple={false}
              accept='.csv'
              beforeUpload={(file) => {
                setCsvFile(file)
                return false
              }}
              onRemove={() => {
                setCsvFile(null)
              }}
              fileList={
                csvFile
                  ? [
                      {
                        uid: '-1',
                        name: csvFile.name,
                        status: 'done',
                      },
                    ]
                  : []
              }
            >
              <p className='ant-upload-drag-icon'>
                <UploadOutlined style={{ color: '#6366f1' }} />
              </p>
              <p className='ant-upload-text'>Click or drag a CSV file here</p>
              <p className='ant-upload-hint'>Supports a single UTF-8 CSV file with the agreed product columns.</p>
            </Dragger>

            <Space direction='vertical' size={12} style={{ display: 'flex', marginTop: 16 }}>
              {csvFile ? (
                <Text type='secondary'>{`Selected file: ${csvFile.name} (${(csvFile.size / 1024).toFixed(1)} KB)`}</Text>
              ) : null}

              <Button
                type='primary'
                size='large'
                loading={isUploading}
                icon={<UploadOutlined />}
                onClick={handleFileUpload}
                disabled={!csvFile}
              >
                Start Import
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default BulkOperation
