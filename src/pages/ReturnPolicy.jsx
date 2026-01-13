import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api'; // Assuming you might want to fetch dynamic return policy settings in future, but for now static content.

const ReturnPolicy = () => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Optional: Fetch dynamic settings if needed
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
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">Return & Refund Policy</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                    <p className="lead text-xl mb-8">
                        We want you to be completely satisfied with your purchase. If you are not happy with your order, we are here to help.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">1. Return Eligibility</h2>
                    <p className="mb-6">
                        To be eligible for a return, your item must be trusted to be:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>Unused and in the same condition that you received it.</li>
                        <li>In the original packaging with all tags attached.</li>
                        <li>Returned within <strong>{settings?.areReturnsActive ? 'the specified return window (usually 7 days)' : '7 days'}</strong> of delivery.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">2. Non-Returnable Items</h2>
                    <p className="mb-6">
                        Certain types of items cannot be returned, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>Perishable goods (such as food, flowers, or plants).</li>
                        <li>Custom products (such as special orders or personalized items).</li>
                        <li>Personal care goods (such as beauty products).</li>
                        <li>Hazardous materials, flammable liquids, or gases.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">3. Return Process</h2>
                    <ol className="list-decimal pl-6 space-y-2 mb-6">
                        <li>Go to your <strong>My Orders</strong> page.</li>
                        <li>Select the order and item you wish to return.</li>
                        <li>Click on the "Return Item" button (if eligible).</li>
                        <li>Follow the instructions to submit your return request, including uploading any necessary evidence (photos/videos).</li>
                        <li>Wait for admin approval. Once approved, we will schedule a pickup or provide return shipping instructions.</li>
                    </ol>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">4. Refunds</h2>
                    <p className="mb-6">
                        Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.
                    </p>
                    <p className="mb-6">
                        If your return is approved, we will initiate a refund to your original method of payment (or store wallet). You will receive the credit within a certain amount of days, depending on your card issuer's policies.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">5. Contact Us</h2>
                    <p className="mb-6">
                        If you have any questions on how to return your item to us, contact us at support@barlinafashion.com.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ReturnPolicy;
