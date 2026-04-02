import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Home from './pages/Home'
import Collection from './pages/Collection'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'
import MyAccount from './pages/MyAccount'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'

const App = () => {
  return (
    <div className='min-h-screen'>
      <ToastContainer
        autoClose={2400}
        closeButton={false}
        hideProgressBar
        newestOnTop
        position='top-right'
        toastClassName={() =>
          'section-shell mb-3 rounded-[20px] bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
        }
        bodyClassName={() => 'p-0 font-medium'}
      />

      <Navbar />

      <main className='page-shell pb-10 pt-28 sm:pb-14 sm:pt-32 lg:pt-36'>
        <SearchBar />

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/collection' element={<Collection />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/product/:productId' element={<Product />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/login' element={<Login />} />
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path='/orders' element={<Orders />} />
          <Route path='/my-account' element={<MyAccount />} />
        </Routes>

        <Footer />
      </main>
    </div>
  )
}

export default App
