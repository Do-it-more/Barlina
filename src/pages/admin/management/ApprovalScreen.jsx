import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Shield, User } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const ApprovalScreen = () => {
    const { showToast } = useToast();
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApprovals = async () => {
        try {
            const { data } = await api.get('/admin/management/approvals/pending');
            console.log('Fetched Approvals Data:', data);
            setApprovals(data);
        } catch (error) {
            console.error("Failed to fetch approvals", error);
            showToast("Failed to load approval requests", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleAction = async (id, action, reason = '') => {
        try {
            if (action === 'approve') {
                await api.put(`/admin/management/approvals/${id}/approve`);
                showToast("Request approved successfully", "success");
            } else {
                await api.put(`/admin/management/approvals/${id}/reject`, { reason });
                showToast("Request rejected", "info");
            }
            fetchApprovals(); // Refresh list
        } catch (error) {
            console.error(`Failed to ${action} request`, error);
            showToast(`Failed to ${action} request`, "error");
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        Approval Center
                    </h1>
                    <p className="text-slate-500 mt-1">Review and manage restricted action requests from admins.</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {approvals.length} Pending Request{approvals.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {approvals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <CheckCircle className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">All Caught Up!</h3>
                    <p className="text-slate-500">No pending approval requests at this time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {approvals.map((request) => (
                        <div key={request._id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>

                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                            {request.targetModel || 'General'}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(request.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {request.action === 'APPROVE_RETURN' ? 'Return Approval Request' : (request.action || 'Restricted Action')}
                                        </h3>

                                        {/* Return Specific Evidence */}
                                        {request.returnDetails && (
                                            <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Customer Return Evidence
                                                </h4>

                                                <div className="flex items-start gap-3 mb-3">
                                                    {request.returnDetails.orderItem?.image && (
                                                        <img src={request.returnDetails.orderItem.image} alt="" className="w-12 h-12 object-cover rounded-md bg-white border border-slate-200" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1">{request.returnDetails.orderItem?.name || 'Product'}</p>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                                                                Reason: {request.returnDetails.reason}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Customer Comments */}
                                                {request.returnDetails.comments && (
                                                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 mb-3">
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                                                            "{request.returnDetails.comments}"
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Evidence Media */}
                                                {request.returnDetails.images && request.returnDetails.images.length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1">Attached Proof:</p>
                                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                                            {request.returnDetails.images.map((img, idx) => {
                                                                const isVideo = img.match(/\.(mp4|webm|mov|ogg)$/i);
                                                                return (
                                                                    <a href={img} target="_blank" rel="noopener noreferrer" key={idx} className="block relative h-16 w-16 min-w-[4rem] rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden group bg-black/5">
                                                                        {isVideo ? (
                                                                            <video src={img} className="h-full w-full object-cover" />
                                                                        ) : (
                                                                            <img src={img} alt={`Proof ${idx}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                                                        )}
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Proposed Action Details */}
                                        {request.targetModel === 'ReturnRequest' && request.requestData && (
                                            <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                                <p className="text-sm">
                                                    <span className="font-bold text-indigo-700 dark:text-indigo-400">Proposed Decision: </span>
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        Mark as <strong className="uppercase">{request.requestData.status}</strong>
                                                        {request.requestData.refundAmount && (
                                                            <span> & Refund <span className="font-mono font-bold">₹{request.requestData.refundAmount}</span></span>
                                                        )}
                                                    </span>
                                                </p>
                                                {request.requestData.adminNote && (
                                                    <p className="text-xs text-slate-500 mt-1 pl-2 border-l-2 border-indigo-200">
                                                        <span className="font-medium">Admin Note:</span> {request.requestData.adminNote}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Fallback for Generic Reasons */}
                                        {!request.returnDetails && (
                                            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                                                {request.requestData?.reason || request.reason || 'No specific reason provided.'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Requestor Info */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 uppercase tracking-wider block">Requested By</span>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {request.admin?.name || 'Unknown Admin'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center border-l border-slate-100 dark:border-slate-700 pl-0 md:pl-6">
                                    <button
                                        onClick={() => handleAction(request._id, 'reject')}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(request._id, 'approve')}
                                        className="w-full sm:w-auto px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalScreen;
