import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { Loader, Lock, CreditCard, QrCode, Smartphone, ExternalLink, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useToast } from '../context/ToastContext';
import { playSuccessSound, initializeAudio } from '../utils/audio';

const CheckoutForm = ({ cart, user, total, itemsPrice, taxPrice, shippingPrice, shippingAddress, clearCart, onDisplaySuccess, validateForm }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('card'); // 'card', 'upi', 'cod'
    const [upiId, setUpiId] = useState('');
    const [isCodAvailable, setIsCodAvailable] = useState(false);
    const [codUnavailableReason, setCodUnavailableReason] = useState('');

    // Check if any product in cart has COD disabled
    const isCodRestrictedByProduct = cart.some(item => {
        // Handle nested product object or direct properties depending on how cart is structured
        // Usually cart items have 'product' field which is the ID, and other details.
        // We need to assume 'isCodAvailable' is populated or part of the item details.
        // If the cart item structure from 'cart' prop doesn't include isCodAvailable, we might need to rely on what's passed.
        // Let's assume the cart item object has the full product details or the relevant flag.
        return item.isCodAvailable === false || (item.product && item.product.isCodAvailable === false);
    });

    const [globalCodEnabled, setGlobalCodEnabled] = useState(true);

    // Initial settings fetch
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                setGlobalCodEnabled(data.isCodAvailable);
            } catch (error) {
                console.error("Failed to fetch settings", error);
                setGlobalCodEnabled(false);
            }
        };
        fetchSettings();
    }, []);

    // Reactive check based on cart and global settings
    React.useEffect(() => {
        if (globalCodEnabled) {
            if (isCodRestrictedByProduct) {
                setIsCodAvailable(false);
                setCodUnavailableReason("One or more items in your cart are not eligible for Cash on Delivery.");
            } else {
                setIsCodAvailable(true);
                setCodUnavailableReason('');
            }
        } else {
            setIsCodAvailable(false);
            setCodUnavailableReason("Cash on Delivery is currently disabled for the store.");
        }
    }, [globalCodEnabled, isCodRestrictedByProduct]);

    const createOrder = async (payMethod) => {
        const orderData = {
            orderItems: cart.map(item => ({
                name: item.name,
                qty: item.quantity,
                image: item.image,
                price: item.price,
                product: item.product._id || item.product
            })),
            shippingAddress,
            paymentMethod: payMethod,
            itemsPrice: itemsPrice,
            taxPrice: taxPrice,
            shippingPrice: shippingPrice,
            totalPrice: total
        };
        const { data } = await api.post('/orders', orderData);
        return data; // createdOrder
    };

    const handleCardPayment = async (e) => {
        e.preventDefault();
        initializeAudio(); // Prepare audio context for mobile
        if (!stripe || !elements) return;
        if (!validateShipping()) return;

        setLoading(true);
        setError(null);
        let orderId = null;

        try {
            const createdOrder = await createOrder('Stripe');
            orderId = createdOrder._id;

            // Amount in cents
            const amountInCents = Math.round(createdOrder.totalPrice * 100);
            const { data: { clientSecret } } = await api.post('/orders/create-payment-intent', { amount: amountInCents });

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: user.name,
                        email: user.email,
                        address: {
                            line1: shippingAddress.address,
                            city: shippingAddress.city,
                            postal_code: shippingAddress.postalCode,
                            country: 'US', // Or map from shippingAddress.country if available/standardized
                        }
                    }
                }
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            if (result.paymentIntent.status === 'succeeded') {
                await markOrderPaid(createdOrder._id, result.paymentIntent.id, 'Stripe');
            }

        } catch (err) {
            console.error("Payment failed", err);

            // If order was created but payment failed, cancel order to restore stock
            if (orderId) {
                try {
                    console.log("Cancelling failed order to restore stock...", orderId);
                    await api.put(`/orders/${orderId}/cancel`, { reason: 'Payment Failed' });
                } catch (cancelErr) {
                    console.error("Failed to cancel failed order:", cancelErr);
                }
            }

            const msg = err.response?.data?.message || err.message || "Payment failed";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUPIPayment = async (e) => {
        e.preventDefault();
        initializeAudio(); // Prepare audio context for mobile
        if (!validateShipping()) return;

        setLoading(true);
        setError(null);

        try {
            // Simulate processing time for better UX
            await new Promise(resolve => setTimeout(resolve, 2000));

            const createdOrder = await createOrder('UPI');

            // Mock successful UPI transaction
            const mockTxId = `UPI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            await markOrderPaid(createdOrder._id, mockTxId, 'UPI');

        } catch (err) {
            console.error("UPI Payment failed", err);
            const msg = err.response?.data?.message || err.message || "UPI Payment verification failed";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCODPayment = async (e) => {
        e.preventDefault();
        initializeAudio();
        if (!validateShipping()) return;

        setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
            const createdOrder = await createOrder('COD');

            // For COD, we don't mark as paid immediately. 
            // Usually status remains 'Pending' or 'Processing' and isPaid = false.
            // But user flow should be success.

            playSuccessSound();
            showToast("Order placed successfully! Pay on delivery.", "success");
            clearCart();
            setTimeout(() => {
                onDisplaySuccess();
            }, 500);

        } catch (err) {
            console.error("COD Order failed", err);
            const msg = err.response?.data?.message || err.message || "Order placement failed";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const markOrderPaid = async (orderId, txId, provider) => {
        const paymentResult = {
            id: txId,
            status: 'completed',
            update_time: String(Date.now()),
            email_address: user.email,
            payer: { email_address: user.email }
        };
        await api.put(`/orders/${orderId}/pay`, paymentResult);

        // Immediate success sound
        playSuccessSound();

        showToast("Payment successful! Order placed.", "success");
        clearCart();

        // Short delay for view switch to allow sound/toast perception
        setTimeout(() => {
            onDisplaySuccess();
        }, 500);
    };

    const validateShipping = () => {
        if (validateForm) {
            return validateForm();
        }
        // Fallback checks if validateForm is not provided
        const missing = [];
        if (!shippingAddress.address?.trim()) missing.push("Address");
        if (!shippingAddress.phoneNumber?.trim()) missing.push("Phone Number");
        if (!shippingAddress.city?.trim()) missing.push("City");
        if (!shippingAddress.postalCode?.trim()) missing.push("Postal Code");
        if (!shippingAddress.country?.trim()) missing.push("State/Province");

        if (missing.length > 0) {
            setError(`Please fill in: ${missing.join(", ")}`);
            return false;
        }
        return true;
    };

    const cardStyle = {
        style: {
            base: {
                color: "#32325d",
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: "antialiased",
                fontSize: "16px",
                "::placeholder": { color: "#aab7c4" }
            },
            invalid: { color: "#fa755a", iconColor: "#fa755a" }
        }
    };

    // Generate a Dummy UPI string for QR Code
    // format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=<currency>
    const finalTotal = Number(total).toFixed(2);
    const upiString = `upi://pay?pa=shopvibe@upi&pn=ShopVibe&am=${finalTotal}&cu=INR`;

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative w-24 h-24 mb-6">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"
                                ></motion.div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.1 }} // Offset animation
                                    className="absolute inset-0 border-4 border-t-indigo-600 dark:border-t-indigo-500 rounded-full border-r-transparent border-b-transparent border-l-transparent"
                                ></motion.div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Lock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Processing Payment</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs">
                                Please wait while we securely process your order...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
                <button
                    onClick={() => { setActiveTab('card'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'card' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <CreditCard className="h-4 w-4" /> Card
                </button>
                <button
                    onClick={() => { setActiveTab('upi'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'upi' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <QrCode className="h-4 w-4" /> UPI / QR
                </button>
                {isCodAvailable && (
                    <button
                        onClick={() => { setActiveTab('cod'); setError(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'cod' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        <Truck className="h-4 w-4" /> COD
                    </button>
                )}
            </div>

            {activeTab === 'card' ? (
                <form onSubmit={handleCardPayment} className="space-y-6 fade-in">
                    <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-700/30">
                        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Secure Credit Card Payment
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm">
                            <CardElement options={{
                                style: {
                                    base: {
                                        color: "#32325d", // Keeping default for now as dynamic theme switching for Stripe requires context
                                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                                        fontSmoothing: "antialiased",
                                        fontSize: "16px",
                                        "::placeholder": { color: "#aab7c4" }
                                    },
                                    invalid: { color: "#fa755a", iconColor: "#fa755a" }
                                }
                            }} />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!stripe || loading}
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : `Pay ₹${finalTotal}`}
                    </button>
                </form>
            ) : activeTab === 'upi' ? (
                <form onSubmit={handleUPIPayment} className="space-y-6 fade-in">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/20">
                        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                            <QRCodeSVG value={upiString} size={180} />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Scan to Pay</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Supported by all UPI Apps</p>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Smartphone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter your UPI ID (e.g. name@upi)"
                                className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                            Note: This is a demo. No real money will be deducted via UPI.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : `Verify & Pay ₹${finalTotal}`}
                    </button>
                </form>
            ) : activeTab === 'cod' ? (
                <form onSubmit={handleCODPayment} className="space-y-6 fade-in">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/20">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
                            <Truck className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cash on Delivery</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400 text-center max-w-xs">
                            Pay securely with cash when your order is delivered to your doorstep.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : `Place Order ₹${finalTotal}`}
                    </button>
                </form>
            ) : null}
        </div>
    );
};

export default CheckoutForm;
