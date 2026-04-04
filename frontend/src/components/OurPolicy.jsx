import React, { useMemo } from 'react';
import { assets } from '../assets/assets';
import { useLanguage } from '../context/LanguageContext';

const OurPolicy = () => {
    const { language } = useLanguage();

    const items = useMemo(
        () =>
            language === 'vi'
                ? [
                      {
                          title: 'Chính sách đổi hàng dễ dàng',
                          description: 'Chúng tôi hỗ trợ đổi hàng nhanh gọn và ít rắc rối.',
                          image: assets.exchange_icon,
                      },
                      {
                          title: 'Hoàn trả trong 7 ngày',
                          description: 'Bạn có thể hoàn trả hàng miễn phí trong vòng 7 ngày.',
                          image: assets.quality_icon,
                      },
                      {
                          title: 'Hỗ trợ khách hàng tốt nhất',
                          description: 'Đội ngũ hỗ trợ luôn sẵn sàng giải đáp khi bạn cần.',
                          image: assets.support_img,
                      },
                  ]
                : [
                      {
                          title: 'Easy Exchange Policy',
                          description: 'We support quick and hassle-free exchanges.',
                          image: assets.exchange_icon,
                      },
                      {
                          title: '7 Days Return Policy',
                          description: 'Enjoy free returns within 7 days.',
                          image: assets.quality_icon,
                      },
                      {
                          title: 'Best Customer Support',
                          description: 'Our support team is always ready whenever you need help.',
                          image: assets.support_img,
                      },
                  ],
        [language],
    );

    return (
        <section className='grid gap-4 py-10 sm:grid-cols-2 sm:py-14 lg:grid-cols-3'>
            {items.map((item) => (
                <article key={item.title} className='section-shell p-6 text-center sm:p-7'>
                    <div className='mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]'>
                        <img src={item.image} className='w-7' alt='' />
                    </div>
                    <p className='text-base font-semibold text-slate-900'>{item.title}</p>
                    <p className='mt-3 text-sm leading-7 text-slate-500'>
                        {item.description}
                    </p>
                </article>
            ))}
        </section>
    );
};

export default OurPolicy;
