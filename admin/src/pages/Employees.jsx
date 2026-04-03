import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  AppstoreAddOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Empty,
  Form,
  Input,
  Modal,
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

const Employees = ({ token, backendUrl: backendUrlFromProps }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [editingUserId, setEditingUserId] = useState(null)
  const [editFormData, setEditFormData] = useState({ name: '', email: '', password: '' })
  const [updating, setUpdating] = useState(false)

  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const apiBaseUrl = useMemo(
    () => (backendUrlFromProps || defaultBackendUrl || '').trim().replace(/\/+$/, ''),
    [backendUrlFromProps],
  )

  const fetchUsers = useCallback(async () => {
    if (!apiBaseUrl || !token) return

    try {
      setLoading(true)
      const { data } = await axios.get(`${apiBaseUrl}/api/user/list`, {
        headers: { token },
      })

      if (data?.success) {
        setEmployees(data.users.filter((u) => u.role === 'Employee' || u.role === 'Admin'))
      } else {
        toast.error(data?.message || 'Cannot load employees')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Cannot load employees')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAddEmployee = async () => {
    if (!apiBaseUrl || !token) return

    try {
      setAdding(true)
      const { data } = await axios.post(`${apiBaseUrl}/api/user/create-employee`, formData, {
        headers: { token },
      })

      if (data.success) {
        toast.success(data.message)
        setFormData({ name: '', email: '', password: '' })
        createForm.resetFields()
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleUpdateEmployee = async () => {
    if (!apiBaseUrl || !token) return

    try {
      setUpdating(true)
      const { data } = await axios.put(
        `${apiBaseUrl}/api/user/update-employee`,
        { id: editingUserId, ...editFormData },
        { headers: { token } },
      )

      if (data.success) {
        toast.success(data.message)
        setEditingUserId(null)
        setEditFormData({ name: '', email: '', password: '' })
        editForm.resetFields()
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemove = useCallback(async (id) => {
    try {
      const { data } = await axios.post(`${apiBaseUrl}/api/user/delete`, { id }, { headers: { token } })

      if (data?.success) {
        toast.success(data.message || 'Employee deleted')
        setEmployees((prev) => prev.filter((item) => item._id !== id))
      } else {
        toast.error(data?.message || 'Delete failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }, [apiBaseUrl, token])

  const openEditModal = useCallback(
    (user) => {
      setEditingUserId(user._id)
      const nextValues = { name: user.name, email: user.email, password: '' }
      setEditFormData(nextValues)
      editForm.setFieldsValue(nextValues)
    },
    [editForm],
  )

  const closeEditModal = useCallback(() => {
    setEditingUserId(null)
    setEditFormData({ name: '', email: '', password: '' })
    editForm.resetFields()
  }, [editForm])

  const stats = useMemo(() => {
    const teamMembers = employees.filter((item) => item.role === 'Employee').length

    return [
      {
        key: 'total',
        title: 'Total Staff',
        value: employees.length,
        icon: <TeamOutlined style={{ color: '#ec4899' }} />,
      },
      {
        key: 'employees',
        title: 'Employees',
        value: teamMembers,
        icon: <AppstoreAddOutlined style={{ color: '#16a34a' }} />,
      },
    ]
  }, [employees])

  const columns = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (_, user) => (
          <Space size={12}>
            <Avatar
              style={{
                backgroundColor: user.role === 'Admin' ? '#fff1f2' : '#eff6ff',
                color: user.role === 'Admin' ? '#e11d48' : '#2563eb',
                fontWeight: 700,
              }}
            >
              {(user.name || user.email || 'U').trim().charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong style={{ color: '#0f172a' }}>
                {user.name}
              </Text>
              <div>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  ID: #{String(user._id || '').slice(-6).toUpperCase()}
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
            <Text style={{ color: '#475569' }}>{email}</Text>
          </Space>
        ),
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        width: 140,
        render: (role) => (
          <Tag
            color={role === 'Admin' ? 'magenta' : 'green'}
            style={{ borderRadius: 999, paddingInline: 10, paddingBlock: 4, fontWeight: 600 }}
          >
            {role}
          </Tag>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 130,
        align: 'center',
        render: (_, user) => (
          <Space size={8}>
            <Button
              type='text'
              shape='circle'
              icon={<EditOutlined />}
              onClick={() => openEditModal(user)}
              style={{ color: '#2563eb' }}
            />
            <Popconfirm
              title='Delete employee'
              description='Are you sure you want to delete this employee?'
              okText='Delete'
              cancelText='Cancel'
              okButtonProps={{ danger: true }}
              onConfirm={() => handleRemove(user._id)}
            >
              <Button type='text' shape='circle' danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleRemove, openEditModal],
  )

  return (
    <ConfigProvider theme={adminAntdTheme} getPopupContainer={getSelectPopupContainer}>
      <div className={pageShellClass}>
        <div className='mb-6'>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Personnel & Roles
          </Title>
          <Text type='secondary'>Manage employee access and internal team members.</Text>
        </div>

        <div className={compactStatsRowClass}>
          {stats.map((item) => (
            <Card key={item.key} bordered={false} className={compactStatCardClass}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: '#0f172a' }} />
            </Card>
          ))}
        </div>

        <div className='grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]'>
          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <Space size={10}>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500'>
                  <UserAddOutlined />
                </div>
                <div>
                  <div className='font-semibold text-slate-900'>Add Employee</div>
                  <div className='text-xs font-normal text-slate-400'>Create a new staff account</div>
                </div>
              </Space>
            }
          >
            <Form form={createForm} layout='vertical' onFinish={handleAddEmployee} requiredMark={false}>
              <Form.Item
                label='Full Name'
                name='name'
                rules={[{ required: true, message: 'Please enter the employee name' }]}
              >
                <Input
                  size='large'
                  placeholder='Nguyen Van A'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Form.Item>

              <Form.Item
                label='Email'
                name='email'
                rules={[
                  { required: true, message: 'Please enter the email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  size='large'
                  prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                  placeholder='employee@forevervn.com'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Item>

              <Form.Item
                label='Password'
                name='password'
                rules={[{ required: true, message: 'Please enter a password' }]}
              >
                <Input.Password
                  size='large'
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder='Strong password'
                  autoComplete='new-password'
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Form.Item>

              <Button type='primary' htmlType='submit' size='large' loading={adding} block icon={<UserAddOutlined />}>
                {adding ? 'Creating...' : 'Create Account'}
              </Button>
            </Form>
          </Card>

          <Card
            bordered={false}
            className='shadow-sm'
            title={
              <div>
                <div className='font-semibold text-slate-900'>Team Directory</div>
                <div className='text-xs font-normal text-slate-400'>Internal staff accounts from the current data source</div>
              </div>
            }
          >
            <Table
              rowKey='_id'
              columns={columns}
              dataSource={employees}
              loading={loading}
              size='middle'
              pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }}
              locale={{
                emptyText: <Empty description='No employees found' image={Empty.PRESENTED_IMAGE_SIMPLE} />,
              }}
              scroll={{ x: 720 }}
            />
          </Card>
        </div>

        <Modal
          open={!!editingUserId}
          onCancel={closeEditModal}
          title='Update Employee'
          okText={updating ? 'Saving...' : 'Save Changes'}
          onOk={() => editForm.submit()}
          confirmLoading={updating}
          cancelText='Cancel'
          destroyOnHidden
        >
          <Form form={editForm} layout='vertical' onFinish={handleUpdateEmployee} requiredMark={false}>
            <Form.Item
              label='Full Name'
              name='name'
              rules={[{ required: true, message: 'Please enter the employee name' }]}
            >
              <Input
                size='large'
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </Form.Item>

            <Form.Item
              label='Email'
              name='email'
              rules={[
                { required: true, message: 'Please enter the email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                size='large'
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </Form.Item>

            <Form.Item label='New Password (Optional)' name='password'>
              <Input.Password
                size='large'
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder='Leave blank to keep unchanged'
                autoComplete='new-password'
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  )
}

export default Employees
