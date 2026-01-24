import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Store, ArrowRight, Loader } from 'lucide-react';

const SellerRegister = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        sellerType: 'INDIVIDUAL',
        pan: '',
        gstin: '',
        mobile: user?.phoneNumber || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/sellers/register', formData);
            showToast("Seller Account Created Successfully", "success");
            navigate('/seller/dashboard'); // Or onboarding step 2
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || "Registration Failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <Store className="h-6 w-6" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
                    Become a Seller
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Start your journey with us today
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-slate-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Mobile (from User Profile)</label>
                            <input
                                type="text"
                                disabled
                                value={formData.mobile}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-gray-100 dark:bg-slate-900 text-gray-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business / Store Name</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    required
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white"
                                    placeholder="My Awesome Store"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seller Type</label>
                            <select
                                value={formData.sellerType}
                                onChange={(e) => setFormData({ ...formData, sellerType: e.target.value })}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-slate-900 dark:text-white"
                            >
                                <option value="INDIVIDUAL">Individual</option>
                                <option value="PROPRIETORSHIP">Proprietorship</option>
                                <option value="COMPANY">Company (Pvt Ltd / LLP)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PAN Number</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    value={formData.pan}
                                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white uppercase"
                                    placeholder="ABCDE1234F"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GSTIN (Optional)</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    maxLength={15}
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white uppercase"
                                    placeholder="22AAAAA0000A1Z5"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? <Loader className="animate-spin h-5 w-5" /> : (
                                    <>
                                        Register & Continue <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellerRegister;
