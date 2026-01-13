import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Loader, UserPlus, Shield, User, Smartphone, Mail, Lock, Eye, EyeOff, Wand2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const AdminCreateScreen = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('user'); // Default to user for safety
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPassword = "";
        for (let i = 0, n = charset.length; i < 12; i++) {
            newPassword += charset.charAt(Math.floor(Math.random() * n));
        }
        setPassword(newPassword);
        setShowPassword(true); // Automatically show the generated password
        showToast("Secure password generated", "success");
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/users/admin/create', {
                name,
                email,
                password,
                phoneNumber,
                role
            });
            showToast("User created successfully", "success");
            navigate('/admin/users');
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to create user", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/admin/users" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Users
            </Link>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New User</h1>
                        <p className="text-gray-500 dark:text-gray-400">Add a new admin or user to the system</p>
                    </div>
                </div>

                <form onSubmit={submitHandler} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone Number</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                            >
                                <Wand2 className="h-4 w-4 transition-transform duration-700 ease-in-out group-hover:rotate-180" />
                                <span className="uppercase tracking-wide">Auto Generate</span>
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Role</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${role === 'user'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                                    }`}
                            >
                                <User className="h-5 w-5" />
                                <span className="font-semibold">User</span>
                            </button>
                            <button
                                type="button"
                                disabled={currentUser?.role !== 'super_admin'}
                                onClick={() => setRole('admin')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${role === 'admin'
                                    ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
                                    } ${currentUser?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : ''}`}
                                title={currentUser?.role !== 'super_admin' ? "Only Super Admin can create new Admins" : "Create Admin User"}
                            >
                                <Shield className="h-5 w-5" />
                                <span className="font-semibold">Admin</span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader className="animate-spin h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        Create User
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminCreateScreen;
