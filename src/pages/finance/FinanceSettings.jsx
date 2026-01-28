import React, { useState, useEffect } from 'react';
import {
    Settings,
    Bell,
    Shield,
    Database,
    Clock,
    Save,
    AlertCircle,
    CheckCircle,
    Mail,
    ChevronRight,
    Lock,
    Key,
    User,
    FileText,
    Wallet,
    IndianRupee,
    Calendar,
    Globe,
    Palette,
    Download,
    Upload,
    RefreshCw,
    Trash2,
    History,
    Calculator,
    Building2,
    Phone,
    MapPin,
    CreditCard,
    Eye,
    EyeOff,
    Zap,
    BarChart3,
    PieChart,
    TrendingUp,
    Printer,
    FileSpreadsheet,
    Check,
    X,
    HelpCircle,
    Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

// Toggle Component
const Toggle = ({ checked, onChange, disabled = false }) => (
    <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-gray-200 dark:bg-slate-600'
            }`}
    >
        <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 mt-0.5 ${checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                }`}
        />
    </button>
);

// Setting Row Component
const SettingRow = ({ icon: Icon, iconColor, title, description, children }) => (
    <div className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 border border-gray-200 dark:border-slate-700/50 hover:border-violet-500/30 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${iconColor} bg-opacity-20`}>
                <Icon className={`h-5 w-5 ${iconColor.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            </div>
        </div>
        <div className="flex items-center">{children}</div>
    </div>
);

// Input Field Component
const InputField = ({ label, value, onChange, type = 'text', icon: Icon, prefix }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon className="h-5 w-5" />
                </div>
            )}
            {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{prefix}</span>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white transition-all ${Icon || prefix ? 'pl-10' : ''}`}
            />
        </div>
    </div>
);

// Select Field Component
const SelectField = ({ label, value, onChange, options, icon: Icon }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                    <Icon className="h-5 w-5" />
                </div>
            )}
            <select
                value={value}
                onChange={onChange}
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white appearance-none cursor-pointer transition-all ${Icon ? 'pl-10' : ''}`}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 rotate-90" />
        </div>
    </div>
);


