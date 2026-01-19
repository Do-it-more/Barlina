import React, { useEffect, useState } from 'react';
import { Shield, Save, Search, Check, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const PermissionScreen = () => {
    const { showToast } = useToast();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // ID of user being saved
    const [searchTerm, setSearchTerm] = useState('');

    // Predefined permissions list (Centralized definition)
    const AVAILABLE_PERMISSIONS = [
        { key: 'orders', label: 'Manage Orders', desc: 'View and process orders' },
        { key: 'products', label: 'Manage Products', desc: 'Create and edit products' },
        { key: 'users', label: 'Manage Users', desc: 'View user list (Restricted)' },
        { key: 'complaints', label: 'Handle Complaints', desc: 'Respond to customer issues' },
        { key: 'returns', label: 'Process Returns', desc: 'Approve/Reject returns' },
        { key: 'coupons', label: 'Manage Coupons', desc: 'Create discount codes' },
        { key: 'settings', label: 'System Settings', desc: 'Modify site configuration' },
        { key: 'inquiries', label: 'View Inquiries', desc: 'Read contact form messages' }
    ];

    const fetchAdmins = async () => {
        try {
            // We fetch all users and filter for admins/super_admins
            // Ideally backend supports ?role=admin, but filtering here is safe for now
            const { data } = await api.get('/users');
            const adminUsers = data.filter(u => u.role === 'admin' || u.role === 'super_admin');
            setAdmins(adminUsers);
        } catch (error) {
            console.error("Failed to fetch admins", error);
            showToast("Failed to load admin users", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handlePermissionChange = (userId, permKey) => {
        setAdmins(prev => prev.map(admin => {
            if (admin._id === userId) {
                const currentPerms = admin.permissions || {};
                return {
                    ...admin,
                    permissions: {
                        ...currentPerms,
                        [permKey]: !currentPerms[permKey]
                    }
                };
            }
            return admin;
        }));
    };

    const savePermissions = async (user) => {
        setSaving(user._id);
        try {
            await api.put(`/admin/management/users/${user._id}/permissions`, {
                permissions: user.permissions
            });
            showToast("Permissions updated successfully", "success");
        } catch (error) {
            console.error("Failed to save permissions", error);
            showToast("Failed to update permissions", "error");
        } finally {
            setSaving(null);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        RBAC Settings
                    </h1>
                    <p className="text-slate-500 mt-1">Configure access levels for administrative staff.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Mobile View - Cards */}
                <div className="md:hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredAdmins.map((admin) => (
                            <div key={admin._id} className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                            {admin.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{admin.name}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[180px]">{admin.email}</p>
                                            {admin.role === 'super_admin' && (
                                                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold border border-purple-200">
                                                    Super Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => savePermissions(admin)}
                                        disabled={saving === admin._id || admin.role === 'super_admin'}
                                        className={`
                                            p-2 rounded-lg transition-all border border-slate-200 dark:border-slate-700
                                            ${admin.role === 'super_admin'
                                                ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                                : 'text-indigo-600 hover:bg-indigo-50 active:scale-95 bg-white dark:bg-slate-800'
                                            }
                                        `}
                                    >
                                        {saving === admin._id ? (
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                                        ) : (
                                            <Save className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    {AVAILABLE_PERMISSIONS.map(perm => {
                                        const isEnabled = admin.permissions?.[perm.key] === true;
                                        const isSuper = admin.role === 'super_admin';
                                        const isRestricted = perm.key === 'users';

                                        return (
                                            <div key={perm.key} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {perm.label}
                                                    {isRestricted && !isSuper && <span className="block text-[9px] text-slate-400">Super Admin Only</span>}
                                                </span>
                                                <label className="relative inline-flex items-center cursor-pointer scale-90 origin-right">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={isSuper || (isEnabled && !isRestricted)}
                                                        disabled={isSuper || isRestricted}
                                                        onChange={() => handlePermissionChange(admin._id, perm.key)}
                                                    />
                                                    <div className={`
                                                        w-9 h-5 rounded-full peer-focus:outline-none transition-all
                                                        ${(isSuper || (isEnabled && !isRestricted))
                                                            ? (isSuper ? 'bg-purple-200 peer-checked:bg-purple-600 opacity-60' : 'bg-slate-200 peer-checked:bg-indigo-600 dark:bg-slate-700')
                                                            : (isRestricted ? 'bg-slate-100 dark:bg-slate-800 opacity-50' : 'bg-slate-200 peer-checked:bg-indigo-600 dark:bg-slate-700')
                                                        }
                                                    `}></div>
                                                    <div className={`absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${(isSuper || (isEnabled && !isRestricted)) ? 'translate-x-full' : ''}`}></div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 font-semibold">
                                <th className="p-4 w-64 min-w-[200px]">Admin User</th>
                                {AVAILABLE_PERMISSIONS.map(perm => (
                                    <th key={perm.key} className="p-4 text-center min-w-[100px]" title={perm.desc}>
                                        {perm.label}
                                    </th>
                                ))}
                                <th className="p-4 w-32 text-center sticky right-0 bg-slate-50 dark:bg-slate-900 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin._id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{admin.name}</p>
                                                <p className="text-xs text-slate-500">{admin.email}</p>
                                                {admin.role === 'super_admin' && (
                                                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold border border-purple-200">
                                                        Super Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {AVAILABLE_PERMISSIONS.map(perm => {
                                        const isEnabled = admin.permissions?.[perm.key] === true;
                                        const isSuper = admin.role === 'super_admin';
                                        // 'users' permission is strictly for Super Admin only
                                        const isRestricted = perm.key === 'users';

                                        return (
                                            <td key={perm.key} className="p-4 text-center">
                                                <label className="relative inline-flex items-center justify-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        // Checked if Super Admin OR (enabled AND not restricted)
                                                        // Effective result: Only Super Admins show as checked for 'users'
                                                        checked={isSuper || (isEnabled && !isRestricted)}
                                                        // Default Disabled if Super Admin
                                                        // NOW: Also disabled if it is a restricted key
                                                        disabled={isSuper || isRestricted}
                                                        onChange={() => handlePermissionChange(admin._id, perm.key)}
                                                    />
                                                    <div className={`
                                                        w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 transition-all
                                                        ${(isSuper || (isEnabled && !isRestricted))
                                                            // Checked style (Purple for Super, Indigo for allowed)
                                                            ? (isSuper ? 'bg-purple-200 peer-checked:bg-purple-600 opacity-60 cursor-not-allowed' : 'bg-slate-200 peer-checked:bg-indigo-600 dark:bg-slate-700')
                                                            // Unchecked/Disabled style
                                                            : (isRestricted ? 'bg-slate-100 dark:bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-slate-200 peer-checked:bg-indigo-600 dark:bg-slate-700')
                                                        }
                                                    `}></div>
                                                    {/* Knob position */}
                                                    <div className={`
                                                        absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform shadow-sm
                                                        ${(isSuper || (isEnabled && !isRestricted)) ? 'translate-x-full' : ''}
                                                    `}></div>
                                                </label>
                                                {isRestricted && !isSuper && (
                                                    <p className="text-[9px] text-slate-400 mt-1">Super Admin Only</p>
                                                )}
                                            </td>
                                        );
                                    })}

                                    <td className="p-4 text-center sticky right-0 bg-white dark:bg-slate-800 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 dark:group-hover:bg-slate-750">
                                        <button
                                            onClick={() => savePermissions(admin)}
                                            disabled={saving === admin._id || admin.role === 'super_admin'}
                                            className={`
                                                p-2 rounded-lg transition-all
                                                ${admin.role === 'super_admin'
                                                    ? 'text-slate-300 cursor-not-allowed'
                                                    : 'text-indigo-600 hover:bg-indigo-50 hover:scale-110 active:scale-95'
                                                }
                                            `}
                                            title="Save Changes"
                                        >
                                            {saving === admin._id ? (
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                                            ) : (
                                                <Save className="h-5 w-5" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {filteredAdmins.length === 0 && (
                                <tr>
                                    <td colSpan={AVAILABLE_PERMISSIONS.length + 2} className="p-12 text-center text-slate-500">
                                        No admins found matching query.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                    <p className="font-bold">Important Note:</p>
                    <p>Super Admins historically have full access and cannot be restricted. Changes made to regular Admins take effect immediately upon their next action or page reload.</p>
                </div>
            </div>
        </div>
    );
};

export default PermissionScreen;
