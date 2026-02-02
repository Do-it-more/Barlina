import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    ShieldCheck,
    FileText,
    Upload,
    CheckCircle,
    AlertCircle,
    Clock,
    Loader,
    Eye,
    X,
    Download,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const SellerKYC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState(null);
    const [uploading, setUploading] = useState({});
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchSellerProfile();
    }, []);

    const fetchSellerProfile = async () => {
        try {
            const { data } = await api.get('/sellers/profile');
            setSeller(data);
        } catch (error) {
            showToast('Failed to load KYC details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (field, file) => {
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('File size should be less than 5MB', 'error');
            return;
        }

        setUploading(prev => ({ ...prev, [field]: true }));

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'seller-kyc');

            const { data } = await api.post('/upload', formDataUpload);

            // Update seller KYC
            await api.put('/sellers/kyc', { [field]: data.url });

            showToast('Document uploaded successfully', 'success');
            fetchSellerProfile();
        } catch (error) {
            showToast('Failed to upload document', 'error');
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const getKycStatusBadge = (status) => {
        const styles = {
            'VERIFIED': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
            'PENDING': { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
            'SUBMITTED': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: FileText },
            'REJECTED': { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
            'NOT_SUBMITTED': { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: FileText }
        };
        return styles[status] || styles['NOT_SUBMITTED'];
    };

    const documents = [
        { key: 'panUrl', label: 'PAN Card', required: true },
        { key: 'aadhaarUrl', label: 'Aadhaar Card', required: true },
        { key: 'sellerPhotoUrl', label: 'Seller Photo', required: true },
        { key: 'bankProofUrl', label: 'Bank Statement / Passbook', required: false },
        { key: 'addressProofUrl', label: 'Address Proof', required: false },
        { key: 'gstCertificateUrl', label: 'GST Certificate', required: false },
        { key: 'proofOfOwnershipUrl', label: 'Proof of Ownership', required: false },
        { key: 'businessCertificateUrl', label: 'Govt. Approval Certificate', required: false },
        { key: 'businessProofUrl', label: 'Business Registration Proof', required: false }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const kycStatus = seller?.kyc?.status || 'NOT_SUBMITTED';
    const StatusIcon = getKycStatusBadge(kycStatus).icon;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-violet-500" />
                            KYC & Compliance
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Verify your identity and documents
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getKycStatusBadge(kycStatus).bg}`}>
                        <StatusIcon className={`w-5 h-5 ${getKycStatusBadge(kycStatus).text}`} />
                        <span className={`font-medium ${getKycStatusBadge(kycStatus).text}`}>
                            {kycStatus.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>

                {/* Tax Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tax Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">PAN Number</label>
                            <p className="text-gray-900 dark:text-white font-mono">{seller?.pan || '-'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">GSTIN</label>
                            <p className="text-gray-900 dark:text-white font-mono">{seller?.gstin || 'Not Provided'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">IEC</label>
                            <p className="text-gray-900 dark:text-white font-mono">{seller?.iec || 'Not Provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Rejection Reason */}
                {kycStatus === 'REJECTED' && seller?.kyc?.rejectionReason && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-400">KYC Rejected</p>
                                <p className="text-red-300/80 text-sm mt-1">{seller.kyc.rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents Grid */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Uploaded Documents</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => {
                            const url = seller?.kyc?.[doc.key];
                            const isUploading = uploading[doc.key];

                            return (
                                <div
                                    key={doc.key}
                                    className={`p-4 rounded-xl border ${url ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {doc.label}
                                            {doc.required && <span className="text-red-400 ml-1">*</span>}
                                        </span>
                                        {url && (
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        )}
                                    </div>

                                    {url ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPreviewUrl(url)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600/20 text-violet-400 rounded-lg hover:bg-violet-600/30 transition-colors text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors text-sm cursor-pointer">
                                                <RefreshCw className="w-4 h-4" />
                                                Replace
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploading ? 'border-violet-500 bg-violet-500/10' : 'border-gray-300 dark:border-slate-600 hover:border-violet-500'}`}>
                                            {isUploading ? (
                                                <Loader className="w-5 h-5 animate-spin text-violet-500" />
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-gray-400" />
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">Upload</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                                                disabled={isUploading}
                                            />
                                        </label>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Preview Modal */}
                {previewUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewUrl(null)}>
                        <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {previewUrl.endsWith('.pdf') ? (
                                <iframe src={previewUrl} className="w-full h-[80vh]" />
                            ) : (
                                <img src={previewUrl} alt="Document Preview" className="max-w-full max-h-[80vh] object-contain" />
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SellerKYC;
