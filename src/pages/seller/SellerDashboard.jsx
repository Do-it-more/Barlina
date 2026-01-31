import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    LayoutDashboard,
    ShoppingBag,
    ArrowUpRight,
    Wallet,
    AlertTriangle,
    CheckCircle,
    Package,
    Clock,
    XCircle,
    TrendingUp,
    Star,
    AlertCircle,
    Bell,
    FileCheck,
    Ban,
    Shield,
    Sparkles,
    ArrowRight,
    Eye,
    BarChart2,
    IndianRupee,
    Box,
    Truck,
    RefreshCw,
    Info,
    Lock,
    ChevronRight,
    MessageSquare
} from 'lucide-react';

const SellerDashboard = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/sellers/dashboard/stats');
                setStats(data);

                // Set notifications from API response
                if (data.notifications) {
                    setNotifications(data.notifications);
                }
            } catch (error) {
                console.error("Failed to fetch seller stats", error);
                if (error.response?.status === 404) {
                    // No seller profile, redirect to registration
                    navigate('/seller/register');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [navigate]);

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading dashboard...</p>
            </div>
        </div>
    );

    const isApproved = stats?.profileStatus === 'APPROVED';
    const isPending = ['PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(stats?.profileStatus);
    const isRejected = stats?.profileStatus === 'REJECTED';
    const isSuspended = stats?.profileStatus === 'SUSPENDED';
    const isDraft = stats?.profileStatus === 'DRAFT';

    // Status color mapping
    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-emerald-400 bg-emerald-500/20';
            case 'PENDING_VERIFICATION':
            case 'UNDER_REVIEW': return 'text-amber-400 bg-amber-500/20';
            case 'REJECTED': return 'text-red-400 bg-red-500/20';
            case 'SUSPENDED': return 'text-orange-400 bg-orange-500/20';
            case 'BLOCKED': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return CheckCircle;
            case 'PENDING_VERIFICATION':
            case 'UNDER_REVIEW': return Clock;
            case 'REJECTED': return XCircle;
            case 'SUSPENDED': return Ban;
            case 'BLOCKED': return Lock;
            default: return AlertCircle;
        }
    };

    const StatusIcon = getStatusIcon(stats?.profileStatus);

    return (
        <div className="space-y-6">
            {/* Header with Status Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 shadow-xl">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full filter blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-yellow-300" />
                            Seller Dashboard
                        </h1>
                        <p className="text-white/80 mt-1">Welcome back! Here's your business overview</p>
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(stats?.profileStatus)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium text-sm">
                            {stats?.profileStatus?.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Admin Message Banner */}
            {stats?.adminNotes && (
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 flex items-start gap-4 mx-1">
                    <div className="p-2 bg-blue-600/20 rounded-lg shrink-0">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-500 mb-1">Message from Admin</h3>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{stats.adminNotes}</p>
                    </div>
                </div>
            )}


            {/* Pending/Rejected/Suspended Status Alert */}
            {
                !isApproved && (
                    <div className={`rounded-xl p-5 border ${isPending ? 'bg-amber-500/10 border-amber-500/30' :
                        isRejected ? 'bg-red-500/10 border-red-500/30' :
                            isSuspended ? 'bg-orange-500/10 border-orange-500/30' :
                                'bg-blue-500/10 border-blue-500/30'
                        }`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${isPending ? 'bg-amber-500/20' :
                                isRejected ? 'bg-red-500/20' :
                                    isSuspended ? 'bg-orange-500/20' :
                                        'bg-blue-500/20'
                                }`}>
                                {isPending && <Clock className="h-6 w-6 text-amber-400" />}
                                {isRejected && <XCircle className="h-6 w-6 text-red-400" />}
                                {isSuspended && <Ban className="h-6 w-6 text-orange-400" />}
                                {isDraft && <AlertCircle className="h-6 w-6 text-blue-400" />}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold ${isPending ? 'text-amber-400' :
                                    isRejected ? 'text-red-400' :
                                        isSuspended ? 'text-orange-400' :
                                            'text-blue-400'
                                    }`}>
                                    {isPending && 'Application Under Review'}
                                    {isRejected && 'Application Rejected'}
                                    {isSuspended && 'Account Suspended'}
                                    {isDraft && 'Complete Your Profile'}
                                </h3>
                                <p className="text-gray-300 text-sm mt-1">
                                    {isPending && 'Your seller application is being reviewed by our team. This typically takes 2-3 business days. You will receive an email notification once approved.'}
                                    {isRejected && 'Unfortunately, your application was rejected. Please check the rejection reason below and reapply with updated information.'}
                                    {isSuspended && 'Your account has been suspended. Please contact support for more information.'}
                                    {isDraft && 'Your seller profile is incomplete. Please complete all steps to submit for review.'}
                                </p>
                                {isDraft && (
                                    <Link
                                        to="/seller/onboarding"
                                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Complete Setup <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Restrictions Notice */}
                        {!isApproved && !isDraft && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    <strong>Restricted Actions:</strong> You cannot add products or receive orders until your account is approved.
                                </p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Products Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                            <Package className="h-5 w-5 text-blue-400" />
                        </div>
                        {isApproved && (
                            <Link to="/seller/products" className="text-xs text-gray-400 hover:text-violet-400 flex items-center gap-1">
                                View <ChevronRight className="h-3 w-3" />
                            </Link>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">Total Products</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats?.productsCount || 0}</p>
                    {stats?.liveProductsCount > 0 && (
                        <p className="text-xs text-emerald-400 mt-1">{stats.liveProductsCount} Live</p>
                    )}
                </div>

                {/* Orders Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                            <ShoppingBag className="h-5 w-5 text-purple-400" />
                        </div>
                        {isApproved && (
                            <Link to="/seller/orders" className="text-xs text-gray-400 hover:text-violet-400 flex items-center gap-1">
                                View <ChevronRight className="h-3 w-3" />
                            </Link>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats?.ordersCount || 0}</p>
                </div>

                {/* Revenue Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                            <IndianRupee className="h-5 w-5 text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">₹{(stats?.revenue || 0).toLocaleString()}</p>
                </div>

                {/* Commission Rate Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 bg-pink-500/20 rounded-xl group-hover:scale-110 transition-transform">
                            <BarChart2 className="h-5 w-5 text-pink-400" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Commission Rate</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats?.commissionRate || 10}%</p>
                    <p className="text-xs text-gray-500 mt-1">Platform fee</p>
                </div>
            </div>

            {/* Product Status Breakdown (For Approved Sellers) */}
            {
                isApproved && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Live Products</p>
                                    <p className="text-lg font-bold text-white">{stats?.liveProductsCount || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Clock className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Pending Review</p>
                                    <p className="text-lg font-bold text-white">{stats?.pendingProductsCount || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Star className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Avg Rating</p>
                                    <p className="text-lg font-bold text-white">{stats?.rating?.toFixed(1) || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stats?.payoutStatus === 'ACTIVE' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                    }`}>
                                    <Wallet className={`h-4 w-4 ${stats?.payoutStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'
                                        }`} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Payout Status</p>
                                    <p className={`text-sm font-bold ${stats?.payoutStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {stats?.payoutStatus || 'PENDING'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Notifications */}
            {
                notifications.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Bell className="h-5 w-5 text-violet-400" />
                                Notifications
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-700/50">
                            {notifications.slice(0, 5).map((notification, index) => (
                                <div key={index} className="p-4 hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded-lg ${notification.type === 'warning' ? 'bg-amber-500/20' :
                                            notification.type === 'error' ? 'bg-red-500/20' :
                                                notification.type === 'success' ? 'bg-emerald-500/20' :
                                                    'bg-blue-500/20'
                                            }`}>
                                            {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                                            {notification.type === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
                                            {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                                            {notification.type === 'info' && <Info className="h-4 w-4 text-blue-400" />}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white">{notification.message}</p>
                                            {notification.action && (
                                                <Link
                                                    to={notification.action.url}
                                                    className="text-xs text-violet-400 hover:underline mt-1 inline-block"
                                                >
                                                    {notification.action.label} →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* CTA Section */}
            {
                isApproved && stats?.productsCount === 0 && (
                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white rounded-full filter blur-3xl" />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <Package className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Ready to Start Selling?</h2>
                            <p className="opacity-90 mb-6 max-w-2xl mx-auto">
                                Your account is approved! Add your first product to reach millions of customers.
                            </p>
                            <Link
                                to="/seller/products/add"
                                className="inline-flex items-center gap-2 bg-white text-violet-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-md"
                            >
                                <Package className="h-5 w-5" />
                                Add Your First Product
                            </Link>
                        </div>
                    </div>
                )
            }

            {/* Quick Actions */}
            {
                isApproved && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link
                            to="/seller/products/add"
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-700/50 transition-all group text-center"
                        >
                            <div className="p-3 bg-violet-500/20 rounded-xl inline-flex mb-2 group-hover:scale-110 transition-transform">
                                <Package className="h-5 w-5 text-violet-400" />
                            </div>
                            <p className="text-sm font-medium text-white">Add Product</p>
                        </Link>
                        <Link
                            to="/seller/products"
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-700/50 transition-all group text-center"
                        >
                            <div className="p-3 bg-blue-500/20 rounded-xl inline-flex mb-2 group-hover:scale-110 transition-transform">
                                <Box className="h-5 w-5 text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-white">My Products</p>
                        </Link>
                        <Link
                            to="/seller/orders"
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-700/50 transition-all group text-center"
                        >
                            <div className="p-3 bg-emerald-500/20 rounded-xl inline-flex mb-2 group-hover:scale-110 transition-transform">
                                <Truck className="h-5 w-5 text-emerald-400" />
                            </div>
                            <p className="text-sm font-medium text-white">Orders</p>
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-700/50 transition-all group text-center"
                        >
                            <div className="p-3 bg-pink-500/20 rounded-xl inline-flex mb-2 group-hover:scale-110 transition-transform">
                                <RefreshCw className="h-5 w-5 text-pink-400" />
                            </div>
                            <p className="text-sm font-medium text-white">Refresh</p>
                        </button>
                    </div>
                )
            }

            {/* Help Section */}
            <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                    <Info className="h-5 w-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Need Help?</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                    If you have any questions about your seller account, products, or orders, our support team is here to help.
                </p>
                <a
                    href="mailto:support@barlinafashion.com"
                    className="text-sm text-violet-400 hover:underline"
                >
                    Contact Seller Support →
                </a>
            </div>
        </div >
    );
};

export default SellerDashboard;
