import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Added Link
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { IndianRupee, ShoppingBag, Users, Package, TrendingUp, AlertCircle, Clock, Truck, CheckCircle, RotateCcw, ChevronRight, ExternalLink, FileText, FileSpreadsheet, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showToast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        const fetchStats = async () => {
            // Limited admins might only see specific stats, but we fetch the same object
            // and filter visible data on the frontend for now.
            try {
                const { data } = await api.get('/orders/analytics/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                if (error.response?.status !== 403) {
                    showToast("Failed to load dashboard data", "error");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user, showToast]);

    useEffect(() => {
        if (!socket) return;

        const handleNewOrder = (data) => {
            showToast(`💰 New Order! ₹${data.amount} from ${data.user}`, 'success');
            // Refresh stats quietly
            api.get('/orders/analytics/stats').then(({ data }) => setStats(data)).catch(console.error);
        };

        socket.on('new_order', handleNewOrder);

        return () => {
            socket.off('new_order', handleNewOrder);
        };
    }, [socket, showToast]);

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        </div>
    );

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full">
                    <Package className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ready for Operations</h2>
                <p className="text-slate-500 max-w-sm">
                    Select a module from the sidebar to begin your tasks.
                </p>
            </div>
        );
    }

    // --- DATA PREPARATION ---

    // Status Data for Pie Chart
    const statusData = Object.keys(stats.statusCounts || {}).map(key => ({
        name: key.replace(/_/g, ' '),
        value: stats.statusCounts[key]
    }));

    const COLORS = ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0']; // Neutral operational colors
    const SUPER_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444']; // Vibrant Super Admin Colors

    // Operational Metrics (For Limited Admin)
    const pendingShipments = (stats.statusCounts?.PAID || 0) + (stats.statusCounts?.READY_TO_SHIP || 0);
    // Use real data from backend or fallback to 0
    const returnsPending = stats.returnsPending || 0;
    const openComplaints = stats.openComplaints || 0;

    // Calculate Today's Orders
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrdersCount = stats.dailyStats?.find(d => d._id === todayStr)?.orders || 0;

    // --- RENDER HELPERS ---

    // --- RENDER HELPERS ---

    const handleDownload = async (endpoint, filename, format = 'csv') => {
        try {
            const response = await api.get(endpoint, {
                params: { format },
                responseType: 'blob'
            });
            const type = format === 'pdf' ? 'application/pdf' : 'text/csv';
            const url = window.URL.createObjectURL(new Blob([response.data], { type }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', format === 'pdf' ? `${filename}.pdf` : `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast(`${format.toUpperCase()} download started`, 'success');
        } catch (error) {
            console.error('Download failed', error);
            showToast('Failed to download report', 'error');
        }
    };

    const handleView = async (endpoint) => {
        try {
            const response = await api.get(endpoint, {
                params: { format: 'pdf' },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (error) {
            console.error('View failed', error);
            showToast('Failed to view report', 'error');
        }
    };

    const renderSuperAdminCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Financials 1: Total Revenue */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{stats.totalRevenue?.toFixed(2) || '0.00'}</h3>
                <div className="absolute top-6 right-6 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <IndianRupee className="h-5 w-5 text-indigo-500" />
                </div>
            </div>

            {/* Financials 2: Total Orders */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Orders</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalOrders}</h3>
                <div className="absolute top-6 right-6 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-blue-500" />
                </div>
            </div>

            {/* Operational 1: Today's Orders */}
            <Link to="/admin/orders" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Today's Orders</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{todayOrdersCount}</h3>
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            New Today
                        </span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <ShoppingBag className="h-5 w-5" />
                    </div>
                </div>
            </Link>

            {/* Operational 2: Shipments */}
            <Link to="/admin/orders" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Shipments</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{pendingShipments}</h3>
                        {pendingShipments > 0 && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <Truck className="h-5 w-5" />
                    </div>
                </div>
            </Link>

            {/* Operational 3: Complaints */}
            <Link to="/admin/complaints" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Open Complaints</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{openComplaints}</h3>
                        {openComplaints > 0 && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                Response Required
                            </span>
                        )}
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                </div>
            </Link>

            {/* Operational 4: Returns */}
            <Link to="/admin/returns" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Returns Processing</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{returnsPending}</h3>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <RotateCcw className="h-5 w-5" />
                    </div>
                </div>
            </Link>
        </div>
    );

    const renderLimitedAdminCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Task: Today's Orders */}
            <Link to="/admin/orders" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Today's Orders</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{todayOrdersCount}</h3>
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            New Today
                        </span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <ShoppingBag className="h-5 w-5" />
                    </div>
                </div>
            </Link>

            {/* Task: Shipments */}
            <Link to="/admin/orders" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Shipments</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{pendingShipments}</h3>
                        {pendingShipments > 0 && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <Truck className="h-5 w-5" />
                    </div>
                </div>
            </Link>

            {/* Task: Complaints */}
            <Link to="/admin/complaints" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Open Complaints</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{openComplaints}</h3>
                        {openComplaints > 0 && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                Response Required
                            </span>
                        )}
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                </div>
            </Link>

            {/* Task: Returns */}
            <Link to="/admin/returns" className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Returns Processing</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{returnsPending}</h3>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                        <RotateCcw className="h-5 w-5" />
                    </div>
                </div>
            </Link>
        </div>
    );

    const hasPermission = (perm) => isSuperAdmin || (user?.permissions && user.permissions[perm]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {!isSuperAdmin && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">Operational View</span>}
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {isSuperAdmin ? 'Platform Overview' : 'My Tasks'}
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm">
                        {isSuperAdmin
                            ? 'Global performance metrics and system health.'
                            : `Welcome back, ${user?.name}. Here is your operational status.`}
                    </p>
                </div>
                {!isSuperAdmin && (
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Last Login</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date().toLocaleDateString()}</p>
                    </div>
                )}
            </div>

            {/* QUICK DOWNLOADS SECTION */}
            {
                (user?.role === 'admin' || user?.role === 'super_admin') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card 1: Today's Orders */}
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">Today's Orders</p>
                                    <p className="text-xs text-gray-500">Daily Report</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-auto">
                                <button
                                    onClick={() => handleView('/reports/orders/today/download')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="View PDF"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDownload('/reports/orders/today/download', `Todays_Orders_${new Date().toISOString().split('T')[0]}`, 'pdf')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="Download PDF"
                                >
                                    <FileText className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDownload('/reports/orders/today/download', `Todays_Orders_${new Date().toISOString().split('T')[0]}`, 'csv')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="Download CSV"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Card 2: Shipped Orders */}
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">Shipped Orders</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Logistics Report</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-auto">
                                <button
                                    onClick={() => handleView('/reports/orders/shipped/download')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="View PDF"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDownload('/reports/orders/shipped/download', 'Shipped_Orders_Report', 'pdf')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="Download PDF"
                                >
                                    <FileText className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDownload('/reports/orders/shipped/download', 'Shipped_Orders_Report', 'csv')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="Download CSV"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Card 3: Delivered Orders */}
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">Delivered Orders</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">History Report</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-auto">
                                <button
                                    onClick={() => handleView('/reports/orders/delivered/download')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="View PDF"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDownload('/reports/orders/delivered/download', 'Delivered_Orders_Report', 'pdf')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="Download PDF"
                                >
                                    <FileText className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDownload('/reports/orders/delivered/download', 'Delivered_Orders_Report', 'csv')}
                                    className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-300 backdrop-blur-sm border border-transparent dark:border-slate-600/50"
                                    title="Download CSV"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Metric Cards - CONDITIONAL */}
            {isSuperAdmin ? renderSuperAdminCards() : renderLimitedAdminCards()}

            {/* ACTION CENTER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Priority Orders */}
                <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 ${(hasPermission('products') || hasPermission('coupons') || hasPermission('users')) ? 'lg:col-span-2' : 'lg:col-span-3'
                    }`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" /> Recent Priority Orders
                        </h3>
                        <Link to="/admin/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            View All <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                                    <th className="pb-3 pl-2">Order ID</th>
                                    <th className="pb-3">Customer</th>
                                    <th className="pb-3 text-right">Amount</th>
                                    <th className="pb-3 text-center">Status</th>
                                    <th className="pb-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                                    stats.recentOrders.map((order) => (
                                        <tr key={order._id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="py-3 pl-2 text-sm font-medium text-slate-900 dark:text-white">
                                                {order.invoiceNumber || order._id.substring(0, 8)}
                                            </td>
                                            <td className="py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {order.user?.name || 'Guest'}
                                            </td>
                                            <td className="py-3 text-sm font-medium text-slate-900 dark:text-white text-right">
                                                ₹{order.totalPrice?.toFixed(2)}
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'READY_TO_SHIP' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right pr-2">
                                                <Link to={`/admin/orders/${order._id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors inline-block">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">
                                            No recent priority orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions Panel - Only show if at least one permission exists */}
                {(hasPermission('products') || hasPermission('coupons') || hasPermission('users')) && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" /> Quick Actions
                        </h3>

                        <div className="space-y-3">
                            {hasPermission('products') && (
                                <Link to="/admin/products/create" className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-100 dark:border-slate-700 transition-all group">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">Add Product</h4>
                                        <p className="text-xs text-slate-500">List new item to store</p>
                                    </div>
                                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                            )}

                            {hasPermission('coupons') && (
                                <Link to="/admin/coupons" className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-pink-50 dark:hover:bg-pink-900/20 border border-slate-100 dark:border-slate-700 transition-all group">
                                    <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 dark:text-white group-hover:text-pink-600 transition-colors">Create Offer</h4>
                                        <p className="text-xs text-slate-500">Add coupon or discount</p>
                                    </div>
                                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400 group-hover:text-pink-500 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                            )}

                            {hasPermission('users') && (
                                <Link to="/admin/users/create" className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-100 dark:border-slate-700 transition-all group">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">Add User</h4>
                                        <p className="text-xs text-slate-500">Register new customer</p>
                                    </div>
                                    <ChevronRight className="ml-auto h-4 w-4 text-slate-400 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Chart 1: Revenue (Super Admin) OR Order Volume (Limited Admin) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        {isSuperAdmin ? (
                            <><TrendingUp className="h-5 w-5 text-indigo-500" /> Revenue Trends</>
                        ) : (
                            <><Package className="h-5 w-5 text-slate-500" /> Order Volume (7 Days)</>
                        )}
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {isSuperAdmin ? (
                                <AreaChart data={stats.dailyStats || []}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="_id" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(str) => str.slice(5)} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="sales" stroke="#4F46E5" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                                </AreaChart>
                            ) : (
                                <BarChart data={stats.dailyStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(str) => str.slice(5)} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="count" name="Orders" fill="#64748b" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Status Breakdown (Simplified for Admin) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Clock className={`h-5 w-5 ${isSuperAdmin ? 'text-indigo-500' : 'text-slate-500'}`} />
                        Order Status
                    </h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={isSuperAdmin ? 80 : 60} // Thicker donut for admin
                                        outerRadius={isSuperAdmin ? 110 : 90}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isSuperAdmin ? SUPER_COLORS[index % SUPER_COLORS.length] : COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center space-y-2">
                                <Package className="h-10 w-10 text-slate-200 mx-auto" />
                                <p className="text-gray-400">No active orders</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AdminDashboard;
