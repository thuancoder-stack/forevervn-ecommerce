import React from 'react'
import Navbar from './components/Navbar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {

  return (
    <div className='bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors'>
      <ToastContainer />
      <Navbar setToken={() => {}} />  
      <hr />
    </div>
  )
}

export default App