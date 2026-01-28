import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    FileCheck,
    Users,
    Package,
    LogOut,
    Menu,
    X,
    Home,
    Settings,
    ShieldCheck,
    TrendingUp,
    AlertTriangle,
    Bell,
    Shield,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AdminChatProvider } from '../../context/AdminChatContext';

const SellerManagementLayoutContent = () => {
    const { logout, user } = useAuth();
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (user?.isFirstLogin && location.pathname !== '/seller-management/change-password') {
            navigate('/seller-management/change-password');
        }
    }, [user, navigate, location.pathname]);

    const navItems = [
        { path: '/seller-management/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/seller-management/sellers', icon: Store, label: 'Seller Approvals' },
        { path: '/seller-management/product-reviews', icon: FileCheck, label: 'Product Reviews' },
        { path: '/seller-management/active-sellers', icon: Users, label: 'Active Sellers' },
        { path: '/seller-management/all-products', icon: Package, label: 'All Products' },
        { path: '/seller-management/team-chat', icon: MessageSquare, label: 'Team Chat' },
    ];

    const isActiveRoute = (path) => {
        if (path === '/seller-management/dashboard') {
            return location.pathname === '/seller-management' || location.pathname === '/seller-management/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-slate-700">
                    <Link to="/seller-management/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            <Store className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                            Seller Hub
                        </span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-10rem)]">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${isActiveRoute(item.path)
                                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                }
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    {user?.role === 'super_admin' && (
                        <Link
                            to="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <ShieldCheck className="h-5 w-5" />
                            Back to Admin
                        </Link>
                    )}
                    <Link
                        to="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <Home className="h-5 w-5" />
                        Switch to Shop
                    </Link>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="hidden md:block">
                        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Seller Management</h1>
                        <p className="text-xs text-gray-500">
                            {user?.role === 'seller_admin' ? 'Seller Admin Panel' : 'Super Admin Control Panel'}
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-slate-700">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                                <p className="text-xs text-orange-500">
                                    {user?.role === 'seller_admin' ? 'Seller Admin' : 'Super Admin'}
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

const SellerManagementLayout = () => {
    return (
        <AdminChatProvider>
            <SellerManagementLayoutContent />
        </AdminChatProvider>
    );
};

export default SellerManagementLayout;
