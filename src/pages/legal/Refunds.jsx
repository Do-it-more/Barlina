import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';

const Refunds = () => {
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

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Refund & Cancellation Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Transparent and fair resolution for all your transactions
                    </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-2xl border border-indigo-100 dark:border-slate-700 mb-12 shadow-sm">
                    <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                        <p className="lead text-lg font-medium text-slate-900 dark:text-white mb-6">
                            Upon completing a Transaction, you are entering into a legally binding and enforceable agreement with us to purchase the product and/or service.
                        </p>

                        <div className="space-y-8">
                            <section>
                                <h2 className="flex items-center text-xl font-bold text-slate-900 dark:text-white mb-4">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm mr-3">1</span>
                                    Cancellation Policy
                                </h2>
                                <p className="ml-11">
                                    After this point the User may cancel the Transaction unless it has been specifically provided for on the Platform. In which case, the cancellation will be subject to the terms mentioned on the Platform. We shall retain the discretion in approving any cancellation requests and we may ask for additional details before approving any requests.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center text-xl font-bold text-slate-900 dark:text-white mb-4">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm mr-3">2</span>
                                    Return & Refund Eligibility
                                </h2>
                                <p className="ml-11 mb-4">
                                    Once you have received the product and/or service, the only event where you can request for a replacement or a return and a refund is if the product and/or service does not match the description as mentioned on the Platform.
                                </p>
                                <div className="ml-11 p-4 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-indigo-500">
                                    <p className="font-semibold text-slate-900 dark:text-white">Timeline</p>
                                    <p className="text-sm mt-1">
                                        Any request for refund must be submitted within <strong>three days</strong> from the date of the Transaction or such number of days prescribed on the Platform, which shall in no event be less than three days.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="flex items-center text-xl font-bold text-slate-900 dark:text-white mb-4">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm mr-3">3</span>
                                    Claim Process
                                </h2>
                                <div className="ml-11 space-y-4">
                                    <p>
                                        A User may submit a claim for a refund for a purchase made by:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Raising a ticket on our support portal</li>
                                        <li>Contacting us via email at <a href={`mailto:${settings?.companyEmail || 'seller+7a3b38ed33f74b5fb9e1b5cbfd8fc6f4@instamojo.com'}`} className="text-indigo-600 hover:text-indigo-700 underline font-medium break-all">{settings?.companyEmail || 'seller+7a3b38ed33f74b5fb9e1b5cbfd8fc6f4@instamojo.com'}</a></li>
                                    </ul>
                                    <p>
                                        You must provide a clear and specific reason for the refund request, including the exact terms that have been violated, along with any proof, if required.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="flex items-center text-xl font-bold text-slate-900 dark:text-white mb-4">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm mr-3">4</span>
                                    Approval Process
                                </h2>
                                <p className="ml-11">
                                    Whether a refund will be provided will be determined by us, and we may ask for additional details before approving any requests.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Refunds;
