import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, Plus } from 'lucide-react';
import api from '../../services/api';
import { X, Loader } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Load Razorpay SDK dynamically
const loadRazorpay = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(window.Razorpay);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(window.Razorpay);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const TopUpForm = ({ onSuccess, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const handleRazorpayPayment = async (user) => {
        // 1. Initiate Top-up (Get Order)
        const { data } = await api.post('/wallet/initiate-topup', {
            amount: Number(amount)
        });

        // 2. Load SDK and Open Checkout
        const Razorpay = await loadRazorpay();
        if (!Razorpay) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: "ShopVibe Wallet",
            description: "Wallet Top-up",
            order_id: data.orderId,
            handler: async function (response) {
                try {
                    // 3. Verify Payment
                    const verifyRes = await api.post('/wallet/verify-topup', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    if (verifyRes.data.success) {
                        showToast(`Successfully added ₹${amount} to wallet!`, 'success');
                        onSuccess();
                    } else {
                        showToast('Payment verification pending...', 'info');
                        onSuccess();
                    }
                } catch (err) {
                    console.error("Verification failed", err);
                    showToast('Payment verification failed. Please contact support.', 'error');
                }
            },
            theme: {
                color: "#4f46e5"
            },
            modal: {
                ondismiss: () => {
                    setLoading(false);
                }
            }
        };

        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            setError(response.error.description || "Payment failed");
        });
        rzp1.open();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await handleRazorpayPayment();
        } catch (err) {
            console.error("Top-up failed", err);
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Payment failed';
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter Amount (₹)</label>
                <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. 500"
                />
            </div>

            <div className="p-4 border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl text-center">
                <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
                    Pay using Razorpay (UPI, Netbanking, Cards).
                </p>
                <div className="flex justify-center gap-2 mt-2 opacity-70">
                    <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border">UPI</span>
                    <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border">GPay</span>
                    <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border">PhonePe</span>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading && <Loader className="h-4 w-4 animate-spin" />}
                {loading ? 'Processing...' : `Pay ₹${amount || '0'}`}
            </button>
        </form>
    );
};

const Wallet = () => {
    const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        try {
            const { data } = await api.get('/wallet');
            setWallet(data);
        } catch (error) {
            console.error('Failed to fetch wallet', error);
        } finally {
            setLoading(false);
        }
    };

    const ITEMS_PER_PAGE = 5;
    const [txnPage, setTxnPage] = useState(1);
    const [txnFilter, setTxnFilter] = useState('all'); // 'all', 'CREDIT', 'DEBIT'

    const filteredTransactions = txnFilter === 'all'
        ? wallet.transactions
        : wallet.transactions.filter(t => t.type === txnFilter);

    const totalTxnPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = filteredTransactions.slice(
        (txnPage - 1) * ITEMS_PER_PAGE,
        txnPage * ITEMS_PER_PAGE
    );

    const getTransactionIcon = (type) => {
        return type === 'CREDIT' ?
            <ArrowDownLeft className="h-5 w-5 text-green-500" /> :
            <ArrowUpRight className="h-5 w-5 text-red-500" />;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* Header / Balance Card */}
            <div className="p-5 sm:p-8 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                    <div>
                        <p className="text-indigo-200 font-medium mb-1 flex items-center gap-2 text-sm sm:text-base">
                            <WalletIcon className="h-4 w-4" /> My Wallet Balance
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold">₹{wallet.balance.toFixed(2)}</h2>
                    </div>
                    <button
                        onClick={() => setShowTopUp(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <Plus className="h-5 w-5" /> Add Money
                    </button>
                </div>
            </div>

            {/* Transactions */}
            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-400" /> Transaction History
                        {filteredTransactions.length > 0 && (
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({filteredTransactions.length})</span>
                        )}
                    </h3>
                    {/* Filter Tabs */}
                    {wallet.transactions.length > 0 && (
                        <div className="flex bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'CREDIT', label: 'Credit' },
                                { key: 'DEBIT', label: 'Debit' }
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => { setTxnFilter(f.key); setTxnPage(1); }}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${txnFilter === f.key ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <WalletIcon className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p>{txnFilter === 'all' ? 'No transactions yet' : `No ${txnFilter.toLowerCase()} transactions`}</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {paginatedTransactions.map((txn) => (
                                <div key={txn._id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors gap-3">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0 flex items-center justify-center ${txn.type === 'CREDIT' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                            {getTransactionIcon(txn.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">{txn.description}</p>
                                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(txn.createdAt).toLocaleDateString()} • {new Date(txn.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm sm:text-base flex-shrink-0 ${txn.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                        {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalTxnPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <button
                                    onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                                    disabled={txnPage === 1}
                                    className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Page {txnPage} of {totalTxnPages}
                                </span>
                                <button
                                    onClick={() => setTxnPage(p => Math.min(totalTxnPages, p + 1))}
                                    disabled={txnPage === totalTxnPages}
                                    className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Top Up Modal */}
            {showTopUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowTopUp(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Add Money to Wallet</h3>

                        <TopUpForm
                            onSuccess={() => {
                                setShowTopUp(false);
                                fetchWallet();
                            }}
                            onCancel={() => setShowTopUp(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
