import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Sparkles, WandSparkles } from 'lucide-react';
import { assets } from '../assets/assets';
import { useLanguage } from '../context/LanguageContext';
import Marquee from './Marquee';

const Hero = () => {
  const { language } = useLanguage();

  const copy = useMemo(() => {
    if (language === 'vi') {
      return {
        badge: 'ForeverVN mùa mới',
        title: 'Không gian thời trang cao cấp, giàu cảm xúc và truyền cảm hứng.',
        description:
          'Khám phá câu chuyện đằng sau mỗi thiết kế với nhịp điệu thị giác tinh tế. ForeverVN mở ra trải nghiệm cuộn mượt mà, nơi mỗi sản phẩm và danh mục đều có không gian riêng để tỏa sáng.',
        quickNotes: [
          'Trang chủ kể chuyện trực quan, cuốn hút',
          'Mặc thử ảo cho các sản phẩm áo quần',
          'Chi tiết sản phẩm và checkout mượt mà',
        ],
        shopNow: 'Mua ngay',
        ourStory: 'Câu chuyện thương hiệu',
        support1: 'Đổi hàng trong 7 ngày',
        support2: 'Tuyển chọn theo mùa',
        support3: 'Trải nghiệm hiện đại',
        cardTitle: 'Ngôn ngữ thiết kế mới',
        cardText: 'Giao diện trực quan, tạo ấn tượng mạnh mẽ ngay từ ánh nhìn đầu tiên.',
        imageAlt: 'Bộ sưu tập mới',
      };
    }

    return {
      badge: 'ForeverVN new season',
      title: 'A premium fashion space, emotional and inspiring.',
      description:
        'Discover the story behind every design with a seamless scrolling experience. ForeverVN brings a refined visual rhythm where each product and category has room to shine.',
      quickNotes: [
        'Engaging and visual storytelling layout',
        'Virtual try-on available on apparel pieces',
        'Fast checkout flow with cleaner details',
      ],
      shopNow: 'Shop now',
      ourStory: 'Our story',
      support1: '7 day exchange support',
      support2: 'Curated seasonal edits',
      support3: 'Modern product experience',
      cardTitle: 'New design language',
      cardText: 'Intuitive interface, making a strong and luxurious first impression.',
      imageAlt: 'Latest arrivals',
    };
  }, [language]);

  return (
    <section className='section-shell relative overflow-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(221,232,243,0.82),transparent_28%),linear-gradient(135deg,rgba(255,247,237,0.85),rgba(255,255,255,0.8))]' />

      <div className='relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12'>
        <div className='max-w-2xl'>
          <div className='inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.06)]'>
            <span className='h-2 w-2 rounded-full bg-slate-900' />
            {copy.badge}
          </div>

          <h1 className='display-font mt-6 text-4xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl lg:text-6xl'>
            {copy.title}
          </h1>

          <p className='mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base'>
            {copy.description}
          </p>

          <div className='mt-6 grid gap-3 sm:grid-cols-3'>
            {copy.quickNotes.map((item) => (
              <div
                key={item}
                className='rounded-[20px] border border-white/70 bg-white/80 px-4 py-4 text-sm leading-6 text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.06)]'
              >
                {item}
              </div>
            ))}
          </div>

          <div className='mt-8 flex flex-wrap items-center gap-4'>
            <Link
              to='/collection'
              className='inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800'
            >
              {copy.shopNow}
              <ArrowRight className='h-4 w-4' />
            </Link>

            <Link
              to='/about'
              className='inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/85 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-600'
            >
              {copy.ourStory}
            </Link>
          </div>

          <div className='mt-8 flex flex-wrap gap-3'>
            <div className='inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
              <BadgeCheck className='h-4 w-4 text-emerald-500' />
              {copy.support1}
            </div>
            <div className='inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
              <Sparkles className='h-4 w-4 text-amber-500' />
              {copy.support2}
            </div>
            <div className='inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
              <WandSparkles className='h-4 w-4 text-indigo-500' />
              {copy.support3}
            </div>
          </div>
        </div>

        <div className='relative'>
          <div className='absolute -left-6 top-8 hidden h-28 w-28 rounded-full bg-white/70 blur-2xl md:block' />
          <div className='absolute -right-4 bottom-10 hidden h-24 w-24 rounded-full bg-[#ffe8cc]/80 blur-2xl md:block' />

          <div className='overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-3 shadow-[0_28px_50px_rgba(15,23,42,0.12)]'>
            <img
              className='h-full w-full rounded-[22px] object-cover'
              src={assets.hero_img}
              alt={copy.imageAlt}
            />
          </div>

          <div className='absolute -bottom-5 left-5 hidden max-w-[240px] rounded-[22px] border border-white/80 bg-white/92 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.12)] lg:block'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400'>
              {copy.cardTitle}
            </p>
            <p className='mt-2 text-sm leading-6 text-slate-600'>
              {copy.cardText}
            </p>
          </div>
        </div>
      </div>
      
      <div className='relative z-10 w-full pt-4'>
        <Marquee />
      </div>
    </section>
  );
};

export default Hero;
