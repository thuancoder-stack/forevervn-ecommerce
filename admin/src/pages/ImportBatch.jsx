import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl as defaultBackendUrl } from '../config'
import {
  AppstoreOutlined,
  EditOutlined,
  InboxOutlined,
  PlusOutlined,
  ShoppingOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import {
  adminAntdTheme,
  compactStatCardClass,
  compactStatsRowClass,
  getSelectPopupContainer,
  nativeSelectClass,
  pageShellClass,
} from '../lib/adminAntd'

const { Title, Text } = Typography

const ImportBatch = ({ token, backendUrl: backendUrlFromProps }) => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    productId: '',
    size: 'Any',
    costPrice: '',
    initialQty: '',
    supplier: '',
    note: '',
  })
  const [adding, setAdding] = useState(false)
  const [editingBatchId, setEditingBatchId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    size: '',
    costPrice: '',
    remainingQty: '',
    supplier: '',
    note: '',
    status: '',
  })
  const [updating, setUpdating] = useState(false)

  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const fetchData = useCallback(async () => {
    if (!apiBaseUrl || !token) return
    try {
      setLoading(true)
      const [batchRes, prodRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/import-batch/list`, { headers: { token } }),
        axios.get(`${apiBaseUrl}/api/product/list`),
      ])
      if (batchRes.data.success) {
        setBatches(batchRes.data.batches)
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.products)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error loading batches')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetCreateForm = useCallback(() => {
    const nextState = {
      productId: '',
      size: 'Any',
      costPrice: '',
      initialQty: '',
      supplier: '',
      note: '',
    }
    setFormData(nextState)
    createForm.resetFields()
  }, [createForm])

  const handleAddBatch = async () => {
    try {
      setAdding(true)
      const { data } = await axios.post(
        `${apiBaseUrl}/api/import-batch/add`,
        {
          ...formData,
          initialQty: Number(formData.initialQty),
          costPrice: Number(formData.costPrice),
        },
        { headers: { token } },
      )

      if (data.success) {
        toast.success('Added import batch successfully')
        resetCreateForm()
        fetchData()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to add import batch')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdateBatch = async () => {
    try {
      setUpdating(true)
      const { data } = await axios.put(
        `${apiBaseUrl}/api/import-batch/update`,
        {
          id: editingBatchId,
          ...editFormData,
          remainingQty: Number(editFormData.remainingQty),
          costPrice: Number(editFormData.costPrice),
        },
        { headers: { token } },
      )

      if (data.success) {
        toast.success('Batch updated successfully')
        setEditingBatchId(null)
        editForm.resetFields()
        fetchData()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to update import batch')
    } finally {
      setUpdating(false)
    }
  }

  const getProductName = useCallback(
    (id) => {
      const product = products.find((item) => item._id === id)
      return product ? product.name : 'Hidden / removed product'
    },
    [products],
  )

  const productOptions = useMemo(
    () => products.map((product) => ({ value: product._id, label: product.name })),
    [products],
  )

  const stats = useMemo(() => {
    const active = batches.filter((item) => item.status === 'Active').length
    const hidden = batches.filter((item) => item.status !== 'Active').length
    const remainingQty = batches.reduce((sum, item) => sum + Number(item.remainingQty || 0), 0)
    const inventoryValue = batches.reduce(
      (sum, item) => sum + Number(item.remainingQty || 0) * Number(item.costPrice || 0),
      0,
    )

    return [
      {
        key: 'batches',
        title: 'Total Batches',
        value: batches.length,
        icon: <InboxOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'active',
        title: 'Active Batches',
        value: active,
        icon: <AppstoreOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'units',
        title: 'Units Remaining',
        value: remainingQty,
        icon: <ShoppingOutlined style={{ color: '#2563eb' }} />,
      },
      {
        key: 'value',
        title: 'Inventory Cost',
        value: new Intl.NumberFormat('vi-VN').format(inventoryValue) + ' d',
        icon: <WalletOutlined style={{ color: '#f97316' }} />,
      },
      {
        key: 'hidden',
        title: 'Hidden',
        value: hidden,
        icon: <AppstoreOutlined style={{ color: '#94a3b8' }} />,
      },
    ]
  }, [batches])

  const columns = useMemo(
    () => [
      {
        title: 'Product Base',
        key: 'product',
        render: (_, batch) => (
          <div>
            <Text strong style={{ color: '#0f172a' }}>
              {getProductName(batch.productId)}
            </Text>
            <div>
              <Text type='secondary' style={{ fontSize: 12 }}>
                #{String(batch._id || '').slice(-6).toUpperCase()}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Variant',
        key: 'variant',
        width: 140,
        render: (_, batch) => (
          <Tag color='default' style={{ borderRadius: 999, fontWeight: 600 }}>
            {batch.size || 'Any'}
          </Tag>
        ),
      },
      {
        title: 'Supplier',
        dataIndex: 'supplier',
        key: 'supplier',
        width: 180,
        render: (value) => <Text style={{ color: '#64748b' }}>{value || 'N/A'}</Text>,
      },
      {
        title: 'Cost Price',
        dataIndex: 'costPrice',
        key: 'costPrice',
        width: 150,
        render: (value) => <Text strong style={{ color: '#dc2626' }}>{new Intl.NumberFormat('vi-VN').format(value)} d</Text>,
      },
      {
        title: 'Remaining / Initial',
        key: 'qty',
        width: 170,
        render: (_, batch) => (
          <div>
            <Text strong style={{ color: Number(batch.remainingQty) === 0 ? '#ef4444' : '#16a34a' }}>
              {batch.remainingQty}
            </Text>
            <Text style={{ color: '#94a3b8' }}> / {batch.initialQty}</Text>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (value) => (
          <Tag color={value === 'Active' ? 'success' : 'default'} style={{ borderRadius: 999, fontWeight: 600 }}>
            {value}
          </Tag>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 100,
        align: 'center',
        render: (_, batch) => (
          <Button
            type='text'
            shape='circle'
            icon={<EditOutlined />}
            style={{ color: '#f59e0b' }}
            onClick={() => {
              setEditingBatchId(batch._id)
              const nextValues = {
                size: batch.size,
                costPrice: batch.costPrice,
                remainingQty: batch.remainingQty,
                supplier: batch.supplier || '',
                note: batch.note || '',
                status: batch.status,
              }
              setEditFormData(nextValues)
              editForm.setFieldsValue(nextValues)
            }}
          />
        ),
      },
    ],
    [editForm, getProductName],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6'>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Import Hub
          </Title>
          <Text type='secondary'>Track inbound inventory batches, supplier costs and current FIFO stock availability.</Text>
        </div>

        <div className={compactStatsRowClass}>
          {stats.map((item) => (
            <Card key={item.key} bordered={false} className={compactStatCardClass}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: '#0f172a' }} />
            </Card>
          ))}
        </div>

        <div className='grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]'>
          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <Space size={10}>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500'>
                  <PlusOutlined />
                </div>
                <div>
                  <div className='font-semibold text-slate-900'>New Goods Receipt</div>
                  <div className='text-xs font-normal text-slate-400'>Create a fresh import batch for FIFO inventory tracking.</div>
                </div>
              </Space>
            }
          >
            <Form form={createForm} layout='vertical' onFinish={handleAddBatch} requiredMark={false}>
              <Form.Item
                label='Product'
                name='productId'
                rules={[{ required: true, message: 'Please choose a product' }]}
              >
                <select
                  value={formData.productId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, productId: event.target.value }))}
                  className={nativeSelectClass}
                >
                  <option value=''>Select product</option>
                  {productOptions.map((product) => (
                    <option key={product.value} value={product.value}>
                      {product.label}
                    </option>
                  ))}
                </select>
              </Form.Item>

              <div className='grid gap-4 md:grid-cols-2'>
                <Form.Item label='Size' name='size'>
                  <Input
                    size='large'
                    placeholder='S, M, L or Any'
                    value={formData.size}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, size: event.target.value.toUpperCase() }))
                    }
                  />
                </Form.Item>
                <Form.Item label='Supplier' name='supplier'>
                  <Input
                    size='large'
                    placeholder='Factory / vendor'
                    value={formData.supplier}
                    onChange={(event) => setFormData((prev) => ({ ...prev, supplier: event.target.value }))}
                  />
                </Form.Item>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <Form.Item
                  label='Cost Price'
                  name='costPrice'
                  rules={[{ required: true, message: 'Please enter cost price' }]}
                >
                  <InputNumber
                    size='large'
                    style={{ width: '100%' }}
                    min={0}
                    placeholder='150000'
                    value={formData.costPrice === '' ? null : Number(formData.costPrice)}
                    onChange={(value) => setFormData((prev) => ({ ...prev, costPrice: value ?? '' }))}
                  />
                </Form.Item>
                <Form.Item
                  label='Initial Quantity'
                  name='initialQty'
                  rules={[{ required: true, message: 'Please enter quantity' }]}
                >
                  <InputNumber
                    size='large'
                    style={{ width: '100%' }}
                    min={0}
                    placeholder='50'
                    value={formData.initialQty === '' ? null : Number(formData.initialQty)}
                    onChange={(value) => setFormData((prev) => ({ ...prev, initialQty: value ?? '' }))}
                  />
                </Form.Item>
              </div>

              <Form.Item label='Note' name='note'>
                <Input
                  size='large'
                  placeholder='Fabric notes, source quality, batch remark...'
                  value={formData.note}
                  onChange={(event) => setFormData((prev) => ({ ...prev, note: event.target.value }))}
                />
              </Form.Item>

              <Space size={12} wrap>
                <Button type='primary' htmlType='submit' size='large' loading={adding} icon={<PlusOutlined />}>
                  Save Batch
                </Button>
                <Button size='large' onClick={resetCreateForm}>
                  Clear
                </Button>
              </Space>
            </Form>
          </Card>

          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <div>
                <div className='font-semibold text-slate-900'>Batch Directory</div>
                <div className='text-xs font-normal text-slate-400'>Imported inventory batches with remaining quantity and supplier cost.</div>
              </div>
            }
          >
            <Table
              rowKey='_id'
              columns={columns}
              dataSource={batches}
              loading={loading}
              size='middle'
              pagination={{ pageSize: 7, showSizeChanger: false, size: 'small' }}
              scroll={{ x: 980 }}
              locale={{
                emptyText: <Empty description='No batches found' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </Card>
        </div>

        <Modal
          open={!!editingBatchId}
          onCancel={() => setEditingBatchId(null)}
          title='Update Import Batch'
          okText={updating ? 'Saving...' : 'Save Changes'}
          onOk={() => editForm.submit()}
          confirmLoading={updating}
          cancelText='Cancel'
          destroyOnHidden
        >
          <Form form={editForm} layout='vertical' onFinish={handleUpdateBatch} requiredMark={false}>
            <div className='grid gap-4 md:grid-cols-2'>
              <Form.Item
                label='Size'
                name='size'
                rules={[{ required: true, message: 'Please enter size' }]}
              >
                <Input
                  size='large'
                  value={editFormData.size}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, size: event.target.value.toUpperCase() }))
                  }
                />
              </Form.Item>

              <Form.Item
                label='Status'
                name='status'
                rules={[{ required: true, message: 'Please choose status' }]}
              >
                <select
                  value={editFormData.status}
                  onChange={(event) => setEditFormData((prev) => ({ ...prev, status: event.target.value }))}
                  className={nativeSelectClass}
                >
                  <option value='Active'>Active</option>
                  <option value='Hidden'>Hidden</option>
                </select>
              </Form.Item>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <Form.Item
                label='Cost Price'
                name='costPrice'
                rules={[{ required: true, message: 'Please enter cost price' }]}
              >
                <InputNumber
                  size='large'
                  style={{ width: '100%' }}
                  min={0}
                  value={editFormData.costPrice === '' ? null : Number(editFormData.costPrice)}
                  onChange={(value) => setEditFormData((prev) => ({ ...prev, costPrice: value ?? '' }))}
                />
              </Form.Item>

              <Form.Item
                label='Remaining Quantity'
                name='remainingQty'
                rules={[{ required: true, message: 'Please enter remaining quantity' }]}
              >
                <InputNumber
                  size='large'
                  style={{ width: '100%' }}
                  min={0}
                  value={editFormData.remainingQty === '' ? null : Number(editFormData.remainingQty)}
                  onChange={(value) => setEditFormData((prev) => ({ ...prev, remainingQty: value ?? '' }))}
                />
              </Form.Item>
            </div>

            <Form.Item label='Supplier' name='supplier'>
              <Input
                size='large'
                value={editFormData.supplier}
                onChange={(event) => setEditFormData((prev) => ({ ...prev, supplier: event.target.value }))}
              />
            </Form.Item>

            <Form.Item label='Note' name='note'>
              <Input
                size='large'
                value={editFormData.note}
                onChange={(event) => setEditFormData((prev) => ({ ...prev, note: event.target.value }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  )
}

export default ImportBatch
