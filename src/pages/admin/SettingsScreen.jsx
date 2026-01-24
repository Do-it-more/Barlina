import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Save, Settings as SettingsIcon, Truck, CreditCard, Lock, Shield, Mail, Key, ShieldCheck, MessageSquare, ShoppingBag, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = () => {
    const { user, login } = useAuth(); // Moved to top
    const { showToast } = useToast();

    const [settings, setSettings] = useState({
        isCodAvailable: true
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
        </div>
    );
};

export default SettingsScreen;
