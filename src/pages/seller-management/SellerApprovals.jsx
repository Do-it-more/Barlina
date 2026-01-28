import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
    Store,
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Ban,
    RefreshCw,
    ChevronDown,
    Building2,
    Mail,
    Phone,
    ShieldCheck,
    Calendar,
    ChevronRight
} from 'lucide-react';

const SellerApprovals = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        status: '',
        kycStatus: '',
        search: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchSellers();
        fetchStats();
    }, [filters.status, filters.kycStatus, filters.page]);

    const fetchSellers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.status) query.append('status', filters.status);
            if (filters.kycStatus) query.append('kycStatus', filters.kycStatus);
            if (filters.search) query.append('search', filters.search);
            query.append('page', filters.page);
            query.append('limit', 10);

            const { data } = await api.get(`/admin/sellers?${query.toString()}`);
            setSellers(data.sellers);
            setPagination({ page: data.page, pages: data.pages, total: data.total });
        } catch (error) {
            console.error('Failed to fetch sellers:', error);
            const message = error.response?.data?.message || 'Failed to load sellers';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/sellers/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSellers();
    };

    const handleQuickApprove = async (sellerId, e) => {
        e.stopPropagation();
        if (!isSuperAdmin) {
            showToast('Only Super Admin can approve sellers', 'error');
            return;
        }
        try {
            await api.put(`/admin/sellers/${sellerId}/approve`, { commissionPercentage: 10 });
            showToast('Seller approved successfully!', 'success');
            fetchSellers();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Approval failed', 'error');
        }
    };

    const handleQuickReject = async (sellerId, e) => {
        e.stopPropagation();
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            await api.put(`/admin/sellers/${sellerId}/reject`, { reason });
            showToast('Seller rejected', 'success');
            fetchSellers();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Rejection failed', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
            PENDING_VERIFICATION: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
            UNDER_REVIEW: { color: 'bg-blue-100 text-blue-700', icon: Eye, label: 'Under Review' },
            APPROVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
            REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
            SUSPENDED: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, label: 'Suspended' },
            BLOCKED: { color: 'bg-red-200 text-red-800', icon: Ban, label: 'Blocked' }
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seller Approvals</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve seller applications</p>
                </div>
                <button
                    onClick={() => { fetchSellers(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                    </form>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING_VERIFICATION">Pending Verification</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="SUSPENDED">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Sellers List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                </div>
            ) : sellers.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl py-20 text-center border border-gray-100 dark:border-slate-700">
                    <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No sellers found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sellers.map((seller) => (
                        <div
                            key={seller._id}
                            onClick={() => navigate(`/seller-management/sellers/${seller._id}`)}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                {seller.kyc?.sellerPhotoUrl ? (
                                    <img
                                        src={seller.kyc.sellerPhotoUrl}
                                        alt={seller.businessName}
                                        className="w-14 h-14 rounded-xl object-cover border border-gray-100 dark:border-slate-600 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                        {seller.businessName?.charAt(0) || 'S'}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{seller.businessName}</h3>
                                        {getStatusBadge(seller.status)}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3.5 w-3.5" />
                                            {seller.email}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3.5 w-3.5" />
                                            {seller.phone}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(seller.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {isSuperAdmin && seller.status === 'PENDING_VERIFICATION' && (
                                        <>
                                            <button
                                                onClick={(e) => handleQuickApprove(seller._id, e)}
                                                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                                title="Quick Approve"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleQuickReject(seller._id, e)}
                                                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                        disabled={filters.page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                        disabled={filters.page >= pagination.pages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default SellerApprovals;
