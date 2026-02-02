import React, { useEffect } from 'react';

const MarketplaceGuidelines = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            title: "PRODUCT LISTING GUIDELINES",
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>**Accurate Descriptions:** All product listings must have clear, accurate, and detailed descriptions. Misleading claims are strictly prohibited.</li>
                    <li>**High-Quality Images:** Images must be clear, well-lit, and accurately represent the product. Watermarks or text overlays that obscure the product are not allowed.</li>
                    <li>**Categorization:** Products must be listed in the correct category and sub-category to ensure customers can find them easily.</li>
                    <li>**Pricing:** Prices must be fair and competitive. Artificial price inflation prior to a sale ('price jacking') is prohibited.</li>
                </ul>
            )
        },
        {
            title: "PROHIBITED ITEMS",
            content: (
                <div className="space-y-2">
                    <p>The following items are strictly prohibited from being sold on the marketplace:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Illegal or restricted items (e.g., weapons, drugs, hazardous materials).</li>
                        <li>Counterfeit or unauthorized replicas of branded goods.</li>
                        <li>Adult content or sexually explicit materials.</li>
                        <li>Stolen property or items acquired through illegal means.</li>
                        <li>Digital goods or services (unless explicitly approved).</li>
                    </ul>
                </div>
            )
        },
        {
            title: "FULFILLMENT AND SHIPPING",
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>**Shipping Timelines:** Sellers must ship orders within the stated handling time (usually 24-48 hours).</li>
                    <li>**Packaging:** Items must be securely packaged to prevent damage during transit. Branded packaging is encouraged where applicable.</li>
                    <li>**Tracking:** Valid tracking numbers must be provided for all shipments.</li>
                </ul>
            )
        },
        {
            title: "COMMUNICATION AND CONDUCT",
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>**Professionalism:** Maintain a professional and courteous tone in all communications with customers and marketplace support.</li>
                    <li>**Response Time:** Respond to customer queries and complaints within 24 hours.</li>
                    <li>**Off-Platform Transactions:** Directing customers to transact outside the marketplace to avoid fees is strictly prohibited and will result in immediate account termination.</li>
                </ul>
            )
        },
        {
            title: "PERFORMANCE STANDARDS",
            content: "Sellers are expected to maintain minimum performance metrics, including a low order cancellation rate (<1%), low return rate (category dependent), and high customer feedback rating (>4.0 stars). Consistently falling below these standards may lead to account review or suspension."
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen py-10 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Marketplace Guidelines</h1>
                    <p className="text-gray-500 dark:text-gray-400">Essential rules for a fair and successful marketplace</p>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        To ensure a safe, trustworthy, and premium experience for our customers and sellers, we have established these Marketplace Guidelines. Adherence to these guidelines is mandatory for all sellers.
                    </p>

                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <section key={index} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 md:p-8 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
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

export default MarketplaceGuidelines;
