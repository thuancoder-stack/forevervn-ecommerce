import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  DeleteOutlined,
  MailOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
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
  pageShellClass,
} from '../lib/adminAntd'

const { Title, Text } = Typography

const Customers = ({ token, setToken, backendUrl: backendUrlFromProps }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

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

  const fetchUsers = useCallback(async () => {
    if (!apiBaseUrl || !token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data } = await axios.get(`${apiBaseUrl}/api/user/list`, {
        headers: { token },
        timeout: 20000,
      })

      if (data?.success) {
        setUsers(Array.isArray(data.users) ? data.users : [])
        return
      }

      if (handleUnauthorized(data?.message)) return
      toast.error(data?.message || 'Cannot load users')
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Cannot load users'
      if (handleUnauthorized(message)) return
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, handleUnauthorized, token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRemove = async (id) => {
    if (!id || removingId || !apiBaseUrl || !token) return

    try {
      setRemovingId(id)
      const { data } = await axios.post(
        `${apiBaseUrl}/api/user/delete`,
        { id },
        { headers: { token }, timeout: 20000 },
      )

      if (data?.success) {
        toast.success(data.message || 'User deleted')
        setUsers((prev) => prev.filter((item) => item._id !== id))
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

  const getInitials = (name) => {
    const trimmed = String(name || '').trim()
    if (!trimmed) return 'U'
    return trimmed.charAt(0).toUpperCase()
  }

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return users

    return users.filter((user) => {
      const haystack = [user?.name, user?.email, user?.role].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [searchTerm, users])

  const stats = useMemo(() => {
    const customers = users.filter((item) => item?.role === 'Customer').length
    const staff = users.filter((item) => item?.role === 'Admin' || item?.role === 'Employee').length
    const unnamed = users.filter((item) => !String(item?.name || '').trim()).length

    return [
      {
        key: 'total',
        title: 'Total Accounts',
        value: users.length,
        icon: <TeamOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'customers',
        title: 'Customers',
        value: customers,
        icon: <UserOutlined style={{ color: '#2563eb' }} />,
      },
      {
        key: 'staff',
        title: 'Staff Records',
        value: staff,
        icon: <TeamOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'unnamed',
        title: 'Missing Names',
        value: unnamed,
        icon: <MailOutlined style={{ color: '#f97316' }} />,
      },
    ]
  }, [users])

  const columns = useMemo(
    () => [
      {
        title: 'Customer',
        key: 'customer',
        width: 280,
        render: (_, user) => (
          <Space size={12}>
            <Avatar
              style={{
                backgroundColor: user?.role === 'Customer' ? '#eff6ff' : '#fff1f2',
                color: user?.role === 'Customer' ? '#2563eb' : '#e11d48',
                fontWeight: 700,
              }}
            >
              {getInitials(user?.name)}
            </Avatar>
            <div>
              <Text strong style={{ color: '#0f172a' }}>
                {user?.name || 'No Name'}
              </Text>
              <div>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  ID: #{String(user?._id || '').slice(-6).toUpperCase()}
                </Text>
              </div>
            </div>
          </Space>
        ),
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        render: (email) => (
          <Space size={8}>
            <MailOutlined style={{ color: '#94a3b8' }} />
            <Text style={{ color: '#475569' }}>{email || '-'}</Text>
          </Space>
        ),
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        width: 140,
        render: (role) => (
          <Tag color={role === 'Customer' ? 'blue' : role === 'Admin' ? 'magenta' : 'green'} style={{ borderRadius: 999, fontWeight: 600 }}>
            {role || 'Unknown'}
          </Tag>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 110,
        align: 'center',
        render: (_, user) => (
          <Popconfirm
            title='Delete account'
            description='This will permanently remove the selected user account.'
            okText='Delete'
            cancelText='Cancel'
            okButtonProps={{ danger: true, loading: removingId === user?._id }}
            onConfirm={() => handleRemove(user?._id)}
          >
            <Button type='text' shape='circle' danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ),
      },
    ],
    [removingId],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Customer Accounts
            </Title>
            <Text type='secondary'>Review registered accounts, search profiles and remove invalid records when needed.</Text>
          </div>

          <Input
            size='large'
            placeholder='Search name, email or role'
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ width: 320, maxWidth: '100%' }}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
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
              <div className='font-semibold text-slate-900'>Accounts Directory</div>
              <div className='text-xs font-normal text-slate-400'>Live user records returned from the current account endpoint.</div>
            </div>
          }
        >
          <Table
            rowKey='_id'
            columns={columns}
            dataSource={filteredUsers}
            loading={loading}
            size='middle'
            pagination={{ pageSize: 7, showSizeChanger: false, size: 'small' }}
            scroll={{ x: 860 }}
            locale={{
              emptyText: <Empty description='No users found' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default Customers
