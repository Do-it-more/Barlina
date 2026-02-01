import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, ChevronLeft, ShieldCheck, LockKeyhole } from 'lucide-react';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useToast } from '../context/ToastContext';
import api from '../services/api';


const AnimatedShield = () => (
    <div className="relative flex items-center justify-center w-24 h-24">
        {/* Pulse Effect */}
        <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20"
        />

        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shield Path - Draws outline */}
            <motion.path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, fill: "rgba(99, 102, 241, 0)" }}
                animate={{ pathLength: 1, fill: "rgba(99, 102, 241, 0.1)" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Checkmark - Pops in */}
            <motion.path
                d="M9 12l2 2 4-4"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
            />
        </svg>
    </div>
);

const PhoneVerification = () => {
    const { showToast } = useToast();
    const { user, setUserData } = useAuth();
    const navigate = useNavigate();

    // Steps: 'phone' -> 'otp'
    const [step, setStep] = useState('phone');
    const [phone, setPhone] = useState('');
    const [otpValues, setOtpValues] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const otpInputRefs = useRef([]);

    useEffect(() => {
        if (user && user.phoneNumber && user.phoneNumber.trim() !== '') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    useEffect(() => {
        return () => {
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch (e) { }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const setupRecaptcha = () => {
        // 1. Clear existing instance if we have a reference
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (e) { console.warn(e); }
            window.recaptchaVerifier = null;
        }

        // 2. Aggressively clean the DOM
        const existingContainer = document.getElementById('recaptcha-wrapper');
        if (existingContainer) {
            // Clone and replace to strip all hidden listeners/internal state
            const newContainer = existingContainer.cloneNode(false);
            if (existingContainer.parentNode) {
                existingContainer.parentNode.replaceChild(newContainer, existingContainer);
            }
        }

        try {
            // 3. Create fresh instance
            const verifier = new RecaptchaVerifier(auth, 'recaptcha-wrapper', {
                'size': 'invisible',
                'callback': () => console.log("Recaptcha verified silently."),
                'expired-callback': () => {
                    setError('Security check expired. Please try again.');
                }
            });
            window.recaptchaVerifier = verifier;
            return verifier;
        } catch (err) {
            console.error("Recaptcha Init Error:", err);
            if (err.message && err.message.includes('already been rendered')) {
                // Even with our aggressive clean, if this happens, we just refresh page advice
                setError("Component state error. Please refresh page.");
            } else {
                setError("Security handling error. Try refreshing.");
            }
            return null;
        }
    };

    const handleSendOtp = async () => {
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit number.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const appVerifier = setupRecaptcha();
            if (!appVerifier) return; // Error already set

            const phoneNumber = `+91${phone}`;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

            setConfirmationResult(result);
            setStep('otp');
            setTimer(30);
            showToast("Code sent successfully!", "success");

        } catch (err) {
            console.error("SMS Error:", err);
            handleError(err);
            // Reset for retry
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch (e) { }
                window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otpValues.join("");
        if (otpCode.length !== 6) return;
        setLoading(true);
        setError('');

        try {
            // Check for Mock Mode logic (simulated)
            if (window.isMockMode && !confirmationResult) {
                await verifyMock(otpCode);
                return;
            }

            if (!confirmationResult && !window.isMockMode) throw new Error("Session expired. Please restart.");

            const credential = await confirmationResult.confirm(otpCode);
            const idToken = await credential.user.getIdToken();

            const { data } = await api.put('/users/update-phone', {
                phoneNumber: phone,
                firebaseToken: idToken
            });

            setUserData(data);
            showToast("Phone successfully verified!", "success");
            setTimeout(() => navigate('/'), 1000);

        } catch (err) {
            console.error("Verification Error:", err);
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const verifyMock = async (otpCode) => {
        const { data: verifyData } = await api.post('/users/verify-phone-otp', { phone, otp: otpCode });
        const idToken = verifyData.phoneVerificationToken;
        const { data } = await api.put('/users/update-phone', { phoneNumber: phone, firebaseToken: idToken });
        setUserData(data);
        showToast("Verified (Dev Mode)!", "success");
        setTimeout(() => navigate('/'), 1000);
    };

    const handleError = (err) => {
        if (err.code === 'auth/invalid-verification-code') setError('The code you entered is incorrect.');
        else if (err.code === 'auth/code-expired') setError('This code has expired. Resend a new one.');
        else if (err.code === 'auth/invalid-app-credential') setError('Configuration Error. Use Dev Bypass.');
        else if (err.message && err.message.includes('already been rendered')) setError('Please refresh the page.');
        else setError(err.message || "Something went wrong.");
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otpValues];
        newOtp[index] = value;
        setOtpValues(newOtp);
        if (value && index < 5) otpInputRefs.current[index + 1].focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) otpInputRefs.current[index - 1].focus();
    };

    const handleDevBypass = () => {
        if (window.confirm("Use Dev Bypass? (Mock OTP: 123456)")) {
            window.isMockMode = true;
            setLoading(true);
            api.post('/users/send-phone-otp', { phone })
                .then(() => {
                    setStep('otp');
                    setTimer(60);
                    showToast("Mock OTP Sent", "info");
                })
                .catch(e => setError(e.message))
                .finally(() => setLoading(false));
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120] relative overflow-hidden font-sans">

            {/* Ambient Background - Subtle */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Invisible Recaptcha */}
            <div id="recaptcha-wrapper" className="absolute bottom-0 left-0 opacity-0 pointer-events-none" />

            <div className="w-full max-w-[420px] z-10 px-4">
                <motion.div
                    layout
                    className="bg-white dark:bg-[#151B2B] rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[600px] relative flex flex-col"
                >
                    {/* Top Bar / Back Navigation */}
                    <div className="px-6 pt-6 flex items-center">
                        {step === 'otp' && (
                            <button
                                onClick={() => setStep('phone')}
                                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
                            </button>
                        )}
                        <h1 className="flex-1 text-center font-bold text-lg text-gray-900 dark:text-white mr-8">
                            {step === 'otp' ? 'OTP Verification' : 'Login'}
                        </h1>
                    </div>

                    <div className="flex-1 flex flex-col px-8 pb-8 pt-8">
                        <AnimatePresence mode="wait">

                            {/* Step 1: Phone Input (Initial Screen) */}
                            {step === 'phone' && (
                                <motion.div
                                    key="step-phone"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col items-center flex-1"
                                >
                                    <div className="w-full h-48 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl mb-8 flex items-center justify-center">
                                        <AnimatedShield />
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                                        Enter your number
                                    </h2>
                                    <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
                                        We will send you a 6 digit verification code to verify your account.
                                    </p>

                                    <div className="w-full mb-6">
                                        <div className="relative flex items-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all overflow-hidden">
                                            <div className="pl-4 pr-3 py-4 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700">
                                                <span className="text-xl">🇮🇳</span>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">+91</span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                placeholder="00000 00000"
                                                className="flex-1 bg-transparent px-4 py-4 font-semibold text-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none tracking-wide"
                                            />
                                        </div>
                                    </div>

                                    {error && <div className="text-center mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl w-full">
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                                        {(error.includes('Config') || error.includes('refresh')) && <button onClick={handleDevBypass} className="text-xs text-indigo-500 underline mt-1 font-semibold hover:text-indigo-600">Simulate (Dev Bypass)</button>}
                                    </div>}

                                    <button
                                        onClick={handleSendOtp}
                                        disabled={loading || phone.length !== 10}
                                        className="w-full mt-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                                    >
                                        {loading ? <Loader className="w-6 h-6 animate-spin" /> : "Send Code"}
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 2: OTP Input (Matches Screenshot) */}
                            {step === 'otp' && (
                                <motion.div
                                    key="step-otp"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex flex-col items-center flex-1"
                                >
                                    {/* Illustration */}
                                    <div className="mb-8 relative">
                                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center z-10 relative">
                                            <LockKeyhole className="w-10 h-10 text-blue-500" />
                                        </div>
                                        {/* Decorative elements mimicking illustration */}
                                        <div className="absolute top-0 right-[-20px] w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg transform rotate-12" />
                                        <div className="absolute bottom-0 left-[-10px] w-6 h-6 bg-pink-100 dark:bg-pink-900/20 rounded-full" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                                        OTP Code Verification
                                    </h2>
                                    <p className="text-gray-500 text-center mb-10 text-sm max-w-[280px] leading-relaxed">
                                        We have sent an OTP code to your Phone No <br />
                                        <span className="font-semibold text-gray-900 dark:text-gray-200">+91 {phone.replace(/(\d{2})\d{4}(\d{4})/, '$1 **** $2')}</span>
                                        <br />Enter the OTP code below to verify.
                                    </p>

                                    {/* OTP Boxes */}
                                    <div className="flex gap-3 mb-8 w-full justify-center">
                                        {otpValues.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={el => otpInputRefs.current[idx] = el}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                                className="w-12 h-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm caret-blue-500"
                                            />
                                        ))}
                                    </div>

                                    {error && <p className="text-xs text-red-500 font-medium text-center mb-4">{error}</p>}

                                    <div className="text-center">
                                        <p className="text-sm text-gray-500 mb-2">Didn't receive Code?</p>
                                        {timer > 0 ? (
                                            <span className="text-sm font-semibold text-gray-400">Resend OTP in {timer}s</span>
                                        ) : (
                                            <button
                                                onClick={handleSendOtp}
                                                className="text-sm font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400"
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>

                                    {/* Verify Button - Optional but good for UX if auto-verify fails or user pauses */}
                                    <button
                                        onClick={handleVerifyOtp}
                                        disabled={loading || otpValues.join("").length !== 6}
                                        className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-lg mb-4"
                                    >
                                        {loading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Verify & Continue"}
                                    </button>

                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PhoneVerification;
