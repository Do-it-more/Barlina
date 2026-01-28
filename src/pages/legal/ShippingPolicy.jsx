import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { Truck, Clock, AlertCircle } from 'lucide-react';

const ShippingPolicy = () => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                setSettings(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchSettings();
    }, []);

    const email = settings?.companyEmail || 'seller+7a3b38ed33f74b5fb9e1b5cbfd8fc6f4@instamojo.com';

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Shipping & Delivery Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Information regarding delivery estimates, costs, and timelines
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-8 space-y-8">

                        {/* Delivery Estimates */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delivery Estimates</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    You hereby agree that the delivery dates are estimates, unless a fixed date for the delivery has been expressly agreed in writing.
                                </p>
                            </div>
                        </div>

                        {/* Shipping Costs */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Truck className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Shipping Costs</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    The cost for delivery shall be calculated at the time of initiation of Transaction based on the shipping address and will be collected from you as a part of the Transaction Amount paid for the products and/or services.
                                </p>
                            </div>
                        </div>

                        {/* Delayed Delivery */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delayed Delivery</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                    In the event that you do not receive the delivery even after seven days have passed from the estimated date of delivery, you must promptly reach out to us.
                                </p>
                                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Contact for delivery issues:</p>
                                    <a href={`mailto:${email}`} className="text-indigo-600 dark:text-indigo-400 font-medium break-all hover:underline">
                                        {email}
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ShippingPolicy;
