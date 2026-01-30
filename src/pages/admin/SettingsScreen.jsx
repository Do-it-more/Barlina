import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Save, Settings as SettingsIcon, Truck, CreditCard, Lock, Shield, Mail, Key, ShieldCheck, MessageSquare, ShoppingBag, Gift, Building2, Phone, FileText, MapPin, Edit2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = () => {
    const { user, login } = useAuth(); // Moved to top
    const { showToast } = useToast();

    const [settings, setSettings] = useState({
        isCodAvailable: true,
        companyName: '',
        companyGST: '',
        companyPAN: '',
        companyAddress: {},
        companyPhone: '',
        companyEmail: '',
        paymentGateways: {
            activeGateway: 'cashfree',
            cashfree: { isActive: true, appId: '', secretKey: '', isProduction: false },
            instamojo: { isActive: false, apiKey: '', authToken: '', isProduction: false }
        }
    });
    const [loading, setLoading] = useState(true);

    // Super Admin State
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [emailForm, setEmailForm] = useState({ email: '' });

    const checkTwoFactorStatus = async () => {
        // ideally fetch from /auth/me or verify a specific endpoint, 
        // but for now user object might have it if updated context
        // We'll trust the user context for now or fetch fresh profile
        try {
            const { data } = await api.get('/auth/me');
            setIsTwoFactorEnabled(data.isTwoFactorEnabled);
            setEmailForm({ email: data.email });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSettings();
        if (user?.role === 'super_admin') {
            checkTwoFactorStatus();
        }
    }, [user]);

    // Company Editing State
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [isSavingCompany, setIsSavingCompany] = useState(false);
    const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(true);

    const handleTextChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleAddressChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            companyAddress: {
                ...(typeof prev.companyAddress === 'object' ? prev.companyAddress : {}),
                [key]: value
            }
        }));
    };

    const handlePaymentConfigChange = (gateway, key, value) => {
        setSettings(prev => ({
            ...prev,
            paymentGateways: {
                ...prev.paymentGateways,
                [gateway]: {
                    ...prev.paymentGateways?.[gateway],
                    [key]: value
                }
            }
        }));
    };

    const handleActiveGatewayChange = (value) => {
        setSettings(prev => ({
            ...prev,
            paymentGateways: {
                ...prev.paymentGateways,
                activeGateway: value
            }
        }));
    };

    const savePaymentSettings = async () => {
        try {
            await api.put('/settings', {
                paymentGateways: settings.paymentGateways
            });
            showToast('Payment gateway settings updated', 'success');
        } catch (error) {
            showToast('Failed to update payment settings', 'error');
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
                companyPAN: settings.companyPAN,
                companyAddress: settings.companyAddress
            });
            showToast('Company details updated successfully', 'success');
            setIsEditingCompany(false);
        } catch (error) {
            showToast('Failed to save company details', 'error');
        } finally {
            setIsSavingCompany(false);
        }
    };

    const cancelEditing = () => {
        setIsEditingCompany(false);
        fetchSettings(); // Revert changes
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            await api.put('/auth/password', passwordForm);
            showToast('Password updated successfully', 'success');
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update password', 'error');
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();
        try {
            await api.put('/auth/profile', { email: emailForm.email });
            showToast('Email updated successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update email', 'error');
        }
    };

    const toggleTwoFactor = async () => {
        try {
            const { data } = await api.put('/auth/2fa');
            setIsTwoFactorEnabled(data.isTwoFactorEnabled);
            showToast(data.message, 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to toggle 2FA', 'error');
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            // Handle legacy address string
            if (typeof data.companyAddress === 'string') {
                data.companyAddress = {
                    street: data.companyAddress,
                    doorNo: '',
                    city: '',
                    district: '',
                    state: '',
                    pincode: ''
                };
            }
            setSettings(data);
        } catch (error) {
            showToast('Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key, value) => {
        // If value is provided, use it. Otherwise, toggle boolean.
        const newValue = value !== undefined ? value : !settings[key];
        const previousValue = settings[key];

        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: newValue }));

        try {
            await api.put('/settings', { [key]: newValue });
            showToast('Settings updated successfully', 'success');
        } catch (error) {
            // Revert on error
            setSettings(prev => ({ ...prev, [key]: previousValue }));
            showToast('Failed to update settings', 'error');
        }
    };

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


            {/* Company Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
                    >
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Company Information
                                {isCompanyInfoExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage business details for invoices</p>
                        </div>
                    </div>
                    <div>
                        {!isEditingCompany ? (
                            <button
                                onClick={() => setIsEditingCompany(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                                <Edit2 className="h-4 w-4" />
                                Edit Details
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={cancelEditing}
                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Cancel"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={saveCompanyInfo}
                                    disabled={isSavingCompany}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSavingCompany ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isCompanyInfoExpanded && (
                    <div className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${!isEditingCompany ? 'opacity-80' : 'opacity-100'}`}>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    disabled={!isEditingCompany}
                                    value={settings.companyGST || ''}
                                    onChange={(e) => handleTextChange('companyGST', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-sm disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    disabled={!isEditingCompany}
                                    value={settings.companyPAN || ''}
                                    onChange={(e) => handleTextChange('companyPAN', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-sm disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                                />
                            </div>
                        </div>
                        {/* Address Fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Door No</label>
                            <input
                                type="text"
                                disabled={!isEditingCompany}
                                value={settings.companyAddress?.doorNo || ''}
                                onChange={(e) => handleAddressChange('doorNo', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street / Landmark</label>
                            <input
                                type="text"
                                disabled={!isEditingCompany}
                                value={settings.companyAddress?.street || ''}
                                onChange={(e) => handleAddressChange('street', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City / Area</label>
                            <input
                                type="text"
                                disabled={!isEditingCompany}
                                value={settings.companyAddress?.city || ''}
                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District</label>
                            <input
                                type="text"
                                disabled={!isEditingCompany}
                                value={settings.companyAddress?.district || ''}
                                onChange={(e) => handleAddressChange('district', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                            <div className="relative">
                                <select
                                    disabled={!isEditingCompany}
                                    value={settings.companyAddress?.state || ''}
                                    onChange={(e) => handleAddressChange('state', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900/50 appearance-none pr-10"
                                >
                                    <option value="">Select State</option>
                                    {[
                                        "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
                                        "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
                                        "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
                                        "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
                                        "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
                                        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
                                    ].map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
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
                )}
            </div>

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

                    {/* Payment Gateway Configuration Section */}
                    <div className="py-6 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Online Payment Gateways</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure credentials for payment providers</p>
                            </div>
                            <button
                                onClick={savePaymentSettings}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                                <Save className="h-4 w-4 inline mr-2" />
                                Save Credentials
                            </button>
                        </div>

                        {/* Active Gateway Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Payment Gateway</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${settings.paymentGateways?.activeGateway === 'cashfree' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700'}`}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="activeGateway"
                                            value="cashfree"
                                            checked={settings.paymentGateways?.activeGateway === 'cashfree'}
                                            onChange={(e) => handleActiveGatewayChange(e.target.value)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="font-semibold text-slate-900 dark:text-white">Cashfree Payments</span>
                                    </div>
                                </label>
                                <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${settings.paymentGateways?.activeGateway === 'instamojo' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700'}`}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="activeGateway"
                                            value="instamojo"
                                            checked={settings.paymentGateways?.activeGateway === 'instamojo'}
                                            onChange={(e) => handleActiveGatewayChange(e.target.value)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="font-semibold text-slate-900 dark:text-white">Instamojo</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Credentials Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cashfree Config */}
                            <div className={`p-4 rounded-lg border ${settings.paymentGateways?.activeGateway === 'cashfree' ? 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 opacity-70'}`}>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Cashfree Credentials</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">App ID</label>
                                        <input
                                            type="text"
                                            value={settings.paymentGateways?.cashfree?.appId || ''}
                                            onChange={(e) => handlePaymentConfigChange('cashfree', 'appId', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white"
                                            placeholder="Enter App ID"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Secret Key</label>
                                        <input
                                            type="password"
                                            value={settings.paymentGateways?.cashfree?.secretKey || ''}
                                            onChange={(e) => handlePaymentConfigChange('cashfree', 'secretKey', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white"
                                            placeholder="Enter Secret Key"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.paymentGateways?.cashfree?.isProduction || false}
                                            onChange={(e) => handlePaymentConfigChange('cashfree', 'isProduction', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Production Mode</span>
                                    </div>
                                </div>
                            </div>

                            {/* Instamojo Config */}
                            <div className={`p-4 rounded-lg border ${settings.paymentGateways?.activeGateway === 'instamojo' ? 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 opacity-70'}`}>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Instamojo Credentials</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Key</label>
                                        <input
                                            type="text"
                                            value={settings.paymentGateways?.instamojo?.apiKey || ''}
                                            onChange={(e) => handlePaymentConfigChange('instamojo', 'apiKey', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white"
                                            placeholder="Enter API Key"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Auth Token</label>
                                        <input
                                            type="password"
                                            value={settings.paymentGateways?.instamojo?.authToken || ''}
                                            onChange={(e) => handlePaymentConfigChange('instamojo', 'authToken', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white"
                                            placeholder="Enter Auth Token"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.paymentGateways?.instamojo?.isProduction || false}
                                            onChange={(e) => handlePaymentConfigChange('instamojo', 'isProduction', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Production Mode</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage return policies for your store</p>
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
        </div >
    );
};

export default SettingsScreen;
