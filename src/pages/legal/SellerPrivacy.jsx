import React, { useEffect } from 'react';

const SellerPrivacy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            title: "INFORMATION WE COLLECT",
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li><strong>Business Information:</strong> Business name, address, tax identification numbers (PAN, GSTIN), and incorporation documents.</li>
                    <li><strong>Personal Information:</strong> Name, email address, phone number, and government-issued ID of the business owner or authorized signatory.</li>
                    <li><strong>Financial Information:</strong> Bank account details for payouts.</li>
                    <li><strong>Transaction Data:</strong> Details of products listed, orders details, sales history, and customer communications.</li>
                </ul>
            )
        },
        {
            title: "HOW WE USE YOUR INFORMATION",
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>To verify your identity and business legitimacy during onboarding.</li>
                    <li>To facilitate transactions, process orders, and manage payments and payouts.</li>
                    <li>To communicate with you regarding your account, orders, and platform updates.</li>
                    <li>To comply with legal obligations, tax reporting, and regulatory requirements.</li>
                    <li>To prevent fraud, abuse, and security incidents.</li>
                </ul>
            )
        },
        {
            title: "DATA SHARING AND DISCLOSURE",
            content: "We do not sell your personal information. We may share your information with third-party service providers (e.g., payment processors, logistics partners) to facilitate your business operations on the platform. We may also disclose information if required by law or to protect our rights and safety."
        },
        {
            title: "DATA SECURITY",
            content: "We implement industry-standard security measures to protect your data. Your bank details and sensitive documents are encrypted and stored securely. However, no method of transmission over the internet is 100% secure."
        },
        {
            title: "YOUR RIGHTS",
            content: "You have the right to access, correct, or update your business and personal information through your seller dashboard. You may also request the deletion of your account, subject to retention of data required for legal and tax purposes."
        },
        {
            title: "UPDATES TO THIS POLICY",
            content: "We may update this Privacy Policy from time to time. We will notify you of any significant changes through the seller portal or via email."
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen py-10 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Seller Privacy Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        This Privacy Policy describes how we collect, use, and share information about you when you register and operate as a seller on our marketplace. We are committed to protecting your privacy and ensuring the security of your business data.
                    </p>

                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <section key={index} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 md:p-8 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-sm font-bold">
                                        {index + 1}
                                    </span>
                                    {section.title}
                                </h2>
                                <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerPrivacy;
