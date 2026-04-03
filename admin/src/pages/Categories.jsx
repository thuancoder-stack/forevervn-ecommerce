import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  Empty,
  Form,
  Input,
  Popconfirm,
  Space,
  Statistic,
  Switch,
  Table,
  Typography,
  Upload,
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

const Categories = ({ token, backendUrl: backendUrlFromProps }) => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [image, setImage] = useState(null)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState('')
  const [togglingId, setTogglingId] = useState('')
  const [resetting, setResetting] = useState(false)
  const [form] = Form.useForm()

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiBaseUrl}/api/category/list`)
      if (response.data.success) {
        setList(response.data.categories)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const resetFormState = useCallback(() => {
    setName('')
    setImage(null)
    form.resetFields()
  }, [form])

  const onSubmitHandler = async () => {
    try {
      setAdding(true)
      const formData = new FormData()
      formData.append('name', name)
      formData.append('status', true)
      if (image) formData.append('image', image)

      const response = await axios.post(`${apiBaseUrl}/api/category/add`, formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        resetFormState()
        fetchCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setAdding(false)
    }
  }

  const removeCategory = async (id) => {
    try {
      setRemovingId(id)
      const response = await axios.post(`${apiBaseUrl}/api/category/remove`, { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRemovingId('')
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    try {
      setTogglingId(id)
      const response = await axios.post(
        `${apiBaseUrl}/api/category/status`,
        { id, status: !currentStatus },
        { headers: { token } },
      )
      if (response.data.success) {
        fetchCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setTogglingId('')
    }
  }

  const resetToPro = async () => {
    try {
      setResetting(true)
      const response = await axios.post(`${apiBaseUrl}/api/system/reset-categories`, {}, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setResetting(false)
    }
  }

  const stats = useMemo(() => {
    const active = list.filter((item) => item.status).length
    const disabled = list.filter((item) => !item.status).length
    const withImages = list.filter((item) => Boolean(item.image)).length

    return [
      {
        key: 'total',
        title: 'Total Categories',
        value: list.length,
        icon: <FolderOpenOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'active',
        title: 'Active',
        value: active,
        icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'disabled',
        title: 'Disabled',
        value: disabled,
        icon: <StopOutlined style={{ color: '#f97316' }} />,
      },
      {
        key: 'images',
        title: 'With Images',
        value: withImages,
        icon: <PictureOutlined style={{ color: '#2563eb' }} />,
      },
    ]
  }, [list])

  const columns = useMemo(
    () => [
      {
        title: 'Category',
        key: 'category',
        render: (_, item) => (
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50'>
              {item.image ? (
                <img src={item.image} alt={item.name} width={36} height={36} className='h-full w-full object-cover' />
              ) : (
                <PictureOutlined style={{ color: '#cbd5e1', fontSize: 18 }} />
              )}
            </div>
            <div>
              <Text strong style={{ color: '#0f172a' }}>
                {item.name}
              </Text>
              <div>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  #{String(item._id || '').slice(-6).toUpperCase()}
                </Text>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 180,
        render: (_, item) => (
          <Space size={12}>
            <Switch
              checked={Boolean(item.status)}
              loading={togglingId === item._id}
              onChange={() => toggleStatus(item._id, item.status)}
            />
            <Text style={{ color: item.status ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
              {item.status ? 'Active' : 'Disabled'}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 120,
        align: 'center',
        render: (_, item) => (
          <Popconfirm
            title='Delete category'
            description='Linked sub-categories will also be removed.'
            okText='Delete'
            cancelText='Cancel'
            okButtonProps={{ danger: true, loading: removingId === item._id }}
            onConfirm={() => removeCategory(item._id)}
          >
            <Button type='text' shape='circle' danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ),
      },
    ],
    [removingId, togglingId],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Category Manager
            </Title>
            <Text type='secondary'>Create primary catalog groups, control visibility and reset the store taxonomy when needed.</Text>
          </div>

          <Space size={12} wrap>
            <Button size='large' icon={<ReloadOutlined />} loading={resetting} onClick={resetToPro}>
              Reset & Setup Pro
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

        <div className='grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]'>
          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <Space size={10}>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500'>
                  <PlusOutlined />
                </div>
                <div>
                  <div className='font-semibold text-slate-900'>Add Category</div>
                  <div className='text-xs font-normal text-slate-400'>Create a new top-level catalog group.</div>
                </div>
              </Space>
            }
          >
            <Form form={form} layout='vertical' onFinish={onSubmitHandler} requiredMark={false}>
              <Form.Item
                label='Category Name'
                name='name'
                rules={[{ required: true, message: 'Please enter the category name' }]}
              >
                <Input
                  size='large'
                  placeholder="e.g. Men's Wear"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Form.Item>

              <Form.Item label='Display Image'>
                <Upload
                  beforeUpload={(file) => {
                    setImage(file)
                    return false
                  }}
                  maxCount={1}
                  onRemove={() => {
                    setImage(null)
                  }}
                  fileList={
                    image
                      ? [
                          {
                            uid: '-1',
                            name: image.name,
                            status: 'done',
                          },
                        ]
                      : []
                  }
                >
                  <Button size='large' icon={<UploadOutlined />}>
                    Upload Image
                  </Button>
                </Upload>
              </Form.Item>

              <Space size={12} wrap>
                <Button type='primary' htmlType='submit' size='large' loading={adding} icon={<PlusOutlined />}>
                  Save Category
                </Button>
                <Button
                  size='large'
                  onClick={resetFormState}
                  disabled={!name && !image}
                >
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
                <div className='font-semibold text-slate-900'>Category Directory</div>
                <div className='text-xs font-normal text-slate-400'>Primary categories returned from the live category endpoint.</div>
              </div>
            }
          >
            <Table
              rowKey='_id'
              columns={columns}
              dataSource={list}
              loading={loading}
              size='middle'
              pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }}
              scroll={{ x: 760 }}
              locale={{
                emptyText: <Empty description='No categories created yet' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Categories
