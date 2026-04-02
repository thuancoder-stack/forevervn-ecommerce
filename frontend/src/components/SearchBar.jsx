import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'

const SearchBar = () => {
    const { search, setSearch, showSearch, setShowSearch, logBehavior } = useContext(ShopContext);
    const [visible, setVisible] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.includes('collection')) {
            setVisible(true);
        } else {
            setVisible(false);
            setShowSearch(false);
        }
    }, [location.pathname, setShowSearch]);

    // Tracking Search Behavior (Debounced)
    useEffect(() => {
        if (showSearch && search.trim().length > 2) {
            const delayDebounceFn = setTimeout(() => {
                logBehavior('SEARCH', search.trim());
            }, 1000);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [search, showSearch, logBehavior]);

    if (!visible || !showSearch) return null;

    return (
        <div className='sticky top-[104px] z-40 mb-6 sm:top-[116px]'>
            <div className='section-shell flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                <div className='flex flex-1 items-center gap-3 rounded-full border border-[var(--border)] bg-white px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'>
                    <img
                        className='w-4'
                        src={assets.search_icon}
                        alt='search'
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='flex-1 bg-transparent text-sm outline-none sm:text-base'
                        type='text'
                        placeholder='Tìm kiếm sản phẩm, mô tả hoặc danh mục...'
                    />
                </div>

                <button
                    onClick={() => setShowSearch(false)}
                    className='inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-3 text-sm font-semibold tracking-[0.14em] text-slate-600 hover:bg-slate-900 hover:text-white'
                    type='button'
                >
                    Đóng
                </button>
            </div>
        </div>
    );
}

export default SearchBar
