import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/image';
import {
    IndianRupee,
    ShoppingBag,
    TrendingUp,
    Percent,
    Store,
    ArrowUpRight,
    RefreshCw,
    Calendar,
    ChevronRight,
    Wallet,
    PiggyBank,
    Users,
    Package,
    Clock,
    CheckCircle,
    Filter,
    Eye,
    Mail,
    Phone,
    CreditCard,
    Building2
} from 'lucide-react';

const SettlementCommission = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('30');

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: result } = await api.get(`/settlements/admin/commission-dashboard?period=${period}`);
            setData(result);
        } catch (error) {
            console.error('Failed to fetch commission data:', error);
            showToast(error.response?.data?.message || 'Failed to load commission data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${Math.round(amount).toLocaleString()}`;
    };

    const formatFull = (amount) => `₹${Math.round(amount).toLocaleString()}`;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading commission data...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { platformTotals, sellers, settlementSummary, totalActiveSellers } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Settlement & Commission</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Platform earnings, seller payouts, and commission tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="365">Last 1 Year</option>
                        <option value="9999">All Time</option>
                    </select>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors text-sm font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Platform Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Gross Revenue */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <IndianRupee className="h-5 w-5" />
                        </div>
                        <TrendingUp className="h-4 w-4 text-white/60" />
                    </div>
                    <p className="text-white/80 text-xs font-medium">Gross Revenue</p>
                    <p className="text-2xl font-bold mt-1" title={formatFull(platformTotals.grossRevenue)}>
                        {formatCurrency(platformTotals.grossRevenue)}
                    </p>
                </div>

                {/* Platform Commission (Our Earnings) */}
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <PiggyBank className="h-5 w-5" />
                        </div>
                        <Percent className="h-4 w-4 text-white/60" />
                    </div>
                    <p className="text-white/80 text-xs font-medium">Platform Commission</p>
                    <p className="text-2xl font-bold mt-1" title={formatFull(platformTotals.platformCommission)}>
                        {formatCurrency(platformTotals.platformCommission)}
                    </p>
                </div>

                {/* Seller Payouts */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-white/60" />
                    </div>
                    <p className="text-white/80 text-xs font-medium">Seller Payouts</p>
                    <p className="text-2xl font-bold mt-1" title={formatFull(platformTotals.sellerPayouts)}>
                        {formatCurrency(platformTotals.sellerPayouts)}
                    </p>
                </div>

                {/* Total Orders */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                            <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{platformTotals.totalOrders}</p>
                </div>

                {/* Active Sellers */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Active Sellers</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalActiveSellers}</p>
                </div>
            </div>

            {/* Settlement Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pending Settlements</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{settlementSummary.pending}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">{formatFull(settlementSummary.pendingAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Paid Settlements</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{settlementSummary.paid}</p>
                            <p className="text-xs text-green-600 dark:text-green-400">{formatFull(settlementSummary.paidAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                            <PiggyBank className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Commission Collected</p>
                            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{formatFull(settlementSummary.paidCommission)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Settlements</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{settlementSummary.total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller-wise Breakdown Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-orange-500" />
                            Seller-wise Commission Breakdown
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Order revenue, platform commission, and seller profit per seller
                        </p>
                    </div>
                </div>

                {sellers.length === 0 ? (
                    <div className="p-12 text-center">
                        <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No seller transactions in this period</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-700/50">
                                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission %</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Revenue</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Our Commission</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller Profit</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {sellers.map((item) => (
                                    <tr key={item.seller._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                {item.seller.sellerPhotoUrl ? (
                                                    <img
                                                        src={getImageUrl(item.seller.sellerPhotoUrl)}
                                                        alt={item.seller.businessName}
                                                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-slate-600"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40?text=S'; }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                                                        {item.seller.businessName?.charAt(0) || 'S'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white text-sm">{item.seller.businessName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.seller.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-xs font-bold">
                                                {item.seller.commissionRate}%
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="font-semibold text-slate-800 dark:text-white">{item.totalOrders}</span>
                                            <span className="text-xs text-gray-400 ml-1">({item.totalItems} items)</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-semibold text-slate-800 dark:text-white">{formatFull(item.grossRevenue)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-bold text-violet-600 dark:text-violet-400">{formatFull(item.platformCommission)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatFull(item.sellerProfit)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <Link
                                                to={`/seller-management/sellers/${item.seller._id}`}
                                                className="inline-flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Totals Row */}
                            <tfoot>
                                <tr className="bg-gray-50 dark:bg-slate-700/50 font-bold">
                                    <td className="py-4 px-5 text-slate-800 dark:text-white text-sm">
                                        Total ({sellers.length} sellers)
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-500 dark:text-gray-400 text-sm">—</td>
                                    <td className="py-4 px-4 text-center text-slate-800 dark:text-white">{platformTotals.totalOrders}</td>
                                    <td className="py-4 px-4 text-right text-slate-800 dark:text-white">{formatFull(platformTotals.grossRevenue)}</td>
                                    <td className="py-4 px-4 text-right text-violet-700 dark:text-violet-400">{formatFull(platformTotals.platformCommission)}</td>
                                    <td className="py-4 px-4 text-right text-emerald-700 dark:text-emerald-400">{formatFull(platformTotals.sellerPayouts)}</td>
                                    <td className="py-4 px-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettlementCommission;
