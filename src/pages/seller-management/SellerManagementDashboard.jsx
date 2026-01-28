import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    Store,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    TrendingUp,
    Users,
    FileCheck,
    ArrowRight,
    Eye,
    ShoppingBag,
    DollarSign,
    BarChart3
} from 'lucide-react';

const SellerManagementDashboard = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [sellerStats, setSellerStats] = useState({});
    const [productStats, setProductStats] = useState({});
    const [pendingSellers, setPendingSellers] = useState([]);
    const [pendingProducts, setPendingProducts] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [sellerStatsRes, productStatsRes, pendingSellersRes, pendingProductsRes] = await Promise.all([
                api.get('/admin/sellers/stats'),
                api.get('/admin/product-reviews/stats'),
                api.get('/admin/sellers?status=PENDING_VERIFICATION&limit=5'),
                api.get('/admin/product-reviews?status=UNDER_REVIEW&limit=5')
            ]);

            setSellerStats(sellerStatsRes.data);
            setProductStats(productStatsRes.data);
            setPendingSellers(pendingSellersRes.data.sellers || []);
            setPendingProducts(pendingProductsRes.data.products || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            const message = error.response?.data?.message || 'Failed to load dashboard data';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seller Management Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage seller applications, approvals, and product listings</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Pending Sellers */}
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium">Pending Sellers</p>
                            <p className="text-3xl font-bold mt-1">{sellerStats.pendingApprovals || 0}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                    <Link to="/seller-management/sellers" className="flex items-center gap-1 mt-4 text-sm text-white/80 hover:text-white transition-colors">
                        Review Now <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Pending Products */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium">Pending Products</p>
                            <p className="text-3xl font-bold mt-1">{productStats.pendingReview || 0}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <FileCheck className="h-6 w-6" />
                        </div>
                    </div>
                    <Link to="/seller-management/product-reviews" className="flex items-center gap-1 mt-4 text-sm text-white/80 hover:text-white transition-colors">
                        Review Now <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Approved Sellers */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Sellers</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{sellerStats.byStatus?.APPROVED || 0}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Total Products */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Live Products</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-1">{productStats.byStatus?.APPROVED || 0}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Package className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500">Total Sellers</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{sellerStats.total || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                            <p className="text-xs text-gray-500">Rejected</p>
                            <p className="text-lg font-bold text-red-600">{sellerStats.byStatus?.REJECTED || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                            <p className="text-xs text-gray-500">Suspended</p>
                            <p className="text-lg font-bold text-orange-600">{sellerStats.byStatus?.SUSPENDED || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="text-xs text-gray-500">Today's Submissions</p>
                            <p className="text-lg font-bold text-blue-600">{productStats.todaySubmissions || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Seller Applications */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Store className="h-5 w-5 text-orange-500" />
                            Pending Seller Applications
                        </h3>
                        <Link to="/seller-management/sellers" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                            View All →
                        </Link>
                    </div>
                    {pendingSellers.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                            <p className="text-gray-500">No pending applications!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {pendingSellers.map((seller) => (
                                <Link
                                    key={seller._id}
                                    to={`/seller-management/sellers/${seller._id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold">
                                        {seller.businessName?.charAt(0) || 'S'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-white truncate">{seller.businessName}</p>
                                        <p className="text-xs text-gray-500">{seller.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                            Pending
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(seller.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Product Reviews */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-purple-500" />
                            Products Awaiting Review
                        </h3>
                        <Link to="/seller-management/product-reviews" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                            View All →
                        </Link>
                    </div>
                    {pendingProducts.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                            <p className="text-gray-500">No products pending review!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {pendingProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-700 overflow-hidden">
                                        {product.image ? (
                                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-white truncate">{product.name}</p>
                                        <p className="text-xs text-gray-500">by {product.seller?.businessName || 'Unknown'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-800 dark:text-white">₹{product.price}</p>
                                        <p className="text-xs text-gray-500">{product.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SellerManagementDashboard;
