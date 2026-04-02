import React, { useContext, useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';

const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Collection', path: '/collection' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
];

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

    const cartCount = getCartCount();
    const hideCartBadge = location.pathname === '/login';

    useEffect(() => {
        setVisible(false);
    }, [location.pathname]);

    const navLinkClass = ({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-semibold tracking-[0.18em] transition-all duration-300 ${
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
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={navLinkClass}
                                >
                                    {item.label.toUpperCase()}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                                type="button"
                                aria-label="Toggle search"
                            >
                                <img
                                    src={assets.search_icon}
                                    className="w-4 sm:w-[18px]"
                                    alt="Search"
                                />
                            </button>

                            <div className="group relative hidden sm:block">
                                {token ? (
                                    <button
                                        type="button"
                                        className="rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300"
                                        aria-label="Account"
                                    >
                                        <img
                                            className="w-4 sm:w-[18px]"
                                            src={assets.profile_icon}
                                            alt="Profile"
                                        />
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300"
                                        aria-label="Login"
                                    >
                                        <img
                                            className="w-4 sm:w-[18px]"
                                            src={assets.profile_icon}
                                            alt="Profile"
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
                                                My Account
                                            </button>
                                            <button
                                                onClick={() => navigate('/orders')}
                                                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-900 hover:text-white"
                                                type="button"
                                            >
                                                Orders
                                            </button>
                                            <button
                                                onClick={logout}
                                                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-900 hover:text-white"
                                                type="button"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link
                                to="/cart"
                                className="relative rounded-full border border-[var(--border)] bg-white/90 p-3 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300"
                                aria-label="Cart"
                            >
                                <img
                                    src={assets.cart_icon}
                                    className="w-4 min-w-4 sm:w-[18px] sm:min-w-[18px]"
                                    alt="Cart"
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
                                aria-label="Open menu"
                            >
                                <img
                                    src={assets.menu_icon}
                                    className="w-4"
                                    alt="Menu"
                                />
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
                            aria-label="Close menu"
                        >
                            <img src={assets.cross_icon} className="w-3" alt="Close" />
                        </button>
                    </div>

                    <nav className="mt-8 flex flex-1 flex-col gap-3">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                onClick={() => setVisible(false)}
                                to={item.path}
                                className={({ isActive }) =>
                                    `rounded-[20px] px-4 py-4 text-sm font-semibold tracking-[0.18em] ${
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
                                    MY ACCOUNT
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/orders');
                                        setVisible(false);
                                    }}
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-3 text-left text-sm font-semibold text-slate-600"
                                    type="button"
                                >
                                    ORDERS
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        setVisible(false);
                                    }}
                                    className="w-full rounded-[20px] bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white"
                                    type="button"
                                >
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <Link
                                onClick={() => setVisible(false)}
                                className="block rounded-[20px] bg-slate-900 px-4 py-3 text-left text-sm font-semibold tracking-[0.18em] text-white"
                                to="/login"
                            >
                                LOGIN
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Navbar;
