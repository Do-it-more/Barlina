import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    CreditCard,
    FileText,
    ShieldCheck,
    LogOut,
    Menu,
    X,
    Bell,
    HelpCircle,
    Package,
    ShoppingBag,
    MessageSquare,
    Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAdminChat } from '../../context/AdminChatContext';
import api from '../../services/api';
import NotificationDropdown from '../../components/common/NotificationDropdown';

const SellerLayout = () => {
    const { logout, user } = useAuth();
    const { theme } = useTheme();
    const { getTotalUnreadCount } = useAdminChat(); // Get unread count
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [pendingOrderCount, setPendingOrderCount] = useState(0);
    const [lastSeenCount, setLastSeenCount] = useState(
        parseInt(localStorage.getItem('seller_last_seen_pending_count') || '0', 10)
    );

    useEffect(() => {
        checkPendingOrders();
        const interval = setInterval(checkPendingOrders, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // When visiting orders page, mark all as seen
    useEffect(() => {
        if (location.pathname === '/seller/orders') {
            setLastSeenCount(pendingOrderCount);
            localStorage.setItem('seller_last_seen_pending_count', pendingOrderCount.toString());
        }
    }, [location.pathname, pendingOrderCount]);

    const checkPendingOrders = async () => {
        try {
            const { data } = await api.get('/sellers/orders?status=Pending&limit=1');
            const newTotal = data.total || 0;
            setPendingOrderCount(newTotal);

            // If pending count dropped (e.g. orders shipped), sync lastSeen to avoid negative logic issues
            // But only if we aren't currently viewing the page (which is handled by the other useEffect)
            if (newTotal < lastSeenCount) {
                setLastSeenCount(newTotal);
                localStorage.setItem('seller_last_seen_pending_count', newTotal.toString());
            }
        } catch (error) {
            console.error('Failed to check pending orders:', error);
        }
    };

    const notificationCount = Math.max(0, pendingOrderCount - lastSeenCount);

    const [sellerProfile, setSellerProfile] = useState(null);

    useEffect(() => {
        const fetchSellerProfile = async () => {
            try {
                const { data } = await api.get('/sellers/profile');
                setSellerProfile(data);
            } catch (error) {
                console.error('Failed to fetch seller profile', error);
            }
        };
        fetchSellerProfile();
    }, []);

    const navItems = [
        { path: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/seller/profile', icon: User, label: 'Business Profile' },
        { path: '/seller/kyc', icon: ShieldCheck, label: 'KYC & Compliance' },
        { path: '/seller/bank', icon: CreditCard, label: 'Bank & Settlements' },
        { path: '/seller/products', icon: Package, label: 'Products', disabled: false },
        { path: '/seller/orders', icon: ShoppingBag, label: 'Orders', disabled: false },
        ...(sellerProfile?.isChatEnabled === true ? [{ path: '/seller/team-chat', icon: MessageSquare, label: 'Team Chat' }] : []),
        { path: '/seller/support', icon: HelpCircle, label: 'Seller Support' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-slate-700">
                    <Link to="/seller/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Seller Hub
                        </span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.disabled ? '#' : item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                                ${location.pathname === item.path
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                }
                                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="flex-1">{item.label}</span>

                            {item.label === 'Orders' && notificationCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </span>
                            )}

                            {item.label === 'Team Chat' && getTotalUnreadCount() > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                    {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
                                </span>
                            )}

                            {item.disabled && <span className="text-[10px] ml-auto bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-500">Coming Soon</span>}
                        </Link>
                    ))}

                    <div className="pt-8 mt-8 border-t border-gray-100 dark:border-slate-700">
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                        <NotificationDropdown />
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-slate-700 focus:outline-none"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                                    <p className="text-xs text-gray-500">Seller ID: {user?._id?.slice(-6).toUpperCase()}</p>
                                </div>
                                {user?.profilePhoto ? (
                                    <img
                                        src={user.profilePhoto}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-600"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                                        {user?.name?.charAt(0)}
                                    </div>
                                )}
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 md:hidden">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/seller/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <User className="h-4 w-4" />
                                            Business Profile
                                        </Link>
                                        <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                        <button
                                            onClick={logout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Log Out
                                        </button>
                                    </div>
                                </>
                            )}
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

export default SellerLayout;
