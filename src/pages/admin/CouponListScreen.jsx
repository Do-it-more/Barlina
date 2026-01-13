import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Tag, Calendar, Percent } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const CouponListScreen = () => {
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountPercentage: '',
        expiryDate: ''
    });

    const fetchCoupons = async () => {
        try {
            const { data } = await api.get('/coupons');
            setCoupons(data);
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCoupon({ ...newCoupon, code });
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm('Delete Coupon', 'Are you sure you want to delete this coupon?');
        if (isConfirmed) {
            try {
                await api.delete(`/coupons/${id}`);
                fetchCoupons();
                showToast("Coupon deleted successfully", "success");
            } catch (error) {
                showToast(error.response?.data?.message || 'Error deleting coupon', "error");
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/coupons', newCoupon);
            setShowCreate(false);
            setNewCoupon({ code: '', discountPercentage: '', expiryDate: '' });
            fetchCoupons();
            showToast("Coupon created successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || 'Error creating coupon', "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Coupons</h1>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-bold"
                >
                    <Plus className="h-4 w-4" /> Add Coupon
                </button>
            </div>

            {showCreate && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Create New Coupon</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
                                <button type="button" onClick={generateCode} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline">Auto-generate</button>
                            </div>
                            <input
                                required
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-bold"
                                placeholder="e.g. SAVE50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount %</label>
                            <div className="relative">
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newCoupon.discountPercentage}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, discountPercentage: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                                <Percent className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                            <input
                                required
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={newCoupon.expiryDate}
                                onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white [color-scheme:dark]"
                            />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 font-bold">Create Coupon</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-white">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-4 font-bold">Coupon Code</th>
                            <th className="px-6 py-4 font-bold">Discount</th>
                            <th className="px-6 py-4 font-bold">Expires On</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {coupons.map((coupon) => (
                            <tr key={coupon._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
                                            <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <span className="font-bold tracking-wider">{coupon.code}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-sm">
                                        {coupon.discountPercentage}% OFF
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(coupon.expiryDate).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {new Date() > new Date(coupon.expiryDate) ? (
                                        <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase">
                                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                                            Expired
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase">
                                            <span className="w-2 h-2 bg-green-600 rounded-full" />
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(coupon._id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                        title="Delete Coupon"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && !loading && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Tag className="h-10 w-10 opacity-20" />
                                        <p className="font-medium text-lg">No Coupons Found</p>
                                        <p className="text-sm">Create a new promotion to see it listed here.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CouponListScreen;
