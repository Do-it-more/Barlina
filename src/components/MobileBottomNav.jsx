import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, User, PlayCircle, Package, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
    const location = useLocation();
    const { theme } = useTheme();
    const { user } = useAuth();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Grid, label: 'Categories', path: '/products' },
        { icon: User, label: 'Account', path: '/profile' },
        (user?.role === 'admin' || user?.role === 'super_admin')
            ? { icon: LayoutDashboard, label: 'Admin', path: '/admin/dashboard' }
            : { icon: Package, label: 'My Orders', path: '/orders' }
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 pb-2">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className="flex flex-col items-center justify-center w-full h-full relative"
                        >
                            <div className="relative px-5 py-1.5 rounded-2xl flex items-center justify-center">
                                {active && (
                                    <motion.div
                                        layoutId="mobile-bottom-nav"
                                        className="absolute inset-0 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon
                                    className={`h-6 w-6 relative z-10 transition-colors duration-200 ${active
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                        }`}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                            </div>
                            <span className={`text-[10px] font-medium mt-1 transition-colors duration-200 ${active
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
