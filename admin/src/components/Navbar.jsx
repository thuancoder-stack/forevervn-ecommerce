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
    <nav className='sticky top-0 z-40 px-4 py-4 md:px-6'>
      <div
        className='flex items-center justify-between gap-4 rounded-[28px] border px-4 py-3.5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] backdrop-blur-2xl transition-colors duration-300 md:px-6'
        style={{
          borderColor: 'var(--admin-border)',
          background: 'var(--admin-glass)',
        }}
      >
        <div className='flex items-center gap-4'>
          <img src={logo} alt='logo' className='w-[min(220px,18vw)] min-w-[150px]' />
          <div className='hidden xl:block'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--admin-tertiary)]'>Forever Admin</p>
            <p className='mt-1 text-sm text-[var(--admin-muted)]'>Refined commerce operations workspace</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={toggleDark}
            title={dark ? 'Light mode' : 'Dark mode'}
            className='group flex items-center gap-2 rounded-[18px] border px-3 py-2.5 text-sm font-medium shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5'
            style={{
              borderColor: 'var(--admin-border)',
              background: 'var(--admin-surface-solid)',
              color: 'var(--admin-muted)',
            }}
          >
            <span
              className='flex h-8 w-8 items-center justify-center rounded-[14px]'
              style={{
                background: dark ? 'rgba(241, 215, 165, 0.16)' : 'rgba(42, 35, 29, 0.08)',
                color: dark ? 'var(--admin-accent)' : 'var(--admin-accent)',
              }}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </span>
            <span className='hidden sm:block'>{dark ? 'Light' : 'Dark'}</span>
          </button>

          <button
            onClick={handleLogout}
            className='flex items-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-semibold shadow-[0_16px_34px_rgba(31,26,23,0.16)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.99]'
            style={
              dark
                ? {
                    background: 'linear-gradient(135deg, #f2dfba 0%, #d8b57a 100%)',
                    color: '#181410',
                  }
                : {
                    background: 'linear-gradient(135deg, #241d18 0%, #40342c 100%)',
                    color: '#ffffff',
                  }
            }
          >
            <span
              className='flex h-8 w-8 items-center justify-center rounded-[14px]'
              style={{
                background: dark ? 'rgba(24, 20, 16, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <LogOut size={15} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
