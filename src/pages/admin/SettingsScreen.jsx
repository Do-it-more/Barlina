import React, { useState, useEffect } from 'react';
import {
    Save, Building2, Phone, Mail, FileText, Check, ChevronDown, Edit2, X,
    Truck, CreditCard, Gift, MessageSquare, Settings as SettingsIcon, ShoppingBag, Key, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SettingsScreen = () => {
    const { showToast } = useToast();
    const [settings, setSettings] = useState({
        paymentGateways: {
            cashfree: { appId: '', secretKey: '', isProduction: false },
            instamojo: { apiKey: '', authToken: '', isProduction: false },
            razorpay: { keyId: '', keySecret: '', isProduction: false },
            activeGateway: 'razorpay'
        },
        companyAddress: { street: '', city: '', state: '', pincode: '' },
        companyName: '',
        companyPhone: '',
        companyEmail: '',
        companyGST: '',
        isCodAvailable: true,
        isStockCountVisible: true,
        isSpecialOffersEnabled: true,
        isChatbotEnabled: true,
        defaultEstimatedDeliveryDays: 5,
        returnPolicyDays: 7,
        areReturnsActive: true
    });
    const [loading, setLoading] = useState(true);

    // Company Editing State
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [isSavingCompany, setIsSavingCompany] = useState(false);
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showPaymentSaveConfirm, setShowPaymentSaveConfirm] = useState(false);

    const handleTextChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleAddressChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            companyAddress: { ...prev.companyAddress, [key]: value }
        }));
    };

    const handleToggle = async (key, value) => {
        try {
            const updatedSettings = { ...settings, [key]: value };
            setSettings(updatedSettings);
            await api.put('/settings', { [key]: value });
            showToast('Settings updated', 'success');
        } catch (error) {
            showToast('Failed to update settings', 'error');
        }
    };

    const handlePaymentConfigChange = (gateway, key, value) => {
        setSettings(prev => ({
            ...prev,
            paymentGateways: {
                ...prev.paymentGateways,
                [gateway]: { ...prev.paymentGateways[gateway], [key]: value }
            }
        }));
    };

    const handleActiveGatewayChange = (value) => {
        setSettings(prev => ({
            ...prev,
            paymentGateways: { ...prev.paymentGateways, activeGateway: value }
        }));
    };

    const savePaymentSettings = async () => {
        setIsSavingPayment(true);
        try {
            await api.put('/settings', {
                paymentGateways: settings.paymentGateways
            });
            showToast('Payment gateway settings updated', 'success');
            setShowPaymentSaveConfirm(false);
        } catch (error) {
            showToast('Failed to update payment settings', 'error');
        } finally {
            setIsSavingPayment(false);
        }
    };

    const saveCompanyInfo = async () => {
        setIsSavingCompany(true);
        try {
            await api.put('/settings', {
                companyName: settings.companyName,
                companyPhone: settings.companyPhone,
                companyEmail: settings.companyEmail,
                companyGST: settings.companyGST,
                companyAddress: settings.companyAddress
            });
            showToast('Company details updated', 'success');
            setIsEditingCompany(false);
            setShowSaveConfirm(false);
        } catch (error) {
            showToast('Failed to update company details', 'error');
        } finally {
            setIsSavingCompany(false);
        }
    };

    const cancelEditing = () => {
        fetchSettings(); // Reset to original values
        setIsEditingCompany(false);
    };

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            if (data) setSettings(prev => ({ ...prev, ...data }));
        } catch (error) {
            showToast('Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Store Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage global configurations for your store</p>
            </div>


            {/* Company Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md group">
                {/* Card Header (Interactive) */}
                <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    onClick={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:scale-110 transition-transform duration-200">
                            <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Company Information
                                {!isCompanyInfoExpanded && settings.companyName && (
                                    <span className="text-xs font-normal text-gray-400 hidden sm:inline">• {settings.companyName}</span>
                                )}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Basic details about your business entity</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isEditingCompany && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800 animate-pulse">
                                <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                                EDITING
                            </span>
                        )}
                        <div className={`p-1 rounded-md text-gray-400 transition-all duration-300 ${isCompanyInfoExpanded ? 'rotate-180 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-y-0.5'}`}>
                            <ChevronDown className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Card Content (Expandable) */}
                {isCompanyInfoExpanded && (
                    <div className="border-t border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Form Body */}
                        <div className={`p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 transition-all duration-300 ${!isEditingCompany ? 'opacity-70 grayscale-[0.2]' : 'opacity-100'}`}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        disabled={!isEditingCompany}
                                        value={settings.companyName || ''}
                                        onChange={(e) => handleTextChange('companyName', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-sm disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        disabled={!isEditingCompany}
                                        value={settings.companyPhone || ''}
                                        onChange={(e) => handleTextChange('companyPhone', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-sm disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        disabled={!isEditingCompany}
                                        value={settings.companyEmail || ''}
                                        onChange={(e) => handleTextChange('companyEmail', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-sm disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number (Optional)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        disabled={!isEditingCompany}
                                        value={settings.companyGST || ''}
                                        onChange={(e) => handleTextChange('companyGST', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-sm uppercase disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                        placeholder="Enter GSTIN"
                                    />
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="md:col-span-2 mt-4">
                                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Registration Address</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street / Building</label>
                                        <input
                                            type="text"
                                            disabled={!isEditingCompany}
                                            value={settings.companyAddress?.street || ''}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input
                                            type="text"
                                            disabled={!isEditingCompany}
                                            value={settings.companyAddress?.city || ''}
                                            onChange={(e) => handleAddressChange('city', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                                        <input
                                            type="text"
                                            disabled={!isEditingCompany}
                                            value={settings.companyAddress?.state || ''}
                                            onChange={(e) => handleAddressChange('state', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                            placeholder="Enter State"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                                        <input
                                            type="text"
                                            disabled={!isEditingCompany}
                                            value={settings.companyAddress?.pincode || ''}
                                            onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Actions Toolbar */}
                            <div className="px-8 py-4 bg-gray-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700 flex justify-end items-center gap-3">
                                {!isEditingCompany ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditingCompany(true); }}
                                        className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-blue-600 hover:text-white dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-lg transition-all border border-blue-200 dark:border-blue-800 shadow-sm"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        EDIT DETAILS
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-gray-200 dark:border-slate-700"
                                        >
                                            <X className="h-4 w-4" />
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSaveConfirm(true); }}
                                            disabled={isSavingCompany}
                                            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                                        >
                                            {isSavingCompany ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4" />
                                            )}
                                            SAVE CHANGES
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Confirmation Modal */}
            {showSaveConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Save Changes?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                Are you sure you want to update your company information? This will be reflected across the platform.
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => setShowSaveConfirm(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
                                >
                                    NOT NOW
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSaveConfirm(false);
                                        saveCompanyInfo();
                                    }}
                                    className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                                >
                                    YES, UPDATE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Methods Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Methods</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure available payment options for customers</p>
                    </div>
                </div>

                <div className="p-6 divide-y divide-gray-100 dark:divide-slate-700">
                    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <Truck className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cash on Delivery (COD)</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                    Enable or disable Cash on Delivery as a payment option during checkout.
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.isCodAvailable}
                                onChange={(e) => handleToggle('isCodAvailable', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* Razorpay Gateway Configuration Section */}
                    <div className="py-8">
                        <div className="mb-8">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Razorpay Gateway</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Configure credentials for Razorpay payments</p>
                        </div>

                        {/* Credentials Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Razorpay Config */}
                            <div className="p-4 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Razorpay Credentials</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key ID</label>
                                        <input
                                            type="text"
                                            value={settings.paymentGateways?.razorpay?.keyId || ''}
                                            onChange={(e) => handlePaymentConfigChange('razorpay', 'keyId', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white"
                                            placeholder="Enter Key ID"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key Secret</label>
                                        <input
                                            type="password"
                                            value={settings.paymentGateways?.razorpay?.keySecret || ''}
                                            onChange={(e) => handlePaymentConfigChange('razorpay', 'keySecret', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white"
                                            placeholder="Enter Key Secret"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.paymentGateways?.razorpay?.isProduction || false}
                                            onChange={(e) => handlePaymentConfigChange('razorpay', 'isProduction', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Production Mode</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Bottom Actions */}
                        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-700/50 flex justify-end">
                            <button
                                onClick={() => setShowPaymentSaveConfirm(true)}
                                disabled={isSavingPayment}
                                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                SAVE CREDENTIALS
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Payment Save Confirmation Modal */}
            {showPaymentSaveConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                <Key className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Update Credentials</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                Updating payment gateway credentials can affect your checkout process. Please ensure the keys are correct.
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => setShowPaymentSaveConfirm(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
                                >
                                    BACK
                                </button>
                                <button
                                    onClick={savePaymentSettings}
                                    disabled={isSavingPayment}
                                    className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                                >
                                    {isSavingPayment ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "UPDATE NOW"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Configuration */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Stock Configuration</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage global inventory settings</p>
                    </div>
                </div>

                <div className="p-6 divide-y divide-gray-100 dark:divide-slate-700">
                    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <ShoppingBag className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Show Quantity Label</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                    Show "Only X left" messages to customers.
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.isStockCountVisible ?? true}
                                onChange={(e) => handleToggle('isStockCountVisible', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            </div>


            {/* Delivery Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delivery Configuration</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage global delivery estimates</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Default Delivery Time</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                    Set the global default estimated delivery time in days. This will be used if a product doesn't have a specific delivery time set.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                className="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white"
                                value={settings.defaultEstimatedDeliveryDays || 5}
                                onChange={(e) => {
                                    setSettings({ ...settings, defaultEstimatedDeliveryDays: e.target.value });
                                }}
                                onBlur={(e) => {
                                    handleToggle('defaultEstimatedDeliveryDays', e.target.value);
                                }}
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Returns Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <SettingsIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Returns Configuration</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage global return policy</p>
                    </div>
                </div>

                <div className="p-6 divide-y divide-gray-100 dark:divide-slate-700">
                    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <SettingsIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Enable Returns Globally</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                    If disabled, returns will be turned off for <strong>all products</strong>, regardless of individual product settings.
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.areReturnsActive ?? true}
                                onChange={(e) => handleToggle('areReturnsActive', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Chatbot Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chatbot Configuration</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage AI assistant availability</p>
                    </div>
                </div>

                <div className="p-6 divide-y divide-gray-100 dark:divide-slate-700">
                    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <MessageSquare className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Enable AI Chatbot</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                    Show the AI assistant bubble to customers for instant support.
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.isChatbotEnabled ?? true}
                                onChange={(e) => handleToggle('isChatbotEnabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Flash Deals / Special Offers Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Gift className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Flash Deals Banner</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage coupon code visibility on homepage</p>
                    </div>
                </div>

                <div className="p-6 divide-y divide-gray-100 dark:divide-slate-700">
                    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <Gift className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Show Flash Deals Section</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                    Display the special offers and coupon codes banner on the homepage hero section.
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.isSpecialOffersEnabled ?? true}
                                onChange={(e) => handleToggle('isSpecialOffersEnabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
