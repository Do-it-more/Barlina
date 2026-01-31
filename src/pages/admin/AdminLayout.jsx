import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    BarChart,
    LogOut,
    Menu,
    X,
    List,
    Home,
    AlertCircle,
    Tag,
    MessageSquare,
    MessagesSquare,
    Settings,
    RotateCcw,
    CheckSquare,
    ShieldCheck,
    Search,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    Activity,
    Wallet,
    Store,
    FileCheck
} from 'lucide-react';
import api from '../../services/api';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAdminChat } from '../../context/AdminChatContext';
import NotificationDropdown from '../../components/common/NotificationDropdown';

const AdminLayoutContent = () => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { hasUnreadMessages, getTotalUnreadCount } = useAdminChat();


    // Force Password Change Check
    if (user?.role === 'admin' && user?.isFirstLogin) {
        return <Navigate to="/admin/change-password" replace />;
    }
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');
    const [searchType, setSearchType] = useState('user'); // 'user', 'order', 'complaint'
    const [imageError, setImageError] = useState(false);
    const [counts, setCounts] = useState({ complaints: 0, inquiries: 0 });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const { data } = await api.get('/reports/dashboard');
                setCounts({
                    complaints: data.openComplaintsCount || 0,
                    inquiries: data.newInquiriesCount || 0
                });
            } catch (error) {
                console.error("Failed to fetch notification counts", error);
            }
        };

        if (user) {
            fetchCounts();
            // Poll every 30 seconds for updates
            const interval = setInterval(fetchCounts, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const getNotificationCount = (path) => {
        if (path === '/admin/complaints') return counts.complaints;
        if (path === '/admin/contacts') return counts.inquiries;
        return 0;
    };

    // ... (rest of search/logic untouched)

    useEffect(() => {
        setImageError(false);
    }, [user?.profilePhoto]);

    const handleGlobalSearch = (e) => {
        e.preventDefault();
        const term = globalSearch.trim();
        if (!term) return;

        const encodedTerm = encodeURIComponent(term);

        if (searchType === 'user') {
            navigate(`/admin/users?search=${encodedTerm}`);
        } else if (searchType === 'order') {
            // OrderListScreen relies on 'invoice' param for search
            navigate(`/admin/orders?invoice=${encodedTerm}`);
        } else if (searchType === 'complaint') {
            navigate(`/admin/complaints?search=${encodedTerm}`);
        }

        // Don't clear search immediately so user sees what they typed
        // setGlobalSearch('');
    };

    // ... (Permissions Logic)
    const isSuperAdmin = user?.role === 'super_admin';

    const baseNavItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
        { path: '/admin/returns', icon: RotateCcw, label: 'Returns' },
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/categories', icon: List, label: 'Categories' },
    ];

    // Team Chat - Always at the end, accessible to all admins
    const teamChatItem = { path: '/admin/team-chat', icon: MessagesSquare, label: 'Team Chat' };

    const adminOnlyItems = [
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
        { path: '/admin/contacts', icon: MessageSquare, label: 'Inquiries' },
        { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    const superAdminItems = [
        { path: '/admin/management/permissions', icon: ShieldCheck, label: 'RBAC Settings' },
        { path: '/admin/management/approvals', icon: CheckSquare, label: 'Approvals' },
        { path: '/admin/management/activity', icon: Activity, label: 'Activity Logs' },
    ];

    const permissionMap = {
        '/admin/orders': 'orders',
        '/admin/returns': 'returns',
        '/admin/complaints': 'complaints',
        '/admin/contacts': 'inquiries',
        '/admin/users': 'users',
        '/admin/products': 'products',
        '/admin/categories': 'categories',
        '/admin/coupons': 'coupons',
        '/admin/settings': 'settings',
        '/admin/finance': 'finance'
    };

    const hasPermission = (item) => {
        if (isSuperAdmin) return true;
        if (item.path === '/admin/dashboard') return true;
        // if (item.path === '/admin/finance') return true; // REMOVED: Now managed by RBAC permissions
        if (item.path === '/admin/team-chat') return true; // Team Chat accessible to all admins
        if (item.path === '/admin/users') return false;
        const requiredPerm = permissionMap[item.path];
        if (requiredPerm) {
            return user?.permissions?.[requiredPerm] === true;
        }
        return false;
    };

    const navItems = [
        ...baseNavItems,
        ...adminOnlyItems,
        ...(isSuperAdmin ? superAdminItems : []),
        teamChatItem // Team Chat always at the end
    ].filter(hasPermission);

    // Bottom Nav Items (Priority) - Filter these too
    const bottomNavItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dash' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/complaints', icon: AlertCircle, label: 'Complaints' },
    ].filter(hasPermission);


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex relative">
            {/* Mobile Menu Bottom Sheet */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        key="mobile-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
                {isMobileMenuOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-100 dark:border-slate-800 md:hidden"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Menu</h2>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-3 gap-3">
                                {navItems.map((item) => {
                                    const isActive = location.pathname.startsWith(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isActive
                                                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                : 'bg-white border-gray-100 dark:bg-slate-800 dark:border-slate-700'
                                                }`}
                                        >
                                            <item.icon className={`h-6 w-6 mb-2 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                                            <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {item.label}
                                            </span>
                                            {/* Regular notification count badge */}
                                            {getNotificationCount(item.path) > 0 && (
                                                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                                                    {getNotificationCount(item.path) > 99 ? '99+' : getNotificationCount(item.path)}
                                                </span>
                                            )}
                                            {/* Team Chat green notification badge with count */}
                                            {item.path === '/admin/team-chat' && getTotalUnreadCount() > 0 && !isActive && (
                                                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                                                    {getTotalUnreadCount() > 9 ? '9+' : getTotalUnreadCount()}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>

                            <div className="mt-6 space-y-3 pb-6">
                                {/* Switch to Shop & Logout */}
                                <Link
                                    to="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium text-sm"
                                >
                                    <Home className="h-5 w-5" /> Switch to Shop
                                </Link>
                                {isSuperAdmin && (
                                    <>
                                        <Link
                                            to="/seller-management"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 font-medium text-sm"
                                        >
                                            <Store className="h-5 w-5" /> Switch to Seller
                                        </Link>
                                        <Link
                                            to="/finance"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium text-sm"
                                        >
                                            <Wallet className="h-5 w-5" /> Switch to Finance
                                        </Link>
                                    </>
                                )}
                                {user?.role === 'finance' && (
                                    <Link
                                        to="/finance"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium text-sm"
                                    >
                                        <Wallet className="h-5 w-5" /> Back to Finance
                                    </Link>
                                )}
                                {user?.role === 'seller_admin' && (
                                    <Link
                                        to="/seller-management"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 font-medium text-sm"
                                    >
                                        <Store className="h-5 w-5" /> Back to Seller Admin
                                    </Link>
                                )}
                                <button
                                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 font-medium text-sm"
                                >
                                    <LogOut className="h-5 w-5" /> Logout
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop & Mobile Sidebar */}
            <aside
                className={`
                    hidden md:flex flex-col 
                    fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
                    transition-all duration-300
                    ${isSidebarCollapsed ? 'w-20' : 'w-64'}
                `}
            >
                {/* ... Header logic same as before ... */}
                <div className={`flex items-center ${isSidebarCollapsed ? 'md:justify-center justify-between' : 'justify-between'} px-6 h-16 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 transition-all duration-300`}>

                    {(!isSidebarCollapsed || isMobileMenuOpen) && (
                        isSuperAdmin ? (
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
                                Super Admin
                            </span>
                        ) : (
                            <span className="text-lg font-bold text-slate-700 dark:text-slate-300 tracking-wide flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                <div className="w-2 h-2 rounded-full bg-slate-500 min-w-[8px]"></div>
                                Admin Console
                            </span>
                        )
                    )}

                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="hidden md:block p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>

                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                title={isSidebarCollapsed ? item.label : ''}
                                className={`
                                    relative flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
                                    }
                                `}
                            >
                                <Icon className={`h-5 w-5 min-w-[20px] ${!isActive && 'group-hover:scale-110 transition-transform'}`} />
                                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                                    <span className="font-medium ml-3 whitespace-nowrap opacity-100 transition-opacity duration-300 flex-1">
                                        {item.label}
                                    </span>
                                )}
                                {/* Regular notification count badge */}
                                {(!isSidebarCollapsed || isMobileMenuOpen) && getNotificationCount(item.path) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm">
                                        {getNotificationCount(item.path) > 99 ? '99+' : getNotificationCount(item.path)}
                                    </span>
                                )}
                                {(isSidebarCollapsed && !isMobileMenuOpen) && getNotificationCount(item.path) > 0 && (
                                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
                                )}
                                {/* Team Chat green notification badge with count */}
                                {item.path === '/admin/team-chat' && getTotalUnreadCount() > 0 && !isActive && (
                                    (!isSidebarCollapsed || isMobileMenuOpen) ? (
                                        <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
                                            {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
                                        </span>
                                    ) : (
                                        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-green-500 text-white text-[9px] font-bold ring-2 ring-white dark:ring-slate-900 animate-pulse">
                                            {getTotalUnreadCount() > 9 ? '9+' : getTotalUnreadCount()}
                                        </span>
                                    )
                                )}
                            </Link>
                        );
                    })}



                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-800">
                        {/* ... logout/switch buttons ... */}
                        <Link
                            to="/"
                            onClick={() => setIsMobileMenuOpen(false)}
                            title={isSidebarCollapsed ? 'Switch to Shop' : ''}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors`}
                        >
                            <Home className="h-5 w-5 min-w-[20px]" />
                            {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Switch to Shop</span>}
                        </Link>

                        {isSuperAdmin && (
                            <>
                                <Link
                                    to="/seller-management"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    title={isSidebarCollapsed ? 'Switch to Seller Management' : ''}
                                    className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-700 dark:hover:text-orange-300 transition-colors mt-2`}
                                >
                                    <Store className="h-5 w-5 min-w-[20px]" />
                                    {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Switch to Seller</span>}
                                </Link>
                                <Link
                                    to="/finance"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    title={isSidebarCollapsed ? 'Switch to Finance' : ''}
                                    className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors mt-2`}
                                >
                                    <Wallet className="h-5 w-5 min-w-[20px]" />
                                    {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Switch to Finance</span>}
                                </Link>
                            </>
                        )}

                        {user?.role === 'finance' && (
                            <Link
                                to="/finance"
                                onClick={() => setIsMobileMenuOpen(false)}
                                title={isSidebarCollapsed ? 'Switch to Finance' : ''}
                                className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors mt-2`}
                            >
                                <Wallet className="h-5 w-5 min-w-[20px]" />
                                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Back to Finance</span>}
                            </Link>
                        )}

                        {user?.role === 'seller_admin' && (
                            <Link
                                to="/seller-management"
                                onClick={() => setIsMobileMenuOpen(false)}
                                title={isSidebarCollapsed ? 'Switch to Seller Management' : ''}
                                className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-700 dark:hover:text-orange-300 transition-colors mt-2`}
                            >
                                <Store className="h-5 w-5 min-w-[20px]" />
                                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Back to Seller Admin</span>}
                            </Link>
                        )}

                        <button
                            onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                            title={isSidebarCollapsed ? 'Logout' : ''}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 hover:text-red-700 dark:hover:text-red-300 transition-colors mt-2`}
                        >
                            <LogOut className="h-5 w-5 min-w-[20px]" />
                            {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Logout</span>}
                        </button>
                    </div>
                </nav>
            </aside>

            {/* ... Main Content ... */}
            <div className={`flex-1 flex flex-col min-w-0 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'} transition-all duration-300`}>
                <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center px-6">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden mr-4 text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="md:hidden font-bold text-lg text-slate-800 dark:text-white">
                        {isSuperAdmin ? 'Super Admin' : 'Admin Console'}
                    </div>

                    {/* Global Search Bar */}
                    <div className="flex-1 flex justify-center max-w-xl mx-auto px-4">
                        <form onSubmit={handleGlobalSearch} className="w-full relative hidden md:block">
                            <div className="flex items-center w-full bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
                                <div className="pl-3 pr-2 border-r border-gray-200 dark:border-slate-600">
                                    <select
                                        value={searchType}
                                        onChange={(e) => setSearchType(e.target.value)}
                                        className="bg-transparent text-xs font-semibold text-gray-500 dark:text-gray-300 focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        <option value="user">User</option>
                                        <option value="order">Order/Invoice</option>
                                        <option value="complaint">Complaint</option>
                                    </select>
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder={`Search ${searchType === 'user' ? 'name, email...' : searchType === 'order' ? 'invoice #...' : 'ID, subject...'}`}
                                        className="w-full pl-8 pr-4 py-2 bg-transparent text-sm focus:outline-none dark:text-white"
                                        value={globalSearch}
                                        onChange={(e) => setGlobalSearch(e.target.value)}
                                    />
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Notifications */}
                    <div className="mr-2">
                        <NotificationDropdown />
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors mr-2"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    <Link to="/profile" className="flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors group">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold overflow-hidden border border-transparent group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors">
                            {user?.profilePhoto && !imageError ? (
                                <img
                                    src={user.profilePhoto}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                user?.name?.charAt(0) || 'A'
                            )}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user?.name || (isSuperAdmin ? 'Super Admin' : 'Admin')}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user?.role?.replace('_', ' ') || 'Admin'}</p>
                        </div>
                    </Link>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-t border-gray-100 dark:border-slate-800">
                <div className="flex justify-around items-center h-16 px-2">
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative group`}
                            >
                                <div className={`relative px-5 py-1.5 rounded-2xl flex items-center justify-center transition-colors duration-200`}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-pill"
                                            className="absolute inset-0 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <Icon
                                        className={`h-6 w-6 relative z-10 transition-colors duration-200 ${isActive
                                            ? 'text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                            }`}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {getNotificationCount(item.path) > 0 && (
                                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 dark:text-gray-500 group"
                    >
                        <div className="px-5 py-1.5 relative">
                            <Menu className="h-6 w-6 relative z-10 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                </div>
            </div>

        </div >
    );
};

const AdminLayout = () => {
    return (
        <AdminLayoutContent />
    );
};
export default AdminLayout;
