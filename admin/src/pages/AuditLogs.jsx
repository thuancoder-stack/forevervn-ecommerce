import React, { useEffect, useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl as defaultBackendUrl } from '../config'
import {
  CalendarOutlined,
  ClearOutlined,
  ProfileOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  ConfigProvider,
  Empty,
  Input,
  Segmented,
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
  pageShellClass,
} from '../lib/adminAntd'

const { Title, Text } = Typography

const AuditLogs = ({ token, backendUrl: backendUrlFromProps }) => {
  const [systemLogs, setSystemLogs] = useState([])
  const [userLogs, setUserLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('system')
  const [searchTerm, setSearchTerm] = useState('')
  const [clearing, setClearing] = useState(false)

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

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiBaseUrl}/api/audit-log/list`, { headers: { token } })
      if (response.data.success) {
        setSystemLogs(response.data.logs || [])
        setUserLogs(response.data.userBehaviors || [])
      } else {
        if (handleUnauthorized(response.data.message)) return
        toast.error(response.data.message)
      }
    } catch (error) {
      if (handleUnauthorized(error.response?.data?.message)) return
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, handleUnauthorized, token])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const clearLogs = async () => {
    if (!window.confirm('Clear all system audit logs?')) return

    try {
      setClearing(true)
      const response = await axios.post(`${apiBaseUrl}/api/audit-log/clear`, {}, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        fetchLogs()
      } else {
        if (handleUnauthorized(response.data.message)) return
        toast.error(response.data.message)
      }
    } catch (error) {
      if (handleUnauthorized(error.response?.data?.message)) return
      toast.error(error.message)
    } finally {
      setClearing(false)
    }
  }

  const getActionColor = (action = '') => {
    if (action.includes('ADD')) return 'success'
    if (action.includes('UPDATE')) return 'processing'
    if (action.includes('DELETE')) return 'error'
    return 'default'
  }

  const getBehaviorLabel = (log) => {
    if (log.actionType === 'VIEW_PRODUCT') return `Viewed product: ${log.targetId}`
    if (log.actionType === 'SEARCH') return `Search: ${log.metadata?.keyword || log.targetId}`
    if (log.actionType === 'ADD_TO_CART') return `Added to cart: ${log.targetId}`
    if (log.actionType === 'REMOVE_FROM_CART') return `Removed from cart: ${log.targetId}`
    if (log.actionType === 'PLACE_ORDER') return `Placed order: ${log.targetId}`
    return log.description || `Action: ${log.targetId || '-'}`
  }

  const filteredSystemLogs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return systemLogs

    return systemLogs.filter((log) =>
      [log.action, log.actionType, log.description, log.userName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [searchTerm, systemLogs])

  const filteredUserLogs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return userLogs

    return userLogs.filter((log) =>
      [log.actionType, log.targetId, log.userId, log.description, log.metadata?.keyword]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [searchTerm, userLogs])

  const stats = useMemo(() => {
    const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentActivity =
      systemLogs.filter((log) => new Date(log.timestamp || log.createdAt).getTime() >= recentCutoff).length +
      userLogs.filter((log) => new Date(log.createdAt || log.timestamp).getTime() >= recentCutoff).length

    return [
      {
        key: 'system',
        title: 'System Logs',
        value: systemLogs.length,
        icon: <ProfileOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'user',
        title: 'User Behaviors',
        value: userLogs.length,
        icon: <UserOutlined style={{ color: '#2563eb' }} />,
      },
      {
        key: 'recent',
        title: 'Last 7 Days',
        value: recentActivity,
        icon: <CalendarOutlined style={{ color: '#16a34a' }} />,
      },
      {
        key: 'actors',
        title: 'Unique Actors',
        value: new Set([...systemLogs.map((log) => log.userName), ...userLogs.map((log) => log.userId)].filter(Boolean)).size,
        icon: <TeamOutlined style={{ color: '#f97316' }} />,
      },
    ]
  }, [systemLogs, userLogs])

  const systemColumns = useMemo(
    () => [
      {
        title: 'Timestamp',
        key: 'timestamp',
        width: 220,
        render: (_, log) => (
          <Space size={8}>
            <CalendarOutlined style={{ color: '#94a3b8' }} />
            <Text style={{ fontSize: 12, color: '#475569' }}>
              {new Date(log.timestamp || log.createdAt).toLocaleString('vi-VN')}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 170,
        render: (_, log) => (
          <Tag color={getActionColor(log.action || log.actionType)} style={{ borderRadius: 999, fontWeight: 700 }}>
            {log.action || log.actionType}
          </Tag>
        ),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (value) => <Text style={{ color: '#475569' }}>{value}</Text>,
      },
      {
        title: 'Actor',
        key: 'actor',
        width: 180,
        render: (_, log) => (
          <Space size={8}>
            <UserOutlined style={{ color: '#94a3b8' }} />
            <Text strong style={{ color: '#0f172a' }}>
              {log.userName || 'Admin'}
            </Text>
          </Space>
        ),
      },
    ],
    [],
  )

  const userColumns = useMemo(
    () => [
      {
        title: 'Timestamp',
        key: 'timestamp',
        width: 220,
        render: (_, log) => (
          <Space size={8}>
            <CalendarOutlined style={{ color: '#94a3b8' }} />
            <Text style={{ fontSize: 12, color: '#475569' }}>
              {new Date(log.createdAt || log.timestamp).toLocaleString('vi-VN')}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Behavior',
        key: 'actionType',
        width: 170,
        render: (_, log) => (
          <Tag
            color={log.actionType === 'ADD_TO_CART' || log.actionType === 'PLACE_ORDER' ? 'success' : 'magenta'}
            style={{ borderRadius: 999, fontWeight: 700 }}
          >
            {log.actionType}
          </Tag>
        ),
      },
      {
        title: 'Details',
        key: 'details',
        render: (_, log) => <Text style={{ color: '#475569' }}>{getBehaviorLabel(log)}</Text>,
      },
      {
        title: 'User / Guest',
        key: 'userId',
        width: 200,
        render: (_, log) => (
          <Text code style={{ fontSize: 12 }}>
            {log.userId || 'Guest'}
          </Text>
        ),
      },
    ],
    [],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Audit Trail
            </Title>
            <Text type='secondary'>Review system activity, staff actions and customer behavior logs from the current backend stream.</Text>
          </div>
          <Button danger size='large' icon={<ClearOutlined />} loading={clearing} onClick={clearLogs}>
            Clear System Logs
          </Button>
        </div>

        <div className={compactStatsRowClass}>
          {stats.map((item) => (
            <Card key={item.key} bordered={false} className={compactStatCardClass}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: '#0f172a' }} />
            </Card>
          ))}
        </div>

        <Card bordered={false} className='mb-6 shadow-sm' bodyStyle={{ padding: 20 }}>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
            <Segmented
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { label: 'Admin & Employee', value: 'system' },
                { label: 'User Behaviors', value: 'user' },
              ]}
            />
            <Input
              size='large'
              placeholder={`Search ${activeTab === 'system' ? 'actions' : 'behaviors'}...`}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              style={{ width: 340, maxWidth: '100%' }}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </Card>

        <Card
          bordered={false}
          className='shadow-sm'
          title={
            <div>
              <div className='font-semibold text-slate-900'>
                {activeTab === 'system' ? 'System Activity Directory' : 'User Behavior Directory'}
              </div>
              <div className='text-xs font-normal text-slate-400'>
                {activeTab === 'system'
                  ? 'Audit logs generated by admins and employees.'
                  : 'Behavior tracking stream captured from storefront users.'}
              </div>
            </div>
          }
        >
          <Table
            rowKey='_id'
            columns={activeTab === 'system' ? systemColumns : userColumns}
            dataSource={activeTab === 'system' ? filteredSystemLogs : filteredUserLogs}
            loading={loading}
            size='middle'
            pagination={{ pageSize: 8, showSizeChanger: false, size: 'small' }}
            scroll={{ x: 980 }}
            locale={{
              emptyText: (
                <Empty
                  description={activeTab === 'system' ? 'No system activity yet' : 'No user behaviors recorded yet'}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default AuditLogs
