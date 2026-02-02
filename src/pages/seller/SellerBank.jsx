import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    CreditCard,
    Landmark,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader,
    Eye,
    EyeOff,
    Wallet,
    TrendingUp,
    Calendar,
    RefreshCw,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const SellerBank = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [showAccountNumber, setShowAccountNumber] = useState(false);
    const [stats, setStats] = useState({
        pendingSettlement: 0,
        totalSettled: 0,
        lastSettlement: null,
        nextSettlementDate: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sellerRes, settlementRes] = await Promise.all([
                api.get('/sellers/profile'),
                api.get('/sellers/settlements')
            ]);
            setSeller(sellerRes.data);
            setSettlements(settlementRes.data.settlements || []);
            setStats({
                pendingSettlement: settlementRes.data.pendingAmount || 0,
                totalSettled: settlementRes.data.totalSettled || 0,
                lastSettlement: settlementRes.data.lastSettlementDate,
                nextSettlementDate: settlementRes.data.nextSettlementDate
            });
        } catch (error) {
            console.error('Failed to fetch bank details:', error);
            // Fallback to just seller profile if settlements API fails
            try {
                const sellerRes = await api.get('/sellers/profile');
                setSeller(sellerRes.data);
            } catch {
                showToast('Failed to load bank details', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const maskAccountNumber = (acc) => {
        if (!acc) return '-';
        return showAccountNumber ? acc : acc.slice(0, 4) + '****' + acc.slice(-4);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const bankDetails = seller?.bankDetails || {};

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Landmark className="h-6 w-6 text-violet-500" />
                            Bank & Settlements
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your bank account and view settlement history
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 text-violet-400 rounded-lg hover:bg-violet-600/30 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl p-5 border border-emerald-500/30"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Wallet className="w-10 h-10 text-emerald-400 p-2 bg-emerald-500/20 rounded-xl" />
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-emerald-300/70 text-sm">Pending Settlement</p>
                        <p className="text-2xl font-bold text-emerald-400 flex items-center gap-1 mt-1">
                            <IndianRupee className="w-5 h-5" />
                            {stats.pendingSettlement.toLocaleString('en-IN')}
                        </p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-5 border border-blue-500/30"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <CheckCircle className="w-10 h-10 text-blue-400 p-2 bg-blue-500/20 rounded-xl" />
                            <ArrowUpRight className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-blue-300/70 text-sm">Total Settled</p>
                        <p className="text-2xl font-bold text-blue-400 flex items-center gap-1 mt-1">
                            <IndianRupee className="w-5 h-5" />
                            {stats.totalSettled.toLocaleString('en-IN')}
                        </p>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-2xl p-5 border border-violet-500/30"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Calendar className="w-10 h-10 text-violet-400 p-2 bg-violet-500/20 rounded-xl" />
                            <Clock className="w-5 h-5 text-violet-400" />
                        </div>
                        <p className="text-violet-300/70 text-sm">Next Settlement</p>
                        <p className="text-lg font-bold text-violet-400 mt-1">
                            {stats.nextSettlementDate
                                ? new Date(stats.nextSettlementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : 'Weekly'}
                        </p>
                    </motion.div>
                </div>

                {/* Bank Details Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-violet-500" />
                            Bank Account Details
                        </h2>
                        {bankDetails.accountNumber && (
                            <span className="flex items-center gap-1 text-sm text-emerald-400">
                                <CheckCircle className="w-4 h-4" />
                                Verified
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        {bankDetails.accountNumber ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Number</label>
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-900 dark:text-white font-mono text-lg">
                                            {maskAccountNumber(bankDetails.accountNumber)}
                                        </p>
                                        <button
                                            onClick={() => setShowAccountNumber(!showAccountNumber)}
                                            className="p-1 text-gray-400 hover:text-violet-400 transition-colors"
                                        >
                                            {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">IFSC Code</label>
                                    <p className="text-gray-900 dark:text-white font-mono text-lg">{bankDetails.ifsc || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Holder Name</label>
                                    <p className="text-gray-900 dark:text-white">{bankDetails.holderName || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bank Name</label>
                                    <p className="text-gray-900 dark:text-white">{bankDetails.bankName || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Branch</label>
                                    <p className="text-gray-900 dark:text-white">{bankDetails.branchName || '-'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">No bank account linked yet</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Add your bank details during onboarding</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Settlement History */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settlement History</h2>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {settlements.length > 0 ? (
                            settlements.slice(0, 10).map((settlement, index) => (
                                <div key={settlement._id || index} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${settlement.status === 'COMPLETED' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                                            {settlement.status === 'COMPLETED' ? (
                                                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-amber-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                Settlement #{settlement.settlementId || settlement._id?.slice(-6)}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(settlement.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                            <IndianRupee className="w-4 h-4" />
                                            {settlement.amount?.toLocaleString('en-IN')}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${settlement.status === 'COMPLETED'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {settlement.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">No settlements yet</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    Settlements are processed weekly after successful deliveries
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-400">Settlement Information</p>
                            <p className="text-blue-300/80 text-sm mt-1">
                                Settlements are processed weekly (every Monday). Amount is credited to your registered bank account within 2-3 business days after processing. A platform commission of {seller?.commissionPercentage || 10}% is deducted from each order.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SellerBank;
