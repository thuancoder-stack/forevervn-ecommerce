import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
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

const Collection = () => {
    const { products, search, setSearch, categories, subCategories } = useContext(ShopContext);

    const [showFilter, setShowFilter] = useState(false);
    const [category, setCategory] = useState([]);
    const [subCategory, setSubCategory] = useState([]);
    const [sortType, setSortType] = useState('relavent');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [onlyBestSeller, setOnlyBestSeller] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({}); // Track open/closed cats

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
        setExpandedCategories(prev => ({
            ...prev,
            [catName]: !prev[catName]
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

    const displayed = filteredAndSorted.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAndSorted.length;

    return (
        <div className="space-y-6 py-4 sm:space-y-8 sm:py-6">
            <section className="section-shell px-5 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                            Refined discovery
                        </p>
                        <Title text1={'ALL'} text2={'COLLECTIONS'} />
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                            Bộ sưu tập được trình bày rõ ràng hơn với lọc nhanh, sắp xếp trực quan và trải nghiệm duyệt sản phẩm mượt mà trên mọi kích thước màn hình.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            onClick={() => setShowFilter((prev) => !prev)}
                            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold tracking-[0.14em] text-slate-600 hover:bg-slate-900 hover:text-white lg:hidden"
                            type="button"
                        >
                            {showFilter ? 'Hide Filters' : 'Show Filters'}
                        </button>

                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value)}
                            className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-medium text-slate-600 outline-none"
                        >
                            <option value="relavent">Sort by: Relavent</option>
                            <option value="low-high">Sort by: Low to High</option>
                            <option value="high-low">Sort by: High to Low</option>
                            <option value="newest">Sort by: Newest</option>
                            <option value="name-az">Sort by: Name A-Z</option>
                            <option value="name-za">Sort by: Name Z-A</option>
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
                                    Filters
                                </p>
                                <h2 className="display-font mt-2 text-2xl font-semibold text-slate-900">
                                    Narrow your style
                                </h2>
                            </div>

                            <button
                                onClick={clearAll}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                                type="button"
                            >
                                Clear all
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-4">
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Price Range
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none"
                                        placeholder="Min"
                                    />
                                    <input
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none"
                                        placeholder="Max"
                                    />
                                </div>

                                <p className="mt-3 text-xs leading-6 text-slate-400">
                                    Bạn có thể nhập <b>100</b> hoặc <b>100.000</b>.
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
                                    Only Bestseller
                                </label>
                            </div>

                            {/* Hierarchical Categories + Sub-categories */}
                            <div className="rounded-[24px] border border-[var(--border)] bg-white p-4">
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Categories
                                </p>

                                <div className="space-y-0.5 text-sm text-slate-600">
                                    {(categories.length === 0
                                        ? ['Nam', 'Nữ', 'Trẻ em', 'Phụ kiện'].map(n => ({ _id: n, name: n, _static: true }))
                                        : categories
                                    ).map((cat) => {
                                        const catSubs = cat._static ? [] : subCategories.filter(
                                            (s) => s.categoryId?._id === cat._id || s.categoryId === cat._id
                                        );
                                        const isExpanded = expandedCategories[cat.name];
                                        const isChecked = category.includes(cat.name);

                                        return (
                                            <div key={cat._id}>
                                                {/* Category row */}
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
                                                            {cat.name}
                                                        </span>
                                                    </label>
                                                    {catSubs.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpandCategory(cat.name)}
                                                            className="mr-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors text-base font-bold leading-none"
                                                            title={isExpanded ? 'Thu gọn' : 'Xem danh mục con'}
                                                        >
                                                            {isExpanded ? '−' : '+'}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Sub-categories — shown when expanded */}
                                                {isExpanded && catSubs.length > 0 && (
                                                    <div className="ml-6 mt-0.5 mb-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
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
                                    Products found
                                </p>
                                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                                    {filteredAndSorted.length} sản phẩm phù hợp với lựa chọn hiện tại.
                                </p>
                            </div>

                            <button
                                onClick={clearAll}
                                className="hidden rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-900 hover:text-white lg:inline-flex"
                                type="button"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {displayed.length === 0 ? (
                        <div className="section-shell px-6 py-12 text-center">
                            <p className="text-lg font-semibold text-slate-900">
                                Không tìm thấy sản phẩm phù hợp
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                Thử nới rộng khoảng giá, bỏ bớt bộ lọc hoặc xóa từ khóa tìm kiếm để xem thêm lựa chọn.
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
                                        Load More
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
