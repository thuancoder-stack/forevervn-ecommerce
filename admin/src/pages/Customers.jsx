import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl as defaultBackendUrl } from '../config'

const Customers = ({ token, setToken, backendUrl: backendUrlFromProps }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState('')

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
    
    // Add a simple confirmation dialog for safety
    if (!window.confirm('Are you sure you want to delete this user?')) return;

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

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className='w-full px-4 py-6 md:px-6'>
      <p className='mb-4 text-xl font-semibold text-gray-800'>Customers Management</p>

      <div className='w-full max-w-[1020px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='grid grid-cols-[80px_2fr_2fr_1fr_90px] items-center border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 px-4 py-3 text-[13px] font-semibold text-gray-700'>
          <span>Avatar</span>
          <span>Name</span>
          <span>Email</span>
          <span>ID</span>
          <span className='text-center'>Action</span>
        </div>

        {loading ? (
          <div className='grid grid-cols-[80px_2fr_2fr_1fr_90px] px-4 py-8 text-center text-sm text-gray-500'>
            <span className='col-span-5'>Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className='grid grid-cols-[80px_2fr_2fr_1fr_90px] px-4 py-8 text-center text-sm text-gray-500'>
            <span className='col-span-5'>No users found.</span>
          </div>
        ) : (
          users.map((user, index) => (
            <div
              key={user._id}
              className={`grid min-h-[70px] grid-cols-[80px_2fr_2fr_1fr_90px] items-center border-b border-gray-100 px-4 py-2 text-[13px] text-gray-700 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
              } hover:bg-rose-50/50`}
            >
              <div className='flex justify-start'>
                <div className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-pink-100 text-pink-600 border border-pink-200 font-bold'>
                  {getInitials(user.name)}
                </div>
              </div>

              <span className='pr-3 font-medium text-gray-700'>{user.name || 'No Name'}</span>
              <span className='text-gray-600 truncate pr-3'>{user.email}</span>
              <span className='text-xs text-gray-400 font-mono truncate pr-2'>{user._id.slice(-6)}</span>

              <div className='text-center'>
                <button
                  onClick={() => handleRemove(user._id)}
                  disabled={removingId === user._id}
                  className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-base font-semibold leading-none text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40'
                  title="Delete User"
                >
                  {removingId === user._id ? '...' : 'X'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Customers
