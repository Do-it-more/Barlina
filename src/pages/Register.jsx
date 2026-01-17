import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, Check, Mail, Smartphone, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useToast } from '../context/ToastContext';

const FloatingInput = ({ label, type, value, onChange, error, icon: Icon, disabled = false, rightElement = null, maxLength, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.length > 0;

    return (
        <div className="relative mb-6">
            <div className="relative">
                {Icon && (
                    <div className="absolute left-4 top-3.5 text-gray-400 z-10">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={disabled}
                    maxLength={maxLength}
                    className={`
                        w-full ${Icon ? 'pl-12' : 'px-4'} ${rightElement ? 'pr-24' : 'pr-4'} py-3.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none transition-all dark:text-white
                        ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900'}
                        ${hasValue || isFocused ? 'pt-6 pb-2' : ''}
                        ${disabled ? 'opacity-70 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : ''}
                    `}
                    {...props}
                />
                <label
                    className={`
                        absolute ${Icon ? 'left-12' : 'left-4'} transition-all duration-200 pointer-events-none text-gray-500 dark:text-gray-400 z-10
                        ${hasValue || isFocused
                            ? 'top-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400'
                            : 'top-3.5 text-base'}
                    `}
                >
                    {label}
                </label>
                {rightElement && (
                    <div className="absolute right-2 top-2 z-20">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500 pl-1">{error}</p>}
        </div>
    );
};

const Register = () => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Email Verification States
    const [emailOtp, setEmailOtp] = useState('');
    const [emailStatus, setEmailStatus] = useState('idle'); // idle, sending, sent, verifying, verified
    const [verificationToken, setVerificationToken] = useState(null);
    const [emailError, setEmailError] = useState('');

    // Phone Verification States (Firebase)
    const [phoneOtp, setPhoneOtp] = useState('');
    const [phoneStatus, setPhoneStatus] = useState('idle'); // idle, sending, sent, verifying, verified
    const [phoneVerificationToken, setPhoneVerificationToken] = useState(null); // Firebase ID Token
    const [phoneError, setPhoneError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (response) => {
        try {
            setLoading(true);
            setError('');
            await googleLogin(response.code);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Google registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google registration failed');
    };

    // Custom Google Login Hook
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                handleGoogleSuccess(response);
            } catch (err) {
                handleGoogleError(err);
            }
        },
        onError: handleGoogleError,
        flow: 'auth-code',
        scope: 'email profile https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.addresses.read'
    });



    // Initialize Recaptcha (Robust)
    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    console.log("Recaptcha solved");
                },
                'expired-callback': () => {
                    console.warn("Recaptcha expired");
                    if (window.recaptchaVerifier) {
                        try {
                            window.recaptchaVerifier.clear();
                        } catch (e) { }
                        window.recaptchaVerifier = null;
                        // setPhoneStatus('idle'); // Optional: Reset status
                    }
                }
            });
        }
    };

    useEffect(() => {
        // Clear any existing auth state to ensure a fresh flow
        auth.signOut().then(() => {
            console.log("Auth state cleared for fresh verification");
        }).catch(err => console.error("Error clearing auth:", err));

        setupRecaptcha();

        return () => {
            // Cleanup on unmount
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handleChange = (e, field) => {
        let value = e.target.value;
        if (field === 'phone') {
            value = value.replace(/\D/g, '');
        }
        setFormData({ ...formData, [field]: value });

        if (field === 'email' && emailStatus !== 'idle') {
            setEmailStatus('idle');
            setVerificationToken(null);
            setEmailError('');
            setEmailOtp('');
        }
        if (field === 'phone' && phoneStatus !== 'idle') {
            setPhoneStatus('idle');
            setPhoneVerificationToken(null);
            setPhoneError('');
            setPhoneOtp('');
            setConfirmationResult(null);
        }
    };

    const handleSendVerification = async () => {
        if (!formData.email) return setEmailError('Please enter an email address');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setEmailError('Invalid email format');

        setEmailStatus('sending');
        setEmailError('');
        try {
            await api.post('/users/send-verification', { email: formData.email });
            setEmailStatus('sent');
        } catch (err) {
            setEmailStatus('idle');
            setEmailError(err.response?.data?.message || err.message || 'Failed to send verification email');
        }
    };

    const handleVerifyOtp = async () => {
        if (!emailOtp) return;
        setEmailStatus('verifying');
        try {
            const { data } = await api.post('/users/verify-email', { email: formData.email, otp: emailOtp });
            setVerificationToken(data.verificationToken);
            setEmailStatus('verified');
        } catch (err) {
            setEmailStatus('sent');
            setError(err.response?.data?.message || 'Invalid OTP');
        }
    };

    const handleSendPhoneVerification = async () => {
        if (!formData.phone || formData.phone.length !== 10) return setPhoneError('Please enter a valid 10-digit phone number');

        setPhoneStatus('sending');
        setPhoneError('');

        try {
            // Use Backend Mock SMS (Free Tier)
            await api.post('/users/send-phone-otp', { phone: formData.phone });
            setPhoneStatus('sent');
            // Inform user to check console if they are dev, or just say it's sent
            console.log("Mock SMS Sent. Use OTP: 123456");
            showToast("OTP Sent! Use 123456", "success");

        } catch (err) {
            console.error("SMS Error:", err);
            setPhoneStatus('idle');
            setPhoneError(err.response?.data?.message || 'Failed to send SMS');
        }
    };

    const handleVerifyPhoneOtp = async () => {
        if (!phoneOtp) return;
        setPhoneStatus('verifying');

        try {
            // Use Backend Mock Verify
            const { data } = await api.post('/users/verify-phone-otp', {
                phone: formData.phone,
                otp: phoneOtp
            });

            console.log("Phone Verified");
            setPhoneVerificationToken(data.phoneVerificationToken);
            setPhoneStatus('verified');
        } catch (err) {
            setPhoneStatus('sent');
            setPhoneError(err.response?.data?.message || 'Invalid Verification Code');
            console.error("OTP Error:", err);
        }
    };

    const calculateStrength = (pass) => {
        let strength = 0;
        if (pass.length > 7) strength += 25;
        if (pass.match(/[A-Z]/)) strength += 25;
        if (pass.match(/[0-9]/)) strength += 25;
        if (pass.match(/[^A-Za-z0-9]/)) strength += 25;
        return strength;
    };

    const strength = calculateStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.phone.length !== 10) return setError('Phone number must be exactly 10 digits');
        if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
        if (!verificationToken) return setError('Please verify your email address');

        setError('');
        setLoading(true);
        try {
            await register(
                formData.name,
                formData.email,
                formData.password,
                formData.phone,
                verificationToken,
                phoneVerificationToken // This is now Firebase ID Token
            );
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        setLoading(false);
    };

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
                <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors font-medium">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>

                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h2>
                    <p className="text-gray-500 dark:text-gray-400">Join Barlina Fashion Design and start shopping today</p>
                </div>

                <div id="recaptcha-container"></div>

                {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <FloatingInput
                        label="Full Name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange(e, 'name')}
                        icon={UserIcon}
                    />

                    {/* Email Verification Section */}
                    <div className="relative">
                        <FloatingInput
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange(e, 'email')}
                            icon={Mail}
                            error={emailError}
                            disabled={emailStatus === 'verified' || emailStatus === 'verifying'}
                            rightElement={
                                emailStatus === 'verified' ? (
                                    <span className="flex items-center text-green-500 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                        <Check className="w-3 h-3 mr-1" /> Verified
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendVerification}
                                        disabled={emailStatus === 'sending' || !formData.email}
                                        className="text-xs font-bold bg-slate-900 dark:bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {emailStatus === 'sending' ? <Loader className="w-3 h-3 animate-spin" /> : 'Verify'}
                                    </button>
                                )
                            }
                        />
                    </div>

                    {/* Email OTP Input - conditionally shown */}
                    {(emailStatus === 'sent' || emailStatus === 'verifying') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mb-4 flex gap-2"
                        >
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter Email OTP"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={!emailOtp || emailStatus === 'verifying'}
                                className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center disabled:opacity-70"
                            >
                                {emailStatus === 'verifying' ? <Loader className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </motion.div>
                    )}

                    {/* Phone Number Verification Section */}
                    <div className="relative">
                        <FloatingInput
                            label="Phone Number"
                            type="text"
                            maxLength={10}
                            value={formData.phone}
                            onChange={(e) => handleChange(e, 'phone')}
                            icon={Smartphone}
                            error={phoneError || (formData.phone && formData.phone.length !== 10 ? 'Phone number must be exactly 10 digits' : null)}
                            disabled={phoneStatus === 'verified' || phoneStatus === 'verifying'}
                            rightElement={
                                phoneStatus === 'verified' ? (
                                    <span className="flex items-center text-green-500 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                        <Check className="w-3 h-3 mr-1" /> Verified
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendPhoneVerification}
                                        disabled={phoneStatus === 'sending' || formData.phone.length !== 10}
                                        className="text-xs font-bold bg-slate-900 dark:bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {phoneStatus === 'sending' ? <Loader className="w-3 h-3 animate-spin" /> : 'Verify'}
                                    </button>
                                )
                            }
                        />
                    </div>

                    {/* Phone OTP Input - conditionally shown */}
                    {(phoneStatus === 'sent' || phoneStatus === 'verifying') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mb-4 flex gap-2"
                        >
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter Phone OTP"
                                    value={phoneOtp}
                                    onChange={(e) => setPhoneOtp(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleVerifyPhoneOtp}
                                disabled={!phoneOtp || phoneStatus === 'verifying'}
                                className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center disabled:opacity-70"
                            >
                                {phoneStatus === 'verifying' ? <Loader className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </motion.div>
                    )}

                    <FloatingInput
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleChange(e, 'password')}
                        icon={Lock}
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-1"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        }
                    />

                    {/* Password Strength Indicator */}
                    {formData.password && (
                        <div className="mb-4 -mt-4 pl-1">
                            <div className="flex gap-1 h-1 mb-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`flex-1 ${strength >= 25 ? 'bg-red-500' : 'bg-transparent'}`}></div>
                                <div className={`flex-1 ${strength >= 50 ? 'bg-yellow-500' : 'bg-transparent'}`}></div>
                                <div className={`flex-1 ${strength >= 75 ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                <div className={`flex-1 ${strength >= 100 ? 'bg-green-500' : 'bg-transparent'}`}></div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                {strength < 50 ? "Weak" : strength < 100 ? "Medium" : "Strong"} password
                            </p>
                        </div>
                    )}

                    <FloatingInput
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange(e, 'confirmPassword')}
                        icon={Lock}
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-1"
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        }
                    />

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={() => loginWithGoogle()}
                                className="flex items-center justify-center w-full max-w-xs py-3 px-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-slate-600 transition-all gap-3 group"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                                    Sign up with Google
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm border border-yellow-200 dark:border-yellow-800 text-center">
                            Google Sign-Up is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-xs text-gray-400">
                    By joining, you agree to our Terms of Service and Privacy Policy
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
