import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    Users,
    Search,
    Filter,
    ChevronDown,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Ban,
    Store,
    TrendingUp,
    RefreshCw,
    MoreVertical,
    Building2,
    Mail,
    Phone
} from 'lucide-react';

const SellerListScreen = () => {
    const { showToast } = useToast();
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
            query.append('limit', 15);

            const { data } = await api.get(`/admin/sellers?${query.toString()}`);
            setSellers(data.sellers);
            setPagination({ page: data.page, pages: data.pages, total: data.total });
        } catch (error) {
            console.error('Failed to fetch sellers:', error);
            showToast('Failed to load sellers', 'error');
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

    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock },
            PENDING_VERIFICATION: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            UNDER_REVIEW: { color: 'bg-blue-100 text-blue-700', icon: Eye },
            APPROVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
            REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle },
            SUSPENDED: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
            BLOCKED: { color: 'bg-red-200 text-red-800', icon: Ban }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700', icon: Clock };
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3" />
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    const getKycBadge = (status) => {
        const colors = {
            NOT_SUBMITTED: 'bg-gray-100 text-gray-600',
            PENDING: 'bg-yellow-100 text-yellow-700',
            SUBMITTED: 'bg-blue-100 text-blue-700',
            VERIFIED: 'bg-green-100 text-green-700',
            REJECTED: 'bg-red-100 text-red-700'
        };

        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.PENDING}`}>
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seller Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage seller applications</p>
                </div>
                <button
                    onClick={() => { fetchSellers(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <Store className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.total || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pending</p>
                            <p className="text-xl font-bold text-yellow-600">{stats.pendingApprovals || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Approved</p>
                            <p className="text-xl font-bold text-green-600">{stats.byStatus?.APPROVED || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Rejected</p>
                            <p className="text-xl font-bold text-red-600">{stats.byStatus?.REJECTED || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Suspended</p>
                            <p className="text-xl font-bold text-orange-600">{stats.byStatus?.SUSPENDED || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Eye className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Under Review</p>
                            <p className="text-xl font-bold text-blue-600">{stats.byStatus?.UNDER_REVIEW || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </form>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING_VERIFICATION">Pending Verification</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="BLOCKED">Blocked</option>
                    </select>
                    <select
                        value={filters.kycStatus}
                        onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value, page: 1 })}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="">All KYC Status</option>
                        <option value="NOT_SUBMITTED">Not Submitted</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Sellers Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    </div>
                ) : sellers.length === 0 ? (
                    <div className="py-20 text-center">
                        <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No sellers found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Seller</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Business</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">KYC</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Registered</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {sellers.map((seller) => (
                                    <tr key={seller._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                    {seller.ownerName?.charAt(0) || seller.businessName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">{seller.ownerName}</p>
                                                    <p className="text-xs text-gray-500">{seller.sellerType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{seller.businessName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {seller.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {seller.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(seller.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getKycBadge(seller.kyc?.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(seller.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/admin/sellers/${seller._id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * 15) + 1} to {Math.min(pagination.page * 15, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={filters.page === 1}
                                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={filters.page >= pagination.pages}
                                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerListScreen;
