import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { RotateCcw, Search, Eye, CheckCircle, XCircle, Clock, Truck, RefreshCcw, DollarSign } from 'lucide-react';

const ReturnListScreen = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // Modal State
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [actionStatus, setActionStatus] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [restoreInventory, setRestoreInventory] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReturns = async () => {
        try {
            const { data } = await api.get('/returns');
            setReturns(data);
        } catch (error) {
            showToast("Failed to fetch return requests", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const filteredReturns = returns.filter(req =>
        (req.user?.name && req.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(req._id).includes(searchTerm) ||
        String(req.order).includes(searchTerm)
    );

    const openActionModal = (req) => {
        setSelectedReturn(req);
        setActionStatus(req.status);
        setAdminNote(req.adminNote || '');
        setRefundAmount(req.refundAmount || req.orderItem.price * req.orderItem.qty);
        setRestoreInventory(false);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();

        // Confirmation for critical actions
        if (actionStatus === 'REFUNDED') {
            const isConfirmed = await confirm('Confirm Refund', `Are you sure you want to mark this as REFUNDED? This may trigger financial processes.`);
            if (!isConfirmed) return;
        }

        setActionLoading(true);
        try {
            const response = await api.put(`/returns/${selectedReturn._id}/status`, {
                status: actionStatus,
                adminNote,
                refundAmount: actionStatus === 'REFUNDED' ? Number(refundAmount) : undefined,
                restoreInventory
            });

            if (response.status === 202) {
                showToast("Request sent to Super Admin for approval", "info");
            } else {
                showToast(`Return request updated to ${actionStatus}`, "success");
            }

            setSelectedReturn(null);
            fetchReturns();
        } catch (error) {
            showToast(error.response?.data?.message || "Update failed", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'REFUNDED': return 'bg-blue-100 text-blue-800';
            case 'PICKUP_SCHEDULED': return 'bg-purple-100 text-purple-800';
            case 'PICKED_UP': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <RotateCcw className="h-6 w-6 text-indigo-600" /> Return Requests
                </h1>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search ID or User..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredReturns.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No return requests found.</div>
                            ) : (
                                filteredReturns.map((req) => (
                                    <div key={req._id} className="p-4 space-y-3">
                                        <div className="flex gap-3">
                                            <img src={req.orderItem.image} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">{req.orderItem.name}</p>
                                                    <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end mt-1">
                                                    <div>
                                                        <p className="text-xs text-gray-500">₹{req.orderItem.price} x {req.orderItem.qty}</p>
                                                        <Link to={`/admin/orders/${req.order}`} className="text-xs text-indigo-600 font-medium hover:underline">
                                                            Order #{req.order.slice(-6)}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">User:</span>
                                                <span className="font-medium dark:text-gray-300">{req.user?.name || 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Reason:</span>
                                                <span className="font-medium dark:text-gray-300">{req.reason.replace('_', ' ')}</span>
                                            </div>
                                            {req.status === 'PICKUP_SCHEDULED' && req.pickupDate && (
                                                <div className="flex justify-between text-indigo-600 font-medium">
                                                    <span>Pickup:</span>
                                                    <span>{new Date(req.pickupDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => openActionModal(req)}
                                            className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            Manage Request
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Item</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">User / Order</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Reason</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Date</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filteredReturns.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No return requests found.</td>
                                    </tr>
                                ) : (
                                    filteredReturns.map((req) => (
                                        <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={req.orderItem.image} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white line-clamp-1 w-40">{req.orderItem.name}</p>
                                                        <p className="text-xs text-gray-500">₹{req.orderItem.price} x {req.orderItem.qty}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-white">{req.user?.name || 'Unknown'}</span>
                                                    <Link to={`/admin/orders/${req.order}`} className="text-xs text-indigo-600 hover:underline">
                                                        Order #{req.order.slice(-6)}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="block text-slate-700 dark:text-gray-300 font-medium">{req.reason.replace('_', ' ')}</span>
                                                {req.comments && <p className="text-xs text-gray-500 truncate w-32" title={req.comments}>{req.comments}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                                    {req.status.replace('_', ' ')}
                                                </span>
                                                {req.status === 'PICKUP_SCHEDULED' && req.pickupDate && (
                                                    <p className="text-xs text-indigo-600 mt-1 font-medium flex items-center gap-1">
                                                        <Truck className="h-3 w-3" />
                                                        {new Date(req.pickupDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openActionModal(req)}
                                                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Manage Modal */}
            {selectedReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manage Return Request</h3>
                            <button onClick={() => setSelectedReturn(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUpdateStatus} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Update Status</label>
                                    <select
                                        value={actionStatus}
                                        onChange={(e) => setActionStatus(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="REQUESTED">REQUESTED</option>
                                        <option value="APPROVED">APPROVED (Approve Return)</option>
                                        <option value="PICKUP_SCHEDULED">PICKUP SCHEDULED</option>
                                        <option value="PICKED_UP">PICKED UP</option>
                                        <option value="REFUNDED">REFUNDED (Money Back)</option>
                                        <option value="REPLACED">REPLACED (Exchange)</option>
                                        <option value="COMPLETED">COMPLETED (Finalize)</option>
                                    </select>
                                </div>

                                {actionStatus === 'REFUNDED' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Refund Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Confirm the amount to be refunded.</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="restoreInventory"
                                        checked={restoreInventory}
                                        onChange={(e) => setRestoreInventory(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    />
                                    <label htmlFor="restoreInventory" className="text-sm text-gray-700 dark:text-gray-300">
                                        Restore Inventory (+{selectedReturn.orderItem?.qty} qty)
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Note (Internal)</label>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        rows="3"
                                        placeholder="Add notes about this decision..."
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedReturn(null)}
                                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Updating...' : 'Update Status'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnListScreen;
