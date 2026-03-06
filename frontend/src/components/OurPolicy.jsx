import React from 'react'
import { assets } from '../assets/assets'

const OurPolicy = () => {
    return (
        <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700'>

            {/* Easy Exchange Policy */}
            <div>
                <img src={assets.exchange_icon} className='w-12 m-auto mb-5' alt="" />
                <p className='font-semibold'>Easy Exchange Policy</p>
                <p className='text-gray-400'>Chúng tôi hỗ trợ đổi hàng dễ dàng, không rắc rối</p>
            </div>

            {/* 7 Days Return Policy */}
            <div>
                <img src={assets.quality_icon} className='w-12 m-auto mb-5' alt="" />
                <p className='font-semibold'>7 Days Return Policy</p>
                <p className='text-gray-400'>Hoàn trả hàng miễn phí trong vòng 7 ngày</p>
            </div>

            {/* Best Customer Support */}
            <div>
                <img src={assets.support_img} className='w-12 m-auto mb-5' alt="" />
                <p className='font-semibold'>Best Customer Support</p>
                <p className='text-gray-400'>Hỗ trợ khách hàng 24/7, luôn sẵn sàng giải đáp</p>
            </div>

        </div>
    )
}

export default OurPolicy