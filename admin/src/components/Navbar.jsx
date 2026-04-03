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
    <nav className='border-b border-[#e7ddcf] bg-[rgba(255,251,247,0.72)] px-6 py-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <img src={logo} alt='logo' className='w-[min(220px,18vw)] min-w-[150px]' />
          <div className='hidden xl:block'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b7c6e]'>Forever Admin</p>
            <p className='mt-1 text-sm text-[#5f554a] dark:text-gray-400'>Refined commerce operations workspace</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={toggleDark}
            title={dark ? 'Light mode' : 'Dark mode'}
            className='flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e7ddcf] bg-white/80 text-[#6e6257] shadow-sm hover:border-[#cab79f] hover:text-[#1f1a17] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={handleLogout}
            className='flex items-center gap-2 rounded-2xl bg-[#1f1a17] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_30px_rgba(31,26,23,0.18)] hover:bg-[#2a221d] active:scale-[0.99]'
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
