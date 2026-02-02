import React, { useEffect } from 'react';

const SellerTerms = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            title: "SELLER ELIGIBILITY",
            content: "To sell on our marketplace, you must be a registered business entity or an individual capable of entering into legally binding contracts. You must provide accurate and up-to-date business information, including tax identification numbers (PAN, GSTIN) where applicable."
        },
        {
            title: "SELLER OBLIGATIONS",
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>You agree to list products that are genuine, new, and not counterfeit or infringing on intellectual property rights.</li>
                    <li>You are responsible for accurate product descriptions, pricing, and inventory management.</li>
                    <li>You must process and ship orders within the agreed service level agreement (SLA) timelines.</li>
                    <li>You must maintain a high standard of customer service and respond to buyer inquiries promptly.</li>
                    <li>You agree to comply with all applicable laws, including consumer protection and tax laws.</li>
                </ul>
            )
        },
        {
            title: "FEES AND PAYMENTS",
            content: "We charge a commission fee on every successful sale made through the platform. The commission rates vary by category and will be communicated to you. Payouts for delivered orders will be processed to your registered bank account after the return period has expired, subject to deduction of applicable fees and taxes."
        },
        {
            title: "RETURNS AND REFUNDS",
            content: "You agree to accept returns for defective, damaged, or incorrect products in accordance with our Return Policy. In cases of disputes, the platform's decision will be final. Refunds to customers will be debited from your payout or future settlements."
        },
        {
            title: "INTELLECTUAL PROPERTY",
            content: "By listing products, you grant us a non-exclusive, royalty-free license to use your product images and descriptions for marketing and promotional purposes. You represent that you own or have the necessary rights to the content you upload."
        },
        {
            title: "ACCOUNT SUSPENSION AND TERMINATION",
            content: "We reserve the right to suspend or terminate your seller account if you violate these terms, engage in fraudulent activities, sell prohibited items, or consistently fail to meet performance standards. You may terminate your account by giving us 30 days' written notice, subject to the completion of pending orders."
        },
        {
            title: "LIMITATION OF LIABILITY",
            content: "We provide the marketplace 'as is' and are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the fees paid by you to us in the 12 months preceding the claim."
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen py-10 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Seller Terms & Conditions</h1>
                    <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        These Seller Terms & Conditions govern your use of our marketplace as a seller. By registering as a seller, you agree to be bound by these terms. Please read them carefully.
                    </p>

                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <section key={index} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 md:p-8 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
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

export default SellerTerms;
