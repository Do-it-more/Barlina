import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Terms = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">Terms & Conditions</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                    <p className="lead text-xl mb-8">
                        Welcome to Barlina Fashion! These terms and conditions outline the rules and regulations for the use of our website.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p className="mb-6">
                        By accessing this website, we assume you accept these terms and conditions. Do not continue to use Barlina Fashion if you do not agree to take all of the terms and conditions stated on this page.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">2. Intellectual Property</h2>
                    <p className="mb-6">
                        Unless otherwise stated, Barlina Fashion and/or its licensors own the intellectual property rights for all material on this website. All intellectual property rights are reserved. You may access this for your own personal use subjected to restrictions set in these terms and conditions.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">3. User Accounts</h2>
                    <p className="mb-6">
                        If you create an account on our website, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account. You must immediately notify us of any unauthorized uses of your account or any other breaches of security.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">4. Products and Pricing</h2>
                    <p className="mb-6">
                        We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Site. However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors, and your electronic display may not accurately reflect the actual colors and details of the products. All products are subject to availability, and we cannot guarantee that items will be in stock. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">5. Limitation of Liability</h2>
                    <p className="mb-6">
                        In no event shall Barlina Fashion, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this website whether such liability is under contract. Barlina Fashion, including its officers, directors, and employees shall not be held liable for any indirect, consequential, or special liability arising out of or in any way related to your use of this website.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4">6. Governing Law</h2>
                    <p className="mb-6">
                        These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
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

export default Terms;
