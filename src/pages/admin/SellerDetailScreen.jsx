import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Ban,
    ShieldCheck,
    Eye,
    Download,
    Percent,
    DollarSign,
    Package,
    ShoppingBag,
    Star,
    History
} from 'lucide-react';

const SellerDetailScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Form states
    const [approvalData, setApprovalData] = useState({ commissionPercentage: 10, notes: '' });
    const [rejectData, setRejectData] = useState({ reason: '', notes: '' });
    const [suspendData, setSuspendData] = useState({ reason: '', freezePayouts: true });
    const [commissionData, setCommissionData] = useState({ commissionPercentage: 10, notes: '' });

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchSeller();
    }, [id]);

    const fetchSeller = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/sellers/${id}`);
            setSeller(data);
            setCommissionData({ commissionPercentage: data.commissionPercentage || 10, notes: '' });
        } catch (error) {
            console.error('Failed to fetch seller:', error);
            showToast('Failed to load seller details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSeller = async (reviewStatus) => {
        setActionLoading(true);
        try {
            await api.put(`/admin/sellers/${id}/review`, {
                reviewStatus,
                notes: rejectData.notes || 'Reviewed by admin'
            });
            showToast(`Seller ${reviewStatus.toLowerCase().replace('_', ' ')}`, 'success');
            fetchSeller();
        } catch (error) {
            showToast(error.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveSeller = async () => {
        setActionLoading(true);
        try {
            await api.put(`/admin/sellers/${id}/approve`, approvalData);
            showToast('Seller approved successfully!', 'success');
            setShowApproveModal(false);
            fetchSeller();
        } catch (error) {
            showToast(error.response?.data?.message || 'Approval failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSeller = async () => {
        if (!rejectData.reason) {
            showToast('Please provide a rejection reason', 'error');
            return;
        }
        setActionLoading(true);
        try {
            await api.put(`/admin/sellers/${id}/reject`, rejectData);
            showToast('Seller rejected', 'success');
            setShowRejectModal(false);
            fetchSeller();
        } catch (error) {
            showToast(error.response?.data?.message || 'Rejection failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspendSeller = async () => {
        if (!suspendData.reason) {
            showToast('Please provide a suspension reason', 'error');
            return;
        }
        setActionLoading(true);
        try {
            await api.put(`/admin/sellers/${id}/suspend`, suspendData);
            showToast('Seller suspended', 'success');
            setShowSuspendModal(false);
            fetchSeller();
        } catch (error) {
            showToast(error.response?.data?.message || 'Suspension failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivateSeller = async () => {
        setActionLoading(true);
        try {
            await api.put(`/admin/sellers/${id}/activate`, { notes: 'Reactivated by admin' });
            showToast('Seller reactivated successfully!', 'success');
            fetchSeller();
        } catch (error) {
            showToast(error.response?.data?.message || 'Activation failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateCommission = async () => {
        setActionLoading(true);
        try {
            await api.put(`/admin/sellers/${id}/commission`, commissionData);
            showToast('Commission updated successfully!', 'success');
            setShowCommissionModal(false);
            fetchSeller();
        } catch (error) {
            showToast(error.response?.data?.message || 'Update failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
            PENDING_VERIFICATION: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending Verification' },
            UNDER_REVIEW: { color: 'bg-blue-100 text-blue-700', icon: Eye, label: 'Under Review' },
            APPROVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
            REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
            SUSPENDED: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, label: 'Suspended' },
            BLOCKED: { color: 'bg-red-200 text-red-800', icon: Ban, label: 'Blocked' }
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.color}`}>
                <Icon className="h-4 w-4" />
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Seller not found</p>
                <Link to="/admin/sellers" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Sellers</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/sellers')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{seller.businessName}</h1>
                    <p className="text-gray-500 dark:text-gray-400">Seller ID: {seller._id}</p>
                </div>
                {getStatusBadge(seller.status)}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Products</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{seller.metrics?.totalProducts || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <ShoppingBag className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Orders</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{seller.metrics?.totalOrders || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Revenue</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">₹{seller.metrics?.totalRevenue || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                            <Star className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Rating</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{seller.metrics?.rating?.toFixed(1) || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-wrap gap-3">
                    {/* Admin Review Actions */}
                    {seller.status === 'PENDING_VERIFICATION' && (
                        <button
                            onClick={() => handleReviewSeller('RECOMMENDED')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Recommend for Approval
                        </button>
                    )}

                    {/* Super Admin Approval */}
                    {isSuperAdmin && ['PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(seller.status) && (
                        <button
                            onClick={() => setShowApproveModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Final Approve
                        </button>
                    )}

                    {/* Reject */}
                    {['PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(seller.status) && (
                        <button
                            onClick={() => setShowRejectModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </button>
                    )}

                    {/* Suspend (Super Admin Only) */}
                    {isSuperAdmin && seller.status === 'APPROVED' && (
                        <button
                            onClick={() => setShowSuspendModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Suspend
                        </button>
                    )}

                    {/* Reactivate */}
                    {isSuperAdmin && seller.status === 'SUSPENDED' && (
                        <button
                            onClick={handleActivateSeller}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Reactivate
                        </button>
                    )}

                    {/* Commission */}
                    {isSuperAdmin && seller.status === 'APPROVED' && (
                        <button
                            onClick={() => setShowCommissionModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <Percent className="h-4 w-4" />
                            Set Commission ({seller.commissionPercentage}%)
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6">
                    {['overview', 'documents', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeTab === 'overview' && (
                    <>
                        {/* Business Info */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                                Business Information
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Business Name" value={seller.businessName} />
                                <InfoRow label="Owner Name" value={seller.ownerName} />
                                <InfoRow label="Seller Type" value={seller.sellerType} />
                                <InfoRow label="PAN" value={seller.pan} />
                                <InfoRow label="GSTIN" value={seller.gstin || 'Not Provided'} />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-indigo-600" />
                                Contact Information
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Email" value={seller.email} icon={Mail} />
                                <InfoRow label="Phone" value={seller.phone} icon={Phone} />
                                <InfoRow label="Address" value={
                                    seller.businessAddress ?
                                        `${seller.businessAddress.street || ''}, ${seller.businessAddress.city || ''}, ${seller.businessAddress.state || ''} - ${seller.businessAddress.pincode || ''}`
                                        : 'Not Provided'
                                } icon={MapPin} />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                                Bank Details
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Account Holder" value={seller.bankDetails?.holderName || 'Not Provided'} />
                                <InfoRow label="Account Number" value={seller.bankDetails?.accountNumber ? `****${seller.bankDetails.accountNumber.slice(-4)}` : 'Not Provided'} />
                                <InfoRow label="IFSC" value={seller.bankDetails?.ifsc || 'Not Provided'} />
                                <InfoRow label="Bank Name" value={seller.bankDetails?.bankName || 'Not Provided'} />
                            </div>
                        </div>

                        {/* Platform Settings */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Percent className="h-5 w-5 text-indigo-600" />
                                Platform Settings
                            </h3>
                            <div className="space-y-3">
                                <InfoRow label="Commission Rate" value={`${seller.commissionPercentage}%`} />
                                <InfoRow label="Payout Status" value={seller.payoutStatus} />
                                <InfoRow label="Can Add Products" value={seller.canAddProducts ? 'Yes' : 'No'} />
                                <InfoRow label="Can Receive Orders" value={seller.canReceiveOrders ? 'Yes' : 'No'} />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'documents' && (
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            KYC Documents
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${seller.kyc?.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                seller.kyc?.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {seller.kyc?.status}
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DocumentCard label="PAN Card" url={seller.kyc?.panUrl} />
                            <DocumentCard label="Aadhaar Card" url={seller.kyc?.aadhaarUrl} />
                            <DocumentCard label="Seller Photo" url={seller.kyc?.sellerPhotoUrl} isImage />
                            <DocumentCard label="Cancelled Cheque" url={seller.kyc?.chequeUrl} />
                            <DocumentCard label="Bank Statement / Passbook" url={seller.kyc?.bankProofUrl} />
                            <DocumentCard label="Address Proof" url={seller.kyc?.addressProofUrl} />
                            <DocumentCard label="GST Certificate" url={seller.kyc?.gstCertificateUrl} />
                            <DocumentCard label="Business Proof" url={seller.kyc?.businessProofUrl} />
                        </div>
                        {seller.kyc?.rejectionReason && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    <strong>Rejection Reason:</strong> {seller.kyc.rejectionReason}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <History className="h-5 w-5 text-indigo-600" />
                            Approval History
                        </h3>
                        {seller.approvalHistory && seller.approvalHistory.length > 0 ? (
                            <div className="space-y-4">
                                {seller.approvalHistory.slice().reverse().map((entry, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                entry.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                {entry.status === 'APPROVED' ? <CheckCircle className="h-5 w-5" /> :
                                                    entry.status === 'REJECTED' ? <XCircle className="h-5 w-5" /> :
                                                        <Clock className="h-5 w-5" />}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-800 dark:text-white">{entry.status?.replace(/_/g, ' ')}</p>
                                            <p className="text-sm text-gray-500">
                                                By {entry.changedBy?.name || 'System'} • {new Date(entry.changedAt).toLocaleString()}
                                            </p>
                                            {entry.reason && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.reason}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No history available</p>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {/* Approve Modal */}
            {showApproveModal && (
                <Modal title="Approve Seller" onClose={() => setShowApproveModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Commission Percentage (%)</label>
                            <input
                                type="number"
                                value={approvalData.commissionPercentage}
                                onChange={(e) => setApprovalData({ ...approvalData, commissionPercentage: Number(e.target.value) })}
                                min="0"
                                max="100"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                            <textarea
                                value={approvalData.notes}
                                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveSeller}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Approving...' : 'Approve Seller'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <Modal title="Reject Seller" onClose={() => setShowRejectModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                            <input
                                type="text"
                                value={rejectData.reason}
                                onChange={(e) => setRejectData({ ...rejectData, reason: e.target.value })}
                                placeholder="e.g., Invalid documents, Incomplete information"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Additional Notes</label>
                            <textarea
                                value={rejectData.notes}
                                onChange={(e) => setRejectData({ ...rejectData, notes: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-slate-700 dark:border-slate-600"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSeller}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject Seller'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Suspend Modal */}
            {showSuspendModal && (
                <Modal title="Suspend Seller" onClose={() => setShowSuspendModal(false)}>
                    <div className="space-y-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <p className="text-sm text-orange-700 dark:text-orange-400">
                                <strong>Warning:</strong> Suspending this seller will delist all their products and prevent them from receiving new orders.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Suspension Reason *</label>
                            <input
                                type="text"
                                value={suspendData.reason}
                                onChange={(e) => setSuspendData({ ...suspendData, reason: e.target.value })}
                                placeholder="e.g., Policy violation, Fraud detected"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="freezePayouts"
                                checked={suspendData.freezePayouts}
                                onChange={(e) => setSuspendData({ ...suspendData, freezePayouts: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="freezePayouts" className="text-sm">Freeze payouts</label>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspendSeller}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Suspending...' : 'Suspend Seller'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Commission Modal */}
            {showCommissionModal && (
                <Modal title="Update Commission" onClose={() => setShowCommissionModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Commission Percentage (%)</label>
                            <input
                                type="number"
                                value={commissionData.commissionPercentage}
                                onChange={(e) => setCommissionData({ ...commissionData, commissionPercentage: Number(e.target.value) })}
                                min="0"
                                max="100"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Notes</label>
                            <textarea
                                value={commissionData.notes}
                                onChange={(e) => setCommissionData({ ...commissionData, notes: e.target.value })}
                                placeholder="Reason for change..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                rows={2}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCommissionModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateCommission}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Updating...' : 'Update Commission'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Helper Components
const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
        <span className="text-gray-500 text-sm flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {label}
        </span>
        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{value}</span>
    </div>
);

const DocumentCard = ({ label, url, isImage }) => (
    <div className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>
        {url ? (
            <div className="space-y-2">
                {isImage && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-500 mb-2">
                        <img src={url} alt={label} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex gap-2">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                        <Eye className="h-4 w-4" /> View
                    </a>
                    <a
                        href={url}
                        download
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                    >
                        <Download className="h-4 w-4" /> Download
                    </a>
                </div>
            </div>
        ) : (
            <span className="text-sm text-gray-400">Not uploaded</span>
        )}
    </div>
);

const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{title}</h3>
            {children}
        </div>
    </div>
);

export default SellerDetailScreen;
