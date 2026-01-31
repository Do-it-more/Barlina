import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Plus,
    Trash2,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    AlertTriangle,
    CheckCircle,
    Bell,
    Activity,
    Zap,
    PiggyBank,
    Receipt
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const FinancialDashboard = () => {
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        income: 0,
        refunds: 0,
        expenses: 0,
        salaries: 0,
        netProfit: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [alerts, setAlerts] = useState([]);

    // Quick Add Form State
    const [quickAdd, setQuickAdd] = useState({
        type: 'EXPENSE',
        category: '',
        amount: '',
        description: ''
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Get current month stats
            const today = new Date();

            // Helper to format as YYYY-MM-DD in Local Time
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const startOfMonth = formatDate(startOfMonthDate);
            const endOfMonth = formatDate(endOfMonthDate);

            const [statsRes, recordsRes] = await Promise.all([
                api.get(`/finance/stats?startDate=${startOfMonth}&endDate=${endOfMonth}`),
                api.get(`/finance?startDate=${startOfMonth}&endDate=${endOfMonth}`)
            ]);

            setStats(statsRes.data);

            // Get last 5 records for activity feed
            const sortedRecords = recordsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
            setRecentActivity(sortedRecords);

            // Generate smart alerts
            generateAlerts(statsRes.data, recordsRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const generateAlerts = (statsData, records) => {
        const newAlerts = [];

        // High expense alert
        if (statsData.expenses > statsData.income * 0.7) {
            newAlerts.push({
                type: 'warning',
                message: 'Expenses are over 70% of income this month',
                icon: AlertTriangle
            });
        }

        // Negative profit alert
        if (statsData.netProfit < 0) {
            newAlerts.push({
                type: 'error',
                message: 'Net profit is negative this month',
                icon: TrendingDown
            });
        }

        // Good profit margin
        if (statsData.income > 0 && statsData.netProfit / statsData.income > 0.3) {
            newAlerts.push({
                type: 'success',
                message: 'Great! Profit margin is above 30%',
                icon: CheckCircle
            });
        }

        // No salary recorded
        if (statsData.salaries === 0 && new Date().getDate() > 25) {
            newAlerts.push({
                type: 'info',
                message: 'No salaries recorded yet this month',
                icon: Bell
            });
        }

        setAlerts(newAlerts);
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance', {
                ...quickAdd,
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'BANK_TRANSFER'
            });
            showToast("Record added successfully", 'success');
            setShowQuickAdd(false);
            setQuickAdd({ type: 'EXPENSE', category: '', amount: '', description: '' });
            fetchDashboardData();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to add record", 'error');
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'INCOME': return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
            case 'EXPENSE': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
            case 'SALARY': return <Wallet className="h-4 w-4 text-blue-500" />;
            case 'REFUND': return <Receipt className="h-4 w-4 text-orange-500" />;
            default: return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHrs < 1) return 'Just now';
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return past.toLocaleDateString();
    };


    const KPICard = ({ title, value, icon: Icon, gradient, trend, subtitle }) => (
        <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} text-white shadow-xl group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
            {/* Subtle diagonal pattern overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                        <Icon className="h-6 w-6" />
                    </div>
                    {/* Trend Badge instead of sparkline */}
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trend > 0 ? 'bg-green-400/30 text-green-100' :
                        trend < 0 ? 'bg-red-400/30 text-red-100' :
                            'bg-white/20 text-white/80'
                        }`}>
                        {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                        {trend > 0 ? 'Up' : trend < 0 ? 'Down' : 'Stable'}
                    </div>
                </div>

                <p className="text-xs font-medium text-white/80 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">₹{value?.toLocaleString()}</p>
                {subtitle && (
                    <p className="text-xs text-white/70 flex items-center gap-1 mt-2 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Enhanced Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 shadow-xl">
                {/* Background decorative elements */}
                <div className="absolute inset-0">
                    <svg className="absolute top-0 right-0 w-64 h-64 text-white/10" viewBox="0 0 200 200" fill="currentColor">
                        <circle cx="100" cy="100" r="80" />
                    </svg>
                    <svg className="absolute bottom-0 left-10 w-32 h-32 text-white/5" viewBox="0 0 200 200" fill="currentColor">
                        <rect x="0" y="0" width="200" height="200" rx="40" transform="rotate(45 100 100)" />
                    </svg>
                    <div className="absolute top-4 left-1/2 w-72 h-72 bg-white/10 rounded-full filter blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {/* Animated Finance Icon */}
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                                <Zap className="h-6 w-6 text-yellow-300 animate-pulse" />
                                Financial Overview
                            </h1>
                            <p className="text-white/80 mt-1">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live indicator */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-white/90 text-sm font-medium">Live Data</span>
                        </div>

                        <button
                            onClick={() => setShowQuickAdd(!showQuickAdd)}
                            className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-white/90 px-6 py-3 rounded-xl transition-all shadow-lg font-semibold hover:scale-105"
                        >
                            <Plus className="h-5 w-5" />
                            Quick Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Add Panel */}
            {showQuickAdd && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-lg animate-in slide-in-from-top duration-300">
                    <form onSubmit={handleQuickAdd} className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                            <select
                                value={quickAdd.type}
                                onChange={(e) => setQuickAdd({ ...quickAdd, type: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="EXPENSE">Expense</option>
                                <option value="SALARY">Salary</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Office Rent"
                                value={quickAdd.category}
                                onChange={(e) => setQuickAdd({ ...quickAdd, category: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                            <input
                                type="number"
                                required
                                placeholder="₹0"
                                value={quickAdd.amount}
                                onChange={(e) => setQuickAdd({ ...quickAdd, amount: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex-[2] min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                            <input
                                type="text"
                                required
                                placeholder="Brief description"
                                value={quickAdd.description}
                                onChange={(e) => setQuickAdd({ ...quickAdd, description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Add Record
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowQuickAdd(false)}
                            className="px-4 py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* KPI Cards */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <KPICard
                            title="Total Income"
                            value={stats.income}
                            icon={TrendingUp}
                            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                            trend={1}
                            subtitle="Revenue this month"
                        />
                        <KPICard
                            title="Total Expenses"
                            value={stats.expenses}
                            icon={CreditCard}
                            gradient="bg-gradient-to-br from-red-500 to-rose-600"
                            trend={-1}
                            subtitle="Spent this month"
                        />
                        <KPICard
                            title="Total Salaries"
                            value={stats.salaries}
                            icon={Wallet}
                            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                            trend={0}
                            subtitle="Payroll costs"
                        />
                        <KPICard
                            title="Net Profit"
                            value={stats.netProfit}
                            icon={PiggyBank}
                            gradient={stats.netProfit >= 0
                                ? "bg-gradient-to-br from-violet-500 to-purple-600"
                                : "bg-gradient-to-br from-gray-600 to-gray-700"}
                            trend={stats.netProfit >= 0 ? 1 : -1}
                            subtitle={stats.income > 0 ? `${((stats.netProfit / stats.income) * 100).toFixed(1)}% margin` : 'No income yet'}
                        />
                    </div>

                    {/* Bottom Grid: Alerts + Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Smart Alerts */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 lg:col-span-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-amber-500" />
                                Smart Alerts
                            </h3>

                            {alerts.length > 0 ? (
                                <div className="space-y-3">
                                    {alerts.map((alert, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-start gap-3 p-3 rounded-xl ${alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' :
                                                alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                                                    alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                                                        'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                                }`}
                                        >
                                            <alert.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${alert.type === 'success' ? 'text-emerald-600' :
                                                alert.type === 'warning' ? 'text-amber-600' :
                                                    alert.type === 'error' ? 'text-red-600' :
                                                        'text-blue-600'
                                                }`} />
                                            <p className={`text-sm ${alert.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' :
                                                alert.type === 'warning' ? 'text-amber-800 dark:text-amber-300' :
                                                    alert.type === 'error' ? 'text-red-800 dark:text-red-300' :
                                                        'text-blue-800 dark:text-blue-300'
                                                }`}>{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <CheckCircle className="h-12 w-12 mb-3 text-emerald-400" />
                                    <p className="text-sm">All systems healthy</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-indigo-500" />
                                Recent Activity
                            </h3>

                            {recentActivity.length > 0 ? (
                                <div className="space-y-3">
                                    {recentActivity.map((record) => (
                                        <div
                                            key={record._id}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <div className={`p-2.5 rounded-xl ${record.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                                record.type === 'EXPENSE' ? 'bg-red-100 dark:bg-red-900/30' :
                                                    record.type === 'SALARY' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                        'bg-orange-100 dark:bg-orange-900/30'
                                                }`}>
                                                {getActivityIcon(record.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 dark:text-white truncate">
                                                    {record.category}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {record.description}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`font-bold ${record.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800 dark:text-white'
                                                    }`}>
                                                    {record.type === 'INCOME' ? '+' : '-'}₹{record.amount.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatTimeAgo(record.createdAt || record.date)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <Activity className="h-12 w-12 mb-3" />
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Quick Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Receipt className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-3xl font-bold text-slate-800 dark:text-white">
                                {recentActivity.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Transactions</p>
                        </div>
                        <div className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-3xl font-bold text-emerald-600">
                                {stats.income > 0 ? ((stats.netProfit / stats.income) * 100).toFixed(0) : 0}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Profit Margin</p>
                        </div>
                        <div className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-3xl font-bold text-blue-600">
                                ₹{stats.refunds.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Total Refunds</p>
                        </div>
                        <div className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-3xl font-bold text-purple-600">
                                {new Date().getDate()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Days This Month</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FinancialDashboard;
