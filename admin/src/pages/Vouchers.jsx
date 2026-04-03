import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FireOutlined,
  PercentageOutlined,
  PlusOutlined,
  RollbackOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Statistic,
  Switch,
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
  pageShellClass,
} from '../lib/adminAntd'

const { Title, Text } = Typography

const Vouchers = ({ token, setToken, backendUrl: backendUrlFromProps }) => {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState('')
  const [togglingId, setTogglingId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [description, setDescription] = useState('')
  const [showAsHot, setShowAsHot] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const [form] = Form.useForm()

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

  const resetFormState = useCallback(() => {
    setEditingId(null)
    setCode('')
    setDiscountPercent('')
    setDescription('')
    setShowAsHot(false)
    setIsActive(true)
    form.resetFields()
  }, [form])

  const fetchVouchers = useCallback(async () => {
    if (!apiBaseUrl) return

    try {
      setLoading(true)
      const { data } = await axios.get(`${apiBaseUrl}/api/system/voucher/list`)

      if (data?.success) {
        setVouchers(Array.isArray(data.vouchers) ? data.vouchers : [])
        return
      }

      toast.error(data?.message || 'Cannot load vouchers')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  const handleAddVoucher = async () => {
    if (!token) {
      toast.error('Please login first')
      return
    }

    if (!code.trim() || !discountPercent) {
      toast.error('Please enter code and discount percentage')
      return
    }

    setIsSubmitting(true)
    try {
      const endpoint = editingId ? '/api/system/voucher/update' : '/api/system/voucher/add'
      const payload = {
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent),
        description: description.trim(),
        showAsHot,
        isActive,
      }

      if (editingId) {
        payload.id = editingId
      }

      const { data } = await axios.post(`${apiBaseUrl}${endpoint}`, payload, { headers: { token } })

      if (data.success) {
        toast.success(editingId ? 'Voucher updated' : 'Voucher created')
        resetFormState()
        fetchVouchers()
      } else {
        if (handleUnauthorized(data.message)) return
        toast.error(data.message)
      }
    } catch (error) {
      if (handleUnauthorized(error.response?.data?.message)) return
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = useCallback(
    (voucher) => {
      setEditingId(voucher._id)
      setCode(voucher.code || '')
      setDiscountPercent(voucher.discountPercent ?? '')
      setDescription(voucher.description || '')
      setShowAsHot(Boolean(voucher.showAsHot))
      setIsActive(Boolean(voucher.isActive))
      form.setFieldsValue({
        code: voucher.code || '',
        discountPercent: voucher.discountPercent ?? undefined,
        description: voucher.description || '',
        showAsHot: Boolean(voucher.showAsHot),
        isActive: Boolean(voucher.isActive),
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [form],
  )

  const handleToggleActive = async (voucher) => {
    if (!token || togglingId) return

    try {
      setTogglingId(voucher._id)
      const { data } = await axios.post(
        `${apiBaseUrl}/api/system/voucher/update`,
        {
          id: voucher._id,
          isActive: !voucher.isActive,
        },
        { headers: { token } },
      )

      if (data.success) {
        toast.success(`Voucher ${!voucher.isActive ? 'activated' : 'deactivated'}`)
        setVouchers((prev) =>
          prev.map((item) => (item._id === voucher._id ? { ...item, isActive: !item.isActive } : item)),
        )
      } else {
        if (handleUnauthorized(data.message)) return
        toast.error(data.message)
      }
    } catch (error) {
      if (handleUnauthorized(error.response?.data?.message)) return
      toast.error(error.message)
    } finally {
      setTogglingId('')
    }
  }

  const handleRemove = async (id) => {
    if (!id || removingId || !token) return

    try {
      setRemovingId(id)
      const { data } = await axios.post(
        `${apiBaseUrl}/api/system/voucher/delete`,
        { id },
        { headers: { token }, timeout: 20000 },
      )

      if (data?.success) {
        toast.success(data.message || 'Voucher deleted')
        setVouchers((prev) => prev.filter((item) => item._id !== id))
        if (editingId === id) {
          resetFormState()
        }
        return
      }

      if (handleUnauthorized(data?.message)) return
      toast.error(data?.message || 'Delete failed')
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Delete failed'
      if (handleUnauthorized(message)) return
      toast.error(message)
    } finally {
      setRemovingId('')
    }
  }

  const stats = useMemo(() => {
    const activeCount = vouchers.filter((item) => item.isActive).length
    const hotCount = vouchers.filter((item) => item.showAsHot).length
    const avgDiscount = vouchers.length
      ? Math.round(vouchers.reduce((sum, item) => sum + Number(item.discountPercent || 0), 0) / vouchers.length)
      : 0

    return [
      {
        key: 'total',
        title: 'Total Vouchers',
        value: vouchers.length,
        icon: <TagsOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'active',
        title: 'Active Codes',
        value: activeCount,
        icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'hot',
        title: 'Hot Promotions',
        value: hotCount,
        icon: <FireOutlined style={{ color: '#f97316' }} />,
      },
      {
        key: 'avg',
        title: 'Avg Discount',
        value: `${avgDiscount}%`,
        icon: <PercentageOutlined style={{ color: '#2563eb' }} />,
      },
    ]
  }, [vouchers])

  const columns = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        width: 160,
        render: (value) => (
          <Tag
            color='magenta'
            style={{
              marginInlineEnd: 0,
              borderRadius: 999,
              paddingInline: 12,
              paddingBlock: 5,
              fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
              fontWeight: 700,
            }}
          >
            {value}
          </Tag>
        ),
      },
      {
        title: 'Discount',
        dataIndex: 'discountPercent',
        key: 'discountPercent',
        width: 130,
        render: (value) => <Text strong style={{ color: '#16a34a' }}>{value}% OFF</Text>,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (value) => <Text style={{ color: '#475569' }}>{value}</Text>,
      },
      {
        title: 'State',
        key: 'state',
        width: 200,
        render: (_, voucher) => (
          <Space size={[8, 8]} wrap>
            <Tag color={voucher.isActive ? 'success' : 'default'} style={{ borderRadius: 999, fontWeight: 600 }}>
              {voucher.isActive ? 'Active' : 'Inactive'}
            </Tag>
            {voucher.showAsHot ? (
              <Tag color='orange' style={{ borderRadius: 999, fontWeight: 600 }}>
                Hot
              </Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'date',
        key: 'date',
        width: 150,
        render: (value) => (
          <Text style={{ fontSize: 12, color: '#64748b' }}>
            {value ? new Date(value).toLocaleDateString('vi-VN') : '-'}
          </Text>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 180,
        render: (_, voucher) => (
          <Space size={8}>
            <Button
              type='text'
              shape='circle'
              icon={<EditOutlined />}
              onClick={() => handleEdit(voucher)}
              style={{ color: '#2563eb' }}
            />
            <Button
              type='text'
              onClick={() => handleToggleActive(voucher)}
              loading={togglingId === voucher._id}
              style={{ color: voucher.isActive ? '#f59e0b' : '#16a34a' }}
            >
              {voucher.isActive ? 'Pause' : 'Activate'}
            </Button>
            <Popconfirm
              title='Delete voucher'
              description='This action permanently removes the voucher.'
              okText='Delete'
              cancelText='Cancel'
              okButtonProps={{ danger: true, loading: removingId === voucher._id }}
              onConfirm={() => handleRemove(voucher._id)}
            >
              <Button type='text' shape='circle' danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleEdit, removingId, togglingId],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6'>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Voucher Studio
          </Title>
          <Text type='secondary'>Create promotional codes, control live status and manage spotlight campaigns.</Text>
        </div>

        <div className={compactStatsRowClass}>
          {stats.map((item) => (
            <Card key={item.key} bordered={false} className={compactStatCardClass}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: '#0f172a' }} />
            </Card>
          ))}
        </div>

        <div className='grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]'>
          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <Space size={10}>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500'>
                  {editingId ? <EditOutlined /> : <PlusOutlined />}
                </div>
                <div>
                  <div className='font-semibold text-slate-900'>{editingId ? 'Edit Voucher' : 'Create Voucher'}</div>
                  <div className='text-xs font-normal text-slate-400'>Configure code, discount and display state.</div>
                </div>
              </Space>
            }
          >
            <Form form={form} layout='vertical' onFinish={handleAddVoucher} requiredMark={false}>
              <Form.Item
                label='Voucher Code'
                name='code'
                rules={[{ required: true, message: 'Please enter the voucher code' }]}
              >
                <Input
                  size='large'
                  placeholder='SUMMER20'
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                />
              </Form.Item>

              <Form.Item
                label='Discount (%)'
                name='discountPercent'
                rules={[{ required: true, message: 'Please enter the discount percentage' }]}
              >
                <InputNumber
                  size='large'
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder='20'
                  value={discountPercent === '' ? null : Number(discountPercent)}
                  onChange={(value) => setDiscountPercent(value ?? '')}
                />
              </Form.Item>

              <Form.Item
                label='Short Description'
                name='description'
                rules={[{ required: true, message: 'Please enter a short description' }]}
              >
                <Input
                  size='large'
                  placeholder='Describe the promotion'
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Form.Item>

              <div className='mb-5 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <div className='font-medium text-slate-900'>Show as Hot</div>
                    <div className='text-xs text-slate-400'>Highlights the voucher in marketing surfaces.</div>
                  </div>
                  <Switch checked={showAsHot} onChange={setShowAsHot} />
                </div>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <div className='font-medium text-slate-900'>Active Status</div>
                    <div className='text-xs text-slate-400'>Controls whether the code can be used at checkout.</div>
                  </div>
                  <Switch checked={isActive} onChange={setIsActive} />
                </div>
              </div>

              <Space size={12} wrap>
                <Button type='primary' htmlType='submit' size='large' loading={isSubmitting} icon={<PlusOutlined />}>
                  {editingId ? 'Update Voucher' : 'Create Voucher'}
                </Button>
                {editingId ? (
                  <Button size='large' icon={<RollbackOutlined />} onClick={resetFormState}>
                    Cancel Edit
                  </Button>
                ) : null}
              </Space>
            </Form>
          </Card>

          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <div>
                <div className='font-semibold text-slate-900'>Voucher Directory</div>
                <div className='text-xs font-normal text-slate-400'>Manage current promotions and switch campaigns live.</div>
              </div>
            }
          >
            <Table
              rowKey='_id'
              columns={columns}
              dataSource={vouchers}
              loading={loading}
              size='middle'
              pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }}
              scroll={{ x: 980 }}
              locale={{
                emptyText: <Empty description='No vouchers found' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Vouchers
