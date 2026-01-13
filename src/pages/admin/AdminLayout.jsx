import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AdminChatWidget from '../../components/admin/AdminChatWidget';


const AdminLayout = () => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();

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
    const [isChatOpen, setIsChatOpen] = useState(false);

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

    const isSuperAdmin = user?.role === 'super_admin';

    const baseNavItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
        { path: '/admin/returns', icon: RotateCcw, label: 'Returns' },
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/categories', icon: List, label: 'Categories' },
    ];

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
        '/admin/settings': 'settings'
    };

    const hasPermission = (item) => {
        if (isSuperAdmin) return true;

        // Dashboard is valid for all admins
        if (item.path === '/admin/dashboard') return true;

        // Users is strictly Super Admin only (double check)
        if (item.path === '/admin/users') return false;

        // Check explicit permission
        const requiredPerm = permissionMap[item.path];

        // If it's in the map, check the permission bit
        if (requiredPerm) {
            return user?.permissions?.[requiredPerm] === true;
        }

        // If not in map and not Dashboard/SuperAdmin stuff, hide it to be safe
        // This ensures "what I give is what shows" strictly.
        return false;
    };

    const navItems = [
        ...baseNavItems,
        ...adminOnlyItems,
        ...(isSuperAdmin ? superAdminItems : [])
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
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Desktop & Mobile Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 
                    transition-all duration-300 flex flex-col
                    ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} w-64
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                `}
            >
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

                    {/* Desktop Collapse Button */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="hidden md:block p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>

                    {/* Mobile Close Button */}
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
                                    flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
                                    }
                                `}
                            >
                                <Icon className={`h-5 w-5 min-w-[20px] ${!isActive && 'group-hover:scale-110 transition-transform'}`} />
                                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                                    <span className="font-medium ml-3 whitespace-nowrap opacity-100 transition-opacity duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}

                    <button
                        onClick={() => { setIsChatOpen(true); setIsMobileMenuOpen(false); }}
                        title={isSidebarCollapsed ? 'Team Chat' : ''}
                        className={`
                            w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl transition-all duration-300
                            ${isChatOpen
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
                            }
                        `}
                    >
                        <MessageSquare className="h-5 w-5 min-w-[20px]" />
                        {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Team Chat</span>}
                    </button>

                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-800">
                        <Link
                            to="/"
                            onClick={() => setIsMobileMenuOpen(false)}
                            title={isSidebarCollapsed ? 'Switch to Shop' : ''}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-0' : 'justify-start px-4'} py-3 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors`}
                        >
                            <Home className="h-5 w-5 min-w-[20px]" />
                            {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="font-medium ml-3 whitespace-nowrap">Switch to Shop</span>}
                        </Link>

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

            {/* Main Content */}
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
                            {user?.profilePhoto ? (
                                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
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

            {/* Mobile Bottom Navigation - Animated */}
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

            {/* Mobile Full Menu Overlay */}
            <AdminChatWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
        </div >
    );
};

export default AdminLayout;
