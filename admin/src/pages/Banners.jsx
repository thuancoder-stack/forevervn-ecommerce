import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Cropper from 'react-easy-crop'
import { backendUrl as defaultBackendUrl } from '../config'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
  PictureOutlined,
  PlusOutlined,
  ScissorOutlined,
  UploadOutlined,
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
  Typography,
} from 'antd'
import {
  adminAntdTheme,
  compactStatCardClass,
  compactStatsRowClass,
  getSelectPopupContainer,
  pageShellClass,
} from '../lib/adminAntd'

const { Title, Text } = Typography

const InlineCropper = ({ imageSrc, zoom, onZoomChange, onCropComplete }) => {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })

  return (
    <Cropper
      image={imageSrc}
      crop={crop}
      zoom={zoom}
      aspect={16 / 9}
      onCropChange={setCrop}
      onZoomChange={onZoomChange}
      onCropComplete={(_, px) => onCropComplete(px)}
      showGrid
      style={{ containerStyle: { borderRadius: 20 } }}
    />
  )
}

const Banners = ({ token, backendUrl: backendUrlFromProps }) => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [image, setImage] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [order, setOrder] = useState(0)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState('')
  const [togglingId, setTogglingId] = useState('')

  const [form] = Form.useForm()

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const resetFormState = useCallback(() => {
    setTitle('')
    setLink('')
    setOrder(0)
    setImage(null)
    setCropSrc(null)
    setCropZoom(1)
    setCroppedAreaPixels(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    form.resetFields()
  }, [form, previewUrl])

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiBaseUrl}/api/banner/list`)
      if (response.data.success) {
        setList(response.data.banners)
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
    fetchList()
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [fetchList, previewUrl])

  const onSubmitHandler = async () => {
    if (!image) {
      toast.error('Please choose and crop a banner image')
      return
    }

    try {
      setAdding(true)
      const formData = new FormData()
      formData.append('title', title)
      formData.append('link', link)
      formData.append('order', order)
      formData.append('status', 'true')
      formData.append('image', image)

      const response = await axios.post(`${apiBaseUrl}/api/banner/add`, formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        resetFormState()
        fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result)
      setCropZoom(1)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleCropConfirm = useCallback(async () => {
    if (!cropSrc || !croppedAreaPixels) return

    try {
      const imageElement = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = cropSrc
      })

      const canvas = document.createElement('canvas')
      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height
      const context = canvas.getContext('2d')
      context.drawImage(
        imageElement,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      )

      const croppedFile = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(new File([blob], `banner-${Date.now()}.jpg`, { type: 'image/jpeg' }))
              : reject(new Error('Crop failed')),
          'image/jpeg',
          0.92,
        ),
      )

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setPreviewUrl(URL.createObjectURL(croppedFile))
      setImage(croppedFile)
      setCropSrc(null)
    } catch (error) {
      toast.error('Failed to crop image, please try again')
      console.error(error)
    }
  }, [cropSrc, croppedAreaPixels, previewUrl])

  const removeBanner = async (id) => {
    try {
      setRemovingId(id)
      const response = await axios.post(`${apiBaseUrl}/api/banner/remove`, { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRemovingId('')
    }
  }

  const toggleStatus = async (id, status) => {
    try {
      setTogglingId(id)
      const response = await axios.post(
        `${apiBaseUrl}/api/banner/status`,
        { id, status: !status },
        { headers: { token } },
      )
      if (response.data.success) {
        fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setTogglingId('')
    }
  }

  const stats = useMemo(() => {
    const visible = list.filter((item) => item.status).length
    const hidden = list.filter((item) => !item.status).length
    const withLinks = list.filter((item) => Boolean(item.link)).length

    return [
      {
        key: 'total',
        title: 'Total Banners',
        value: list.length,
        icon: <PictureOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'visible',
        title: 'Visible',
        value: visible,
        icon: <EyeOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'hidden',
        title: 'Hidden',
        value: hidden,
        icon: <EyeInvisibleOutlined style={{ color: '#f97316' }} />,
      },
      {
        key: 'links',
        title: 'Linked Banners',
        value: withLinks,
        icon: <LinkOutlined style={{ color: '#2563eb' }} />,
      },
    ]
  }, [list])

  const columns = useMemo(
    () => [
      {
        title: 'Banner',
        key: 'banner',
        render: (_, item) => (
          <div className='flex items-start gap-3'>
            <div
              className='overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shrink-0'
              style={{ width: 64, height: 40, minWidth: 64 }}
            >
              <img
                className='h-full w-full object-cover'
                src={item.image}
                alt={item.title || 'Banner'}
                width={64}
                height={40}
                style={{ width: 64, height: 40, objectFit: 'cover' }}
              />
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
                {item.title || 'Untitled banner'}
              </Text>
              <div>
                <Text
                  type='secondary'
                  style={{
                    fontSize: 12,
                    display: 'inline-block',
                    maxWidth: 260,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.link || 'No destination link'}
                </Text>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'State',
        key: 'state',
        width: 180,
        render: (_, item) => (
          <Space size={12}>
            <Switch checked={Boolean(item.status)} loading={togglingId === item._id} onChange={() => toggleStatus(item._id, item.status)} />
            <Text style={{ color: item.status ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
              {item.status ? 'Visible' : 'Hidden'}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Order',
        dataIndex: 'order',
        key: 'order',
        width: 100,
        align: 'center',
        render: (value) => <Text strong>{value ?? 0}</Text>,
      },
      {
        title: 'Action',
        key: 'action',
        width: 110,
        align: 'center',
        render: (_, item) => (
          <Popconfirm
            title='Delete banner'
            description='This will remove the selected banner permanently.'
            okText='Delete'
            cancelText='Cancel'
            okButtonProps={{ danger: true, loading: removingId === item._id }}
            onConfirm={() => removeBanner(item._id)}
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
        <div className='mb-6'>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Banner Manager
          </Title>
          <Text type='secondary'>Upload storefront banners, crop them to 16:9 and control visibility order from one place.</Text>
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
                  <div className='font-semibold text-slate-900'>Create Banner</div>
                  <div className='text-xs font-normal text-slate-400'>Choose image, crop to 16:9 and publish to the storefront slider.</div>
                </div>
              </Space>
            }
          >
            <Form form={form} layout='vertical' onFinish={onSubmitHandler} requiredMark={false}>
              <div className='mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                {cropSrc ? (
                  <>
                    <div className='relative mb-4 overflow-hidden rounded-2xl bg-slate-900' style={{ height: 240 }}>
                      <InlineCropper
                        imageSrc={cropSrc}
                        zoom={cropZoom}
                        onZoomChange={setCropZoom}
                        onCropComplete={setCroppedAreaPixels}
                      />
                    </div>
                    <div className='flex items-center gap-3'>
                      <ScissorOutlined style={{ color: '#94a3b8' }} />
                      <input
                        type='range'
                        min={1}
                        max={3}
                        step={0.05}
                        value={cropZoom}
                        onChange={(event) => setCropZoom(Number(event.target.value))}
                        className='flex-1'
                      />
                      <Text type='secondary' style={{ minWidth: 44, textAlign: 'right' }}>
                        {cropZoom.toFixed(1)}x
                      </Text>
                    </div>
                    <Space size={12} className='mt-4'>
                      <Button onClick={() => setCropSrc(null)}>Cancel Crop</Button>
                      <Button type='primary' icon={<ScissorOutlined />} onClick={handleCropConfirm}>
                        Use Cropped Image
                      </Button>
                    </Space>
                  </>
                ) : (
                  <div className='flex flex-col gap-4'>
                    <label className='flex cursor-pointer items-center gap-4'>
                      <div className='flex h-[64px] w-[112px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white'>
                        {previewUrl ? (
                          <img src={previewUrl} alt='Banner preview' className='h-full w-full object-cover' width={112} height={64} />
                        ) : (
                          <div className='text-center text-slate-400'>
                            <UploadOutlined style={{ fontSize: 20 }} />
                            <div className='mt-1 text-xs font-medium'>Choose image</div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className='font-medium text-slate-900'>{previewUrl ? 'Banner image ready' : 'Upload banner image'}</div>
                        <div className='text-xs text-slate-400'>Selecting an image opens the 16:9 crop stage.</div>
                      </div>
                      <input hidden type='file' accept='image/*' onChange={handleFileSelect} />
                    </label>
                  </div>
                )}
              </div>

              <Form.Item label='Title' name='title'>
                <Input
                  size='large'
                  placeholder='Summer promotion banner'
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Form.Item>

              <Form.Item label='Destination Link' name='link'>
                <Input
                  size='large'
                  placeholder='/collection'
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                />
              </Form.Item>

              <Form.Item label='Display Order' name='order'>
                <InputNumber
                  size='large'
                  min={0}
                  style={{ width: '100%' }}
                  value={Number(order)}
                  onChange={(value) => setOrder(value ?? 0)}
                />
              </Form.Item>

              <Space size={12} wrap>
                <Button type='primary' htmlType='submit' size='large' loading={adding} icon={<PlusOutlined />}>
                  Save Banner
                </Button>
                <Button size='large' onClick={resetFormState}>
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
                <div className='font-semibold text-slate-900'>Banner Directory</div>
                <div className='text-xs font-normal text-slate-400'>Storefront banners sorted by display order from the live banner endpoint.</div>
              </div>
            }
          >
            <Table
              rowKey='_id'
              columns={columns}
              dataSource={[...list].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))}
              loading={loading}
              size='middle'
              pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }}
              scroll={{ x: 840 }}
              locale={{
                emptyText: <Empty description='No banners created yet' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Banners
