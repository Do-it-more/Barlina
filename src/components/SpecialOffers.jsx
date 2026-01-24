import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Copy, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

const SpecialOffers = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch settings first to check if section is enabled
                const settingsRes = await api.get('/settings');
                const settingsEnabled = settingsRes.data?.isSpecialOffersEnabled !== false;
                setIsEnabled(settingsEnabled);

                // Only fetch coupons if section is enabled
                if (settingsEnabled) {
                    const { data } = await api.get('/coupons/active');
                    setCoupons(data);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedId(code);

        confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.3 },
            colors: ['#FFD700', '#FFA500', '#FF4500']
        });

        setTimeout(() => setCopiedId(null), 2000);
    };

    // Don't render if disabled by admin, loading, or no coupons
    if (!isEnabled || loading || coupons.length === 0) return null;

    return (
        <section className="relative overflow-hidden py-2 bg-[#0F172A]">
            {/* Subtle Background Gradient */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-[-100%] left-[-20%] w-[60%] h-[200%] rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 blur-[100px]" />
                <div className="absolute top-[-100%] right-[-10%] w-[40%] h-[200%] rounded-full bg-gradient-to-r from-pink-600 to-rose-600 blur-[80px]" />
            </div>

            {/* Floating Particles (reduced) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-20"
                        style={{
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Single Row Layout - Header + Coupons */}
                <div className="flex items-center justify-end gap-4 md:gap-8">

                    {/* Left: Header */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-pink-600 rounded-lg blur opacity-40"></div>
                            <div className="relative bg-black rounded-lg p-1.5 ring-1 ring-white/10">
                                <Gift className="w-4 h-4 text-yellow-400" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-sm md:text-base font-bold text-white tracking-tight leading-none">
                                Flash Deals
                            </h2>
                            <div className="flex items-center gap-1 text-indigo-300 text-[9px]">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                </span>
                                Live Offers Ending Soon
                            </div>
                        </div>
                    </div>

                    {/* Right: Horizontal Scrollable Coupons */}
                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 md:gap-3 justify-end">
                            {coupons.map((coupon) => (
                                <button
                                    key={coupon._id}
                                    onClick={() => copyToClipboard(coupon.code)}
                                    className="flex-shrink-0 flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-lg px-3 py-1.5 transition-all group active:scale-95"
                                >
                                    <span className="text-xs font-bold text-yellow-400">
                                        {coupon.discountPercentage}% OFF
                                    </span>
                                    <span className="text-[10px] text-gray-400">|</span>
                                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                                        {coupon.code}
                                    </span>
                                    <div className="flex items-center gap-1 text-indigo-300 group-hover:text-white transition-colors">
                                        {copiedId === coupon.code ? (
                                            <span className="text-green-400 text-[10px]">✓</span>
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for custom animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(5px, -5px); }
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
};

export default SpecialOffers;
