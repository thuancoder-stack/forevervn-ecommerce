import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const parsePrice = (price) => {
    if (typeof price === 'number') return price < 1000 ? price * 1000 : price;

    const digits = String(price ?? '').replace(/[^\d]/g, '');
    if (!digits) return 0;

    const n = Number(digits);
    if (!Number.isFinite(n)) return 0;

    return n < 1000 ? n * 1000 : n;
};

const copyByLanguage = {
    vi: {
        title1: 'TO\u00c0N B\u1ed8',
        title2: 'B\u1ed8 S\u01afU T\u1eacP',
        refinedDiscovery: 'Kh\u00e1m ph\u00e1 tinh ch\u1ecdn',
        intro:
            'B\u1ed9 s\u01b0u t\u1eadp \u0111\u01b0\u1ee3c tr\u00ecnh b\u00e0y r\u00f5 r\u00e0ng h\u01a1n v\u1edbi l\u1ecdc nhanh, s\u1eafp x\u1ebfp tr\u1ef1c quan v\u00e0 tr\u1ea3i nghi\u1ec7m duy\u1ec7t s\u1ea3n ph\u1ea9m m\u01b0\u1ee3t m\u00e0 tr\u00ean m\u1ecdi k\u00edch th\u01b0\u1edbc m\u00e0n h\u00ecnh.',
        showFilters: 'Hi\u1ec7n b\u1ed9 l\u1ecdc',
        hideFilters: '\u1ea8n b\u1ed9 l\u1ecdc',
        sortRelevant: 'S\u1eafp x\u1ebfp: Li\u00ean quan',
        sortLowHigh: 'S\u1eafp x\u1ebfp: Gi\u00e1 th\u1ea5p \u0111\u1ebfn cao',
        sortHighLow: 'S\u1eafp x\u1ebfp: Gi\u00e1 cao \u0111\u1ebfn th\u1ea5p',
        sortNewest: 'S\u1eafp x\u1ebfp: M\u1edbi nh\u1ea5t',
        sortNameAZ: 'S\u1eafp x\u1ebfp: T\u00ean A-Z',
        sortNameZA: 'S\u1eafp x\u1ebfp: T\u00ean Z-A',
        filters: 'B\u1ed9 l\u1ecdc',
        narrowYourStyle: 'Thu g\u1ecdn phong c\u00e1ch',
        clearAll: 'X\u00f3a t\u1ea5t c\u1ea3',
        priceRange: 'Kho\u1ea3ng gi\u00e1',
        minPlaceholder: 'Gi\u00e1 t\u1eeb',
        maxPlaceholder: 'Gi\u00e1 \u0111\u1ebfn',
        priceHint: 'B\u1ea1n c\u00f3 th\u1ec3 nh\u1eadp 100 ho\u1eb7c 100.000.',
        onlyBestSeller: 'Ch\u1ec9 hi\u1ec7n bestseller',
        categories: 'Danh m\u1ee5c',
        collapse: 'Thu g\u1ecdn',
        viewSubCategories: 'Xem danh m\u1ee5c con',
        productsFound: 'S\u1ea3n ph\u1ea9m t\u00ecm th\u1ea5y',
        matchedCount: (count) => `${count} s\u1ea3n ph\u1ea9m ph\u00f9 h\u1ee3p v\u1edbi l\u1ef1a ch\u1ecdn hi\u1ec7n t\u1ea1i.`,
        resetFilters: '\u0110\u1eb7t l\u1ea1i b\u1ed9 l\u1ecdc',
        noProductsTitle: 'Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m ph\u00f9 h\u1ee3p',
        noProductsBody:
            'Th\u1eed n\u1edbi r\u1ed9ng kho\u1ea3ng gi\u00e1, b\u1ecf b\u1edbt b\u1ed9 l\u1ecdc ho\u1eb7c x\u00f3a t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm \u0111\u1ec3 xem th\u00eam l\u1ef1a ch\u1ecdn.',
        loadMore: 'Xem th\u00eam',
        fallbackCategories: [
            { value: 'Nam', label: 'Nam' },
            { value: 'N\u1eef', label: 'N\u1eef' },
            { value: 'Tr\u1ebb em', label: 'Tr\u1ebb em' },
            { value: 'Ph\u1ee5 ki\u1ec7n', label: 'Ph\u1ee5 ki\u1ec7n' },
        ],
    },
    en: {
        title1: 'ALL',
        title2: 'COLLECTIONS',
        refinedDiscovery: 'Refined discovery',
        intro:
            'The collection is presented more clearly with quick filtering, intuitive sorting and a smoother browsing experience across every screen size.',
        showFilters: 'Show Filters',
        hideFilters: 'Hide Filters',
        sortRelevant: 'Sort by: Relevant',
        sortLowHigh: 'Sort by: Low to High',
        sortHighLow: 'Sort by: High to Low',
        sortNewest: 'Sort by: Newest',
        sortNameAZ: 'Sort by: Name A-Z',
        sortNameZA: 'Sort by: Name Z-A',
        filters: 'Filters',
        narrowYourStyle: 'Narrow your style',
        clearAll: 'Clear all',
        priceRange: 'Price Range',
        minPlaceholder: 'Min',
        maxPlaceholder: 'Max',
        priceHint: 'You can type 100 or 100,000.',
        onlyBestSeller: 'Only Bestseller',
        categories: 'Categories',
        collapse: 'Collapse',
        viewSubCategories: 'View sub-categories',
        productsFound: 'Products found',
        matchedCount: (count) => `${count} products match your current filters.`,
        resetFilters: 'Reset Filters',
        noProductsTitle: 'No matching products found',
        noProductsBody:
            'Try widening the price range, removing some filters or clearing the search term to see more options.',
        loadMore: 'Load More',
        fallbackCategories: [
            { value: 'Nam', label: 'Men' },
            { value: 'N\u1eef', label: 'Women' },
            { value: 'Tr\u1ebb em', label: 'Kids' },
            { value: 'Ph\u1ee5 ki\u1ec7n', label: 'Accessories' },
        ],
    },
};

