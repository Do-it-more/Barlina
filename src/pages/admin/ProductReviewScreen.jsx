import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
    Package,
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Ban,
    RefreshCw,
    Image as ImageIcon,
    Store,
    Tag,
    IndianRupee,
    ChevronDown,
    ExternalLink,
    MessageSquare
} from 'lucide-react';

const ProductReviewScreen = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showActionModal, setShowActionModal] = useState(null); // 'approve', 'reject', 'block'
    const [actionData, setActionData] = useState({ reason: '', notes: '', qualityScore: 80 });
    const [actionLoading, setActionLoading] = useState(false);

    const [filters, setFilters] = useState({
        status: 'UNDER_REVIEW',
        category: '',
        search: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchProducts();
        fetchStats();
    }, [filters.status, filters.category, filters.page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.status) query.append('status', filters.status);
            if (filters.category) query.append('category', filters.category);
            if (filters.search) query.append('search', filters.search);
            query.append('page', filters.page);
            query.append('limit', 12);

            const { data } = await api.get(`/admin/product-reviews?${query.toString()}`);
            setProducts(data.products);
            setPagination({ page: data.page, pages: data.pages, total: data.total });
        } catch (error) {
            console.error('Failed to fetch products:', error);
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/product-reviews/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleAction = async () => {
        if (!selectedProduct) return;

        if ((showActionModal === 'reject' || showActionModal === 'block') && !actionData.reason) {
            showToast('Please provide a reason', 'error');
            return;
        }

        setActionLoading(true);
        try {
            let endpoint = `/admin/product-reviews/${selectedProduct._id}`;
            let payload = {};

            switch (showActionModal) {
                case 'approve':
                    endpoint += '/approve';
                    payload = { notes: actionData.notes, qualityScore: actionData.qualityScore };
                    break;
                case 'reject':
                    endpoint += '/reject';
                    payload = { reason: actionData.reason, notes: actionData.notes };
                    break;
                case 'block':
                    endpoint += '/block';
                    payload = { reason: actionData.reason };
                    break;
                case 'changes':
                    endpoint += '/request-changes';
                    payload = { changes: actionData.reason, notes: actionData.notes };
                    break;
                default:
                    break;
            }

            await api.put(endpoint, payload);
            showToast(`Product ${showActionModal === 'approve' ? 'approved' : showActionModal === 'changes' ? 'changes requested' : showActionModal + 'ed'} successfully!`, 'success');

            setShowActionModal(null);
            setSelectedProduct(null);
            setActionData({ reason: '', notes: '', qualityScore: 80 });
            fetchProducts();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock },
            UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            APPROVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
            REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle },
            BLOCKED: { color: 'bg-red-200 text-red-800', icon: Ban },
            DELISTED: { color: 'bg-gray-200 text-gray-700', icon: AlertTriangle }
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3" />
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Product Reviews</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve seller product listings</p>
                </div>
                <button
                    onClick={() => { fetchProducts(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pending Review</p>
                            <p className="text-xl font-bold text-yellow-600">{stats.pendingReview || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Today's Submissions</p>
                            <p className="text-xl font-bold text-blue-600">{stats.todaySubmissions || 0}</p>
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
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
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
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="BLOCKED">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl py-20 text-center border border-gray-100 dark:border-slate-700">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product._id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-100 dark:bg-slate-700">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-12 w-12 text-gray-300" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge(product.listingStatus)}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-1">{product.name}</h3>

                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Tag className="h-4 w-4" />
                                        <span>{product.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Store className="h-4 w-4" />
                                        <span>{product.seller?.businessName || 'Platform Product'}</span>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-lg font-bold text-slate-800 dark:text-white">
                                        <IndianRupee className="h-4 w-4" />
                                        {product.price}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        Submitted {new Date(product.reviewInfo?.submittedAt || product.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => setSelectedProduct(product)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View
                                    </button>
                                    {product.listingStatus === 'UNDER_REVIEW' && (
                                        <>
                                            <button
                                                onClick={() => { setSelectedProduct(product); setShowActionModal('approve'); }}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => { setSelectedProduct(product); setShowActionModal('reject'); }}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </>
                                    )}
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

            {/* Product Detail Modal */}
            {selectedProduct && !showActionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedProduct.name}</h2>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Images */}
                                <div>
                                    <img
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                    {selectedProduct.images && selectedProduct.images.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2 mt-2">
                                            {selectedProduct.images.slice(0, 4).map((img, idx) => (
                                                <img key={idx} src={img} alt="" className="w-full h-16 object-cover rounded" />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-sm text-gray-500">Category</span>
                                        <p className="font-medium">{selectedProduct.category}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Brand</span>
                                        <p className="font-medium">{selectedProduct.brand}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Price</span>
                                        <p className="font-medium text-lg">₹{selectedProduct.price}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Stock</span>
                                        <p className="font-medium">{selectedProduct.countInStock} units</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Seller</span>
                                        <p className="font-medium">{selectedProduct.seller?.businessName || 'Platform'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <span className="text-sm text-gray-500">Description</span>
                                <p className="mt-1 text-gray-700 dark:text-gray-300">{selectedProduct.description}</p>
                            </div>

                            {/* Rejection Reason if exists */}
                            {selectedProduct.reviewInfo?.rejectionReason && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        <strong>Previous Rejection:</strong> {selectedProduct.reviewInfo.rejectionReason}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedProduct.listingStatus === 'UNDER_REVIEW' && (
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => setShowActionModal('approve')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        Approve Product
                                    </button>
                                    <button
                                        onClick={() => setShowActionModal('changes')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <MessageSquare className="h-5 w-5" />
                                        Request Changes
                                    </button>
                                    <button
                                        onClick={() => setShowActionModal('reject')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <XCircle className="h-5 w-5" />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {isSuperAdmin && selectedProduct.listingStatus === 'APPROVED' && (
                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowActionModal('block')}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <Ban className="h-5 w-5" />
                                        Block Product
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                            {showActionModal === 'approve' && 'Approve Product'}
                            {showActionModal === 'reject' && 'Reject Product'}
                            {showActionModal === 'block' && 'Block Product'}
                            {showActionModal === 'changes' && 'Request Changes'}
                        </h3>

                        <div className="space-y-4">
                            {showActionModal === 'approve' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Quality Score (0-100)</label>
                                    <input
                                        type="number"
                                        value={actionData.qualityScore}
                                        onChange={(e) => setActionData({ ...actionData, qualityScore: Number(e.target.value) })}
                                        min="0"
                                        max="100"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                            )}

                            {(showActionModal === 'reject' || showActionModal === 'block' || showActionModal === 'changes') && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {showActionModal === 'changes' ? 'Required Changes *' : 'Reason *'}
                                    </label>
                                    <textarea
                                        value={actionData.reason}
                                        onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                                        placeholder={
                                            showActionModal === 'changes'
                                                ? "Describe the changes required..."
                                                : "Provide a reason..."
                                        }
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                        rows={3}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                                <textarea
                                    value={actionData.notes}
                                    onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                                    placeholder="Additional notes..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => { setShowActionModal(null); setActionData({ reason: '', notes: '', qualityScore: 80 }); }}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={actionLoading}
                                    className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${showActionModal === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                            showActionModal === 'changes' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                                'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {actionLoading ? 'Processing...' :
                                        showActionModal === 'approve' ? 'Approve' :
                                            showActionModal === 'changes' ? 'Request Changes' :
                                                showActionModal.charAt(0).toUpperCase() + showActionModal.slice(1)
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReviewScreen;
