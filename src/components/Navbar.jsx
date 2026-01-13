import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, Heart, Sun, Moon, Home, Grid, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const { user, logout } = useAuth();
    const { getCartCount } = useCart();
    const { wishlist } = useWishlist();
    const { theme, toggleTheme } = useTheme();
    const cartCount = getCartCount();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (keyword.trim()) {
            navigate(`/products?keyword=${keyword}`);
        } else {
            navigate('/products');
        }
    };

    const getProfileImg = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http')) return photo;
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
        return `${baseUrl}${photo}`;
    };

    return (
        <nav className="sticky top-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm transition-all duration-300 border-b border-transparent dark:border-slate-800 pb-2 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">

                    {/* Logo - Mobile: Left, Desktop: Center/Left */}
                    <Link to="/" className="group flex flex-col items-start md:items-center justify-center">
                        <span className="font-serif text-2xl md:text-3xl tracking-[0.15em] font-bold text-slate-900 dark:text-white leading-none group-hover:opacity-80 transition-opacity" style={{ fontFamily: '"Playfair Display", serif' }}>
                            BARLINA
                        </span>
                        <span className="text-[10px] md:text-xs tracking-[0.4em] font-light lowercase text-gray-500 dark:text-gray-400 mt-1 block">
                            fashion design
                        </span>
                    </Link>

                    {/* Desktop Categories Dropdown */}
                    <div className="hidden md:block relative group ml-8 z-50">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-full text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700">
                            <Grid className="h-4 w-4" />
                            <span>Categories</span>
                            <ChevronDown className="h-3 w-3 text-gray-400 group-hover:rotate-180 transition-transform duration-300" />
                        </button>

                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left overflow-hidden">
                            <div className="p-2 space-y-1">
                                {[
                                    'Electronics', 'Home Improvement', 'Kitchen', 'Gardening',
                                    "Kid's Toys", 'Jewellery', 'Winter Collection', 'Gifts'
                                ].map((cat) => (
                                    <Link
                                        key={cat}
                                        to={`/products?category=${cat}`}
                                        className="block px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {cat}
                                    </Link>
                                ))}
                                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                                <Link
                                    to="/products"
                                    className="block px-4 py-2.5 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                >
                                    View All Categories
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Search */}
                    {user && (
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 ml-6 mr-12 max-w-lg relative group">
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Search for products..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-gray-50 dark:bg-slate-800 dark:text-white transition-all shadow-sm group-hover:shadow-md"
                            />
                            <button type="submit" className="absolute left-4 top-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors">
                                <Search className="h-5 w-5" />
                            </button>
                        </form>
                    )}
                    {!user && <div className="hidden md:flex flex-1"></div>}

                    {/* Desktop Icons */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-300">
                            <Home className="h-5 w-5" />
                        </Link>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-300">
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>

                        {user ? (
                            <>
                                <ProfileDropdown />
                                <Link to="/wishlist" className="text-gray-600 dark:text-gray-300 hover:text-red-500 relative transition-colors group">
                                    <div className="p-2 rounded-full bg-gray-50 dark:bg-slate-800 group-hover:bg-red-50 dark:group-hover:bg-slate-700 transition-colors relative">
                                        <Heart className="h-6 w-6" />
                                        {wishlist?.length > 0 && (
                                            <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
                                        )}
                                    </div>
                                </Link>

                                <Link to="/cart" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 relative transition-colors group">
                                    <div className="p-2 rounded-full bg-gray-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-slate-700 transition-colors">
                                        <ShoppingCart className="h-6 w-6" />
                                    </div>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        ) : (
                            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 font-medium transition-colors group">
                                <div className="p-2 rounded-full bg-gray-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-slate-700 transition-colors">
                                    <User className="h-5 w-5" />
                                </div>
                                <span className="hidden lg:block">Login</span>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Header Icons (Wishlist & Cart & Profile) */}
                    <div className="md:hidden flex items-center gap-3">
                        <button onClick={toggleTheme} className="text-slate-900 dark:text-white">
                            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                        </button>
                        {user && (
                            <>
                                <Link to="/wishlist" className="text-slate-900 dark:text-white relative group">
                                    <Heart className="h-6 w-6 group-hover:text-red-500 transition-colors" />
                                    {wishlist?.length > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900"></span>
                                    )}
                                </Link>
                                <Link to="/cart" className="text-slate-900 dark:text-white relative">
                                    <ShoppingCart className="h-6 w-6" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="md:hidden px-0 pb-2">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="What are you looking for?"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 dark:bg-slate-800 dark:text-white text-sm shadow-sm"
                        />
                    </form>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
