import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { Tag, X, Wallet, Truck, MapPin } from 'lucide-react';
import AddressBook from '../components/profile/AddressBook';

// Replace with your Stripe Publishable Key
// Replace with your Stripe Publishable Key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const { settings } = useSettings();
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [form, setForm] = useState({
        address: '',
        address2: '',
        city: '',
        postalCode: '',
        country: '',
        phoneNumber: user?.phoneNumber || user?.address?.phoneNumber || '',
    });
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [showAddressBook, setShowAddressBook] = useState(false);

    const handleSelectAddress = (address) => {
        setForm({
            address: address.street,
            address2: address.addressLine2 || '',
            city: address.city,
            country: address.state, // Mapping state to country field as per original form
            postalCode: address.postalCode,
            phoneNumber: address.phoneNumber || user.phoneNumber || ''
        });
        setShowAddressBook(false);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsApplying(true);
        setCouponError('');
        try {
            const { data } = await api.post('/coupons/validate', { code: couponCode });
            setAppliedCoupon(data);
            setCouponCode('');
        } catch (error) {
            setCouponError(error.response?.data?.message || 'Invalid coupon');
        } finally {
            setIsApplying(false);
        }
    };

    const total = getCartTotal();
    const discount = appliedCoupon ? (total * appliedCoupon.discountPercentage) / 100 : 0;

    // Use dynamic tax and shipping from settings
    const taxRate = settings.gstEnabled ? (settings.gstRate / 100) : 0;
    const tax = (total - discount) * taxRate;
    const shipping = (total - discount) >= (settings.freeShippingThreshold || 0) ? 0 : (settings.shippingCharge || 0);

    // TDS Calculation (Deduction)
    const tdsRate = settings.tdsEnabled ? (settings.tdsRate / 100) : 0;
    const tds = (total - discount) * tdsRate;

    const finalTotal = total - discount + tax + shipping - tds;

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!form.address) newErrors.address = 'Address is required';
        if (!form.city) newErrors.city = 'City is required';
        if (!form.country) newErrors.country = 'State is required'; // Mapping country input to state

        // Postal Code Validation (6 digits)
        if (!form.postalCode) {
            newErrors.postalCode = 'Postal Code is required';
        } else if (!/^\d{6}$/.test(form.postalCode)) {
            newErrors.postalCode = 'Postal Code must be 6 digits';
        }

        // Phone Validation (10 digits)
        if (!form.phoneNumber) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10}$/.test(form.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number must be 10 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        // Clear error when user types
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    React.useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                phoneNumber: user.phoneNumber || prev.phoneNumber || '',
                // Only overwrite if empty to strictly avoid overwriting user input
                // But for phone number, we want to ensure it's there.
            }));
        }
    }, [user]);

    React.useEffect(() => {
        if (isOrderPlaced) {
            window.scrollTo(0, 0);
            // Realistic Confetti "Fire" spread
            const count = 200;
            const defaults = {
                origin: { y: 0.7 }
            };

            function fire(particleRatio, opts) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio),
                    colors: ['#4f46e5', '#818cf8', '#c084fc', '#f472b6', '#fbbf24'] // Indigo, Purple, Pink, Gold
                });
            }

            fire(0.25, {
                spread: 26,
                startVelocity: 55,
            });
            fire(0.2, {
                spread: 60,
            });
            fire(0.35, {
                spread: 100,
                decay: 0.91,
                scalar: 0.8
            });
            fire(0.1, {
                spread: 120,
                startVelocity: 25,
                decay: 0.92,
                scalar: 1.2
            });
            fire(0.1, {
                spread: 120,
                startVelocity: 45,
            });

            // Success Sound is now handled in CheckoutForm with delay
        }
    }, [isOrderPlaced]);

    if (isOrderPlaced) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col transition-colors duration-300 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <Navbar />
                <div className="flex-grow flex items-center justify-center p-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md w-full text-center relative overflow-hidden"
                    >
                        {/* Decorative Top Gradient Line */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
                        >
                            <CheckCircle className="h-12 w-12 text-white" />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-bold text-slate-900 dark:text-white mb-3"
                        >
                            Order Placed!
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-500 dark:text-gray-300 mb-8 leading-relaxed"
                        >
                            Thank you for your purchase. Your order has been securely processed and is on its way!
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.href = '/'}
                            className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all"
                        >
                            Continue Shopping
                        </motion.button>
                    </motion.div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Please Login to Checkout</h2>
                        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Go to Login</Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                        <input type="email" value={user.email} disabled className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl cursor-not-allowed text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                        <input type="text" value={user.name} disabled className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl cursor-not-allowed text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                        <input type="text" value={user.phoneNumber || ''} disabled className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl cursor-not-allowed text-gray-500 dark:text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-slate-700"></div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shipping Address</h2>
                                    <button
                                        onClick={() => setShowAddressBook(!showAddressBook)}
                                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <MapPin className="h-4 w-4" /> Select Saved Address
                                    </button>
                                </div>

                                {showAddressBook && (
                                    <div className="mb-6 p-4 border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl">
                                        <AddressBook onSelect={handleSelectAddress} selectedId={null} />
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address Line 1</label>
                                        <input
                                            required
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="Street address, P.O. box"
                                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${errors.address ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500'}`}
                                        />
                                        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            name="address2"
                                            value={form.address2 || ''} // Handle potentially undefined
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="Apartment, suite, unit, building, floor, etc."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                            <input
                                                required
                                                name="city"
                                                value={form.city}
                                                onChange={handleChange}
                                                type="text"
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${errors.city ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500'}`}
                                            />
                                            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">State / Province</label>
                                            <input
                                                required
                                                name="country"
                                                value={form.country}
                                                onChange={handleChange}
                                                placeholder="State"
                                                type="text"
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${errors.country ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500'}`}
                                            />
                                            {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</label>
                                            <input
                                                required
                                                name="postalCode"
                                                value={form.postalCode}
                                                onChange={(e) => {
                                                    // Only allow digits
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    handleChange({ target: { name: 'postalCode', value: val } });
                                                }}
                                                type="text"
                                                maxLength={6}
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${errors.postalCode ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500'}`}
                                            />
                                            {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                        <input
                                            required
                                            name="phoneNumber"
                                            value={form.phoneNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                handleChange({ target: { name: 'phoneNumber', value: val } });
                                            }}
                                            type="tel"
                                            maxLength={10}
                                            placeholder="10-digit mobile number"
                                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${errors.phoneNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-500'}`}
                                        />
                                        {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-slate-700"></div>

                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Payment Method</h2>
                                <Elements stripe={stripePromise}>
                                    <CheckoutForm
                                        cart={cart}
                                        user={user}
                                        total={finalTotal}
                                        itemsPrice={total - discount}
                                        taxPrice={tax}
                                        shippingPrice={shipping}
                                        shippingAddress={form}
                                        clearCart={clearCart}
                                        onDisplaySuccess={() => setIsOrderPlaced(true)}
                                        validateForm={validateForm}
                                    />
                                </Elements>
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-24 transition-colors">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                                {cart.map(item => (
                                    <div key={item._id || item.id} className="flex gap-4 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <img src={item.image} alt="" className="w-16 h-16 rounded-md object-cover bg-gray-100 dark:bg-slate-600" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">₹{item.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-slate-700 my-4"></div>

                            {/* Coupon Section */}
                            <div className="mb-6">
                                <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">Apply Coupon</p>
                                {!appliedCoupon ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    placeholder="Enter code"
                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                                />
                                            </div>
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={isApplying || !couponCode}
                                                className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                            >
                                                {isApplying ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && <p className="text-xs text-red-500 ml-1">{couponError}</p>}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                            <Tag className="h-4 w-4" />
                                            <span className="text-sm font-bold">{appliedCoupon.code}</span>
                                            <span className="text-xs bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">-{appliedCoupon.discountPercentage}%</span>
                                        </div>
                                        <button onClick={() => setAppliedCoupon(null)} className="text-green-700 dark:text-green-400 hover:opacity-70">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                                    <span>Subtotal</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400 text-sm">
                                        <span>Discount</span>
                                        <span>-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                {settings.gstEnabled && (
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                                        <span>Tax ({settings.gstRate}%)</span>
                                        <span>₹{tax.toFixed(2)}</span>
                                    </div>
                                )}
                                {settings.tdsEnabled && (
                                    <div className="flex justify-between text-blue-600 dark:text-blue-400 text-sm">
                                        <span>TDS ({settings.tdsRate}%)</span>
                                        <span>-₹{tds.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-700 mt-2">
                                    <span>Total</span>
                                    <span>₹{finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-900/30">
                                Complete payment details on the left to place order.
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Checkout;
