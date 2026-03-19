import React, { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ setToken }) => {
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggleDark = () => {
    setDark((prev) => !prev)
  }

  const handleLogout = () => {
    setToken('')
    localStorage.removeItem('token')
    navigate('/', { replace: true })
  }

  return (
    <nav className='flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 transition-colors shadow-sm'>
      <img src={logo} alt='logo' className='w-[max(12%,120px)]' />

      <div className='flex items-center gap-3'>
        <button
          onClick={toggleDark}
          title={dark ? 'Light mode' : 'Dark mode'}
          className='w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:border-pink-300 hover:text-pink-500 transition-all duration-200'
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={handleLogout}
          className='flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 active:scale-95 transition-all duration-200 shadow-sm'
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar