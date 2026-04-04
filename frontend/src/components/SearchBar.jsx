import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/locale';

const getSafeImage = (imageValue) => {
    if (Array.isArray(imageValue) && imageValue.length > 0) return imageValue[0];
    if (typeof imageValue === 'string' && imageValue.trim()) return imageValue;
    return 'https://dummyimage.com/600x800/e5e7eb/6b7280&text=No+Image';
};

const SearchBar = () => {
    const {
        products,
        search,
        setSearch,
        showSearch,
        setShowSearch,
        logBehavior,
        navigate,
    } = useContext(ShopContext);
    const { language } = useLanguage();
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef(null);

    const keyword = search.trim().toLowerCase();

    const suggestions = useMemo(() => {
        if (!keyword) return [];

        return (Array.isArray(products) ? products : [])
            .filter((product) => {
                const name = String(product?.name ?? '').toLowerCase();
                const description = String(product?.description ?? '').toLowerCase();
                const category = String(product?.category ?? '').toLowerCase();
                const subCategory = String(product?.subCategory ?? '').toLowerCase();

                return (
                    name.includes(keyword) ||
                    description.includes(keyword) ||
                    category.includes(keyword) ||
                    subCategory.includes(keyword)
                );
            })
            .slice(0, 6);
    }, [keyword, products]);

    useEffect(() => {
        if (showSearch && search.trim().length > 2) {
            const delayDebounceFn = setTimeout(() => {
                logBehavior('SEARCH', search.trim());
            }, 1000);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [search, showSearch, logBehavior]);

    useEffect(() => {
        if (!showSearch) {
            setIsFocused(false);
        }
    }, [showSearch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeSearch = () => {
        setShowSearch(false);
        setIsFocused(false);
    };

    const handleSelectProduct = (productId) => {
        setSearch('');
        closeSearch();
        navigate(`/product/${productId}`);
    };

    const shouldShowDropdown = showSearch && isFocused && keyword.length > 0;

    if (!showSearch) return null;

    return (
        <div className="sticky top-[104px] z-40 mb-6 sm:top-[116px]">
            <div className="section-shell flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div ref={containerRef} className="relative flex-1">
                    <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-white px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
                        <img className="w-4" src={assets.search_icon} alt="search" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onFocus={() => setIsFocused(true)}
                            className="flex-1 bg-transparent text-sm outline-none sm:text-base"
                            type="text"
                            placeholder={
                                language === 'vi'
                                    ? 'Tìm kiếm sản phẩm, mô tả hoặc danh mục...'
                                    : 'Search products, descriptions or categories...'
                            }
                        />
                    </div>

                    {shouldShowDropdown && (
                        <div className="absolute left-0 right-0 top-[calc(100%+12px)] overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
                            <div className="border-b border-[var(--border)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {language === 'vi' ? 'Gợi ý sản phẩm' : 'Product suggestions'}
                            </div>

                            {suggestions.length > 0 ? (
                                <div className="max-h-[420px] overflow-y-auto py-2">
                                    {suggestions.map((product) => (
                                        <button
                                            key={product._id ?? product.id}
                                            type="button"
                                            onClick={() => handleSelectProduct(product._id ?? product.id)}
                                            className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-slate-50"
                                        >
                                            <img
                                                className="h-16 w-14 rounded-[18px] object-cover"
                                                src={getSafeImage(product.image)}
                                                alt={product.name}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
                                                    {product.name}
                                                </p>
                                                <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-slate-400">
                                                    {product.category ||
                                                        (language === 'vi'
                                                            ? 'Bộ sưu tập Forever'
                                                            : 'Forever Collection')}
                                                </p>
                                            </div>

                                            <p className="whitespace-nowrap text-sm font-semibold text-slate-900">
                                                {formatMoney(product.price, language)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-5 py-5 text-sm text-slate-500">
                                    {language === 'vi'
                                        ? 'Không tìm thấy sản phẩm phù hợp.'
                                        : 'No matching products found.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={closeSearch}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-3 text-sm font-semibold tracking-[0.14em] text-slate-600 hover:bg-slate-900 hover:text-white"
                    type="button"
                >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
            </div>
        </div>
    );
};

export default SearchBar;
