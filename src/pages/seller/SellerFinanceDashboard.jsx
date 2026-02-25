import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    IndianRupee,
    Calendar,
    Download,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Banknote,
    History,
    PiggyBank,
    AlertCircle,
    Award,
    Star,
    Diamond,
    Medal,
    Sparkles,
    Timer,
    RefreshCw,
    Filter
} from 'lucide-react';

const SellerFinanceDashboard = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [dateFilter, setDateFilter] = useState('30');

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (activeTab === 'ledger') {
            fetchLedger();
        } else if (activeTab === 'settlements') {
            fetchSettlements();
        }
    }, [activeTab, dateFilter]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/settlements/dashboard');
            // Map backend response to frontend expected format
            setDashboard({
                ...data,
                availableBalance: data.balance?.eligible || 0,
                onHoldBalance: data.balance?.onHold || 0,
                pendingBalance: data.balance?.pending || 0,
                totalEarned: data.stats?.totalEarnings || 0,
                totalSettled: data.stats?.totalPaidOut || 0,
                commissionRate: 10, // Default, can be fetched from seller profile
                performanceScore: 75, // Default, can be fetched from seller profile
                performanceTier: 'STANDARD', // Default
                recentSettlements: [...(data.pastSettlements || []), ...(data.pendingSettlements || [])].slice(0, 5)
            });
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
            showToast('Failed to load financial dashboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchLedger = async () => {
        try {
            const { data } = await api.get(`/settlements/ledger?limit=50`);
            setLedger(data.transactions || []);
        } catch (error) {
            console.error('Failed to fetch ledger:', error);
        }
    };

    const fetchSettlements = async () => {
        try {
            const { data } = await api.get('/settlements/history');
            setSettlements(data.settlements || []);
        } catch (error) {
            console.error('Failed to fetch settlements:', error);
        }
    };


    const getTierInfo = (tier) => {
        const tiers = {
            PLATINUM: { icon: Diamond, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: '💎 Platinum' },
            GOLD: { icon: Medal, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '🥇 Gold' },
            SILVER: { icon: Award, color: 'text-gray-300', bg: 'bg-gray-500/20', label: '🥈 Silver' },
            BRONZE: { icon: Star, color: 'text-orange-400', bg: 'bg-orange-500/20', label: '🥉 Bronze' },
            STANDARD: { icon: Star, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Standard' }
        };
        return tiers[tier] || tiers.STANDARD;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ELIGIBLE': return 'text-emerald-400 bg-emerald-500/20';
            case 'PENDING': return 'text-amber-400 bg-amber-500/20';
            case 'ON_HOLD': return 'text-blue-400 bg-blue-500/20';
            case 'SETTLED': return 'text-gray-400 bg-gray-500/20';
            case 'REVERSED': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'ORDER_CREDIT': return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
            case 'RETURN_DEBIT':
            case 'CANCELLATION_DEBIT': return <ArrowDownRight className="h-4 w-4 text-red-400" />;
            case 'SETTLEMENT_DEBIT': return <Banknote className="h-4 w-4 text-blue-400" />;
            default: return <History className="h-4 w-4 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading financial data...</p>
                </div>
            </div>
        );
    }

    const tierInfo = getTierInfo(dashboard?.performanceTier);
    const TierIcon = tierInfo.icon;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-xl">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full filter blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                            <Wallet className="h-7 w-7" />
                            Financial Dashboard
                        </h1>
                        <p className="text-white/80 mt-1">Track your earnings, settlements & performance</p>
                    </div>

                    {/* Performance Tier Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${tierInfo.bg}`}>
                        <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
                        <span className={`font-semibold ${tierInfo.color}`}>{tierInfo.label}</span>
                    </div>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <Wallet className="h-6 w-6 text-emerald-400" />
                        </div>
                        <span className="text-xs text-emerald-400 font-medium">Available</span>
                    </div>
                    <p className="text-sm text-gray-400">Ready for Withdrawal</p>
                    <p className="text-3xl font-bold text-white mt-1">
                        ₹{(dashboard?.availableBalance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Can be settled anytime
                    </p>
                </div>

                {/* On Hold Balance */}
                <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl">
                            <Timer className="h-6 w-6 text-amber-400" />
                        </div>
                        <span className="text-xs text-amber-400 font-medium">On Hold</span>
                    </div>
                    <p className="text-sm text-gray-400">7-Day Return Window</p>
                    <p className="text-3xl font-bold text-white mt-1">
                        ₹{(dashboard?.onHoldBalance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Released after delivery + 7 days
                    </p>
                </div>

                {/* Pending Balance */}
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <PiggyBank className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className="text-xs text-blue-400 font-medium">Pending</span>
                    </div>
                    <p className="text-sm text-gray-400">Awaiting Delivery</p>
                    <p className="text-3xl font-bold text-white mt-1">
                        ₹{(dashboard?.pendingBalance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Unlocks after order delivered
                    </p>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                    Performance & Commission
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-gray-400">Performance Score</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            {(dashboard?.performanceScore || 0).toFixed(0)}/100
                        </p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-gray-400">Commission Rate</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">
                            {dashboard?.commissionRate || 10}%
                        </p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-gray-400">Total Earned</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            ₹{(dashboard?.totalEarned || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-gray-400">Total Settled</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            ₹{(dashboard?.totalSettled || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Tier Benefits */}
                {dashboard?.performanceTier && dashboard.performanceTier !== 'STANDARD' && (
                    <div className={`mt-4 p-4 rounded-xl ${tierInfo.bg} border border-${tierInfo.color.replace('text-', '')}/30`}>
                        <p className={`text-sm font-medium ${tierInfo.color}`}>
                            🎉 Your {tierInfo.label} tier gives you a reduced commission rate!
                        </p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700">
                {['overview', 'ledger', 'settlements'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                            ? 'text-violet-400 border-b-2 border-violet-400'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-white">Recent Transactions</h3>
                            <button
                                onClick={() => setActiveTab('ledger')}
                                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                            >
                                View All <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
                            {dashboard?.recentTransactions?.slice(0, 5).map((tx, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${tx.netAmount >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                                {tx.netAmount >= 0
                                                    ? <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                                    : <ArrowDownRight className="h-4 w-4 text-red-400" />
                                                }
                                            </div>
                                            <div>
                                                <p className="text-sm text-white">{tx.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`font-semibold ${tx.netAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {tx.netAmount >= 0 ? '+' : ''}₹{Math.abs(tx.netAmount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )) || (
                                    <div className="p-8 text-center text-gray-500">
                                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        No transactions yet
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Recent Settlements */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-white">Settlement History</h3>
                            <button
                                onClick={() => setActiveTab('settlements')}
                                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                            >
                                View All <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
                            {dashboard?.recentSettlements?.slice(0, 5).map((s, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-white">{s.settlementNumber}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(s.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-white">₹{s.netPayable?.toLocaleString()}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(s.status)}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) || (
                                    <div className="p-8 text-center text-gray-500">
                                        <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        No settlements yet
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ledger' && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Transaction Ledger</h3>
                        <div className="flex items-center gap-2">
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600"
                            >
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                            <button
                                onClick={fetchLedger}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <RefreshCw className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="text-left text-xs font-medium text-gray-400 p-4">Date</th>
                                    <th className="text-left text-xs font-medium text-gray-400 p-4">Type</th>
                                    <th className="text-left text-xs font-medium text-gray-400 p-4">Description</th>
                                    <th className="text-right text-xs font-medium text-gray-400 p-4">Amount</th>
                                    <th className="text-right text-xs font-medium text-gray-400 p-4">Commission</th>
                                    <th className="text-right text-xs font-medium text-gray-400 p-4">Net</th>
                                    <th className="text-center text-xs font-medium text-gray-400 p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {ledger.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-sm text-gray-300">
                                            {new Date(entry.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(entry.type)}
                                                <span className="text-sm text-white">
                                                    {entry.type.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-300 max-w-xs truncate">
                                            {entry.description}
                                        </td>
                                        <td className="p-4 text-sm text-right text-white">
                                            ₹{entry.grossAmount?.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-right text-red-400">
                                            -₹{entry.commission?.toLocaleString()}
                                        </td>
                                        <td className={`p-4 text-sm text-right font-semibold ${entry.netAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {entry.netAmount >= 0 ? '+' : ''}₹{entry.netAmount?.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(entry.status)}`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {ledger.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No transactions found for this period</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'settlements' && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="font-semibold text-white">All Settlements</h3>
                    </div>

                    <div className="divide-y divide-slate-700/50">
                        {settlements.map((settlement, idx) => (
                            <div key={idx} className="p-4 hover:bg-slate-700/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${settlement.status === 'COMPLETED' ? 'bg-emerald-500/20' :
                                            settlement.status === 'PROCESSING' ? 'bg-blue-500/20' :
                                                'bg-amber-500/20'
                                            }`}>
                                            <Banknote className={`h-5 w-5 ${settlement.status === 'COMPLETED' ? 'text-emerald-400' :
                                                settlement.status === 'PROCESSING' ? 'text-blue-400' :
                                                    'text-amber-400'
                                                }`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{settlement.settlementNumber}</p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(settlement.periodStart).toLocaleDateString()} - {new Date(settlement.periodEnd).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-bold text-white">₹{settlement.netPayable?.toLocaleString()}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(settlement.status)}`}>
                                            {settlement.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-4 gap-4 text-center bg-slate-700/30 rounded-lg p-3">
                                    <div>
                                        <p className="text-xs text-gray-400">Gross</p>
                                        <p className="text-sm text-white">₹{settlement.grossAmount?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Commission</p>
                                        <p className="text-sm text-red-400">-₹{settlement.totalCommission?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Deductions</p>
                                        <p className="text-sm text-red-400">-₹{settlement.totalDeductions?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Net Payable</p>
                                        <p className="text-sm text-emerald-400 font-semibold">₹{settlement.netPayable?.toLocaleString()}</p>
                                    </div>
                                </div>

                                {settlement.utrNumber && (
                                    <div className="mt-3 text-sm text-gray-400">
                                        UTR: <span className="text-white font-mono">{settlement.utrNumber}</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {settlements.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No settlements generated yet</p>
                                <p className="text-sm mt-2">Settlements are generated weekly on Mondays</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Help Section */}
            <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                    How Settlements Work
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                        <p className="text-violet-400 font-medium mb-1">1. Order Paid</p>
                        <p className="text-gray-400">Your earnings are recorded when customer pays</p>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                        <p className="text-amber-400 font-medium mb-1">2. 7-Day Hold</p>
                        <p className="text-gray-400">After delivery, funds are held for return window</p>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                        <p className="text-emerald-400 font-medium mb-1">3. Settlement</p>
                        <p className="text-gray-400">Weekly payouts every Monday to your bank</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerFinanceDashboard;
