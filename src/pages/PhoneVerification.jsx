import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Smartphone, Loader, Check, ArrowRight, Shield } from 'lucide-react';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const PhoneVerification = () => {
    const { showToast } = useToast();
    const { user, setUserData } = useAuth();
    const navigate = useNavigate();

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState('idle'); // idle, sending, sent, verifying, verified
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Redirect if user already has phone number
    useEffect(() => {
        if (user && user.phoneNumber && user.phoneNumber.trim() !== '') {
            navigate('/');
        }
    }, [user, navigate]);

    // Cleanup recaptcha on unmount
    useEffect(() => {
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setPhone(value);
        if (status !== 'idle') {
            setStatus('idle');
            setError('');
            setOtp('');
            setConfirmationResult(null);
        }
    };

    const handleSendOtp = async () => {
        if (!phone || phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setStatus('sending');
        setError('');

        try {
            // Clear previous recaptcha
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch (e) { }
                window.recaptchaVerifier = null;
            }

            const container = document.getElementById('recaptcha-container');
            if (container) container.innerHTML = '';

            console.log("📱 Setting up phone verification for: +91" + phone);

            // Create visible reCAPTCHA
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': async (response) => {
                    console.log("✅ reCAPTCHA solved, sending SMS...");
                    try {
                        const phoneNumber = `+91${phone}`;
                        const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
                        setConfirmationResult(result);
                        setStatus('sent');
                        showToast("OTP sent to your phone!", "success");
                    } catch (smsErr) {
                        console.error("SMS error:", smsErr.code, smsErr.message);
                        setStatus('idle');

                        if (window.recaptchaVerifier) {
                            try { window.recaptchaVerifier.clear(); } catch (e) { }
                            window.recaptchaVerifier = null;
                        }
                        const container = document.getElementById('recaptcha-container');
                        if (container) container.innerHTML = '';

                        if (smsErr.code === 'auth/too-many-requests') {
                            setError('Too many attempts. Wait 10-15 minutes and try again.');
                        } else if (smsErr.code === 'auth/invalid-phone-number') {
                            setError('Invalid phone number. Please check the format.');
                        } else if (smsErr.code === 'auth/internal-error') {
                            setError('Firebase service temporarily unavailable. Please try again.');
                        } else if (smsErr.code === 'auth/quota-exceeded') {
                            setError('SMS quota exceeded. Please contact support.');
                        } else {
                            setError(`Error: ${smsErr.message || smsErr.code || 'Unknown error'}`);
                        }
                    }
                },
                'expired-callback': () => {
                    console.warn("⚠️ reCAPTCHA expired");
                    setError('reCAPTCHA expired. Click Send OTP again.');
                    setStatus('idle');
                    if (window.recaptchaVerifier) {
                        try { window.recaptchaVerifier.clear(); } catch (e) { }
                        window.recaptchaVerifier = null;
                    }
                    const container = document.getElementById('recaptcha-container');
                    if (container) container.innerHTML = '';
                }
            });

            await window.recaptchaVerifier.render();
            console.log("👆 Please solve the reCAPTCHA to continue");

        } catch (err) {
            console.error("Phone verification error:", err.code, err.message);
            setStatus('idle');

            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch (e) { }
                window.recaptchaVerifier = null;
            }
            const container = document.getElementById('recaptcha-container');
            if (container) container.innerHTML = '';

            if (err.code === 'auth/invalid-app-credential') {
                setError('Firebase configuration error. Please refresh the page.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Wait 10-15 minutes and try again.');
            } else {
                setError(`Error: ${err.message || err.code || 'Unknown error'}`);
            }
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter the 6-digit OTP');
            return;
        }

        if (!confirmationResult) {
            setError('Session expired. Please request a new OTP.');
            setStatus('idle');
            return;
        }

        setStatus('verifying');
        setError('');

        try {
            // Verify OTP with Firebase
            const userCredential = await confirmationResult.confirm(otp);
            const idToken = await userCredential.user.getIdToken();

            console.log("✅ Phone Verified via Firebase!");

            // Now update the user profile in our backend
            setLoading(true);
            const { data } = await api.put('/users/update-phone', {
                phoneNumber: phone,
                firebaseToken: idToken
            });

            // Update local user state
            setUserData(data);
            setStatus('verified');
            showToast("Phone number verified and linked successfully!", "success");

            // Redirect to home after a short delay
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (err) {
            console.error("OTP Verification Error:", err);
            setStatus('sent');

            if (err.code === 'auth/invalid-verification-code') {
                setError('Invalid OTP. Please check and try again.');
            } else if (err.code === 'auth/code-expired') {
                setError('OTP expired. Please request a new one.');
                setStatus('idle');
                setConfirmationResult(null);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(err.message || 'Verification failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };



    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <Loader className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 relative overflow-hidden py-12 transition-colors duration-300">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-200/20 dark:bg-indigo-900/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-200/20 dark:bg-purple-900/20 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md relative z-10 border border-gray-100 dark:border-slate-700"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                        <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Verify Your Phone
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Welcome, <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</span>!
                        <br />
                        Please verify your phone number to continue.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {status === 'verified' ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-8"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                            Phone Verified!
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Redirecting you to the homepage...
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* Phone Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone Number
                            </label>
                            <div className="flex gap-2">
                                <div className="flex items-center px-4 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-300 font-medium">
                                    +91
                                </div>
                                <div className="relative flex-1">
                                    <Smartphone className="absolute left-4 top-3.5 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="Enter 10-digit phone number"
                                        maxLength={10}
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        disabled={status === 'verifying' || loading}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* reCAPTCHA Container */}
                        <div id="recaptcha-container" className="flex justify-center mb-4"></div>

                        {/* Send OTP Button */}
                        {status === 'idle' && (
                            <button
                                onClick={handleSendOtp}
                                disabled={phone.length !== 10}
                                className="w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send OTP
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        {/* OTP Input */}
                        {(status === 'sent' || status === 'verifying') && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        disabled={status === 'verifying' || loading}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-center tracking-[0.5em] font-bold text-lg disabled:opacity-70"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                        OTP sent to +91 {phone}
                                    </p>
                                </div>

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={otp.length !== 6 || status === 'verifying' || loading}
                                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {(status === 'verifying' || loading) ? (
                                        <Loader className="animate-spin h-5 w-5" />
                                    ) : (
                                        <>
                                            Verify & Continue
                                            <Check className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        setOtp('');
                                        setConfirmationResult(null);
                                    }}
                                    className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    Change phone number
                                </button>
                            </motion.div>
                        )}


                    </>
                )}
            </motion.div>
        </div>
    );
};

export default PhoneVerification;
