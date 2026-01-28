import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Ban,
    Store,
    MapPin,
    Mail,
    Phone,
    MoreVertical,
    Clock,
    Trash2
} from 'lucide-react';

const ActiveSellers = () => {
    const { showToast } = useToast();
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });
    const [filters, setFilters] = useState({
        search: '',
        status: 'APPROVED', // Default to approved
        page: 1
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchSellers();
    }, [filters.page, filters.search, filters.status]);

    const fetchSellers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: filters.page,
                limit: 10,
                status: filters.status, // Can be APPROVED or SUSPENDED
            });
            if (filters.search) query.append('search', filters.search);

            const { data } = await api.get(`/admin/sellers?${query.toString()}`);
            setSellers(data.sellers);
            setPagination({ page: data.page, pages: data.pages, total: data.total });

            // Also fetch stats if needed, or mock them
            setStats({
                total: data.total,
                active: data.sellers.filter(s => s.status === 'APPROVED').length,
                suspended: data.sellers.filter(s => s.status === 'SUSPENDED').length
            });

        } catch (error) {
            console.error(error);
            showToast('Failed to fetch active sellers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (sellerId) => {
        if (!window.confirm('Are you sure you want to suspend this seller? Their products will be hidden.')) return;
        try {
            // Include params in query string as fallback
            const reason = 'Admin Action';
            const freezePayouts = true;
            await api.put(`/admin/sellers/${sellerId}/suspend?reason=${encodeURIComponent(reason)}&freezePayouts=${freezePayouts}`, { reason, freezePayouts });
            // await api.put(`/admin/sellers/${sellerId}/suspend`, { reason: 'Admin Action', freezePayouts: true });
            showToast('Seller suspended successfully', 'success');
            fetchSellers();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to suspend', 'error');
        }
    };

    const handleActivate = async (sellerId) => {
        try {
            await api.put(`/admin/sellers/${sellerId}/activate`, {});
            showToast('Seller reactivated successfully', 'success');
            fetchSellers();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to activate', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Active Sellers</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage approved sellers</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Active</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{pagination.total}</h3>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <Store className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                {/* We could add more stats if API provided them globally */}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by business name, email..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="APPROVED">Active Only</option>
                        <option value="SUSPENDED">Suspended Only</option>
                        <option value="">All Status</option>
                    </select>
                </div>
            </div>

            {/* Sellers Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : sellers.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                    <Store className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">No sellers found</h3>
                    <p className="text-gray-500">Try adjusting your search filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sellers.map((seller) => (
                        <div key={seller._id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    {seller.kyc?.sellerPhotoUrl ? (
                                        <img
                                            src={seller.kyc.sellerPhotoUrl}
                                            alt={seller.businessName}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-slate-600"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xl uppercase">
                                            {seller.businessName?.charAt(0)}
                                        </div>
                                    )}
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${seller.status === 'APPROVED'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {seller.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">{seller.businessName}</h3>
                                <p className="text-sm text-gray-500 mb-4">{seller.ownerName}</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="truncate">{seller.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{seller.phone || 'No phone'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                                    <Link
                                        to={`/seller-management/sellers/${seller._id}`}
                                        className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline"
                                    >
                                        View Details
                                    </Link>

                                    {seller.status === 'APPROVED' ? (
                                        <button
                                            onClick={() => handleSuspend(seller._id)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                        >
                                            <Ban className="h-4 w-4" />
                                            Suspend
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleActivate(seller._id)}
                                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Activate
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                        disabled={filters.page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2">Page {pagination.page} of {pagination.pages}</span>
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                        disabled={filters.page >= pagination.pages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActiveSellers;
