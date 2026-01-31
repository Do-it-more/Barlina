import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
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
    Download,
    RefreshCw,
    Printer,
    FileText,
    CreditCard
} from 'lucide-react';

const SellerOrders = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Invoice View State
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const invoiceRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Invoice-${invoiceOrder?.invoiceNumber || invoiceOrder?._id}`,
    });

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

    const handleViewInvoice = (e, order) => {
        e.stopPropagation();
        setInvoiceOrder(order);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            CREATED: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
            PAID: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Paid' },
            READY_TO_SHIP: { color: 'bg-blue-100 text-blue-700', icon: Package, label: 'Processing' },
            SHIPPED: { color: 'bg-purple-100 text-purple-700', icon: Truck, label: 'Shipped' },
            OUT_FOR_DELIVERY: { color: 'bg-amber-100 text-amber-700', icon: Truck, label: 'Out for Delivery' },
            DELIVERED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Delivered' },
            CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
            RETURNED: { color: 'bg-orange-100 text-orange-700', icon: XCircle, label: 'Returned' },
            REFUNDED: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Refunded' }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700', icon: Clock, label: status };
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {config.label}
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
                                        onClick={(e) => handleViewInvoice(e, order)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Invoice
                                    </button>

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
                                                    <p>{order.shippingAddress.address || order.shippingAddress.street}</p>
                                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.country}</p>
                                                    <p>{order.shippingAddress.postalCode}</p>
                                                    <p className="flex items-center gap-1 mt-1 font-medium text-slate-700 dark:text-slate-300">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {order.shippingAddress.phoneNumber || order.shippingAddress.phone || order.user?.phoneNumber || 'N/A'}
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

            {/* Invoice Modal */}
            {invoiceOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-500" /> Invoice Preview
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    <Printer className="h-4 w-4" /> Print Invoice
                                </button>
                                <button
                                    onClick={() => setInvoiceOrder(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-slate-950">
                            {/* INVOICE PAPER DESIGN */}
                            <div
                                ref={invoiceRef}
                                className="bg-white text-slate-800 mx-auto max-w-[210mm] min-h-[297mm] p-[10mm] shadow-lg print:shadow-none print:m-0 flex flex-col"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                                {/* Header Title */}
                                <div className="mb-2">
                                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">INVOICE</h1>
                                </div>

                                {/* Invoice Details */}
                                <div className="mb-8 text-sm text-slate-600 space-y-1">
                                    <p><span className="text-slate-500">Invoice #:</span> <span className="font-bold text-slate-900">{invoiceOrder.invoiceNumber || invoiceOrder._id.slice(-6).toUpperCase()}</span></p>
                                    <p><span className="text-slate-500">Order Ref:</span> #{invoiceOrder._id.slice(-6).toUpperCase()}</p>
                                    <p><span className="text-slate-500">Date:</span> {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                                </div>

                                {/* Billed To & Seller Info */}
                                <div className="flex justify-between items-start mb-8">
                                    {/* Left: Billed To */}
                                    <div className="w-1/2">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">BILLED TO:</h3>
                                        <p className="font-bold text-slate-900 text-lg">{invoiceOrder.user?.name}</p>
                                        <p className="text-sm text-slate-500">{invoiceOrder.user?.email}</p>
                                        <p className="text-sm text-slate-500">{invoiceOrder.user?.phoneNumber}</p>

                                        {/* Barcode placed here */}
                                        <div className="mt-4">
                                            <Barcode
                                                value={invoiceOrder.invoiceNumber || invoiceOrder._id}
                                                width={1.5}
                                                height={40}
                                                fontSize={10}
                                                displayValue={true}
                                                background="#ffffff"
                                                lineColor="#000000"
                                                margin={0}
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Seller Info */}
                                    <div className="w-1/2 text-right">
                                        <h2 className="text-xl font-bold text-indigo-600 mb-1">{user?.businessName || user?.name || 'Seller Shop'}</h2>
                                        <div className="text-sm text-slate-600 whitespace-pre-line">
                                            {user?.address && (
                                                <>
                                                    {user.address.street && <p>{user.address.street}</p>}
                                                    {user.address.city && <p>{user.address.city} {user.address.postalCode}</p>}
                                                    {user.address.state && <p>{user.address.state}, {user.address.country}</p>}
                                                </>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600">Phone: {user?.phoneNumber || user?.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Two Column Cards */}
                                <div className="flex gap-6 mb-8">
                                    {/* Left Card: Shipping Address */}
                                    <div className="flex-1 border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-slate-400 font-bold mb-4 flex items-center gap-2">
                                            <span className="text-indigo-500 text-lg">📍</span> Shipping Address
                                        </h3>
                                        <div className="space-y-1 text-slate-600 text-sm">
                                            <p className="font-medium text-slate-800 text-base">{invoiceOrder.user?.name}</p>
                                            <p>{invoiceOrder.shippingAddress?.address || invoiceOrder.shippingAddress?.street}</p>
                                            <p>{invoiceOrder.shippingAddress?.city}, {invoiceOrder.shippingAddress?.postalCode}</p>
                                            <p>{invoiceOrder.shippingAddress?.country || invoiceOrder.shippingAddress?.state}</p>
                                            <p className="mt-2 text-slate-500">Phone: {invoiceOrder.shippingAddress?.phoneNumber || invoiceOrder.shippingAddress?.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Right Card: Payment Summary */}
                                    <div className="flex-1 border border-gray-200 rounded-xl p-6 bg-slate-50/50">
                                        <h3 className="text-slate-400 font-bold mb-4 flex items-center gap-2">
                                            <span className="text-indigo-500 text-lg">💳</span> Payment Summary
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Items Total</span>
                                                <span className="font-medium">₹{calculateOrderTotal(invoiceOrder.orderItems).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Shipping</span>
                                                <span className="font-medium">₹{invoiceOrder.shippingPrice ? invoiceOrder.shippingPrice.toFixed(2) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Tax</span>
                                                <span className="font-medium">₹{invoiceOrder.taxPrice ? invoiceOrder.taxPrice.toFixed(2) : '0.00'}</span>
                                            </div>

                                            <div className="h-px bg-slate-200 my-2"></div>

                                            <div className="flex justify-between text-lg font-bold text-slate-800">
                                                <span>Total Paid</span>
                                                <span>₹{calculateOrderTotal(invoiceOrder.orderItems).toFixed(2)}</span>
                                            </div>

                                            <div className="pt-4 mt-2">
                                                <p className="text-xs text-slate-400">Method: <span className="uppercase font-medium text-slate-600">{invoiceOrder.paymentMethod}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table - Added for Detail Visibility */}
                                <div className="mb-12">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Order Details</h3>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="pb-3">Item</th>
                                                <th className="pb-3 text-center">Qty</th>
                                                <th className="pb-3 text-right">Price</th>
                                                <th className="pb-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
                                            {invoiceOrder.orderItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-3 font-medium text-slate-800">{item.name}</td>
                                                    <td className="py-3 text-center">{item.qty}</td>
                                                    <td className="py-3 text-right">₹{item.price}</td>
                                                    <td className="py-3 text-right font-bold text-slate-800">₹{item.price * item.qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Quote */}
                                <div className="mt-auto pt-8 border-t border-gray-100 text-center">
                                    <p className="text-slate-500 italic font-serif">"Thank you for shopping with us! We hope you love your purchase."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerOrders;
