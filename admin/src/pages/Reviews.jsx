import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl as defaultBackendUrl } from '../config'
import {
  CalendarOutlined,
  CommentOutlined,
  DeleteOutlined,
  MessageOutlined,
  RollbackOutlined,
  SearchOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Empty,
  Image,
  Input,
  Modal,
  Popconfirm,
  Rate,
  Space,
  Statistic,
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

const { Title, Text, Paragraph } = Typography

const Reviews = ({ token, backendUrl: backendUrlFromProps }) => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [replyingId, setReplyingId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [removingId, setRemovingId] = useState('')

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const handleUnauthorized = useCallback((message) => {
    const normalized = (message || '').toLowerCase()
    if (!normalized.includes('not authorized')) return false

    toast.error('Session expired, please login again')
    localStorage.removeItem('token')
    setTimeout(() => window.location.reload(), 400)
    return true
  }, [])

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiBaseUrl}/api/review-user/list`)
      if (response.data.success) {
        setList(response.data.reviews)
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
  }, [fetchList])

  const deleteReview = async (id) => {
    try {
      setRemovingId(id)
      const response = await axios.post(`${apiBaseUrl}/api/review-user/delete`, { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchList()
      } else {
        if (handleUnauthorized(response.data.message)) return
        toast.error(response.data.message)
      }
    } catch (error) {
      if (handleUnauthorized(error.response?.data?.message)) return
      toast.error(error.message)
    } finally {
      setRemovingId('')
    }
  }

  const submitReply = async () => {
    if (!replyText.trim() || !replyingId) return

    try {
      setReplySubmitting(true)
      const response = await axios.post(
        `${apiBaseUrl}/api/review-user/reply`,
        { id: replyingId, reply: replyText },
        { headers: { token } },
      )

      if (response.data.success) {
        toast.success('Reply sent successfully')
        setReplyingId(null)
        setReplyText('')
        fetchList()
      } else {
        if (handleUnauthorized(response.data.message)) return
        toast.error(response.data.message)
      }
    } catch (error) {
      if (handleUnauthorized(error.response?.data?.message)) return
      toast.error('Failed to send reply')
    } finally {
      setReplySubmitting(false)
    }
  }

  const openReplyModal = useCallback((item) => {
    setReplyingId(item._id)
    setReplyText(item.adminReply || '')
  }, [])

  const filteredList = useMemo(() => {
    let result = [...list]

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          (item.productId?.name || '').toLowerCase().includes(lowerSearch) ||
          (item.userName || '').toLowerCase().includes(lowerSearch) ||
          (item.comment || '').toLowerCase().includes(lowerSearch),
      )
    }

    const now = Date.now()
    if (dateFilter === 'today') {
      result = result.filter((item) => now - item.date <= 24 * 60 * 60 * 1000)
    } else if (dateFilter === 'week') {
      result = result.filter((item) => now - item.date <= 7 * 24 * 60 * 60 * 1000)
    }

    result.sort((a, b) => {
      if (sortOrder === 'newest') return b.date - a.date
      return a.date - b.date
    })

    return result
  }, [dateFilter, list, searchTerm, sortOrder])

  const stats = useMemo(() => {
    const replied = list.filter((item) => Boolean(item.adminReply)).length
    const withImages = list.filter((item) => Array.isArray(item.images) && item.images.length > 0).length
    const avgRating = list.length
      ? (list.reduce((sum, item) => sum + Number(item.rating || 0), 0) / list.length).toFixed(1)
      : '0.0'

    return [
      {
        key: 'total',
        title: 'Total Reviews',
        value: list.length,
        icon: <CommentOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'rating',
        title: 'Avg Rating',
        value: avgRating,
        icon: <StarOutlined style={{ color: '#f59e0b' }} />,
      },
      {
        key: 'replied',
        title: 'Replied',
        value: replied,
        icon: <RollbackOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'images',
        title: 'With Images',
        value: withImages,
        icon: <CalendarOutlined style={{ color: '#2563eb' }} />,
      },
    ]
  }, [list])

  const activeReplyItem = useMemo(
    () => filteredList.find((item) => item._id === replyingId) || list.find((item) => item._id === replyingId),
    [filteredList, list, replyingId],
  )

  const getSafeImage = (img) => {
    if (Array.isArray(img)) return img[0]
    return img
  }

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Review Moderation
            </Title>
            <Text type='secondary'>Track customer feedback, respond to reviews and remove invalid content when necessary.</Text>
          </div>
          <Tag color='magenta' style={{ borderRadius: 999, alignSelf: 'flex-start', paddingInline: 12, paddingBlock: 6, fontWeight: 700 }}>
            {filteredList.length} results
          </Tag>
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
          className='mb-6 shadow-sm'
          bodyStyle={{ padding: 20 }}
        >
          <div className='flex flex-col gap-4 xl:flex-row'>
            <Input
              size='large'
              placeholder='Search product, customer or review text'
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className={`${nativeSelectClass} min-w-[180px]`}>
              <option value='all'>All time</option>
              <option value='today'>Today</option>
              <option value='week'>Last 7 days</option>
            </select>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className={`${nativeSelectClass} min-w-[180px]`}>
              <option value='newest'>Newest first</option>
              <option value='oldest'>Oldest first</option>
            </select>
          </div>
        </Card>

        {loading ? (
          <Card bordered={false} className='shadow-sm'>
            <div className='py-10 text-center text-sm text-slate-500'>Loading reviews...</div>
          </Card>
        ) : filteredList.length === 0 ? (
          <Card bordered={false} className='shadow-sm'>
            <Empty description='No matching reviews found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Card>
        ) : (
          <div className='space-y-4'>
            {filteredList.map((item) => (
              <Card key={item._id} bordered={false} className='shadow-sm'>
                <div className='flex flex-col gap-4 xl:flex-row'>
                  <div className='xl:w-[210px] xl:shrink-0'>
                    <div className='flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3'>
                      <div className='h-9 w-9 overflow-hidden rounded-lg border border-white bg-white'>
                        <img
                          src={getSafeImage(item.productId?.image) || 'https://dummyimage.com/100'}
                          alt={item.productId?.name || 'Product'}
                          width={36}
                          height={36}
                          className='h-full w-full object-cover'
                        />
                      </div>
                      <div className='min-w-0'>
                        <div className='text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'>Product</div>
                        <div className='truncate font-semibold text-slate-900'>{item.productId?.name || 'Unknown Product'}</div>
                      </div>
                    </div>

                    <div className='mt-3 rounded-2xl border border-slate-100 bg-white p-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar size={28} style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} icon={<UserOutlined />}>
                          {String(item.userName || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <div className='text-sm font-semibold text-slate-900'>{item.userName || 'Unknown User'}</div>
                          <div className='text-xs text-slate-400'>{new Date(item.date).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>

                      <div className='mt-3 flex items-center justify-between'>
                        <Rate disabled value={Number(item.rating) || 0} style={{ fontSize: 14, color: '#fbbf24' }} />
                        <Tag color='blue' style={{ borderRadius: 999, fontWeight: 600 }}>
                          {item.rating}/5
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-4'>
                      <Paragraph style={{ margin: 0, color: '#334155', fontSize: 14, lineHeight: 1.65 }}>"{item.comment}"</Paragraph>
                      <Popconfirm
                        title='Delete review'
                        description='This will permanently remove the selected review.'
                        okText='Delete'
                        cancelText='Cancel'
                        okButtonProps={{ danger: true, loading: removingId === item._id }}
                        onConfirm={() => deleteReview(item._id)}
                      >
                        <Button type='text' shape='circle' danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>

                    {item.images && item.images.length > 0 ? (
                      <div className='mt-4 flex flex-wrap gap-2.5'>
                        {item.images.map((img, index) => (
                          <Image
                            key={`${item._id}-${index}`}
                            src={img}
                            alt='Review attachment'
                            width={40}
                            height={40}
                            style={{ objectFit: 'cover', borderRadius: 10, border: '1px solid #f1f5f9' }}
                          />
                        ))}
                      </div>
                    ) : null}

                    <div className='mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                      {item.adminReply ? (
                        <div>
                          <div className='mb-2 flex items-center justify-between gap-3'>
                            <Space size={8}>
                              <MessageOutlined style={{ color: '#6366f1' }} />
                              <Text strong style={{ color: '#4338ca' }}>
                                Store Reply
                              </Text>
                            </Space>
                            <Text type='secondary' style={{ fontSize: 12 }}>
                              {item.replyDate ? new Date(item.replyDate).toLocaleDateString('vi-VN') : ''}
                            </Text>
                          </div>
                          <Paragraph style={{ margin: 0, color: '#334155' }}>{item.adminReply}</Paragraph>
                          <Button type='link' icon={<RollbackOutlined />} style={{ paddingInline: 0, marginTop: 8 }} onClick={() => openReplyModal(item)}>
                            Edit reply
                          </Button>
                        </div>
                      ) : (
                        <Button type='link' icon={<RollbackOutlined />} style={{ paddingInline: 0 }} onClick={() => openReplyModal(item)}>
                          Reply to this review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          open={!!replyingId}
          onCancel={() => {
            setReplyingId(null)
            setReplyText('')
          }}
          title='Reply to Review'
          okText={replySubmitting ? 'Sending...' : 'Send Reply'}
          onOk={submitReply}
          confirmLoading={replySubmitting}
          cancelText='Cancel'
          destroyOnHidden
        >
          {activeReplyItem ? (
            <div className='mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-4'>
              <div className='font-semibold text-slate-900'>{activeReplyItem.userName}</div>
              <div className='mt-1 text-sm text-slate-500'>{activeReplyItem.productId?.name || 'Unknown Product'}</div>
              <Paragraph style={{ margin: '12px 0 0', color: '#334155' }}>"{activeReplyItem.comment}"</Paragraph>
            </div>
          ) : null}

          <Input.TextArea
            rows={5}
            placeholder='Write your reply to the customer'
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
          />
        </Modal>
      </div>
    </ConfigProvider>
  )
}

export default Reviews
