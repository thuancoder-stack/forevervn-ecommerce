import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

// ====== PARSE PRICE ======
const parsePrice = (price) => {
  if (typeof price === "number") return price < 1000 ? price * 1000 : price;

  const digits = String(price ?? "").replace(/[^\d]/g, "");
  if (!digits) return 0;

  const n = Number(digits);
  if (!Number.isFinite(n)) return 0;

  return n < 1000 ? n * 1000 : n;
};

const Collection = () => {
  const { products } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);

  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relavent");

  // ====== Extra "hay" ======
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState(""); // bạn có thể nhập 100 hoặc 100.000
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyBestSeller, setOnlyBestSeller] = useState(false);

  // Load more
  const STEP = 16;
  const [visibleCount, setVisibleCount] = useState(STEP);

  // Reset load more khi filter/sort thay đổi
  useEffect(() => {
    setVisibleCount(STEP);
  }, [category, subCategory, sortType, search, minPrice, maxPrice, onlyBestSeller, products]);

  // ====== Toggle category ======
  const toggleCategory = (e) => {
    const value = e.target.value;
    setCategory((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  // ====== Toggle subCategory ======
  const toggleSubCategory = (e) => {
    const value = e.target.value;
    setSubCategory((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const clearAll = () => {
    setCategory([]);
    setSubCategory([]);
    setSortType("relavent");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyBestSeller(false);
  };

  // ====== Filter + Sort bằng useMemo (gọn và ít bug) ======
  const filteredAndSorted = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];

    // 1) Filter category
    if (category.length > 0) {
      list = list.filter((p) => category.includes(p.category));
    }

    // 2) Filter subCategory
    if (subCategory.length > 0) {
      list = list.filter((p) => subCategory.includes(p.subCategory));
    }

    // 3) Bestseller
    if (onlyBestSeller) {
      list = list.filter((p) => p.bestseller === true);
    }

    // 4) Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = String(p.name ?? "").toLowerCase();
        const desc = String(p.description ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    // 5) Price range
    const min = minPrice !== "" ? parsePrice(minPrice) : null;
    const max = maxPrice !== "" ? parsePrice(maxPrice) : null;

    if (min !== null) list = list.filter((p) => parsePrice(p.price) >= min);
    if (max !== null) list = list.filter((p) => parsePrice(p.price) <= max);

    // 6) Sort
    switch (sortType) {
      case "low-high":
        list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case "high-low":
        list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case "newest":
        list.sort((a, b) => (b.date || 0) - (a.date || 0));
        break;
      case "name-az":
        list.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
        break;
      case "name-za":
        list.sort((a, b) => String(b.name ?? "").localeCompare(String(a.name ?? "")));
        break;
      default:
        // relavent: giữ nguyên thứ tự gốc
        break;
    }

    return list;
  }, [products, category, subCategory, sortType, search, minPrice, maxPrice, onlyBestSeller]);

  const displayed = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* ===== FILTER SIDEBAR ===== */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
            src={assets.dropdown_icon}
            alt=""
          />
        </p>

        {/* Search */}
        <div className={`border border-gray-300 p-4 mt-4 ${showFilter ? "" : "hidden"} sm:block`}>
          <p className="mb-2 text-sm font-medium">SEARCH</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
            placeholder="Tìm theo tên / mô tả..."
          />
        </div>

        {/* Price range */}
        <div className={`border border-gray-300 p-4 mt-4 ${showFilter ? "" : "hidden"} sm:block`}>
          <p className="mb-2 text-sm font-medium">PRICE RANGE</p>
          <div className="flex gap-2">
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 border border-gray-300 px-3 py-2 text-sm outline-none"
              placeholder="Min (vd: 100)"
            />
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 border border-gray-300 px-3 py-2 text-sm outline-none"
              placeholder="Max (vd: 300)"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Bạn có thể nhập <b>100</b> (tự hiểu 100k) hoặc <b>100.000</b>.
          </p>
        </div>

        {/* Bestseller */}
        <div className={`border border-gray-300 p-4 mt-4 ${showFilter ? "" : "hidden"} sm:block`}>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyBestSeller}
              onChange={(e) => setOnlyBestSeller(e.target.checked)}
            />
            Only Bestseller
          </label>
        </div>

        {/* Category */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? "" : "hidden"} sm:block`}>
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <label className="flex gap-2 cursor-pointer">
              <input className="w-3" type="checkbox" value="Men" onChange={toggleCategory} checked={category.includes("Men")} />
              Men
            </label>
            <label className="flex gap-2 cursor-pointer">
              <input className="w-3" type="checkbox" value="Women" onChange={toggleCategory} checked={category.includes("Women")} />
              Women
            </label>
            <label className="flex gap-2 cursor-pointer">
              <input className="w-3" type="checkbox" value="Kids" onChange={toggleCategory} checked={category.includes("Kids")} />
              Kids
            </label>
          </div>
        </div>

        {/* SubCategory */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? "" : "hidden"} sm:block`}>
          <p className="mb-3 text-sm font-medium">TYPE</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <label className="flex gap-2 cursor-pointer">
              <input className="w-3" type="checkbox" value="Topwear" onChange={toggleSubCategory} checked={subCategory.includes("Topwear")} />
              Topwear
            </label>
            <label className="flex gap-2 cursor-pointer">
              <input className="w-3" type="checkbox" value="Bottomwear" onChange={toggleSubCategory} checked={subCategory.includes("Bottomwear")} />
              Bottomwear
            </label>
            <label className="flex gap-2 cursor-pointer">
              <input className="w-3" type="checkbox" value="Winterwear" onChange={toggleSubCategory} checked={subCategory.includes("Winterwear")} />
              Winterwear
            </label>
          </div>
        </div>

        {/* Clear all */}
        <div className={`mt-4 ${showFilter ? "" : "hidden"} sm:block`}>
          <button
            onClick={clearAll}
            className="w-full border border-gray-300 py-2 text-sm hover:bg-gray-100"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* ===== PRODUCT GRID ===== */}
      <div className="flex-1">
        <div className="flex justify-between items-end text-base sm:text-2xl mb-4">
          <div>
            <Title text1={"ALL"} text2={"COLLECTIONS"} />
            <p className="text-sm text-gray-500 mt-1">
              {filteredAndSorted.length} sản phẩm
            </p>
          </div>

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2 py-1"
          >
            <option value="relavent">Sort by: Relavent</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
            <option value="newest">Sort by: Newest</option>
            <option value="name-az">Sort by: Name A-Z</option>
            <option value="name-za">Sort by: Name Z-A</option>
          </select>
        </div>

        {displayed.length === 0 ? (
          <div className="border border-gray-200 p-6 text-gray-600">
            Không tìm thấy sản phẩm phù hợp 😢
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
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
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((v) => v + STEP)}
                  className="border border-gray-300 px-6 py-2 text-sm hover:bg-gray-100"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Collection;