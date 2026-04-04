import React, { useContext, useEffect, useMemo, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';

const copyByLanguage = {
    vi: {
        home: 'Trang chủ',
        collection: 'Bộ sưu tập',
        about: 'Giới thiệu',
        contact: 'Liên hệ',
        account: 'Tài khoản',
        myAccount: 'Tài khoản của tôi',
        orders: 'Đơn hàng',
        logout: 'Đăng xuất',
        login: 'Đăng nhập',
        toggleSearch: 'Mở tìm kiếm',
        cart: 'Giỏ hàng',
        openMenu: 'Mở menu',
        closeMenu: 'Đóng menu',
        language: 'Ngôn ngữ',
    },
    en: {
        home: 'Home',
        collection: 'Collection',
        about: 'About',
        contact: 'Contact',
        account: 'Account',
        myAccount: 'My Account',
        orders: 'Orders',
        logout: 'Logout',
        login: 'Login',
        toggleSearch: 'Toggle search',
        cart: 'Cart',
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        language: 'Language',
    },
};

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    const location = useLocation();
    const {
        getCartCount,
        setShowSearch,
        showSearch,
        token,
        logout,
        navigate,
    } = useContext(ShopContext);
    const { language, setLanguage, isVietnamese } = useLanguage();

    const cartCount = getCartCount();
    const hideCartBadge = location.pathname === '/login';
    const copy = copyByLanguage[language];

    const navItems = useMemo(
        () => [
            { label: copy.home, path: '/' },
            { label: copy.collection, path: '/collection' },
            { label: copy.about, path: '/about' },
            { label: copy.contact, path: '/contact' },
        ],
        [copy],
    );

    useEffect(() => {
        setVisible(false);
    }, [location.pathname]);

    const navLinkClass = ({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-semibold tracking-[0.12em] transition-all duration-300 ${
            isActive
                ? 'bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]'
                : 'text-slate-500 hover:-translate-y-0.5 hover:bg-slate-900 hover:text-white'
        }`;

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-50">
                <div className="page-shell pt-3 sm:pt-4">
                    <div className="section-shell flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                        <NavLink to="/" className="flex items-center gap-3">
                            <img src={assets.logo} className="w-28 sm:w-32" alt="Logo" />
                        </NavLink>

                        <nav className="hidden items-center gap-2 md:flex">
                            {navItems.map((item) => (
                                <NavLink key={item.path} to={item.path} className={navLinkClass}>
                                    {item.label.toUpperCase()}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="hidden items-center rounded-full border border-[var(--border)] bg-white/90 p-1 shadow-[0_10px_25px_rgba(15,23,42,0.08)] sm:flex">
                                <button
                                    type="button"
                                    onClick={() => setLanguage('vi')}
                                    className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                                        isVietnamese
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-500'
                                    }`}
                                    aria-label="Switch to Vietnamese"
                                >
                                    VI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLanguage('en')}
                                    className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                                        !isVietnamese
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-500'
                                    }`}
                                    aria-label="Switch to English"
                                >
                                    EN
                                </button>
                            </div>

                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                                type="button"
                                aria-label={copy.toggleSearch}
                            >
                                <img
                                    src={assets.search_icon}
                                    className="w-4 sm:w-[18px]"
                                    alt={copy.toggleSearch}
                                />
                            </button>

                            <div className="group relative hidden sm:block">
                                {token ? (
                                    <button
                                        type="button"
                                        className="rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300"
                                        aria-label={copy.account}
                                    >
                                        <img
                                            className="w-4 sm:w-[18px]"
                                            src={assets.profile_icon}
                                            alt={copy.account}
                                        />
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300"
                                        aria-label={copy.login}
                                    >
                                        <img
                                            className="w-4 sm:w-[18px]"
                                            src={assets.profile_icon}
                                            alt={copy.login}
                                        />
                                    </Link>
                                )}

                                {token && (
                                    <div className="pointer-events-none absolute right-0 top-full hidden pt-4 group-hover:block group-hover:pointer-events-auto">
                                        <div className="section-shell min-w-[180px] rounded-[22px] p-2">
                                            <button
                                                onClick={() => navigate('/my-account')}
                                                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-900 hover:text-white"
                                                type="button"
                                            >
                                                {copy.myAccount}
                                            </button>
                                            <button
                                                onClick={() => navigate('/orders')}
                                                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-900 hover:text-white"
                                                type="button"
                                            >
                                                {copy.orders}
                                            </button>
                                            <button
                                                onClick={logout}
                                                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-900 hover:text-white"
                                                type="button"
                                            >
                                                {copy.logout}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link
                                to="/cart"
                                data-cart-target="true"
                                className="relative rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300"
                                aria-label={copy.cart}
                            >
                                <img
                                    src={assets.cart_icon}
                                    className="w-4 min-w-4 sm:w-[18px] sm:min-w-[18px]"
                                    alt={copy.cart}
                                />
                                {!hideCartBadge && cartCount > 0 && (
                                    <p className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                                        {cartCount}
                                    </p>
                                )}
                            </Link>

                            <button
                                onClick={() => setVisible(true)}
                                className="rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300 md:hidden"
                                type="button"
                                aria-label={copy.openMenu}
                            >
                                <img src={assets.menu_icon} className="w-4" alt={copy.openMenu} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div
                className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
                    visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setVisible(false)}
            />

            <aside
                className={`fixed right-0 top-0 z-50 h-screen w-full max-w-sm p-4 transition-transform duration-300 md:hidden ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="section-shell flex h-full flex-col rounded-[32px] p-5">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
                        <img src={assets.logo} className="w-28" alt="Logo" />
                        <button
                            onClick={() => setVisible(false)}
                            className="rounded-full border border-[var(--border)] p-3"
                            type="button"
                            aria-label={copy.closeMenu}
                        >
                            <img src={assets.cross_icon} className="w-3" alt={copy.closeMenu} />
                        </button>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {copy.language}
                        </span>
                        <button
                            type="button"
                            onClick={() => setLanguage('vi')}
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase ${
                                isVietnamese ? 'bg-slate-900 text-white' : 'border border-[var(--border)] text-slate-500'
                            }`}
                        >
                            VI
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase ${
                                !isVietnamese ? 'bg-slate-900 text-white' : 'border border-[var(--border)] text-slate-500'
                            }`}
                        >
                            EN
                        </button>
                    </div>

                    <nav className="mt-8 flex flex-1 flex-col gap-3">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                onClick={() => setVisible(false)}
                                to={item.path}
                                className={({ isActive }) =>
                                    `rounded-[20px] px-4 py-4 text-sm font-semibold tracking-[0.14em] ${
                                        isActive
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-900 hover:text-white'
                                    }`
                                }
                            >
                                {item.label.toUpperCase()}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="space-y-3 border-t border-[var(--border)] pt-5">
                        {token ? (
                            <>
                                <button
                                    onClick={() => {
                                        navigate('/my-account');
                                        setVisible(false);
                                    }}
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-3 text-left text-sm font-semibold text-slate-600"
                                    type="button"
                                >
                                    {copy.myAccount.toUpperCase()}
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/orders');
                                        setVisible(false);
                                    }}
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-3 text-left text-sm font-semibold text-slate-600"
                                    type="button"
                                >
                                    {copy.orders.toUpperCase()}
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        setVisible(false);
                                    }}
                                    className="w-full rounded-[20px] bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white"
                                    type="button"
                                >
                                    {copy.logout.toUpperCase()}
                                </button>
                            </>
                        ) : (
                            <Link
                                onClick={() => setVisible(false)}
                                className="block rounded-[20px] bg-slate-900 px-4 py-3 text-left text-sm font-semibold tracking-[0.14em] text-white"
                                to="/login"
                            >
                                {copy.login.toUpperCase()}
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Navbar;
