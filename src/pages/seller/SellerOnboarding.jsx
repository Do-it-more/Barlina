import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
    Store,
    ArrowRight,
    ArrowLeft,
    Loader,
    CheckCircle,
    User,
    Building2,
    CreditCard,
    FileText,
    Shield,
    Phone,
    Mail,
    MapPin,
    Upload,
    X,
    AlertCircle,
    Clock,
    Eye,
    EyeOff,
    Sparkles,
    BadgeCheck,
    FileCheck,
    ChevronRight,
    Camera,
    Landmark,
    Info
} from 'lucide-react';

const SellerOnboarding = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [existingSeller, setExistingSeller] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [uploadProgress, setUploadProgress] = useState({});

    // Form Data
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        businessName: '',
        ownerName: user?.name || '',
        email: user?.email || '',
        phone: user?.phoneNumber || '',
        sellerType: 'INDIVIDUAL',

        // Step 2: Tax & Legal
        pan: '',
        gstin: '',

        // Step 3: Address
        businessAddress: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        },

        // Step 4: Bank Details
        bankDetails: {
            accountNumber: '',
            confirmAccountNumber: '',
            ifsc: '',
            holderName: '',
            bankName: '',
            branchName: ''
        },

        // Step 5: KYC Documents
        kyc: {
            panUrl: '',
            aadhaarUrl: '',
            addressProofUrl: '',
            businessProofUrl: '',
            chequeUrl: '',
            bankProofUrl: '',
            gstCertificateUrl: '',
            sellerPhotoUrl: ''
        },

        // Agreement
        agreeTerms: false,
        agreeTaxCompliance: false
    });

    const [showAccountNumber, setShowAccountNumber] = useState(false);

    // Check if user already has a seller account
    useEffect(() => {
        checkExistingStatus();
    }, []);

    const checkExistingStatus = async () => {
        try {
            const res = await api.get('/sellers/profile');
            if (res.data) {
                setExistingSeller(res.data);
                // Set current step based on onboarding progress
                setCurrentStep(res.data.onboardingStep || 1);
                // Pre-fill existing data
                setFormData(prev => ({
                    ...prev,
                    businessName: res.data.businessName || '',
                    ownerName: res.data.ownerName || '',
                    email: res.data.email || '',
                    phone: res.data.phone || '',
                    sellerType: res.data.sellerType || 'INDIVIDUAL',
                    pan: res.data.pan || '',
                    gstin: res.data.gstin || '',
                    businessAddress: res.data.businessAddress || prev.businessAddress,
                    bankDetails: {
                        ...prev.bankDetails,
                        ...res.data.bankDetails,
                        confirmAccountNumber: res.data.bankDetails?.accountNumber || ''
                    },
                    kyc: res.data.kyc || prev.kyc
                }));
            }
        } catch (error) {
            // No existing seller account, start fresh
        } finally {
            setCheckingStatus(false);
        }
    };

    const steps = [
        { id: 1, title: 'Business Info', icon: Building2, description: 'Basic business details' },
        { id: 2, title: 'Tax Details', icon: FileText, description: 'PAN & GST information' },
        { id: 3, title: 'Address', icon: MapPin, description: 'Business location' },
        { id: 4, title: 'Bank Account', icon: Landmark, description: 'Payout details' },
        { id: 5, title: 'Documents', icon: FileCheck, description: 'KYC verification' },
        { id: 6, title: 'Review', icon: Shield, description: 'Final submission' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const handleFileUpload = async (field, file) => {
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showToast('File size should be less than 5MB', 'error');
            return;
        }

        setUploadProgress(prev => ({ ...prev, [field]: 0 }));

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('type', 'kyc');

        try {
            const res = await api.post('/upload', formDataUpload, {
                headers: {
                    'Content-Type': undefined,
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(prev => ({ ...prev, [field]: percent }));
                }
            });

            handleNestedChange('kyc', field, res.data.url);
            setUploadProgress(prev => ({ ...prev, [field]: 100 }));
            showToast('Document uploaded successfully', 'success');
        } catch (error) {
            console.error('[Upload Error]', error);
            const msg = error.response?.data?.message || 'Failed to upload document';
            showToast(msg, 'error');
            setUploadProgress(prev => ({ ...prev, [field]: 0 }));
        }
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.businessName || !formData.ownerName || !formData.email || !formData.phone) {
                    showToast('Please fill all required fields', 'error');
                    return false;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    showToast('Please enter a valid email', 'error');
                    return false;
                }
                if (!/^[6-9]\d{9}$/.test(formData.phone)) {
                    showToast('Please enter a valid 10-digit mobile number', 'error');
                    return false;
                }
                return true;

            case 2:
                if (!formData.pan || formData.pan.length !== 10) {
                    showToast('Please enter a valid 10-character PAN', 'error');
                    return false;
                }
                if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
                    showToast('Invalid PAN format (e.g., ABCDE1234F)', 'error');
                    return false;
                }
                if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
                    showToast('Invalid GSTIN format', 'error');
                    return false;
                }
                return true;

            case 3:
                const addr = formData.businessAddress;
                if (!addr.street || !addr.city || !addr.state || !addr.pincode) {
                    showToast('Please fill all address fields', 'error');
                    return false;
                }
                if (!/^\d{6}$/.test(addr.pincode)) {
                    showToast('Please enter a valid 6-digit pincode', 'error');
                    return false;
                }
                return true;

            case 4:
                const bank = formData.bankDetails;
                if (!bank.accountNumber || !bank.ifsc || !bank.holderName || !bank.bankName) {
                    showToast('Please fill all bank details', 'error');
                    return false;
                }
                if (bank.accountNumber !== bank.confirmAccountNumber) {
                    showToast('Account numbers do not match', 'error');
                    return false;
                }
                if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc)) {
                    showToast('Invalid IFSC code format', 'error');
                    return false;
                }
                return true;

            case 5:
                if (!formData.kyc.panUrl || !formData.kyc.aadhaarUrl || !formData.kyc.sellerPhotoUrl) {
                    showToast('Please upload PAN, Aadhaar, and Seller Photo', 'error');
                    return false;
                }
                return true;

            case 6:
                if (!formData.agreeTerms || !formData.agreeTaxCompliance) {
                    showToast('Please accept all terms and conditions', 'error');
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const saveStep = async (step) => {
        setLoading(true);
        try {
            let endpoint = '/sellers';
            let data = {};

            switch (step) {
                case 1:
                    endpoint = existingSeller ? '/sellers/profile' : '/sellers/register';
                    data = {
                        businessName: formData.businessName,
                        ownerName: formData.ownerName,
                        email: formData.email,
                        phone: formData.phone,
                        sellerType: formData.sellerType
                    };
                    break;
                case 2:
                    endpoint = '/sellers/profile';
                    data = {
                        pan: formData.pan,
                        gstin: formData.gstin
                    };
                    break;
                case 3:
                    endpoint = '/sellers/profile';
                    data = {
                        businessAddress: formData.businessAddress
                    };
                    break;
                case 4:
                    endpoint = '/sellers/bank';
                    data = {
                        accountNumber: formData.bankDetails.accountNumber,
                        ifsc: formData.bankDetails.ifsc,
                        holderName: formData.bankDetails.holderName,
                        bankName: formData.bankDetails.bankName,
                        branchName: formData.bankDetails.branchName
                    };
                    break;
                case 5:
                    endpoint = '/sellers/kyc';
                    data = formData.kyc;
                    break;
                default:
                    break;
            }

            if (existingSeller || step > 1) {
                await api.put(endpoint, data);
            } else {
                const res = await api.post(endpoint, data);
                setExistingSeller(res.data.seller || res.data);
            }

            return true;
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (!validateStep(currentStep)) return;

        if (currentStep < 6) {
            const saved = await saveStep(currentStep);
            if (saved) {
                setCurrentStep(prev => prev + 1);
            }
        } else {
            await handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/sellers/submit');
            showToast('Application submitted successfully! We will review your application within 2-3 business days.', 'success');
            navigate('/seller/dashboard');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to submit application', 'error');
        } finally {
            setLoading(false);
        }
    };

    // File Upload Component
    const FileUploadField = ({ label, field, accept = 'image/*,.pdf', required = false }) => {
        const [localKey, setLocalKey] = useState(0);

        const handleChange = async (e) => {
            const file = e.target.files?.[0];
            if (file) {
                await handleFileUpload(field, file);
                // Reset the input by changing key
                setLocalKey(prev => prev + 1);
            }
        };

        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    {label} {required && <span className="text-red-400">*</span>}
                </label>
                <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${formData.kyc[field]
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-600 hover:border-violet-500 bg-slate-800/50'
                    }`}>
                    {formData.kyc[field] ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Document Uploaded</p>
                                    <p className="text-xs text-gray-400">Click to replace</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleNestedChange('kyc', field, '');
                                }}
                                className="p-1 rounded-lg hover:bg-red-500/20 text-red-400"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center cursor-pointer">
                            {uploadProgress[field] > 0 && uploadProgress[field] < 100 ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader className="h-8 w-8 text-violet-400 animate-spin" />
                                    <p className="text-sm text-gray-400">Uploading... {uploadProgress[field]}%</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-400">Click to upload or drag & drop</p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 5MB</p>
                                </>
                            )}
                            <input
                                key={localKey}
                                type="file"
                                accept={accept}
                                className="hidden"
                                onChange={handleChange}
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-10 w-10 animate-spin text-violet-500 mx-auto mb-4" />
                    <p className="text-gray-400">Checking your status...</p>
                </div>
            </div>
        );
    }

    // If already submitted, show status
    if (existingSeller && ['PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(existingSeller.status)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Application Under Review</h2>
                    <p className="text-gray-400 mb-6">
                        Your seller application is being reviewed by our team. This typically takes 2-3 business days.
                    </p>
                    <div className="p-4 bg-slate-700/50 rounded-xl text-left mb-6">
                        <p className="text-sm text-gray-300"><strong>Business:</strong> {existingSeller.businessName}</p>
                        <p className="text-sm text-gray-300 mt-1"><strong>Status:</strong>
                            <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                                {existingSeller.status.replace('_', ' ')}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    // If approved, redirect to dashboard
    if (existingSeller && existingSeller.status === 'APPROVED') {
        navigate('/seller/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
                        <Store className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-yellow-400" />
                        Become a Seller
                    </h1>
                    <p className="text-gray-400 mt-2">Complete your seller profile to start selling</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-700">
                            <div
                                className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-500"
                                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                            />
                        </div>

                        {steps.map((step) => {
                            const Icon = step.icon;
                            const isCompleted = currentStep > step.id;
                            const isCurrent = currentStep === step.id;

                            return (
                                <div key={step.id} className="relative flex flex-col items-center z-10">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : isCurrent
                                            ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                                            : 'bg-slate-700 text-gray-400'
                                        }`}>
                                        {isCompleted ? (
                                            <CheckCircle className="h-6 w-6" />
                                        ) : (
                                            <Icon className="h-5 w-5" />
                                        )}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium hidden sm:block ${isCurrent ? 'text-violet-400' : isCompleted ? 'text-emerald-400' : 'text-gray-500'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
                    {/* Step Header */}
                    <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-violet-600/10 to-purple-600/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            {React.createElement(steps[currentStep - 1].icon, { className: 'h-6 w-6 text-violet-400' })}
                            {steps[currentStep - 1].title}
                        </h2>
                        <p className="text-gray-400 mt-1">{steps[currentStep - 1].description}</p>
                    </div>

                    {/* Form Content */}
                    <div className="p-6">
                        {/* Step 1: Business Info */}
                        {currentStep === 1 && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Business / Store Name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.businessName}
                                                onChange={(e) => handleInputChange('businessName', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                                placeholder="Your Business Name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Owner Name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.ownerName}
                                                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                                placeholder="Your Full Name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Email Address <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                                placeholder="business@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Phone Number <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                                placeholder="9876543210"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Seller Type <span className="text-red-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { value: 'INDIVIDUAL', label: 'Individual', icon: User },
                                            { value: 'PROPRIETORSHIP', label: 'Proprietorship', icon: Store },
                                            { value: 'PARTNERSHIP', label: 'Partnership', icon: Building2 },
                                            { value: 'COMPANY', label: 'Company/LLP', icon: Building2 }
                                        ].map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => handleInputChange('sellerType', type.value)}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.sellerType === type.value
                                                    ? 'border-violet-500 bg-violet-500/20 text-white'
                                                    : 'border-slate-600 bg-slate-700/30 text-gray-400 hover:border-slate-500'
                                                    }`}
                                            >
                                                <type.icon className="h-5 w-5" />
                                                <span className="text-xs font-medium">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Tax Details */}
                        {currentStep === 2 && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            PAN Number <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.pan}
                                                onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase().slice(0, 10))}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white uppercase transition-all"
                                                placeholder="ABCDE1234F"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Required for all sellers</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            GSTIN <span className="text-gray-500">(Optional for small sellers)</span>
                                        </label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.gstin}
                                                onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase().slice(0, 15))}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white uppercase transition-all"
                                                placeholder="22AAAAA0000A1Z5"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">15-character GST Identification Number</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-blue-400">Tax Information</p>
                                            <p className="text-sm text-blue-300/70 mt-1">
                                                PAN is mandatory for all sellers. GSTIN is optional for sellers with annual turnover below ₹40 lakhs.
                                                We'll help you with GST registration if needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Address */}
                        {currentStep === 3 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Street Address <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <textarea
                                            value={formData.businessAddress.street}
                                            onChange={(e) => handleNestedChange('businessAddress', 'street', e.target.value)}
                                            rows={2}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all resize-none"
                                            placeholder="Building name, street, area"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            City <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.businessAddress.city}
                                            onChange={(e) => handleNestedChange('businessAddress', 'city', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            State <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            value={formData.businessAddress.state}
                                            onChange={(e) => handleNestedChange('businessAddress', 'state', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                        >
                                            <option value="">Select State</option>
                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                            <option value="Karnataka">Karnataka</option>
                                            <option value="Kerala">Kerala</option>
                                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                                            <option value="Maharashtra">Maharashtra</option>
                                            <option value="Delhi">Delhi</option>
                                            <option value="Gujarat">Gujarat</option>
                                            <option value="West Bengal">West Bengal</option>
                                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Pincode <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.businessAddress.pincode}
                                            onChange={(e) => handleNestedChange('businessAddress', 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                            placeholder="600001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                                        <input
                                            type="text"
                                            value={formData.businessAddress.country}
                                            disabled
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Bank Details */}
                        {currentStep === 4 && (
                            <div className="space-y-5">
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-amber-400">Secure Bank Details</p>
                                            <p className="text-sm text-amber-300/70 mt-1">
                                                Your bank details are encrypted and securely stored. These will be used for payout transfers only.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Account Holder Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankDetails.holderName}
                                            onChange={(e) => handleNestedChange('bankDetails', 'holderName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                            placeholder="As per bank records"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Bank Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankDetails.bankName}
                                            onChange={(e) => handleNestedChange('bankDetails', 'bankName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                            placeholder="e.g., HDFC Bank"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Account Number <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showAccountNumber ? 'text' : 'password'}
                                                value={formData.bankDetails.accountNumber}
                                                onChange={(e) => handleNestedChange('bankDetails', 'accountNumber', e.target.value.replace(/\D/g, ''))}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all pr-12"
                                                placeholder="Account number"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAccountNumber(!showAccountNumber)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            >
                                                {showAccountNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Confirm Account Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankDetails.confirmAccountNumber}
                                            onChange={(e) => handleNestedChange('bankDetails', 'confirmAccountNumber', e.target.value.replace(/\D/g, ''))}
                                            className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border focus:ring-2 focus:ring-violet-500/20 text-white transition-all ${formData.bankDetails.confirmAccountNumber && formData.bankDetails.accountNumber !== formData.bankDetails.confirmAccountNumber
                                                ? 'border-red-500'
                                                : formData.bankDetails.confirmAccountNumber && formData.bankDetails.accountNumber === formData.bankDetails.confirmAccountNumber
                                                    ? 'border-emerald-500'
                                                    : 'border-slate-600'
                                                }`}
                                            placeholder="Re-enter account number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            IFSC Code <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankDetails.ifsc}
                                            onChange={(e) => handleNestedChange('bankDetails', 'ifsc', e.target.value.toUpperCase().slice(0, 11))}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white uppercase transition-all"
                                            placeholder="e.g., HDFC0001234"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Branch Name</label>
                                        <input
                                            type="text"
                                            value={formData.bankDetails.branchName}
                                            onChange={(e) => handleNestedChange('bankDetails', 'branchName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white transition-all"
                                            placeholder="Branch name"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Documents */}
                        {currentStep === 5 && (
                            <div className="space-y-5">
                                {/* Required Identity Documents */}
                                <div>
                                    <h4 className="text-sm font-medium text-violet-400 mb-3 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Identity Documents (Required)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FileUploadField label="PAN Card" field="panUrl" required />
                                        <FileUploadField label="Aadhaar Card" field="aadhaarUrl" required />
                                        <FileUploadField label="Seller Photo" field="sellerPhotoUrl" accept="image/*" required />
                                    </div>
                                </div>

                                {/* Bank Verification Documents */}
                                <div>
                                    <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                        <Landmark className="h-4 w-4" />
                                        Bank Verification
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FileUploadField label="Cancelled Cheque" field="chequeUrl" />
                                        <FileUploadField label="Bank Statement / Passbook" field="bankProofUrl" />
                                    </div>
                                </div>

                                {/* Address & Business Documents */}
                                <div>
                                    <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Address & Business Documents
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FileUploadField label="Address Proof" field="addressProofUrl" />
                                        <FileUploadField label="GST Certificate" field="gstCertificateUrl" />
                                        {formData.sellerType !== 'INDIVIDUAL' && (
                                            <FileUploadField label="Business Registration Proof" field="businessProofUrl" />
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-700/50 rounded-xl">
                                    <h4 className="font-medium text-white mb-2">Accepted Documents:</h4>
                                    <ul className="text-sm text-gray-400 space-y-1">
                                        <li>• <strong className="text-gray-300">PAN Card:</strong> Clear photo of your PAN card</li>
                                        <li>• <strong className="text-gray-300">Aadhaar:</strong> Front and back of Aadhaar card</li>
                                        <li>• <strong className="text-gray-300">Seller Photo:</strong> Recent passport-size photo of the owner</li>
                                        <li>• <strong className="text-gray-300">Cancelled Cheque:</strong> For bank account verification</li>
                                        <li>• <strong className="text-gray-300">Bank Statement:</strong> Latest 3 months statement or first page of passbook</li>
                                        <li>• <strong className="text-gray-300">Address Proof:</strong> Utility bill, rental agreement, or bank statement</li>
                                        <li>• <strong className="text-gray-300">GST Certificate:</strong> GST registration certificate (if applicable)</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Review */}
                        {currentStep === 6 && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-700/50 rounded-xl">
                                        <h4 className="font-medium text-violet-400 mb-3 flex items-center gap-2">
                                            <Building2 className="h-4 w-4" /> Business Info
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-gray-300"><span className="text-gray-500">Business:</span> {formData.businessName}</p>
                                            <p className="text-gray-300"><span className="text-gray-500">Owner:</span> {formData.ownerName}</p>
                                            <p className="text-gray-300"><span className="text-gray-500">Type:</span> {formData.sellerType}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-700/50 rounded-xl">
                                        <h4 className="font-medium text-violet-400 mb-3 flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Tax Details
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-gray-300"><span className="text-gray-500">PAN:</span> {formData.pan}</p>
                                            <p className="text-gray-300"><span className="text-gray-500">GSTIN:</span> {formData.gstin || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-700/50 rounded-xl">
                                        <h4 className="font-medium text-violet-400 mb-3 flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Address
                                        </h4>
                                        <p className="text-sm text-gray-300">
                                            {formData.businessAddress.street}, {formData.businessAddress.city}, {formData.businessAddress.state} - {formData.businessAddress.pincode}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-700/50 rounded-xl">
                                        <h4 className="font-medium text-violet-400 mb-3 flex items-center gap-2">
                                            <Landmark className="h-4 w-4" /> Bank Account
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-gray-300"><span className="text-gray-500">Bank:</span> {formData.bankDetails.bankName}</p>
                                            <p className="text-gray-300"><span className="text-gray-500">A/C:</span> ****{formData.bankDetails.accountNumber.slice(-4)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Status */}
                                <div className="p-4 bg-slate-700/50 rounded-xl">
                                    <h4 className="font-medium text-violet-400 mb-3 flex items-center gap-2">
                                        <FileCheck className="h-4 w-4" /> Documents Uploaded
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'PAN Card', field: 'panUrl' },
                                            { label: 'Aadhaar', field: 'aadhaarUrl' },
                                            { label: 'Seller Photo', field: 'sellerPhotoUrl' },
                                            { label: 'Cancelled Cheque', field: 'chequeUrl' },
                                            { label: 'Bank Statement', field: 'bankProofUrl' },
                                            { label: 'Address Proof', field: 'addressProofUrl' },
                                            { label: 'GST Certificate', field: 'gstCertificateUrl' },
                                            { label: 'Business Proof', field: 'businessProofUrl' }
                                        ].map((doc) => (
                                            <div key={doc.field} className={`p-3 rounded-lg flex items-center gap-2 ${formData.kyc[doc.field] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-gray-400'}`}>
                                                {formData.kyc[doc.field] ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                <span className="text-xs">{doc.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Terms & Conditions */}
                                <div className="space-y-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreeTerms}
                                            onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                                            className="mt-1 rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                                        />
                                        <span className="text-sm text-gray-300">
                                            I agree to the <a href="#" className="text-violet-400 hover:underline">Seller Terms & Conditions</a>,
                                            <a href="#" className="text-violet-400 hover:underline"> Privacy Policy</a>, and
                                            <a href="#" className="text-violet-400 hover:underline"> Marketplace Guidelines</a>.
                                        </span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreeTaxCompliance}
                                            onChange={(e) => handleInputChange('agreeTaxCompliance', e.target.checked)}
                                            className="mt-1 rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                                        />
                                        <span className="text-sm text-gray-300">
                                            I confirm that I am responsible for all tax compliance and the information provided is accurate.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="p-6 border-t border-slate-700 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStep === 1 || loading}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : currentStep === 6 ? (
                                <>
                                    <BadgeCheck className="h-5 w-5" />
                                    Submit Application
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerOnboarding;
