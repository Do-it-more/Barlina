import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

import { useSettings } from '../context/SettingsContext';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();
    const { user } = useAuth();
    const { settings } = useSettings();
    const [stockData, setStockData] = useState({});
    const [loadingStock, setLoadingStock] = useState(false);

    const total = getCartTotal();

    // Use dynamic settings for tax and shipping
    const taxRate = settings.gstEnabled ? (settings.gstRate / 100) : 0;
    const tax = total * taxRate;
    const shipping = total >= (settings.freeShippingThreshold || 0) ? 0 : (settings.shippingCharge || 0);

    // TDS Calculation
    const tdsRate = settings.tdsEnabled ? (settings.tdsRate / 100) : 0;
    const tds = total * tdsRate;

    const finalTotal = total + tax + shipping - tds;

    useEffect(() => {
        const fetchStock = async () => {
            if (cart.length === 0) return;
            setLoadingStock(true);
            try {
                // Fetch fresh data for each item
                const promises = cart.map(item => {
                    const id = item.product._id || item.product;
                    return api.get(`/products/${id}`).then(res => ({ id, data: res.data })).catch(() => ({ id, error: true }));
                });

                const results = await Promise.all(promises);
                const newStockData = {};
                results.forEach(res => {
                    if (!res.error) {
                        newStockData[res.id] = res.data;
                    }
                });
                setStockData(newStockData);
            } catch (err) {
                console.error("Failed to refresh stock", err);
            } finally {
                setLoadingStock(false);
            }
        };

        fetchStock();
    }, [cart]); // Re-check when cart changes

    // Check for any OOS items to disable checkout
    const hasOutOfStockItems = cart.some(item => {
        const id = item.product._id || item.product;
        const freshProduct = stockData[id];
        if (!freshProduct) return false; // Assume okay if loading or failed

        // Stock Logic: If Limited Stock AND Quantity requested > Available
        return (freshProduct.isStockEnabled !== false && freshProduct.countInStock < item.quantity);
    });

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Shopping Cart</h1>

                {cart.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-10 w-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
                        <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors">
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <AnimatePresence>
                                {cart.map((item) => {
                                    const id = item.product._id || item.product;
                                    const freshProduct = stockData[id];
                                    const isOOS = freshProduct && freshProduct.isStockEnabled !== false && freshProduct.countInStock < item.quantity;
                                    const remaining = freshProduct ? freshProduct.countInStock : item.quantity + 99; // Fallback

                                    return (
                                        <motion.div
                                            key={id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border ${isOOS ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-100 dark:border-slate-700'} flex flex-col sm:flex-row gap-6 items-center`}
                                        >
                                            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-700 rounded-xl overflow-hidden flex-shrink-0 relative">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                {isOOS && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-red-500 px-2 py-1 rounded">Out of Stock</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 text-center sm:text-left">
                                                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.name}</h3>
                                                <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.category}</p>
                                                    {item.color && (
                                                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                                            <span className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: item.color.toLowerCase() }}></span>
                                                            <span className="text-gray-600 dark:text-gray-300 font-medium">{item.color}</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-bold text-indigo-600 dark:text-indigo-400">₹{item.price}</div>

                                                {isOOS && (
                                                    <p className="text-xs font-bold text-red-500 mt-2">
                                                        {freshProduct.countInStock === 0 ? "Currently Unavailable" : `Only ${freshProduct.countInStock} available! Reduce quantity.`}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded-full bg-gray-50 dark:bg-slate-700">
                                                    <button
                                                        onClick={() => updateQuantity(id, item.quantity - 1, item.color)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className={`w-8 text-center font-bold text-sm ${isOOS ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(id, item.quantity + 1, item.color)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        disabled={freshProduct && freshProduct.isStockEnabled !== false && item.quantity >= freshProduct.countInStock}
                                                    >
                                                        <Plus className={`h-3 w-3 ${(freshProduct && freshProduct.isStockEnabled !== false && item.quantity >= freshProduct.countInStock) ? 'text-gray-300' : ''}`} />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => removeFromCart(id, item.color)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-24 transition-colors">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span className="font-medium">₹{total.toFixed(2)}</span>
                                    </div>
                                    {settings.gstEnabled && (
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>Tax ({settings.gstRate}%)</span>
                                            <span className="font-medium">₹{tax.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {settings.tdsEnabled && (
                                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                            <span>TDS ({settings.tdsRate}%)</span>
                                            <span className="font-medium">-₹{tds.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Shipping</span>
                                        <span className="font-medium">{shipping === 0 ? <span className="text-green-600 dark:text-green-400">Free</span> : `₹${shipping}`}</span>
                                    </div>
                                    {shipping > 0 && settings.freeShippingThreshold > 0 && <p className="text-xs text-green-600 dark:text-green-400">Spend ₹{(settings.freeShippingThreshold - total).toFixed(2)} more for free delivery</p>}

                                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-4"></div>

                                    <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                                        <span>Total</span>
                                        <span>₹{finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                {(user?.role === 'admin' || user?.role === 'super_admin') ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded-xl">
                                            <p className="text-sm text-orange-700 dark:text-orange-400 font-medium text-center">
                                                Checkout is disabled for Admin accounts.
                                            </p>
                                        </div>
                                        <button disabled className="w-full py-4 bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                            Proceed to Checkout
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {hasOutOfStockItems ? (
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl">
                                                <p className="text-xs text-red-600 dark:text-red-400 font-bold text-center">
                                                    Some items are out of stock. Please remove or update quantity to proceed.
                                                </p>
                                            </div>
                                        ) : null}

                                        <Link
                                            to={hasOutOfStockItems ? "#" : "/checkout"}
                                            onClick={(e) => hasOutOfStockItems && e.preventDefault()}
                                            className={`block w-full py-4 text-center rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${hasOutOfStockItems
                                                ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
                                                : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700 hover:shadow-xl active:scale-95'
                                                }`}
                                        >
                                            Proceed to Checkout
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-col gap-2">
                                    <p className="text-xs text-gray-400 text-center">We accept</p>
                                    <div className="flex justify-center gap-4">
                                        {/* Visa */}
                                        <svg className="h-6 w-10 shadow-sm rounded bg-white p-0.5" viewBox="0 0 48 48">
                                            <path fill="#1565C0" d="M10,34L10,34c-0.6,0-1.2-0.4-1.4-1L5.1,19.2c-0.2-0.6,0.2-1.2,0.8-1.2h4.5c0.4,0,0.8,0.2,1,0.6L14,24.5l2.6-5.9c0.2-0.4,0.6-0.6,1-0.6h4.5c0.6,0,1,0.6,0.8,1.2L19.4,33c-0.2,0.6-0.8,1-1.4,1H10z" />
                                            <path fill="#1565C0" d="M22,18h4c0.6,0,1,0.4,1,1v14c0,0.6-0.4,1-1,1h-4c-0.6,0-1-0.4-1-1V19C21,18.4,21.4,18,22,18z" />
                                            <path fill="#1565C0" d="M37.3,18h-4.6c-0.5,0-1,0.3-1.2,0.8l-5.5,14c-0.2,0.6,0.2,1.2,0.8,1.2h4.5c0.4,0,0.8-0.2,1-0.6l1.1-2.9h5.8l1.1,2.9c0.2,0.4,0.6,0.6,1,0.6h4.4c0.6,0,1-0.6,0.8-1.2l-5.5-14C38.3,18.3,37.8,18,37.3,18z M34.1,28.5l2-5.3l2,5.3H34.1z" />
                                            <path fill="#FFC107" d="M4.5,18H3L2,19c0,0,1.5,0.1,2.9,0.5C6.4,20,8.2,21,9.5,22.1l0.7-3.5C10.2,18.6,10,18,4.5,18z" />
                                        </svg>
                                        {/* Mastercard */}
                                        <svg className="h-6 w-10 shadow-sm rounded bg-white p-0.5" viewBox="0 0 48 48">
                                            <circle cx="16" cy="24" r="16" fill="#ff9800" />
                                            <circle cx="32" cy="24" r="16" fill="#f44336" />
                                            <path fill="#ffeb3b" d="M24,24c0-3.1,0.9-6,2.4-8.4c-1.5-2.4-4.1-4.1-7-4.1c-4.7,0-8.6,3.8-8.6,8.5s3.8,8.5,8.6,8.5c2.9,0,5.5-1.7,7-4.1C24.9,30,24,27.1,24,24z" />
                                        </svg>
                                        {/* UPI */}
                                        <div className="h-6 px-2 flex items-center bg-gradient-to-r from-orange-500 to-indigo-600 rounded shadow-sm text-[8px] font-black italic text-white uppercase tracking-tighter">
                                            UPI BHIM
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Cart;
