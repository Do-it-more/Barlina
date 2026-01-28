import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    ShoppingBag,
    Search,
    Filter,
    Eye,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    User,
    MapPin,
    Phone,
    ChevronDown,
    IndianRupee,
    RefreshCw
} from 'lucide-react';

const SellerOrders = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchOrders();
    }, [filters.status, filters.page]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.status) query.append('status', filters.status);
            query.append('page', filters.page);
            query.append('limit', 15);

            const { data } = await api.get(`/sellers/orders?${query.toString()}`);
            setOrders(data.orders);
            setPagination({ page: data.page, pages: data.pages, total: data.total });
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            showToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            Pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            Processing: { color: 'bg-blue-100 text-blue-700', icon: Package },
            Shipped: { color: 'bg-purple-100 text-purple-700', icon: Truck },
            Delivered: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
            Cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle }
        };

        const config = statusConfig[status] || statusConfig.Pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {status}
            </span>
        );
    };

    const calculateOrderTotal = (items) => {
        return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Orders</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage orders containing your products</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl py-20 text-center border border-gray-100 dark:border-slate-700">
                    <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No orders yet</h3>
                    <p className="text-gray-500">Orders containing your products will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden"
                        >
                            {/* Order Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Order ID</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">#{order._id.slice(-8).toUpperCase()}</p>
                                    </div>
                                    <div className="pl-4 border-l border-gray-200 dark:border-slate-600">
                                        <p className="text-sm text-gray-500">Order Date</p>
                                        <p className="font-medium text-slate-700 dark:text-slate-300">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(order.status)}
                                    <button
                                        onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                        {selectedOrder?._id === order._id ? 'Hide' : 'View'}
                                    </button>
                                </div>
                            </div>

                            {/* Order Items (Your products only) */}
                            <div className="p-4">
                                <div className="space-y-3">
                                    {order.orderItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-lg border"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 dark:text-white truncate">{item.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-800 dark:text-white flex items-center">
                                                    <IndianRupee className="h-4 w-4" />
                                                    {item.price * item.qty}
                                                </p>
                                                <p className="text-xs text-gray-500">₹{item.price} × {item.qty}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total for your products */}
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-gray-500">Your products total:</span>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                        <IndianRupee className="h-5 w-5" />
                                        {calculateOrderTotal(order.orderItems)}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {selectedOrder?._id === order._id && (
                                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Customer Info */}
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                                <User className="h-4 w-4 text-indigo-600" />
                                                Customer Info
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    <strong>Name:</strong> {order.user?.name || 'N/A'}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    <strong>Email:</strong> {order.user?.email || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Shipping Address */}
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-indigo-600" />
                                                Shipping Address
                                            </h4>
                                            {order.shippingAddress ? (
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    <p>{order.shippingAddress.street}</p>
                                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                                    <p>{order.shippingAddress.postalCode}</p>
                                                    <p className="flex items-center gap-1 mt-1">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {order.shippingAddress.phone || 'N/A'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No address provided</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Payment Method:</span>
                                                <span className="ml-2 font-medium">{order.paymentMethod || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Payment Status:</span>
                                                <span className={`ml-2 font-medium ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {order.isPaid ? 'Paid' : 'Pending'}
                                                </span>
                                            </div>
                                            {order.paidAt && (
                                                <div>
                                                    <span className="text-gray-500">Paid At:</span>
                                                    <span className="ml-2 font-medium">
                                                        {new Date(order.paidAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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

export default SellerOrders;
