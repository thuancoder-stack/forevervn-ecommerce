import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import logo from '../assets/logo.png'
import { backendUrl } from '../config'

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!backendUrl) {
      toast.error('Thiếu VITE_BACKEND_URL trong file .env')
      return
    }

    setLoading(true)

    try {
      console.log('Attempting login to:', `${backendUrl}/api/user/admin/login`)
      const { data } = await axios.post(`${backendUrl}/api/user/admin/login`, {
        email: email.trim(),
        password,
      })

      if (!data.success) {
        toast.error(data.message || 'Login failed')
        return
      }

      if (!data.token) {
        toast.error('Server không trả về token')
        return
      }

      setToken(data.token)
      toast.success('Welcome back!')
      navigate('/add', { replace: true })
    } catch (err) {
      console.error('Login Error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đăng nhập'
      toast.error(errorMsg)
      
      if (err.message === 'Network Error') {
        console.warn('Network Error detected. Please check if backend is running on', backendUrl)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100'>
        <div className='text-center mb-8'>
          <img src={logo} alt='logo' className='h-10 mx-auto mb-4' />
          <p className='text-sm text-gray-400'>Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-pink-400 transition-colors'>
            <Mail size={16} className='text-gray-400' />
            <input
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400'
            />
          </div>

          <div className='flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-pink-400 transition-colors'>
            <Lock size={16} className='text-gray-400' />
            <input
              type='password'
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='flex items-center justify-center gap-2 mt-2 bg-pink-500 hover:bg-pink-600 active:scale-95 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-sm'
          >
            <LogIn size={16} />
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login