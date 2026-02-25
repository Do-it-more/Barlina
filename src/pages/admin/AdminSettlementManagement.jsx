import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    Wallet,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    RefreshCw,
    ChevronDown,
    AlertCircle,
    Banknote,
    Building2,
    User,
    Calendar,
    ArrowRight,
    Check,
    X,
    CreditCard,
    FileText,
    TrendingUp,
    IndianRupee,
    Users,
    Download,
    Eye,
    Send
} from 'lucide-react';

const AdminSettlementManagement = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [settlements, setSettlements] = useState([]);
    const [stats, setStats] = useState({});
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');
    const [paidAt, setPaidAt] = useState('');

    useEffect(() => {
        fetchSettlements();
        fetchStats();
    }, [filter]);

    const fetchSettlements = async () => {
        try {
            setLoading(true);
            const status = filter === 'ALL' ? '' : `?status=${filter}`;
            const { data } = await api.get(`/settlements/admin/all${status}`);
            setSettlements(data.settlements || []);
        } catch (error) {
            console.error('Failed to fetch settlements:', error);
            showToast('Failed to load settlements', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/settlements/admin/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleApprove = async (settlementId) => {
        try {
            setActionLoading(true);
            await api.put(`/settlements/admin/${settlementId}/approve`);
            showToast('Settlement approved successfully', 'success');
            fetchSettlements();
            fetchStats();
            setShowModal(false);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to approve', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (settlementId, reason) => {
        try {
            setActionLoading(true);
            await api.put(`/settlements/admin/${settlementId}/reject`, { reason });
            showToast('Settlement rejected', 'success');
            fetchSettlements();
            fetchStats();
            setShowModal(false);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to reject', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcess = async (settlementId) => {
        try {
            setActionLoading(true);
            await api.put(`/settlements/admin/${settlementId}/process`);
            showToast('Settlement marked as processing', 'success');
            fetchSettlements();
            fetchStats();
            setShowModal(false);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to process', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkPaid = async (settlementId) => {
        if (!utrNumber) {
            showToast('Please enter UTR number', 'error');
            return;
        }
        try {
            setActionLoading(true);
            await api.put(`/settlements/admin/${settlementId}/paid`, {
                utrNumber,
                paidAt: paidAt || new Date().toISOString()
            });
            showToast('Settlement marked as paid!', 'success');
            fetchSettlements();
            fetchStats();
            setShowModal(false);
            setUtrNumber('');
            setPaidAt('');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to mark as paid', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
            case 'APPROVED': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
            case 'PROCESSING': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
            case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            case 'FAILED': return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'REJECTED': return 'text-red-400 bg-red-500/20 border-red-500/30';
            default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return Clock;
            case 'APPROVED': return Check;
            case 'PROCESSING': return RefreshCw;
            case 'COMPLETED': return CheckCircle;
            case 'FAILED':
            case 'REJECTED': return XCircle;
            default: return AlertCircle;
        }
    };

    const filteredSettlements = settlements.filter(s => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            s.settlementNumber?.toLowerCase().includes(term) ||
            s.seller?.businessName?.toLowerCase().includes(term) ||
            s.seller?.email?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 shadow-xl">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                        <Banknote className="h-7 w-7" />
                        Settlement Management
                    </h1>
                    <p className="text-white/80 mt-1">Review, approve, and process seller payouts</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Clock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Pending</p>
                            <p className="text-xl font-bold text-white">{stats.pending || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Check className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Approved</p>
                            <p className="text-xl font-bold text-white">{stats.approved || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <RefreshCw className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Processing</p>
                            <p className="text-xl font-bold text-white">{stats.processing || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Completed</p>
                            <p className="text-xl font-bold text-white">{stats.completed || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <IndianRupee className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Total Paid</p>
                            <p className="text-lg font-bold text-white">₹{(stats.totalPaid || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    {['ALL', 'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by seller or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-violet-500 outline-none w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Settlements Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="text-left text-xs font-medium text-gray-400 p-4">Settlement</th>
                                    <th className="text-left text-xs font-medium text-gray-400 p-4">Seller</th>
                                    <th className="text-left text-xs font-medium text-gray-400 p-4">Period</th>
                                    <th className="text-right text-xs font-medium text-gray-400 p-4">Amount</th>
                                    <th className="text-center text-xs font-medium text-gray-400 p-4">Status</th>
                                    <th className="text-center text-xs font-medium text-gray-400 p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredSettlements.map((settlement) => {
                                    const StatusIcon = getStatusIcon(settlement.status);
                                    return (
                                        <tr key={settlement._id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4">
                                                <p className="font-medium text-white">{settlement.settlementNumber}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(settlement.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-600 rounded-lg">
                                                        <Building2 className="h-4 w-4 text-gray-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white">{settlement.seller?.businessName}</p>
                                                        <p className="text-xs text-gray-500">{settlement.seller?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-300">
                                                {new Date(settlement.periodStart).toLocaleDateString()} - {new Date(settlement.periodEnd).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <p className="font-bold text-white">₹{settlement.netPayable?.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">{settlement.entriesCount} entries</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border ${getStatusColor(settlement.status)}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {settlement.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSettlement(settlement);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    {settlement.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleApprove(settlement._id)}
                                                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {settlement.status === 'APPROVED' && (
                                                        <button
                                                            onClick={() => handleProcess(settlement._id)}
                                                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                                            title="Start Processing"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {settlement.status === 'PROCESSING' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSettlement(settlement);
                                                                setShowModal(true);
                                                            }}
                                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                                            title="Mark as Paid"
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredSettlements.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No settlements found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Settlement Detail Modal */}
            {showModal && selectedSettlement && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Settlement Details</h2>
                                <p className="text-sm text-gray-400">{selectedSettlement.settlementNumber}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedSettlement(null);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Seller Info */}
                            <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                                <div className="p-3 bg-violet-500/20 rounded-xl">
                                    <Building2 className="h-6 w-6 text-violet-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{selectedSettlement.seller?.businessName}</p>
                                    <p className="text-sm text-gray-400">{selectedSettlement.seller?.email}</p>
                                </div>
                            </div>

                            {/* Amount Breakdown */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-700/30 rounded-xl text-center">
                                    <p className="text-sm text-gray-400">Gross Amount</p>
                                    <p className="text-2xl font-bold text-white">₹{selectedSettlement.grossAmount?.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-700/30 rounded-xl text-center">
                                    <p className="text-sm text-gray-400">Commission</p>
                                    <p className="text-2xl font-bold text-red-400">-₹{selectedSettlement.totalCommission?.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-700/30 rounded-xl text-center">
                                    <p className="text-sm text-gray-400">Deductions</p>
                                    <p className="text-2xl font-bold text-red-400">-₹{selectedSettlement.totalDeductions?.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-emerald-500/20 rounded-xl text-center border border-emerald-500/30">
                                    <p className="text-sm text-emerald-400">Net Payable</p>
                                    <p className="text-2xl font-bold text-emerald-400">₹{selectedSettlement.netPayable?.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="p-4 bg-slate-700/30 rounded-xl">
                                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-violet-400" />
                                    Bank Details
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-400">Account Holder</p>
                                        <p className="text-white">{selectedSettlement.bankDetails?.holderName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Bank Name</p>
                                        <p className="text-white">{selectedSettlement.bankDetails?.bankName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Account Number</p>
                                        <p className="text-white font-mono">{selectedSettlement.bankDetails?.accountNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">IFSC Code</p>
                                        <p className="text-white font-mono">{selectedSettlement.bankDetails?.ifsc || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* UTR Input for Processing Status */}
                            {selectedSettlement.status === 'PROCESSING' && (
                                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                                    <h4 className="font-medium text-purple-400 mb-3">Mark as Paid</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm text-gray-400">UTR Number *</label>
                                            <input
                                                type="text"
                                                value={utrNumber}
                                                onChange={(e) => setUtrNumber(e.target.value)}
                                                placeholder="Enter UTR/Transaction ID"
                                                className="w-full mt-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400">Payment Date</label>
                                            <input
                                                type="datetime-local"
                                                value={paidAt}
                                                onChange={(e) => setPaidAt(e.target.value)}
                                                className="w-full mt-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Current Status</span>
                                <span className={`px-4 py-2 rounded-full text-sm ${getStatusColor(selectedSettlement.status)}`}>
                                    {selectedSettlement.status}
                                </span>
                            </div>

                            {selectedSettlement.utrNumber && (
                                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                    <p className="text-sm text-emerald-400">
                                        Payment UTR: <span className="font-mono text-white">{selectedSettlement.utrNumber}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer - Action Buttons */}
                        <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>

                            {selectedSettlement.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => handleReject(selectedSettlement._id, 'Rejected by admin')}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedSettlement._id)}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Check className="h-4 w-4" />
                                        Approve
                                    </button>
                                </>
                            )}

                            {selectedSettlement.status === 'APPROVED' && (
                                <button
                                    onClick={() => handleProcess(selectedSettlement._id)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="h-4 w-4" />
                                    Start Processing
                                </button>
                            )}

                            {selectedSettlement.status === 'PROCESSING' && (
                                <button
                                    onClick={() => handleMarkPaid(selectedSettlement._id)}
                                    disabled={actionLoading || !utrNumber}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Mark as Paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettlementManagement;
