import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('login'); // 'login' or '2fa'
    const [otp, setOtp] = useState('');

    const { login, verifyTwoFactorLogin, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (response) => {
        try {
            setLoading(true);
            setError('');
            // When using flow: 'auth-code', the code is in response.code
            await googleLogin(response.code);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed');
    };

    // Custom Google Login Hook (Must be at the top level)
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

    const handleSubmit = async (e) => {

        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (step === 'login') {
                const response = await login(email, password);
                if (response.twoFactorRequired) {
                    setStep('2fa');
                } else {
                    navigate('/');
                }
            } else {
                // Verify 2FA
                await verifyTwoFactorLogin(email, otp);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-200/20 dark:bg-indigo-900/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-200/20 dark:bg-pink-900/20 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md relative z-10 border border-gray-100 dark:border-slate-700"
            >
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex flex-col items-center justify-center mb-6 group">
                        <span className="font-serif text-3xl md:text-4xl tracking-[0.15em] font-bold text-slate-900 dark:text-white leading-none" style={{ fontFamily: '"Playfair Display", serif' }}>
                            BARLINA
                        </span>
                        <span className="text-xs md:text-sm tracking-[0.4em] font-light lowercase text-gray-500 dark:text-gray-400 mt-2">
                            fashion design
                        </span>
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                    <p className="text-gray-500 dark:text-gray-400">Please enter your details to sign in</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 'login' ? (
                        <>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-gray-400 h-5 w-5 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Email Address or Phone Number"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-gray-400 h-5 w-5 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="relative group animate-in slide-in-from-right duration-300">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 h-5 w-5 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP code"
                                required
                                value={otp}
                                maxLength={6}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all text-center tracking-[0.5em] font-bold text-lg"
                            />
                            <p className="text-center text-xs text-gray-500 mt-2">Check your email for the verification code.</p>
                        </div>
                    )}

                    <div className="flex justify-end items-center text-sm">
                        <Link to="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">Forgot Password?</Link>
                    </div>

                    <button disabled={loading} className="w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? <Loader className="animate-spin h-5 w-5" /> : (step === 'login' ? 'Sign In' : 'Verify & Login')}
                        {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
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
                                    Sign in with Google
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm border border-yellow-200 dark:border-yellow-800 text-center">
                            Google Sign-In is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
                    Don't have an account? <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Sign Up</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
