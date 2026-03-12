import React from 'react'
import logo from '../assets/logo.png'

const Navbar = ({ setToken }) => {
  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
      <div>
        <img src={logo} alt='logo' className='w-[max(10%,80px)]' />
        <p className='text-pink-600 font-semibold text-sm'>ADMIN PANEL</p>
      </div>
      <button
        onClick={() => setToken('')}
        className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'
      >
        Logout
      </button>
    </div>
  )
}

export default Navbar