const Collection = () => {
    const { products, search, setSearch, categories, subCategories } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copyByLanguage[language];

    const [showFilter, setShowFilter] = useState(false);
    const [category, setCategory] = useState([]);
    const [subCategory, setSubCategory] = useState([]);
    const [sortType, setSortType] = useState('relavent');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [onlyBestSeller, setOnlyBestSeller] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    const STEP = 16;
    const [visibleCount, setVisibleCount] = useState(STEP);

    useEffect(() => {
        setVisibleCount(STEP);
    }, [
        category,
        subCategory,
        sortType,
        search,
        minPrice,
        maxPrice,
        onlyBestSeller,
        products,
    ]);

    const toggleCategory = (value) => {
        setCategory((prev) =>
            prev.includes(value)
                ? prev.filter((x) => x !== value)
                : [...prev, value],
        );
    };

    const toggleExpandCategory = (catName) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [catName]: !prev[catName],
        }));
    };

    const toggleSubCategory = (value) => {
        setSubCategory((prev) =>
            prev.includes(value)
                ? prev.filter((x) => x !== value)
                : [...prev, value],
        );
    };

    const clearAll = () => {
        setCategory([]);
        setSubCategory([]);
        setSortType('relavent');
        setSearch('');
        setMinPrice('');
        setMaxPrice('');
        setOnlyBestSeller(false);
        setExpandedCategories({});
    };

    const filteredAndSorted = useMemo(() => {
        let list = Array.isArray(products) ? [...products] : [];

        if (category.length > 0) {
            list = list.filter((p) => category.includes(p.category));
        }

        if (subCategory.length > 0) {
            list = list.filter((p) => subCategory.includes(p.subCategory));
        }

        if (onlyBestSeller) {
            list = list.filter((p) => p.bestseller === true);
        }

        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter((p) => {
                const name = String(p.name ?? '').toLowerCase();
                const desc = String(p.description ?? '').toLowerCase();
                return name.includes(q) || desc.includes(q);
            });
        }

        const min = minPrice !== '' ? parsePrice(minPrice) : null;
        const max = maxPrice !== '' ? parsePrice(maxPrice) : null;

        if (min !== null) list = list.filter((p) => parsePrice(p.price) >= min);
        if (max !== null) list = list.filter((p) => parsePrice(p.price) <= max);

        switch (sortType) {
            case 'low-high':
                list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
                break;
            case 'high-low':
                list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
                break;
            case 'newest':
                list.sort((a, b) => (b.date || 0) - (a.date || 0));
                break;
            case 'name-az':
                list.sort((a, b) =>
                    String(a.name ?? '').localeCompare(String(b.name ?? '')),
                );
                break;
            case 'name-za':
                list.sort((a, b) =>
                    String(b.name ?? '').localeCompare(String(a.name ?? '')),
                );
                break;
            default:
                break;
        }

        return list;
    }, [
        products,
        category,
        subCategory,
        sortType,
        search,
        minPrice,
        maxPrice,
        onlyBestSeller,
    ]);

    const categoryOptions = categories.length === 0
        ? t.fallbackCategories.map((item) => ({ _id: item.value, name: item.value, label: item.label, _static: true }))
        : categories.map((item) => ({ ...item, label: item.name }));

    const displayed = filteredAndSorted.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAndSorted.length;

    return (
        <div className="space-y-6 py-4 sm:space-y-8 sm:py-6">
            <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                            {t.refinedDiscovery}
                        </p>
                        <Title text1={t.title1} text2={t.title2} />
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                            {t.intro}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            onClick={() => setShowFilter((prev) => !prev)}
                            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold tracking-[0.14em] text-slate-600 hover:bg-slate-900 hover:text-white lg:hidden"
                            type="button"
                        >
                            {showFilter ? t.hideFilters : t.showFilters}
                        </button>

                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value)}
                            className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-medium text-slate-600 outline-none"
                        >
                            <option value="relavent">{t.sortRelevant}</option>
                            <option value="low-high">{t.sortLowHigh}</option>
                            <option value="high-low">{t.sortHighLow}</option>
                            <option value="newest">{t.sortNewest}</option>
                            <option value="name-az">{t.sortNameAZ}</option>
                            <option value="name-za">{t.sortNameZA}</option>
                        </select>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
                <aside className={`${showFilter ? 'block' : 'hidden'} lg:block`}>
                    <div className="section-shell h-fit p-5 lg:sticky lg:top-[140px] lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                                    {t.filters}
                                </p>
                                <h2 className="display-font mt-2 text-2xl font-semibold text-slate-900">
                                    {t.narrowYourStyle}
                                </h2>
                            </div>

                            <button
                                onClick={clearAll}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                                type="button"
                            >
                                {t.clearAll}
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-4">
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    {t.priceRange}
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none"
                                        placeholder={t.minPlaceholder}
                                    />
                                    <input
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none"
                                        placeholder={t.maxPlaceholder}
                                    />
                                </div>

                                <p className="mt-3 text-xs leading-6 text-slate-400">
                                    {t.priceHint}
                                </p>
                            </div>

                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-4">
                                <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={onlyBestSeller}
                                        onChange={(e) =>
                                            setOnlyBestSeller(e.target.checked)
                                        }
                                    />
                                    {t.onlyBestSeller}
                                </label>
                            </div>

                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-4">
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    {t.categories}
                                </p>

                                <div className="space-y-0.5 text-sm text-slate-600">
                                    {categoryOptions.map((cat) => {
                                        const catSubs = cat._static ? [] : subCategories.filter(
                                            (s) => s.categoryId?._id === cat._id || s.categoryId === cat._id,
                                        );
                                        const isExpanded = expandedCategories[cat.name];
                                        const isChecked = category.includes(cat.name);

                                        return (
                                            <div key={cat._id}>
                                                <div className="flex items-center gap-1 rounded-xl hover:bg-slate-50">
                                                    <label className="flex flex-1 cursor-pointer items-center gap-3 px-2 py-2">
                                                        <input
                                                            type="checkbox"
                                                            value={cat.name}
                                                            onChange={() => toggleCategory(cat.name)}
                                                            checked={isChecked}
                                                            className="accent-slate-900"
                                                        />
                                                        <span className={`flex-1 font-medium ${isChecked ? 'text-slate-900' : ''}`}>
                                                            {cat.label}
                                                        </span>
                                                    </label>
                                                    {catSubs.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpandCategory(cat.name)}
                                                            className="mr-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                                                            title={isExpanded ? t.collapse : t.viewSubCategories}
                                                        >
                                                            {isExpanded ? '\u2212' : '+'}
                                                        </button>
                                                    )}
                                                </div>

                                                {isExpanded && catSubs.length > 0 && (
                                                    <div className="mb-1 ml-6 mt-0.5 space-y-0.5 border-l-2 border-slate-100 pl-3">
                                                        {catSubs.map((sub) => (
                                                            <label
                                                                key={sub._id}
                                                                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    value={sub.name}
                                                                    onChange={() => toggleSubCategory(sub.name)}
                                                                    checked={subCategory.includes(sub.name)}
                                                                    className="accent-slate-700"
                                                                />
                                                                <span className="text-slate-500">{sub.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="space-y-5">
                    <div className="section-shell px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    {t.productsFound}
                                </p>
                                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                                    {t.matchedCount(filteredAndSorted.length)}
                                </p>
                            </div>

                            <button
                                onClick={clearAll}
                                className="hidden rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white lg:inline-flex"
                                type="button"
                            >
                                {t.resetFilters}
                            </button>
                        </div>
                    </div>

                    {displayed.length === 0 ? (
                        <div className="section-shell px-6 py-12 text-center">
                            <p className="text-lg font-semibold text-slate-900">
                                {t.noProductsTitle}
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                {t.noProductsBody}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                                {displayed.map((item, index) => (
                                    <ProductItem
                                        key={item._id ?? index}
                                        name={item.name}
                                        id={item._id}
                                        price={item.price}
                                        oldPrice={item.oldPrice}
                                        image={item.image}
                                    />
                                ))}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={() => setVisibleCount((v) => v + STEP)}
                                        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-slate-800"
                                        type="button"
                                    >
                                        {t.loadMore}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Collection;
