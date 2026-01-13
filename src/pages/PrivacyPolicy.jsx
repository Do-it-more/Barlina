import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">Privacy Policy</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                    <p className="lead text-xl mb-8">
                        At Barlina Fashion, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li><strong>Personal Information:</strong> Name, email address, phone number, shipping and billing addresses.</li>
                        <li><strong>Payment Information:</strong> Credit card details and other payment data (processed securely by our payment partners).</li>
                        <li><strong>Usage Data:</strong> Information about how you interact with our website, including IP address, browser type, and pages visited.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
                    <p className="mb-6">
                        We use your information to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>Process and fulfill your orders.</li>
                        <li>Communicate with you about your order status and updates.</li>
                        <li>Send you promotional offers and newsletters (if you opted in).</li>
                        <li>Improve our website and customer service.</li>
                        <li>Prevent fraud and ensure security.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">3. Data Security</h2>
                    <p className="mb-6">
                        We implement strict security measures to protect your personal information. Your payment data is encrypted using SSL technology and is never stored on our servers.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">4. Cookies</h2>
                    <p className="mb-6">
                        We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can choose to disable cookies in your browser settings, but this may affect site functionality.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">5. Third-Party Services</h2>
                    <p className="mb-6">
                        We may share your data with trusted third-party service providers who assist us in operating our website, conducting business, or servicing you (e.g., shipping carriers, payment gateways), so long as those parties agree to keep this information confidential.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">6. Your Rights</h2>
                    <p className="mb-6">
                        You have the right to access, correct, or delete your personal information. If you wish to exercise these rights, please contact us at support@barlinafashion.com.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">7. Changes to This Policy</h2>
                    <p className="mb-6">
                        We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.
                    </p>

                    <p className="mt-12 text-sm text-gray-500">
                        Last Updated: January 2026
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
