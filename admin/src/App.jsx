import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import ToastSoundBridge from './components/ToastSoundBridge'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Employees from './pages/Employees'
import ImportBatch from './pages/ImportBatch'
import BulkOperation from './pages/BulkOperation'
import Vouchers from './pages/Vouchers'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Update from './pages/Update'
import Categories from './pages/Categories'
import SubCategories from './pages/SubCategories'
import AuditLogs from './pages/AuditLogs'
import Banners from './pages/Banners'
import Reviews from './pages/Reviews'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { backendUrl } from './config'


const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  
  // Custom hook hoặc state track role (Nên có thêm setRole nhưng trong bài này Role query theo token base64 ở file sau)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  if (!token) {
    return (
      <div className='min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] transition-colors duration-300'>
        <ToastSoundBridge />
        <ToastContainer />
        <Login setToken={setToken} />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] transition-colors duration-300'>
      <ToastSoundBridge />
      <ToastContainer />
      <Navbar setToken={setToken} />

      <div className='flex min-h-[calc(100vh-81px)] w-full'>
        <Sidebar />

        <div className='flex-1 min-w-0 p-4 md:p-5 xl:p-6'>
          <Routes>
            <Route path='/' element={<Navigate to='/dashboard' replace />} />
            <Route path='/dashboard' element={<Dashboard token={token} backendUrl={backendUrl} />} />
            <Route path='/employees' element={<Employees token={token} backendUrl={backendUrl} />} />
            <Route path='/import-batch' element={<ImportBatch token={token} backendUrl={backendUrl} />} />
            <Route path='/bulk-operation' element={<BulkOperation token={token} backendUrl={backendUrl} />} />
            <Route path='/customers' element={<Customers token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/vouchers' element={<Vouchers token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/add' element={<Add token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/add-item' element={<Add token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/add-items' element={<Add token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/update/:id' element={<Update token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/list' element={<List token={token} setToken={setToken} backendUrl={backendUrl} />} />
            <Route path='/orders' element={<Orders token={token} backendUrl={backendUrl} />} />
            <Route path='/categories' element={<Categories token={token} backendUrl={backendUrl} />} />
            <Route path='/sub-categories' element={<SubCategories token={token} backendUrl={backendUrl} />} />
            <Route path='/audit-logs' element={<AuditLogs token={token} backendUrl={backendUrl} />} />
            <Route path='/banners' element={<Banners token={token} backendUrl={backendUrl} />} />
            <Route path='/reviews' element={<Reviews token={token} backendUrl={backendUrl} />} />
            <Route path='*' element={<Navigate to='/dashboard' replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
