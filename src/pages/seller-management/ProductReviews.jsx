
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
    Package,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Ban,
    RefreshCw,
    Eye,
    IndianRupee,
    Store,
    MessageSquare,
    X,
    Tag,
    Image as ImageIcon,
    Trash2
} from 'lucide-react';

const ProductReviews = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const location = useLocation();

    const isAllProductsView = location.pathname.includes('all-products');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [filters, setFilters] = useState({
        status: isAllProductsView ? 'all' : 'UNDER_REVIEW',
        category: '',
        search: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [categories, setCategories] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            status: location.pathname.includes('all-products') ? 'all' : 'UNDER_REVIEW',
            page: 1
        }));
    }, [location.pathname]);

    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [previewImage, setPreviewImage] = useState(null); // Add state for image preview

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchProducts();
        fetchStats();
    }, [filters.status, filters.page]);

    useEffect(() => {
        setPreviewImage(null);
    }, [selectedProduct]);

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
            setProducts(data.products || []);
            setPagination({ page: data.page, pages: data.pages, total: data.total });
        } catch (error) {
            console.error('Failed to fetch products:', error);
            const message = error.response?.data?.message || 'Failed to load products';
            showToast(message, 'error');
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

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const handleSelectItem = (productId) => {
        setSelectedItems(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedItems.length === products.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(products.map(p => p._id));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleApprove = async (productId) => {
        if (actionLoading) return; // Prevent double execution
        setActionLoading(true);
        try {
            await api.put(`/admin/product-reviews/${productId}/approve`, {});
            showToast('Product approved!', 'success');
            fetchProducts();
            fetchStats();
            setSelectedProduct(null);
        } catch (error) {
            const message = error.response?.data?.message || 'Approval failed';
            // If the product is no longer under review, it might have been approved by someone else 
            // or by a double-click race condition. We'll treat it as "done".
            if (message.includes('Only products under review')) {
                showToast('Product is no longer pending review', 'info');
                setSelectedProduct(null);
                fetchProducts();
                fetchStats();
            } else {
                showToast(message, 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            showToast('Please provide a reason', 'error');
            return;
        }
        setActionLoading(true);
        try {
            await api.put(`/admin/product-reviews/${showRejectModal}/reject`, { reason: rejectReason });
            showToast('Product rejected', 'success');
            setShowRejectModal(null);
            setRejectReason('');
            fetchProducts();
            fetchStats();
            setSelectedProduct(null);
        } catch (error) {
            showToast(error.response?.data?.message || 'Rejection failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkApprove = async () => {
        if (!window.confirm(`Approve ${selectedItems.length} selected products?`)) return;
        setActionLoading(true);
        try {
            await Promise.all(selectedItems.map(id => api.put(`/admin/product-reviews/${id}/approve`, {})));
            showToast(`${selectedItems.length} products approved successfully`, 'success');
            setSelectedItems([]);
            fetchProducts();
            fetchStats();
        } catch (error) {
            console.error(error);
            showToast('Some approvals might have failed', 'error');
            fetchProducts();
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkReject = () => {
        setShowBulkRejectModal(true);
        setRejectReason('');
    };

    const confirmBulkReject = async () => {
        if (!rejectReason.trim()) {
            showToast('Please provide a reason', 'error');
            return;
        }

        setActionLoading(true);
        try {
            await Promise.all(selectedItems.map(id => api.put(`/admin/product-reviews/${id}/reject`, { reason: rejectReason })));
            showToast(`${selectedItems.length} products rejected`, 'success');
            setSelectedItems([]);
            fetchProducts();
            fetchStats();
            setShowBulkRejectModal(false);
            setRejectReason('');
        } catch (error) {
            console.error(error);
            showToast('Some rejections might have failed', 'error');
            fetchProducts();
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlock = async (productId) => {
        if (!window.confirm('Block this product permanently?')) return;
        try {
            await api.put(`/admin/product-reviews/${productId}/block`, { reason: 'Policy violation' });
            showToast('Product blocked', 'success');
            fetchProducts();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Block failed', 'error');
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this product? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            await api.delete(`/products/${productId}`);
            showToast('Product deleted permanently', 'success');
            fetchProducts();
            fetchStats();
            setSelectedProduct(null);
        } catch (error) {
            showToast(error.response?.data?.message || 'Delete failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
            UNDER_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
            BLOCKED: { bg: 'bg-red-200', text: 'text-red-800', icon: Ban }
        };
        const c = config[status] || config.DRAFT;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isAllProductsView ? 'All Products Catalog' : 'Product Reviews'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {isAllProductsView ? 'Manage and monitor all seller products' : 'Review and approve seller product listings'}
                    </p>
                </div>
                <button
                    onClick={() => { fetchProducts(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-900/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-700 dark:text-yellow-400 text-sm">Pending Review</p>
                            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{stats.pendingReview || 0}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-700 dark:text-green-400 text-sm">Approved</p>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{stats.byStatus?.APPROVED || 0}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-700 dark:text-red-400 text-sm">Rejected</p>
                            <p className="text-2xl font-bold text-red-800 dark:text-red-300">{stats.byStatus?.REJECTED || 0}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-700 dark:text-indigo-400 text-sm">Today's Submissions</p>
                            <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">{stats.todaySubmissions || 0}</p>
                        </div>
                        <Package className="h-8 w-8 text-indigo-500" />
                    </div>
                </div>
            </div>

            {/* Filters / Bulk Actions */}
            {selectedItems.length > 0 ? (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 mr-4 border-r border-purple-200 dark:border-purple-700 pr-4">
                            <input
                                type="checkbox"
                                checked={true}
                                onChange={handleSelectAll}
                                className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-bold text-purple-700 dark:text-purple-300">
                                {selectedItems.length} Selected
                            </span>
                        </div>
                        <span className="text-sm text-purple-600 dark:text-purple-400">
                            Apply actions to all selected items
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedItems([])}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkReject}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject All
                        </button>
                        <button
                            onClick={handleBulkApprove}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Approve All
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Select All Checkbox */}
                        <div className="flex items-center gap-2 mr-2 border-r pr-4 border-gray-200 dark:border-slate-700">
                            <input
                                type="checkbox"
                                checked={products.length > 0 && selectedItems.length === products.length}
                                onChange={handleSelectAll}
                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select All
                            </span>
                        </div>

                        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </form>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="all">All Status</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="BLOCKED">Blocked</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                            className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl py-20 text-center border border-gray-100 dark:border-slate-700">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all"
                        >
                            {/* Product Image */}
                            <div className="relative h-40 bg-gray-100 dark:bg-slate-700 group/image">
                                {/* Selection Checkbox */}
                                <div className="absolute top-2 left-2 z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(product._id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleSelectItem(product._id);
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 shadow-sm"
                                    />
                                </div>
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-10 w-10 text-gray-300" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    {getStatusBadge(product.listingStatus)}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-1">{product.name}</h3>

                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                    <Store className="h-4 w-4" />
                                    <span className="truncate">{product.seller?.businessName || 'Unknown Seller'}</span>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1 text-lg font-bold text-slate-800 dark:text-white">
                                            <IndianRupee className="h-4 w-4" />
                                            {product.discountPrice > 0 && product.discountPrice < product.price
                                                ? product.discountPrice
                                                : product.price}
                                        </div>
                                        {product.discountPrice > 0 && product.discountPrice < product.price && (
                                            <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {product.category}
                                    </span>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 mt-4">
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
                                                onClick={() => handleApprove(product._id)}
                                                disabled={actionLoading}
                                                className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(product._id)}
                                                className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                    {isSuperAdmin && product.listingStatus === 'REJECTED' && (
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 className="h-4 w-4" />
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
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                        disabled={filters.page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                        disabled={filters.page >= pagination.pages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
                            <h3 className="font-bold text-lg">Product Details</h3>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">

                            {/* Images */}
                            <div className="space-y-2">
                                <div className="h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                                    {(previewImage || selectedProduct.image) ? (
                                        <img
                                            src={previewImage || selectedProduct.image}
                                            alt="Main"
                                            className="w-full h-full object-contain transition-all duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                {/* Additional Images */}
                                {((selectedProduct.images && selectedProduct.images.length > 0) || selectedProduct.image) && (
                                    <div className="grid grid-cols-5 gap-2">
                                        {/* Main Image Thumbnail */}
                                        {selectedProduct.image && (
                                            <button
                                                onClick={() => setPreviewImage(selectedProduct.image)}
                                                className={`h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-slate-700 border-2 transition-all ${(previewImage === selectedProduct.image || (!previewImage && true))
                                                    ? 'border-purple-500'
                                                    : 'border-transparent hover:border-gray-300 dark:hover:border-slate-500'
                                                    }`}
                                            >
                                                <img src={selectedProduct.image} alt="Main Thumbnail" className="w-full h-full object-cover" />
                                            </button>
                                        )}
                                        {/* Additional Images Thumbnails */}
                                        {selectedProduct.images && selectedProduct.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPreviewImage(img)}
                                                className={`h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-slate-700 border-2 transition-all ${previewImage === img ? 'border-purple-500' : 'border-transparent hover:border-gray-300 dark:hover:border-slate-500'
                                                    }`}
                                            >
                                                <img src={img} alt={`Additional ${idx}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedProduct.name}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    {getStatusBadge(selectedProduct.listingStatus)}
                                    <span className="text-sm text-gray-500">by {selectedProduct.seller?.businessName}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Price</p>
                                    <div className="flex items-baseline gap-2">
                                        {selectedProduct.discountPrice > 0 && selectedProduct.discountPrice < selectedProduct.price ? (
                                            <>
                                                <span className="text-xl font-bold">₹{selectedProduct.discountPrice}</span>
                                                <span className="text-sm text-gray-400 line-through">
                                                    ₹{selectedProduct.price}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xl font-bold">₹{selectedProduct.price}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium">{selectedProduct.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Stock</p>
                                    <p className="font-medium">{selectedProduct.countInStock}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Brand</p>
                                    <p className="font-medium">{selectedProduct.brand}</p>
                                </div>
                            </div>

                            {/* Colors */}
                            {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Available Colors</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProduct.colors.map((color, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-sm">
                                                {color}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Description</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedProduct.description}</p>
                            </div>

                            {/* Delivery & Returns */}
                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                                <h4 className="font-semibold text-sm text-slate-800 dark:text-white">Delivery & Returns</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Delivery</p>
                                        <p className="font-medium text-sm">{selectedProduct.estimatedDeliveryDays || 7} Days</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Return Window</p>
                                        <p className="font-medium text-sm">{selectedProduct.returnPolicy?.returnWindowDays || 7} Days</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Return Type</p>
                                        <p className="font-medium text-sm">{selectedProduct.returnPolicy?.returnType || 'REFUND'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-2 border-t border-gray-200 dark:border-slate-600">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selectedProduct.isCodAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm">COD {selectedProduct.isCodAvailable ? 'Available' : 'Unavailable'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selectedProduct.returnPolicy?.isReturnable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm">{selectedProduct.returnPolicy?.isReturnable ? 'Returnable' : 'Non-returnable'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedProduct.listingStatus === 'UNDER_REVIEW' && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => handleApprove(selectedProduct._id)}
                                        disabled={actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        Approve Product
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(selectedProduct._id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                                    >
                                        <XCircle className="h-5 w-5" />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {isSuperAdmin && (
                                <div className="space-y-3 pt-4 border-t">
                                    {selectedProduct.listingStatus === 'APPROVED' && (
                                        <button
                                            onClick={() => handleBlock(selectedProduct._id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200 rounded-lg font-medium"
                                        >
                                            <Ban className="h-5 w-5" />
                                            Block Product
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(selectedProduct._id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg font-medium"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                        Delete Permanently
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="font-bold text-lg mb-4">Reject Product</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain why this product is being rejected..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-slate-700 dark:border-slate-600"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading || !rejectReason.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    {actionLoading ? 'Rejecting...' : 'Reject Product'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Bulk Reject Modal */}
            {showBulkRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Reject {selectedItems.length} Products</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Rejection Reason for All *</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain why these products are being rejected..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    rows={3}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => { setShowBulkRejectModal(false); setRejectReason(''); }}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBulkReject}
                                    disabled={actionLoading || !rejectReason.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {actionLoading ? 'Rejecting...' : 'Reject All'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReviews;