const FinanceSettings = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { refreshSettings } = useSettings();
    const { setTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [showResetModal, setShowResetModal] = useState(false);
    const [showBackupModal, setShowBackupModal] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        // General Settings
        currency: 'INR',
        fiscalYearStart: '04',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Asia/Kolkata',
        language: 'en',
        theme: 'dark',

        companyPhone: '',

        // Notification Settings
        emailNotifications: true,
        lowBalanceAlert: false,
        lowBalanceThreshold: 10000,
        monthlyReportEmail: true,
        weeklyDigest: false,
        instantAlerts: true,
        pushNotifications: true,

        // Security Settings
        requireApprovalForLargeExpenses: true,
        largeExpenseThreshold: 50000,
        twoFactorForFinance: false,
        sessionTimeout: 30,
        ipRestriction: false,
        auditLogging: true,

        // Export Settings
        defaultExportFormat: 'csv',
        includeDescriptions: true,
        groupByCategory: true,
        autoBackup: true,
        backupFrequency: 'weekly',

        // Tax Settings
        gstEnabled: true,
        gstRate: 18,
        tdsEnabled: false,
        tdsRate: 10,

        // Budget Settings
        budgetAlerts: true,
        budgetThreshold: 80,
        autoApproveBelow: 5000,

        // Shipping Settings
        shippingCharge: 50,
        freeShippingThreshold: 1000
    });

    const [lastSaved, setLastSaved] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            // showToast('Failed to load settings', 'error');
        }
    };

    useEffect(() => {
        // Simple change detection logic could go here if we tracked initial state
        // For now, we just rely on user interaction
    }, [settings]);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            await api.put('/settings', settings);
            setLastSaved(new Date());
            setHasChanges(false);
            await refreshSettings();
            showToast("Settings saved successfully", 'success');
        } catch (error) {
            console.error(error);
            showToast("Failed to save settings", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSettings = async () => {
        setShowResetModal(false);
        showToast("Settings reset to defaults", 'info');
    };

    const handleBackup = async () => {
        setShowBackupModal(false);
        showToast("Backup created successfully", 'success');
    };


    const tabs = [
        { id: 'general', label: 'General', icon: Settings, color: 'from-violet-500 to-purple-500' },
        { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-amber-500 to-orange-500' },
        { id: 'security', label: 'Security', icon: Shield, color: 'from-red-500 to-rose-500' },
        { id: 'tax', label: 'Tax & Shipping', icon: Calculator, color: 'from-emerald-500 to-teal-500' },
        { id: 'export', label: 'Export & Backup', icon: Database, color: 'from-indigo-500 to-violet-500' },
        { id: 'budget', label: 'Budget', icon: PieChart, color: 'from-pink-500 to-rose-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-6 shadow-xl">
                <div className="absolute inset-0 opacity-20">
                    <svg className="absolute top-0 right-0 w-64 h-64 text-white/10" viewBox="0 0 200 200" fill="currentColor">
                        <circle cx="100" cy="100" r="80" />
                    </svg>
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full filter blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Settings className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-yellow-300" />
                                Finance Settings
                            </h1>
                            <p className="text-white/80 mt-1">Configure your financial management preferences</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <span className="text-white/80 text-sm flex items-center gap-1">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                Unsaved changes
                            </span>
                        )}
                        {lastSaved && (
                            <span className="hidden md:flex text-white/60 text-sm items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Last saved: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                {/* Sidebar Navigation */}
                <div className="lg:w-72 shrink-0 space-y-4">
                    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden shadow-sm dark:shadow-none">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 border-b border-gray-100 dark:border-slate-700/50 last:border-b-0 ${isActive
                                        ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">{tab.label}</span>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 p-4 space-y-3 shadow-sm dark:shadow-none">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Quick Actions</h3>
                        <button
                            onClick={() => setShowBackupModal(true)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition-all group"
                        >
                            <Download className="h-5 w-5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                            <span>Create Backup</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition-all group">
                            <Upload className="h-5 w-5 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span>Import Data</span>
                        </button>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/50 text-slate-700 dark:text-white transition-all group"
                        >
                            <RefreshCw className="h-5 w-5 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" />
                            <span>Reset to Defaults</span>
                        </button>
                    </div>

                    {/* User Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700/50 p-4 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Super Admin'}</p>
                                <p className="text-xs text-violet-600 dark:text-violet-400">Finance Manager</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 rounded-lg px-3 py-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                            All permissions granted
                        </div>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6 shadow-sm dark:shadow-none">

                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                                        <Settings className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Settings</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure basic preferences and display options</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SelectField
                                        label="Currency"
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                        icon={IndianRupee}
                                        options={[
                                            { value: 'INR', label: '₹ Indian Rupee (INR)' },
                                            { value: 'USD', label: '$ US Dollar (USD)' },
                                            { value: 'EUR', label: '€ Euro (EUR)' },
                                            { value: 'GBP', label: '£ British Pound (GBP)' },
                                        ]}
                                    />
                                    <SelectField
                                        label="Fiscal Year Start"
                                        value={settings.fiscalYearStart}
                                        onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                                        icon={Calendar}
                                        options={[
                                            { value: '01', label: 'January' },
                                            { value: '04', label: 'April (India Standard)' },
                                            { value: '07', label: 'July' },
                                            { value: '10', label: 'October' },
                                        ]}
                                    />
                                    <SelectField
                                        label="Date Format"
                                        value={settings.dateFormat}
                                        onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                                        icon={Clock}
                                        options={[
                                            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (26/01/2026)' },
                                            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/26/2026)' },
                                            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-01-26)' },
                                        ]}
                                    />
                                    <SelectField
                                        label="Timezone"
                                        value={settings.timezone}
                                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                        icon={Globe}
                                        options={[
                                            { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
                                            { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                                            { value: 'America/New_York', label: 'Eastern Time (ET)' },
                                            { value: 'Europe/London', label: 'British Time (GMT)' },
                                        ]}
                                    />
                                </div>

                                {/* Theme Preference removed as per user request (moved to Navbar) */}
                            </div>
                        )}



                        {/* Notification Settings */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                    <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                                        <Bell className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Control how you receive updates and alerts</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SettingRow
                                        icon={Mail}
                                        iconColor="bg-blue-500"
                                        title="Email Notifications"
                                        description="Receive email updates for all financial activities"
                                    >
                                        <Toggle
                                            checked={settings.emailNotifications}
                                            onChange={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={Bell}
                                        iconColor="bg-violet-500"
                                        title="Push Notifications"
                                        description="Get instant push notifications on your browser"
                                    >
                                        <Toggle
                                            checked={settings.pushNotifications}
                                            onChange={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={Zap}
                                        iconColor="bg-amber-500"
                                        title="Instant Alerts"
                                        description="Immediate alerts for critical transactions"
                                    >
                                        <Toggle
                                            checked={settings.instantAlerts}
                                            onChange={() => setSettings({ ...settings, instantAlerts: !settings.instantAlerts })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={AlertCircle}
                                        iconColor="bg-red-500"
                                        title="Low Balance Alert"
                                        description="Notify when balance falls below threshold"
                                    >
                                        <Toggle
                                            checked={settings.lowBalanceAlert}
                                            onChange={() => setSettings({ ...settings, lowBalanceAlert: !settings.lowBalanceAlert })}
                                        />
                                    </SettingRow>

                                    {settings.lowBalanceAlert && (
                                        <div className="ml-14 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Alert Threshold Amount
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500 dark:text-gray-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={settings.lowBalanceThreshold}
                                                    onChange={(e) => setSettings({ ...settings, lowBalanceThreshold: Number(e.target.value) })}
                                                    className="w-40 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <SettingRow
                                        icon={BarChart3}
                                        iconColor="bg-emerald-500"
                                        title="Weekly Digest"
                                        description="Receive weekly summary of financial activities"
                                    >
                                        <Toggle
                                            checked={settings.weeklyDigest}
                                            onChange={() => setSettings({ ...settings, weeklyDigest: !settings.weeklyDigest })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={FileText}
                                        iconColor="bg-pink-500"
                                        title="Monthly Report Email"
                                        description="Automated monthly financial summary"
                                    >
                                        <Toggle
                                            checked={settings.monthlyReportEmail}
                                            onChange={() => setSettings({ ...settings, monthlyReportEmail: !settings.monthlyReportEmail })}
                                        />
                                    </SettingRow>
                                </div>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                    <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                                        <Shield className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Access</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Protect your financial data with advanced security</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 border border-gray-200 dark:border-slate-700/50 hover:border-violet-500/30 shadow-sm dark:shadow-none">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-blue-500 bg-opacity-20">
                                                <Lock className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">Change Password</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Update your account password</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate('/finance/change-password')}
                                            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <SettingRow
                                        icon={Key}
                                        iconColor="bg-violet-500"
                                        title="Two-Factor Authentication"
                                        description="Add extra security layer for finance access"
                                    >
                                        <Toggle
                                            checked={settings.twoFactorForFinance}
                                            onChange={() => setSettings({ ...settings, twoFactorForFinance: !settings.twoFactorForFinance })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={CheckCircle}
                                        iconColor="bg-emerald-500"
                                        title="Large Expense Approval"
                                        description="Require approval for expenses above threshold"
                                    >
                                        <Toggle
                                            checked={settings.requireApprovalForLargeExpenses}
                                            onChange={() => setSettings({ ...settings, requireApprovalForLargeExpenses: !settings.requireApprovalForLargeExpenses })}
                                        />
                                    </SettingRow>

                                    {settings.requireApprovalForLargeExpenses && (
                                        <div className="ml-14 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Approval Threshold Amount
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500 dark:text-gray-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={settings.largeExpenseThreshold}
                                                    onChange={(e) => setSettings({ ...settings, largeExpenseThreshold: Number(e.target.value) })}
                                                    className="w-40 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <SettingRow
                                        icon={History}
                                        iconColor="bg-blue-500"
                                        title="Audit Logging"
                                        description="Track all changes and actions in the system"
                                    >
                                        <Toggle
                                            checked={settings.auditLogging}
                                            onChange={() => setSettings({ ...settings, auditLogging: !settings.auditLogging })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={Globe}
                                        iconColor="bg-amber-500"
                                        title="IP Restriction"
                                        description="Only allow access from specific IP addresses"
                                    >
                                        <Toggle
                                            checked={settings.ipRestriction}
                                            onChange={() => setSettings({ ...settings, ipRestriction: !settings.ipRestriction })}
                                        />
                                    </SettingRow>

                                    <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Session Timeout (minutes)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="5"
                                                max="120"
                                                value={settings.sessionTimeout}
                                                onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                                                className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                            />
                                            <span className="text-slate-900 dark:text-white font-bold bg-violet-100 dark:bg-violet-500/30 px-3 py-1 rounded-lg min-w-[60px] text-center">
                                                {settings.sessionTimeout}m
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-600 dark:text-amber-400">Security Recommendation</p>
                                            <p className="text-sm text-amber-600/70 dark:text-amber-300/70 mt-1">
                                                Enable 2FA and audit logging for maximum protection of your financial data.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tax Settings */}
                        {activeTab === 'tax' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                                        <Calculator className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tax & Shipping Configuration</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage tax, GST and shipping charge settings</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SettingRow
                                        icon={FileText}
                                        iconColor="bg-emerald-500"
                                        title="Enable GST"
                                        description="Apply GST to applicable transactions"
                                    >
                                        <Toggle
                                            checked={settings.gstEnabled}
                                            onChange={() => setSettings({ ...settings, gstEnabled: !settings.gstEnabled })}
                                        />
                                    </SettingRow>

                                    {settings.gstEnabled && (
                                        <div className="ml-14 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Default GST Rate (%)
                                            </label>
                                            <div className="flex gap-3">
                                                {[5, 12, 18, 28].map((rate) => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => setSettings({ ...settings, gstRate: rate })}
                                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${settings.gstRate === rate
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                                                            }`}
                                                    >
                                                        {rate}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <SettingRow
                                        icon={CreditCard}
                                        iconColor="bg-blue-500"
                                        title="Enable TDS"
                                        description="Calculate TDS on applicable payments"
                                    >
                                        <Toggle
                                            checked={settings.tdsEnabled}
                                            onChange={() => setSettings({ ...settings, tdsEnabled: !settings.tdsEnabled })}
                                        />
                                    </SettingRow>

                                    {settings.tdsEnabled && (
                                        <div className="ml-14 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Default TDS Rate (%)
                                            </label>
                                            <div className="flex gap-3">
                                                {[2, 5, 10, 20].map((rate) => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => setSettings({ ...settings, tdsRate: rate })}
                                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${settings.tdsRate === rate
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                                                            }`}
                                                    >
                                                        {rate}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <SettingRow
                                        icon={Wallet}
                                        iconColor="bg-pink-500"
                                        title="Shipping Charges"
                                        description="Set default shipping cost for all orders"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={settings.shippingCharge}
                                                onChange={(e) => setSettings({ ...settings, shippingCharge: Math.max(0, Number(e.target.value)) })}
                                                className="w-24 px-2 py-1 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                                            />
                                        </div>
                                    </SettingRow>

                                    <SettingRow
                                        icon={Zap}
                                        iconColor="bg-yellow-500"
                                        title="Free Shipping Threshold"
                                        description="Orders above this amount get free shipping"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={settings.freeShippingThreshold}
                                                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Math.max(0, Number(e.target.value)) })}
                                                className="w-24 px-2 py-1 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                            />
                                        </div>
                                    </SettingRow>
                                </div>
                            </div>
                        )}

                        {/* Export Settings */}
                        {activeTab === 'export' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
                                        <Database className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Export & Backup</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure data export and backup preferences</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default Export Format</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { value: 'csv', label: 'CSV', icon: FileSpreadsheet, desc: 'Spreadsheet format' },
                                            { value: 'xlsx', label: 'Excel', icon: FileText, desc: 'Microsoft Excel' },
                                            { value: 'pdf', label: 'PDF', icon: Printer, desc: 'Print-ready format' },
                                        ].map((format) => (
                                            <button
                                                key={format.value}
                                                onClick={() => setSettings({ ...settings, defaultExportFormat: format.value })}
                                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.defaultExportFormat === format.value
                                                    ? 'border-violet-500 bg-violet-500/20 text-slate-900 dark:text-white'
                                                    : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30 text-gray-500 dark:text-gray-400 hover:border-violet-400'
                                                    }`}
                                            >
                                                <format.icon className="h-6 w-6" />
                                                <span className="font-semibold">{format.label}</span>
                                                <span className="text-xs opacity-70">{format.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SettingRow
                                        icon={FileText}
                                        iconColor="bg-blue-500"
                                        title="Include Descriptions"
                                        description="Add transaction notes in exports"
                                    >
                                        <Toggle
                                            checked={settings.includeDescriptions}
                                            onChange={() => setSettings({ ...settings, includeDescriptions: !settings.includeDescriptions })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={Database}
                                        iconColor="bg-violet-500"
                                        title="Group by Category"
                                        description="Organize exported data by expense categories"
                                    >
                                        <Toggle
                                            checked={settings.groupByCategory}
                                            onChange={() => setSettings({ ...settings, groupByCategory: !settings.groupByCategory })}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={Clock}
                                        iconColor="bg-emerald-500"
                                        title="Auto Backup"
                                        description="Automatically backup data periodically"
                                    >
                                        <Toggle
                                            checked={settings.autoBackup}
                                            onChange={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
                                        />
                                    </SettingRow>

                                    {settings.autoBackup && (
                                        <div className="ml-14 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Backup Frequency</label>
                                            <div className="flex gap-3">
                                                {['daily', 'weekly', 'monthly'].map((freq) => (
                                                    <button
                                                        key={freq}
                                                        onClick={() => setSettings({ ...settings, backupFrequency: freq })}
                                                        className={`px-4 py-2 rounded-lg capitalize font-medium transition-all ${settings.backupFrequency === freq
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                                                            }`}
                                                    >
                                                        {freq}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Budget Settings */}
                        {activeTab === 'budget' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                                    <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                                        <PieChart className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Budget Settings</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage budget alerts and thresholds</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SettingRow
                                        icon={AlertCircle}
                                        iconColor="bg-pink-500"
                                        title="Budget Alerts"
                                        description="Notify when budget limit is approached"
                                    >
                                        <Toggle
                                            checked={settings.budgetAlerts}
                                            onChange={() => setSettings({ ...settings, budgetAlerts: !settings.budgetAlerts })}
                                        />
                                    </SettingRow>

                                    {settings.budgetAlerts && (
                                        <div className="ml-14 p-4 bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Alert Threshold (%)
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="100"
                                                    value={settings.budgetThreshold}
                                                    onChange={(e) => setSettings({ ...settings, budgetThreshold: Number(e.target.value) })}
                                                    className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-pink-600"
                                                />
                                                <span className="text-slate-900 dark:text-white font-bold bg-pink-100 dark:bg-pink-500/30 px-3 py-1 rounded-lg min-w-[60px] text-center">
                                                    {settings.budgetThreshold}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Alert will be sent when {settings.budgetThreshold}% of the budget is utilized.
                                            </p>
                                        </div>
                                    )}

                                    <SettingRow
                                        icon={CheckCircle}
                                        iconColor="bg-emerald-500"
                                        title="Auto-Approve Low Expenses"
                                        description="Automatically approve expenses below threshold"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                value={settings.autoApproveBelow}
                                                onChange={(e) => setSettings({ ...settings, autoApproveBelow: Number(e.target.value) })}
                                                className="w-24 px-2 py-1 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </SettingRow>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={fetchSettings}
                            className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={loading}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 transition-all ${loading
                                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-xl">
                                <RefreshCw className="h-6 w-6 text-red-500 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Settings</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to reset all settings to their default values? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetSettings}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Reset All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Backup Modal */}
            {showBackupModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <Download className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Backup</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Create a complete backup of your financial data and settings. This will download a secure backup file.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowBackupModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBackup}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download Backup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceSettings;
