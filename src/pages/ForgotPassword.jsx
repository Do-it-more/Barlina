import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader, CheckCircle, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/users/forgot-password', { email });
            setMessage('OTP sent to your email.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/users/verify-otp', { email, otp });
            setMessage('OTP verified successfully.');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            await api.post('/users/reset-password', { email, otp, newPassword });
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
            {/* Background Decoration - consistent with Login */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-200/20 dark:bg-indigo-900/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-200/20 dark:bg-pink-900/20 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md relative z-10 border border-gray-100 dark:border-slate-700"
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {step === 1 && 'Forgot Password?'}
                        {step === 2 && 'Verification'}
                        {step === 3 && 'Reset Password'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {step === 1 && 'Enter your email to receive a verification code'}
                        {step === 2 && `Enter the 6-digit code sent to ${email}`}
                        {step === 3 && 'Create a strong new password'}
                    </p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2 border border-red-200 dark:border-red-900"><div className="w-1 h-1 bg-red-700 dark:bg-red-400 rounded-full"></div>{error}</div>}
                {message && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center gap-2 border border-green-200 dark:border-green-900"><CheckCircle className="h-4 w-4" /> {message}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 h-5 w-5 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white"
                            />
                        </div>
                        <button disabled={loading} className="w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Send Code'}
                            {!loading && <ArrowRight className="h-4 w-4" />}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="relative group">
                            <KeyRound className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 h-5 w-5 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only numbers
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all tracking-widest text-lg dark:text-white"
                            />
                        </div>
                        <button disabled={loading} className="w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Verify Code'}
                            {!loading && <ArrowRight className="h-4 w-4" />}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 h-5 w-5 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <button disabled={loading} className="w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Reset Password'}
                            {!loading && <CheckCircle className="h-4 w-4" />}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors">
                        Return to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
