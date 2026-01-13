import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, Truck, CheckCircle, Clock, Search, FileText, CheckSquare, Square, RotateCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const OrderListScreen = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInvoice, setSearchInvoice] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Bulk Actions State
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Check for invoice query param to auto-search
        const params = new URLSearchParams(window.location.search);
        const invoiceQuery = params.get('invoice');
        if (invoiceQuery) {
            setSearchInvoice(invoiceQuery);
            // Trigger search immediately
            const searchOrder = async () => {
                setSearchLoading(true);
                try {
                    const { data } = await api.get(`/orders/invoice/${encodeURIComponent(invoiceQuery)}`);
                    window.location.href = `/admin/orders/${data._id}`;
                } catch (error) {
                    setSearchError('Order not found from link');
                } finally {
                    setSearchLoading(false);
                }
            };
            searchOrder();
        }
    }, []);

    const handleInvoiceSearch = async (e) => {
        e.preventDefault();
        const term = searchInvoice.trim().replace(/^#/, ''); // Fix: Remove leading '#' if user copy-pasted with it
        if (!term) return;

        setSearchLoading(true);
        setSearchError('');
        try {
            const { data } = await api.get(`/orders/invoice/${encodeURIComponent(term)}`);
            // If found, redirect to order detail
            window.location.href = `/admin/orders/${data._id}`;
        } catch (error) {
            setSearchError(error.response?.data?.message || 'Order not found');
        } finally {
            setSearchLoading(false);
        }
    };

    const markAsDelivered = async (id) => {
        try {
            await api.put(`/orders/${id}/deliver`);
            fetchOrders();
            showToast("Order marked as delivered", "success");
        } catch (error) {
            showToast("Failed to update status", "error");
        }
    };

    const toggleSelectOrder = (id) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const handleBulkStatusUpdate = async (status) => {
        if (!window.confirm(`Update ${selectedOrders.length} orders to ${status}?`)) return;

        setBulkActionLoading(true);
        try {
            await api.post('/orders/bulk-status', {
                orderIds: selectedOrders,
                status: status
            });
            showToast(`Batch updated to ${status}`, "success");
            setSelectedOrders([]);
            fetchOrders();
        } catch (error) {
            showToast(error.response?.data?.message || "Bulk update failed", "error");
        } finally {
            setBulkActionLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'unpaid') return !order.isPaid && !order.isCancelled && order.paymentMethod !== 'COD';
        // Ready to Ship: Paid OR COD, and not delivered/cancelled
        if (filterStatus === 'toship') {
            return ['READY_TO_SHIP', 'PAID'].includes(order.status) || (order.paymentMethod === 'COD' && order.status === 'CREATED');
        }
        if (filterStatus === 'shipped') return order.status === 'SHIPPED';
        if (filterStatus === 'delivered') return order.status === 'DELIVERED' || order.isDelivered;
        if (filterStatus === 'cancelled') return order.status === 'CANCELLED' || order.isCancelled;
        if (filterStatus === 'returned') return order.status === 'RETURNED';
        return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getCount = (status) => {
        if (status === 'all') return orders.length;
        return orders.filter(order => {
            if (status === 'unpaid') return !order.isPaid && !order.isCancelled && order.paymentMethod !== 'COD';
            if (status === 'toship') {
                return ['READY_TO_SHIP', 'PAID'].includes(order.status) || (order.paymentMethod === 'COD' && order.status === 'CREATED');
            }
            if (status === 'shipped') return order.status === 'SHIPPED';
            if (status === 'delivered') return order.status === 'DELIVERED' || order.isDelivered;
            if (status === 'cancelled') return order.status === 'CANCELLED' || order.isCancelled;
            if (status === 'returned') return order.status === 'RETURNED';
            return false;
        }).length;
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setFilterStatus(id)}
            className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap
                ${filterStatus === id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700'
                }
            `}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
            <span className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${filterStatus === id
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                }`}>
                {getCount(id)}
            </span>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Order Management</h1>

                {/* Invoice Quick Lookup */}
                <form onSubmit={handleInvoiceSearch} className="relative w-full md:w-96 group">
                    <input
                        type="text"
                        value={searchInvoice}
                        onChange={(e) => setSearchInvoice(e.target.value)}
                        placeholder="Search Invoice #"
                        className={`w-full pl-12 pr-24 py-3 bg-white dark:bg-slate-800 border ${searchError ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white`}
                    />
                    <FileText className={`absolute left-4 top-3.5 h-5 w-5 ${searchError ? 'text-red-500' : 'text-gray-400 group-focus-within:text-indigo-500 transition-colors'}`} />
                    <button
                        type="submit"
                        disabled={searchLoading}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {searchLoading ? '...' : 'LOOKUP'}
                    </button>
                    {searchError && (
                        <p className="absolute -bottom-6 left-2 text-xs text-red-500 font-medium">{searchError}</p>
                    )}
                </form>
            </div>

            {/* Bulk Action Bar */}
            {selectedOrders.length > 0 && (
                <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-fade-in-down">
                    <span className="font-bold flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" /> {selectedOrders.length} Selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={bulkActionLoading}
                            onClick={() => handleBulkStatusUpdate('READY_TO_SHIP')}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                        >
                            Mark Ready
                        </button>
                        <button
                            disabled={bulkActionLoading}
                            onClick={() => handleBulkStatusUpdate('SHIPPED')}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                        >
                            Mark Shipped
                        </button>
                        <button
                            disabled={bulkActionLoading}
                            onClick={() => handleBulkStatusUpdate('DELIVERED')}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                        >
                            Mark Delivered
                        </button>
                        <button onClick={() => setSelectedOrders([])} className="px-3 py-1.5 text-white/70 hover:text-white text-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex flex-wrap gap-2 p-2">
                    <TabButton id="all" label="All Orders" />
                    <TabButton id="toship" label="Ready to Ship" icon={Truck} />
                    <TabButton id="shipped" label="Shipped" icon={Truck} />
                    <TabButton id="unpaid" label="Unpaid/Pending" icon={Clock} />
                    <TabButton id="delivered" label="Delivered" icon={CheckCircle} />
                    <TabButton id="returned" label="Returned" icon={RotateCcw} />
                    <TabButton id="cancelled" label="Cancelled" />
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th className="p-4 w-10">
                                    <button
                                        onClick={() => {
                                            if (selectedOrders.length === filteredOrders.length) setSelectedOrders([]);
                                            else setSelectedOrders(filteredOrders.map(o => o._id));
                                        }}
                                        className="text-gray-400 hover:text-indigo-600"
                                    >
                                        {selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length
                                            ? <CheckSquare className="h-5 w-5 text-indigo-600" />
                                            : <Square className="h-5 w-5" />
                                        }
                                    </button>
                                </th>
                                <th className="p-4 font-semibold">Invoice #</th>
                                <th className="p-4 font-semibold">User Details</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Total</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No orders found in this category.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order._id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${selectedOrders.includes(order._id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}>
                                        <td className="p-4">
                                            <button onClick={() => toggleSelectOrder(order._id)} className="text-gray-400 hover:text-indigo-600">
                                                {selectedOrders.includes(order._id)
                                                    ? <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                    : <Square className="h-5 w-5" />
                                                }
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-white">{order.invoiceNumber || 'N/A'}</span>
                                                <span className="text-[10px] font-mono text-gray-400">{order._id.substring(0, 10)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800 dark:text-white">{order.user?.name}</span>
                                                <span className="text-xs text-gray-500">{order.shippingAddress?.phoneNumber || order.user?.phoneNumber || 'No phone'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-slate-900 dark:text-white">₹{order.totalPrice.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold w-fit border
                                                ${order.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                                ${order.status === 'CREATED' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                                                ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                                                ${order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                                                ${order.status === 'READY_TO_SHIP' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
                                             `}>
                                                {order.status || (order.isPaid ? 'PAID' : 'PENDING')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link to={`/admin/orders/${order._id}`} className="inline-block p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg">
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="md:hidden space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No orders found.
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order._id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white uppercase">{order.invoiceNumber || 'No Invoice #'}</h3>
                                    <p className="text-[10px] font-mono text-gray-400">ID: {order._id.substring(0, 10)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">₹{order.totalPrice.toFixed(2)}</span>
                            </div>

                            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-bold">{order.user?.name}</p>
                                <p className="text-xs text-gray-500">{order.shippingAddress?.phoneNumber || order.user?.phoneNumber || 'No phone number'}</p>
                            </div>

                            <div className="flex items-center justify-between gap-2 mb-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold w-fit border`}>
                                    {order.status || (order.isPaid ? 'PAID' : 'PENDING')}
                                </span>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <Link to={`/admin/orders/${order._id}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                    <Eye className="h-4 w-4" /> View Details
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default OrderListScreen;
