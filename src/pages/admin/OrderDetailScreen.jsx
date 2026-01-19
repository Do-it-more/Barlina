import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft, ArrowRight, CheckCircle, XCircle, Truck, Package, Clock,
    AlertTriangle, FileText, User, MapPin, CreditCard, RotateCcw, Download, Printer, ExternalLink
} from 'lucide-react';
import InvoiceModal from '../../components/admin/orders/InvoiceModal';

const OrderDetailScreen = () => {
    const { id } = useParams();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Status Management State
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');

    // Cancellation Modal
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    const fetchOrderData = async () => {
        try {
            const [orderRes, auditRes] = await Promise.all([
                api.get(`/orders/${id}`),
                api.get(`/orders/${id}/audit`)
            ]);
            setOrder(orderRes.data);
            setAuditLogs(auditRes.data);
            setNewStatus(orderRes.data.status); // Initialize with current
        } catch (error) {
            console.error("Failed to fetch order data", error);
            showToast("Failed to load order details", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderData();
    }, [id]);



    const handleDownloadInvoice = async () => {
        try {
            const response = await api.get(`/orders/${id}/invoice`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${order.invoiceNumber || order._id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
            showToast("Failed to download invoice", "error");
        }
    };

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === order.status) return;

        setStatusUpdating(true);
        try {
            await api.put(`/orders/${id}/status`, {
                status: newStatus,
                note: statusNote
            });
            showToast(`Status updated to ${newStatus}`, "success");
            setStatusNote('');
            fetchOrderData(); // Refresh all data
        } catch (error) {
            showToast(error.response?.data?.message || "Update failed", "error");
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason) return showToast("Cancellation reason is required", "error");

        try {
            await api.put(`/orders/${id}/cancel`, { reason: cancelReason });
            showToast("Order cancelled successfully", "success");
            setShowCancelModal(false);
            fetchOrderData();
        } catch (error) {
            showToast(error.response?.data?.message || "Cancellation failed", "error");
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            CREATED: 'bg-gray-100 text-gray-800',
            PAID: 'bg-green-100 text-green-800',
            PAYMENT_FAILED: 'bg-red-100 text-red-800',
            READY_TO_SHIP: 'bg-yellow-100 text-yellow-800',
            SHIPPED: 'bg-blue-100 text-blue-800',
            OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
            DELIVERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
            RETURNED: 'bg-orange-100 text-orange-800',
            REFUNDED: 'bg-purple-100 text-purple-800',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${styles[status] || 'bg-gray-100'}`}>
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin/orders" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-slate-500" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                Order #
                                <Link
                                    to={`/order/${order._id}`}
                                    className="hover:text-indigo-600 hover:underline flex items-center gap-1 transition-colors"
                                    title="View as Customer"
                                >
                                    {order.invoiceNumber || order._id.slice(-6).toUpperCase()}
                                    <ArrowRight className="h-5 w-5 opacity-50" />
                                </Link>
                            </h1>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Placed on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" /> Print / View
                    </button>
                    <button
                        onClick={handleDownloadInvoice}
                        className="px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" /> Download PDF
                    </button>

                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'REFUNDED' && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>

            <InvoiceModal
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                order={order}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Status Management Panel (Admin Only) */}
                    {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <RotateCcw className="h-5 w-5 text-indigo-500" />
                                Update Status
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Change Status To</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        {['CREATED', 'PAID', 'READY_TO_SHIP', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'].map((s, index, arr) => {
                                            const currentIndex = arr.indexOf(order.status);
                                            const optionIndex = index;

                                            // Sequential Logic: Only allow Current or Immediate Next
                                            // Handle COD exception: Allow CREATED -> READY_TO_SHIP (Skip PAID)
                                            const isCODSkip = order.paymentMethod === 'COD' && order.status === 'CREATED' && s === 'READY_TO_SHIP';
                                            const isNext = optionIndex === currentIndex + 1;
                                            const isCurrent = optionIndex === currentIndex;
                                            const isAllowed = isCurrent || isNext || isCODSkip;

                                            return (
                                                <option
                                                    key={s}
                                                    value={s}
                                                    disabled={!isAllowed}
                                                    className={!isAllowed ? 'text-gray-400 bg-gray-50' : ''}
                                                >
                                                    {s.replace(/_/g, ' ')}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Internal Note (Optional)</label>
                                    <input
                                        type="text"
                                        value={statusNote}
                                        onChange={(e) => setStatusNote(e.target.value)}
                                        placeholder="Reason for change..."
                                        className="w-full px-4 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={statusUpdating || newStatus === order.status}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {statusUpdating ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Items ({order.orderItems.length})</h3>
                        <div className="space-y-4">
                            {order.orderItems.map((item, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border" />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800 dark:text-white">{item.name}</p>
                                        <p className="text-sm text-slate-500">Qty: {item.qty} × ₹{item.price}</p>
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-white">₹{(item.qty * item.price).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-between items-center text-lg font-bold text-slate-800 dark:text-white">
                            <span>Total Amount</span>
                            <span>₹{order.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Timeline / Audit Log */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" /> Timeline
                        </h3>
                        <div className="space-y-6 relative ml-2">
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-slate-700"></div>
                            {auditLogs.map((log, i) => (
                                <div key={i} className="relative flex gap-4">
                                    <div className={`relative z-10 mt-1 w-4 h-4 rounded-full border-2 ${i === 0 ? 'bg-indigo-600 border-indigo-200' : 'bg-white border-gray-300'} flex-shrink-0`}></div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white text-sm">
                                            {log.action.replace(/_/g, ' ')}
                                            <span className="font-normal text-gray-500"> by {log.performedBy.name}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </p>
                                        {log.statusFrom && log.statusTo && (
                                            <p className="text-xs font-mono text-indigo-600 mt-1 bg-indigo-50 inline-block px-1.5 py-0.5 rounded">
                                                {log.statusFrom} → {log.statusTo}
                                            </p>
                                        )}
                                        {log.note && (
                                            <p className="text-xs text-gray-600 italic mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                                                "{log.note}"
                                            </p>
                                        )}
                                        {log.reason && (
                                            <p className="text-xs text-red-600 italic mt-1 bg-red-50 p-2 rounded border border-red-100">
                                                Reason: {log.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User className="h-4 w-4" /> Customer
                        </h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                {order.user.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">{order.user.name}</p>
                                <p className="text-xs text-slate-500">{order.user.email}</p>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                            <div>
                                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Shipping Address</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Phone</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{order.shippingAddress.phoneNumber || order.user.phoneNumber}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Payment
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Method</span>
                                <span className="font-medium text-slate-800 dark:text-white uppercase">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Status</span>
                                <span className={`font-bold ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.isPaid ? 'PAID' : 'PENDING'}
                                </span>
                            </div>
                            {order.paymentResult && (
                                <div className="pt-2 border-t dark:border-slate-700">
                                    <p className="text-xs text-slate-400 mb-1">Transaction ID</p>
                                    <p className="text-xs font-mono bg-gray-100 dark:bg-slate-700 p-1.5 rounded">{order.paymentResult.id || 'N/A'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {
                showCancelModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6" /> Cancel Order
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                                Are you sure? This will release reserved stock and cannot be undone.
                            </p>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation (required)..."
                                className="w-full border rounded-lg p-3 text-sm h-24 mb-4 dark:bg-slate-700 dark:color-white"
                            ></textarea>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Confirm Cancellation
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OrderDetailScreen;
