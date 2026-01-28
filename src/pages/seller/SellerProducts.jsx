import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    Package,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    MoreVertical,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Image as ImageIcon,
    Tag,
    IndianRupee
} from 'lucide-react';

const SellerProducts = () => {
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showDeleteModal, setShowDeleteModal] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [filters.status, filters.page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.status) query.append('status', filters.status);
            if (filters.search) query.append('search', filters.search);
            query.append('page', filters.page);
            query.append('limit', 12);

            const { data } = await api.get(`/sellers/products?${query.toString()}`);
            setProducts(data.products);
            setPagination({ page: data.page, pages: data.pages, total: data.total });
        } catch (error) {
            console.error('Failed to fetch products:', error);
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleDelete = (productId) => {
        setShowDeleteModal(productId);
    };

    const confirmDelete = async () => {
        if (!showDeleteModal) return;
        try {
            await api.delete(`/sellers/products/${showDeleteModal}`);
            showToast('Product deleted successfully', 'success');
            fetchProducts();
            setShowDeleteModal(null);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleSubmitForReview = async (productId) => {
        try {
            await api.post(`/sellers/products/${productId}/submit`);
            showToast('Product submitted for review!', 'success');
            fetchProducts();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to submit', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock, label: 'Draft' },
            UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Under Review' },
            APPROVED: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Live' },
            REJECTED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Rejected' },
            BLOCKED: { color: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: AlertTriangle, label: 'Blocked' }
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Products</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your product catalog</p>
                </div>
                <Link
                    to="/seller/products/add"
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Product
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{pagination.total}</p>
                    <p className="text-sm text-gray-500">Total Products</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <p className="text-2xl font-bold text-green-600">{products.filter(p => p.listingStatus === 'APPROVED').length}</p>
                    <p className="text-sm text-gray-500">Live</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <p className="text-2xl font-bold text-yellow-600">{products.filter(p => p.listingStatus === 'UNDER_REVIEW').length}</p>
                    <p className="text-sm text-gray-500">Under Review</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <p className="text-2xl font-bold text-gray-600">{products.filter(p => p.listingStatus === 'DRAFT').length}</p>
                    <p className="text-sm text-gray-500">Drafts</p>
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
                        <option value="DRAFT">Draft</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="APPROVED">Live</option>
                        <option value="REJECTED">Rejected</option>
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
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-6">Start adding products to your catalog</p>
                    <Link
                        to="/seller/products/add"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Add Your First Product
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product._id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden group hover:shadow-lg transition-shadow">
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

                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                    <Tag className="h-4 w-4" />
                                    <span>{product.category}</span>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
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
                                    <span className="text-xs text-gray-500">
                                        Stock: {product.countInStock}
                                    </span>
                                </div>

                                {/* Rejection Reason */}
                                {product.listingStatus === 'REJECTED' && product.reviewInfo?.rejectionReason && (
                                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <p className="text-xs text-red-700 dark:text-red-400 line-clamp-2">
                                            <strong>Rejected:</strong> {product.reviewInfo.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-4 flex gap-2">
                                    {product.listingStatus === 'DRAFT' && (
                                        <button
                                            onClick={() => handleSubmitForReview(product._id)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Submit for Review
                                        </button>
                                    )}
                                    {product.listingStatus === 'REJECTED' && (
                                        <Link
                                            to={`/seller/products/${product._id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit & Resubmit
                                        </Link>
                                    )}
                                    {['DRAFT', 'REJECTED', 'APPROVED'].includes(product.listingStatus) && (
                                        <Link
                                            to={`/seller/products/${product._id}/edit`}
                                            className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${product.listingStatus === 'APPROVED'
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                                : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                                                }`}
                                            title={product.listingStatus === 'APPROVED' ? "Edit Price & Stock" : "Edit Product"}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    )}
                                    {product.listingStatus === 'APPROVED' && (
                                        <div className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                                            <CheckCircle className="h-4 w-4" />
                                            Live on Store
                                        </div>
                                    )}
                                    {product.listingStatus === 'UNDER_REVIEW' && (
                                        <div className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium">
                                            <Clock className="h-4 w-4" />
                                            Pending Review
                                        </div>
                                    )}
                                    <div className="flex-1"></div> {/* Spacer */}

                                    <button
                                        onClick={() => handleDelete(product._id)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors ml-2"
                                        title="Delete Product"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            {/* Pagination */}
            {
                pagination.pages > 1 && (
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
                )
            }
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Delete this product?</h3>
                        <p className="text-gray-500 mb-6 text-sm dark:text-gray-400">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30"
                            >
                                Delete Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default SellerProducts;
