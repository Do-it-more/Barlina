import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { Loader, CheckCircle, XCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { playSuccessSound, initializeAudio } from '../utils/audio';

const OrderConfirmation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'failed'
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);

    const orderId = searchParams.get('order_id');
    const gateway = searchParams.get('gateway');
    const paymentId = searchParams.get('payment_id'); // Instamojo
    const paymentRequestId = searchParams.get('payment_request_id'); // Instamojo

    useEffect(() => {
        const verifyPayment = async () => {
            if (!orderId) {
                setStatus('failed');
                setError('Invalid order details');
                setLoading(false);
                return;
            }

            try {
                // Instamojo needs verification after redirect
                if (gateway === 'instamojo') {
                    const { data } = await api.post('/payments/verify', {
                        gateway: 'instamojo',
                        paymentRequestId,
                        paymentId,
                        orderId
                    });

                    if (data.verified) {
                        handleSuccess();
                    } else {
                        setStatus('failed');
                        setError('Payment could not be verified');
                    }
                } else {
                    // For other gateways or manual navigation
                    const { data: order } = await api.get(`/orders/${orderId.replace('ORDER_', '')}`);
                    if (order.isPaid) {
                        handleSuccess();
                    } else {
                        setStatus('processing');
                        // Maybe wait and retry or show pending
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Verification error:', err);
                setStatus('failed');
                setError(err.response?.data?.message || 'Payment verification failed');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [orderId, gateway, paymentId, paymentRequestId]);

    const handleSuccess = () => {
        setStatus('success');
        clearCart();
        initializeAudio();
        playSuccessSound();

        // Confetti effect
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8 text-center">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-indigo-100 dark:border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifying Payment</h2>
                            <p className="text-gray-500 dark:text-gray-400">Please wait while we confirm your payment status...</p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Order Placed!</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Your payment for order <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">#{orderId?.slice(-6).toUpperCase()}</span> was successful.
                                </p>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    We've sent a confirmation email with your order details and invoice.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    to={`/order/${orderId?.replace('ORDER_', '')}`}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group"
                                >
                                    Track Order <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/"
                                    className="w-full py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingBag className="h-5 w-5" /> Continue Shopping
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Failed</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {error || "We couldn't verify your payment. If money was deducted, it will be refunded or updated shortly."}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/checkout"
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                                >
                                    Try Again
                                </Link>
                                <Link
                                    to="/contact"
                                    className="w-full py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrderConfirmation;
