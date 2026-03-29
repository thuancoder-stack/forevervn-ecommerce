import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Update from './pages/Update'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { backendUrl } from './config'

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  if (!token) {
    return (
      <div className='bg-gray-50 min-h-screen'>
        <ToastContainer />
        <Login setToken={setToken} />
      </div>
    )
  }

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      <Navbar setToken={setToken} />

      <div className='flex w-full'>
        <Sidebar />

        <div className='flex-1 p-4'>
          <Routes>
            <Route path='/' element={<Navigate to='/dashboard' replace />} />
            <Route path='/dashboard' element={<Dashboard token={token} backendUrl={backendUrl} />} />
            <Route path='/customers' element={<Customers token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/add' element={<Add token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/update/:id' element={<Update token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/list' element={<List token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/orders' element={<Orders token={token} backendUrl={backendUrl} />} />
            <Route path='*' element={<Navigate to='/dashboard' replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App