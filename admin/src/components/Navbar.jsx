import React, { useState } from 'react'
import logo from '../assets/logo.png'

const Navbar = ({ setToken }) => {
  const [dark, setDark] = useState(false)

  const toggleDark = () => {
    const newDark = !dark
    setDark(newDark)
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <nav className='flex items-center justify-between py-4 px-[4%] bg-white dark:bg-gray-900 transition-colors'>

      <img src={logo} alt='logo' className='w-[max(15%,150px)]' />

      <div className='flex items-center gap-5 mr-4'>
        <button
          onClick={toggleDark}
          className='w-10 h-10 rounded-full border border-pink-200 dark:border-gray-600 bg-pink-50 dark:bg-gray-800 flex items-center justify-center text-lg transition-colors'
        >
          {dark ? '☀️' : '🌙'}
        </button>

        <button
          onClick={() => setToken('')}
          className='bg-pink-500 hover:bg-pink-600 transition-colors text-white rounded-full text-sm px-8 py-2 font-medium tracking-wide shadow-sm'
        >
          Logout
        </button>
      </div>

    </nav>
  )
}

export default Navbar