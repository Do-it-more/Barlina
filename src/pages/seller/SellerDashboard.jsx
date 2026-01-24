import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    LayoutDashboard,
    ShoppingBag,
    ArrowUpRight,
    Wallet,
    AlertTriangle,
    CheckCircle,
    Package
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SellerDashboard = () => {
    const { showToast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/sellers/dashboard/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch seller stats", error);
                // toast.error("Failed to load dashboard data"); 
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const isVerified = stats?.profileStatus === 'VERIFIED';
    const isKycPending = stats?.kycStatus === 'PENDING' || stats?.kycStatus === 'SUBMITTED';

    return (
        <div className="space-y-6">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Seller Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Overview of your business performance</p>
                </div>
                {!isVerified && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg text-sm border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                            {stats?.profileStatus === 'DRAFT' ? 'Complete your profile setup to start selling.' :
                                stats?.profileStatus === 'KYC_PENDING' ? 'KYC Verification is pending.' : 'Account status: ' + stats?.profileStatus}
                        </span>
                        <Link to="/seller/kyc" className="underline font-semibold ml-1">Check Status</Link>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Product Independence: Show 0 if no products */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Package className="h-6 w-6" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Products</h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats?.productsCount || 0}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Orders</h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats?.ordersCount || 0}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            <Wallet className="h-6 w-6" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue</h3>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">₹{stats?.revenue || 0}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Profile Status</h3>
                    <p className={`text-lg font-bold mt-1 ${isVerified ? 'text-green-600' : 'text-orange-500'}`}>
                        {stats?.profileStatus?.replace('_', ' ')}
                    </p>
                </div>
            </div>

            {/* CTA Section (If 0 products) */}
            {stats?.productsCount === 0 && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">Ready to start selling?</h2>
                    <p className="opacity-90 mb-6 max-w-2xl mx-auto">Your account is ready. Add your first product catalog to reach millions of customers.</p>
                    {isVerified ? (
                        <Link to="/seller/products/add" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-md">
                            <Package className="h-5 w-5" />
                            Add Your First Product
                        </Link>
                    ) : (
                        <div className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full font-bold cursor-not-allowed">
                            <AlertTriangle className="h-5 w-5" />
                            Complete Verification First
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
