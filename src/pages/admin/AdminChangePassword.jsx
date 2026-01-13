import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Lock, Shield, Key } from 'lucide-react';

const AdminChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { logout, updatePassword, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validation
        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match", "error");
            return;
        }

        if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters", "error");
            return;
        }

        if (currentPassword === newPassword) {
            showToast("New password cannot be the same as the old one", "error");
            return;
        }

        setLoading(true);

        try {
            // 2. Call API directly or use context
            // Using API directly to handle specific logic if needed, but context is better if available.
            // Assuming api.put('/users/password') handles it.

            // Note: The backend checks req.user.role === 'super_admin' for OTP requirement. 
            // If this is a regular admin forcing change, standard endpoint works.

            await api.put('/users/password', {
                currentPassword,
                newPassword
            });

            showToast("Password updated successfully. Please login again.", "success");

            // 3. Force Logout to re-authenticate with new credentials (security best practice)
            logout();
            navigate('/login');

        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to update password", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-center">
                    <Shield className="h-12 w-12 text-white mx-auto mb-2" />
                    <h1 className="text-2xl font-bold text-white">Security Update Required</h1>
                    <p className="text-white/90 text-sm mt-1">You must change your temporary password to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Current (Temporary) Password</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter current password"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Create strong password"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Repeat new password"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating...' : 'Update Password & Login'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={logout}
                            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                        >
                            Cancel & Logout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminChangePassword;
