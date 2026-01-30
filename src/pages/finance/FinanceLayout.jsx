import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    PieChart,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    MessageSquare,
    ShoppingBag,
    Package,
    RotateCcw,
    AlertCircle,
    Tag,
    List,
    Users,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { AdminChatProvider } from '../../context/AdminChatContext';

const FinanceLayoutContent = () => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (user?.isFirstLogin && location.pathname !== '/finance/change-password') {
            navigate('/finance/change-password');
        }
    }, [user, navigate, location.pathname]);

    const navItems = [
        { path: '/finance/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/finance/reports', icon: FileText, label: 'Ledger & Reports' },
        { path: '/finance/stats', icon: PieChart, label: 'Analytics' },
    ];

    // Append Permission-Based Links
    // Orders and Returns removed from Finance Portal Sidebar by user request
    // if (user?.permissions?.orders) navItems.push({ path: '/admin/orders', icon: ShoppingBag, label: 'Orders' });
    // if (user?.permissions?.returns) navItems.push({ path: '/admin/returns', icon: RotateCcw, label: 'Returns' });

    navItems.push({ path: '/finance/settings', icon: Settings, label: 'Settings' });
    navItems.push({ path: '/finance/team-chat', icon: MessageSquare, label: 'Team Chat' });

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-slate-800">
                    <Link to="/finance/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">F</div>
                        <span className="text-xl font-bold text-slate-800 dark:text-emerald-100">
                            Finance Portal
                        </span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-slate-900 dark:hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${location.pathname === item.path
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400'
                                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}

                    <div className="pt-8 mt-8 border-t border-gray-200 dark:border-slate-800">
                        <div className="px-4 mb-4">
                            <p className="text-xs text-gray-500 dark:text-slate-500 uppercase font-semibold tracking-wider">Department</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">Finance & Accounts</p>
                        </div>

                        {user?.role === 'super_admin' && (
                            <Link
                                to="/admin"
                                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors mb-1"
                            >
                                <LayoutDashboard className="h-5 w-5" />
                                Switch to Super Admin
                            </Link>
                        )}
                        <Link
                            to="/"
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mb-1"
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            Switch to Shop
                        </Link>

                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-900/20 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Log Out
                        </button>
                    </div>
                </nav>
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

                    <div className="ml-auto flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <Bell className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-slate-700">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                                <p className="text-xs text-emerald-600 font-medium bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full inline-block">Finance Manager</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
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

const FinanceLayout = () => {
    return (
        <AdminChatProvider>
            <FinanceLayoutContent />
        </AdminChatProvider>
    );
};

export default FinanceLayout;
