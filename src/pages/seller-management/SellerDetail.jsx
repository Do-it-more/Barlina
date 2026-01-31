import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft,
    Store,
    Mail,
    Phone,
    MapPin,
    Building2,
    ShieldCheck,
    CreditCard,
    Package,
    ShoppingBag,
    Star,
    IndianRupee,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Ban,
    Clock,
    FileText,
    User,
    Calendar,
    Eye,
    Download,
    RefreshCw,
    Percent,
    MessageSquare
} from 'lucide-react';

const SellerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Products state
    const [sellerProducts, setSellerProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    // Action modal states
    const [showActionModal, setShowActionModal] = useState(null);
    const [actionData, setActionData] = useState({
        reason: '',
        notes: '',
        commissionPercentage: 10
    });

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchSeller();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchSellerProducts();
        }
    }, [activeTab, id]);

    const fetchSellerProducts = async () => {
        setProductsLoading(true);
        try {
            const { data } = await api.get(`/admin/product-reviews?sellerId=${id}&status=all&limit=50`);
            setSellerProducts(data.products || []);
        } catch (error) {
            console.error('Failed to load products:', error);
            showToast('Failed to load seller products', 'error');
        } finally {
            setProductsLoading(false);
        }
    };

    const fetchSeller = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/sellers/${id}`);
            setSeller(data);
        } catch (error) {
            showToast('Failed to load seller details', 'error');
            navigate('/seller-management/sellers');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        setActionLoading(true);
        try {
            let endpoint = `/admin/sellers/${id}`;

            switch (showActionModal) {
                case 'approve':
                    await api.put(`${endpoint}/approve`, {
                        commissionPercentage: actionData.commissionPercentage,
                        notes: actionData.notes
                    });
                    showToast('Seller approved successfully!', 'success');
                    break;
                case 'reject':
                    await api.put(`${endpoint}/reject`, {
                        reason: actionData.reason,
                        notes: actionData.notes
                    });
                    showToast('Seller rejected', 'success');
                    break;
                case 'suspend':
                    await api.put(`${endpoint}/suspend`, { reason: actionData.reason });
                    showToast('Seller suspended', 'success');
                    break;
                case 'activate':
                    await api.put(`${endpoint}/activate`, {});
                    showToast('Seller reactivated', 'success');
                    break;
                case 'block':
                    await api.put(`${endpoint}/block`, { reason: actionData.reason });
                    showToast('Seller blocked', 'success');
                    break;
                case 'commission':
                    await api.put(`${endpoint}/commission`, {
                        commissionPercentage: actionData.commissionPercentage
                    });
                    showToast('Commission updated', 'success');
                    break;
                case 'unblock':
                    await api.put(`${endpoint}/unblock`, {});
                    showToast('Seller unblocked', 'success');
                    break;
                default:
                    break;
            }

            setShowActionModal(null);
            setActionData({ reason: '', notes: '', commissionPercentage: 10 });
            fetchSeller();
        } catch (error) {
            showToast(error.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
            PENDING_VERIFICATION: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
            UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
            SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle },
            BLOCKED: { bg: 'bg-red-200', text: 'text-red-800', icon: Ban }
        };
        const c = config[status] || config.DRAFT;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
                <Icon className="h-4 w-4" />
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Seller not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => navigate('/seller-management/sellers')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-4 flex-wrap">
                        {seller.kyc?.sellerPhotoUrl ? (
                            <img
                                src={seller.kyc.sellerPhotoUrl}
                                alt={seller.businessName}
                                className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-slate-700"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-2xl font-bold">
                                {seller.businessName?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{seller.businessName}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                {getStatusBadge(seller.status)}
                                <span className="text-sm text-gray-500">
                                    ID: {seller._id.slice(-8).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-indigo-500" />
                        <div>
                            <p className="text-xs text-gray-500">Products</p>
                            <p className="text-xl font-bold">{seller.metrics?.productsCount || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="h-5 w-5 text-green-500" />
                        <div>
                            <p className="text-xs text-gray-500">Orders</p>
                            <p className="text-xl font-bold">{seller.metrics?.ordersCount || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <IndianRupee className="h-5 w-5 text-emerald-500" />
                        <div>
                            <p className="text-xs text-gray-500">Revenue</p>
                            <p className="text-xl font-bold">₹{(seller.metrics?.totalRevenue || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Percent className="h-5 w-5 text-orange-500" />
                        <div>
                            <p className="text-xs text-gray-500">Commission</p>
                            <p className="text-xl font-bold">{seller.commissionPercentage || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {isSuperAdmin && (
                <div className="flex flex-wrap gap-3">
                    {(seller.status === 'PENDING_VERIFICATION' || seller.status === 'UNDER_REVIEW') && (
                        <>
                            <button
                                onClick={() => setShowActionModal('approve')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Approve Seller
                            </button>
                            <button
                                onClick={() => setShowActionModal('reject')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <XCircle className="h-4 w-4" />
                                Reject
                            </button>
                        </>
                    )}
                    {seller.status === 'APPROVED' && (
                        <>
                            <button
                                onClick={() => setShowActionModal('suspend')}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Suspend
                            </button>
                            <button
                                onClick={() => setShowActionModal('commission')}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Percent className="h-4 w-4" />
                                Set Commission
                            </button>
                        </>
                    )}
                    {seller.status === 'SUSPENDED' && (
                        <>
                            <button
                                onClick={() => setShowActionModal('activate')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Reactivate
                            </button>
                            <button
                                onClick={() => setShowActionModal('block')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Ban className="h-4 w-4" />
                                Block Permanently
                            </button>
                        </>
                    )}
                    {seller.status === 'BLOCKED' && (
                        <button
                            onClick={() => setShowActionModal('unblock')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Unblock Seller
                        </button>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="flex space-x-8">
                    {['overview', 'products', 'documents', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {(seller.status === 'SUSPENDED' || seller.status === 'BLOCKED') && seller.suspensionReason && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-orange-800 dark:text-orange-300">
                                        Account {seller.status === 'BLOCKED' ? 'Blocked' : 'Suspended'}
                                    </h3>
                                    <p className="text-orange-700 dark:text-orange-400 mt-1">
                                        <strong>Reason:</strong> {seller.suspensionReason}
                                    </p>
                                </div>
                            </div>
                        )}

                        {seller.status === 'REJECTED' && seller.rejectionReason && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-800 dark:text-red-300">
                                        Application Rejected
                                    </h3>
                                    <p className="text-red-700 dark:text-red-400 mt-1">
                                        <strong>Reason:</strong> {seller.rejectionReason}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Business Details */}
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-orange-500" />
                                    Business Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Business Name</span>
                                        <span className="font-medium">{seller.businessName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">GSTIN</span>
                                        <span className="font-medium">{seller.gstin || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">PAN</span>
                                        <span className="font-medium">{seller.pan || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Category</span>
                                        <span className="font-medium">{seller.businessCategory || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-orange-500" />
                                    Contact Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium">{seller.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Phone</span>
                                        <span className="font-medium">{seller.phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Address</span>
                                        <span className="font-medium text-right">
                                            {seller.address?.street}, {seller.address?.city}<br />
                                            {seller.address?.state} - {seller.address?.pincode}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-orange-500" />
                                    Bank Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Bank Name</span>
                                        <span className="font-medium">{seller.bankDetails?.bankName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Account Number</span>
                                        <span className="font-medium">{seller.bankDetails?.accountNumber ? '****' + seller.bankDetails.accountNumber.slice(-4) : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">IFSC</span>
                                        <span className="font-medium">{seller.bankDetails?.ifsc || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Registration Info */}
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-orange-500" />
                                    Registration Info
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Registered On</span>
                                        <span className="font-medium">{new Date(seller.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">KYC Status</span>
                                        <span className={`font-medium ${seller.kyc?.status === 'VERIFIED' ? 'text-green-600' : seller.kyc?.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {seller.kyc?.status || 'NOT_SUBMITTED'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Onboarding Step</span>
                                        <span className="font-medium">{seller.onboardingStep || 1}/5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {activeTab === 'products' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800 dark:text-white">Seller Products</h3>
                            <span className="text-sm text-gray-500">{sellerProducts.length} items</span>
                        </div>

                        {productsLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            </div>
                        ) : sellerProducts.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No products listed</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {sellerProducts.map(product => (
                                    <div key={product._id} className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="relative aspect-square bg-gray-100 dark:bg-slate-800">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <Package className="h-8 w-8" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 scale-75 origin-top-right">
                                                {getStatusBadge(product.listingStatus || product.status || 'DRAFT')}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-medium text-sm text-slate-800 dark:text-white truncate" title={product.name}>{product.name}</h4>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="font-bold text-sm text-slate-900 dark:text-white">₹{product.discountPrice || product.price}</span>
                                                <span className="text-xs text-gray-500">Qty: {product.countInStock}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="font-semibold text-slate-800 dark:text-white">KYC Documents</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${seller.kyc?.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                seller.kyc?.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    seller.kyc?.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {seller.kyc?.status || 'NOT_SUBMITTED'}
                            </span>
                        </div>
                        {(seller.kyc?.panUrl || seller.kyc?.aadhaarUrl || seller.kyc?.addressProofUrl || seller.kyc?.businessProofUrl || seller.kyc?.chequeUrl || seller.kyc?.bankProofUrl || seller.kyc?.gstCertificateUrl || seller.kyc?.sellerPhotoUrl) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {seller.kyc?.panUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">PAN Card</p>
                                                <p className="text-xs text-gray-500">Identity Document</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.panUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.panUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {seller.kyc?.aadhaarUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="h-8 w-8 text-orange-500" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">Aadhaar Card</p>
                                                <p className="text-xs text-gray-500">Identity Document</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.aadhaarUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.aadhaarUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {seller.kyc?.addressProofUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="h-8 w-8 text-green-500" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">Address Proof</p>
                                                <p className="text-xs text-gray-500">Verification Document</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.addressProofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.addressProofUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {seller.kyc?.businessProofUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="h-8 w-8 text-purple-500" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">Business Proof</p>
                                                <p className="text-xs text-gray-500">Business Document</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.businessProofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.businessProofUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {seller.kyc?.chequeUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="h-8 w-8 text-teal-500" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">Cancelled Cheque</p>
                                                <p className="text-xs text-gray-500">Bank Verification</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.chequeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.chequeUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {seller.kyc?.bankProofUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="h-8 w-8 text-cyan-500" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">Bank Statement / Passbook</p>
                                                <p className="text-xs text-gray-500">Bank Verification</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.bankProofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.bankProofUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {seller.kyc?.gstCertificateUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="h-8 w-8 text-amber-500" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">GST Certificate</p>
                                                <p className="text-xs text-gray-500">Tax Document</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.gstCertificateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.gstCertificateUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {seller.kyc?.sellerPhotoUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500">
                                                <img
                                                    src={seller.kyc.sellerPhotoUrl}
                                                    alt="Seller"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">Seller Photo</p>
                                                <p className="text-xs text-gray-500">Owner Verification</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={seller.kyc.sellerPhotoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </a>
                                            <a
                                                href={seller.kyc.sellerPhotoUrl}
                                                download
                                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                                            >
                                                <Download className="h-4 w-4" /> Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No documents uploaded yet</p>
                            </div>
                        )}
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
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Approval History</h3>
                        {seller.approvalHistory && seller.approvalHistory.length > 0 ? (
                            <div className="space-y-3">
                                {seller.approvalHistory.map((entry, idx) => {
                                    const actionStatus = entry.action || entry.status || 'UNKNOWN';
                                    return (
                                        <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                            <div className={`p-2 rounded-full ${actionStatus === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                actionStatus === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                    actionStatus === 'SUSPENDED' ? 'bg-orange-100 text-orange-600' :
                                                        actionStatus === 'BLOCKED' ? 'bg-red-100 text-red-600' :
                                                            'bg-gray-100 text-gray-600'
                                                }`}>
                                                {actionStatus === 'APPROVED' ? <CheckCircle className="h-4 w-4" /> :
                                                    actionStatus === 'REJECTED' || actionStatus === 'BLOCKED' ? <XCircle className="h-4 w-4" /> :
                                                        <Clock className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{actionStatus.replace(/_/g, ' ')}</p>
                                                {entry.reason && <p className="text-sm text-gray-500">{entry.reason}</p>}
                                                {entry.notes && <p className="text-sm text-gray-400 mt-1">Note: {entry.notes}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">
                                                    {entry.timestamp && !isNaN(new Date(entry.timestamp).getTime())
                                                        ? new Date(entry.timestamp).toLocaleDateString()
                                                        : entry.changedAt && !isNaN(new Date(entry.changedAt).getTime())
                                                            ? new Date(entry.changedAt).toLocaleDateString()
                                                            : 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-400">{entry.changedBy?.name || 'System'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500">No history available</p>
                        )}
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                            {showActionModal === 'approve' && 'Approve Seller'}
                            {showActionModal === 'reject' && 'Reject Seller'}
                            {showActionModal === 'suspend' && 'Suspend Seller'}
                            {showActionModal === 'activate' && 'Reactivate Seller'}
                            {showActionModal === 'block' && 'Block Seller'}
                            {showActionModal === 'unblock' && 'Unblock Seller'}
                            {showActionModal === 'commission' && 'Set Commission Rate'}
                        </h3>

                        <div className="space-y-4">
                            {showActionModal === 'approve' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Commission Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={actionData.commissionPercentage}
                                        onChange={(e) => setActionData({ ...actionData, commissionPercentage: Number(e.target.value) })}
                                        min="0"
                                        max="50"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                            )}

                            {showActionModal === 'commission' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">New Commission Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={actionData.commissionPercentage}
                                        onChange={(e) => setActionData({ ...actionData, commissionPercentage: Number(e.target.value) })}
                                        min="0"
                                        max="50"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                            )}

                            {['reject', 'suspend', 'block'].includes(showActionModal) && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Reason *</label>
                                    <textarea
                                        value={actionData.reason}
                                        onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                                        placeholder="Provide a reason..."
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                                        rows={3}
                                    />
                                </div>
                            )}

                            {['approve', 'reject'].includes(showActionModal) && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                                    <textarea
                                        value={actionData.notes}
                                        onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:border-slate-600"
                                        rows={2}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    onClick={() => { setShowActionModal(null); setActionData({ reason: '', notes: '', commissionPercentage: 10 }); }}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={actionLoading || (['reject', 'suspend', 'block'].includes(showActionModal) && !actionData.reason)}
                                    className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${['approve', 'activate'].includes(showActionModal)
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : showActionModal === 'commission'
                                            ? 'bg-indigo-600 hover:bg-indigo-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {actionLoading ? 'Processing...' : (showActionModal === 'unblock' ? 'Unblock' : 'Confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDetail;
