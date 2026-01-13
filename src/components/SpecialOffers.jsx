import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Tag, Copy, Sparkles, Clock, Percent, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SpecialOffers = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    // Carousel State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsToShow, setItemsToShow] = useState(3);
    const [isHovered, setIsHovered] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const { data } = await api.get('/coupons/active');
                setCoupons(data);
            } catch (error) {
                console.error("Failed to fetch coupons", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCoupons();
    }, []);

    // Responsive Carousel Logic
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setItemsToShow(1);
            else if (window.innerWidth < 1024) setItemsToShow(2);
            else setItemsToShow(3);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prepare extended list for infinite loop ONLY if we have enough items
    // If we have fewer items than we'd show, don't clone. Center them instead.
    const shouldLoop = coupons.length > itemsToShow;

    const extendedCoupons = shouldLoop
        ? [...coupons, ...coupons.slice(0, 3).map(c => ({ ...c, _id: `${c._id}-clone` }))]
        : coupons;

    // Auto Play Logic: Rotates every 5 seconds
    useEffect(() => {
        let interval;
        if (!isHovered && shouldLoop) {
            interval = setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev >= coupons.length) return 0;
                    return prev + 1;
                });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isHovered, coupons.length, shouldLoop]);

    // Handle Resetting State
    useEffect(() => {
        if (isResetting) {
            const timer = requestAnimationFrame(() => {
                setIsResetting(false);
            });
            return () => cancelAnimationFrame(timer);
        }
    }, [isResetting]);

    const handleAnimationComplete = () => {
        if (shouldLoop && currentIndex === coupons.length) {
            setIsResetting(true);
            setCurrentIndex(0);
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedId(code);

        confetti({
            particleCount: 150,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#FF4500']
        });

        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading || coupons.length === 0) return null;

    return (
        <section
            className="relative overflow-hidden py-2 bg-[#0F172A]" // Reduced padding
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* --- Premium Animated Background --- */}

            {/* 1. Aurora Gradient Mesh */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-pink-600 to-rose-600 blur-[100px] animate-blob" />
            </div>

            {/* 2. Dynamic Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay pointer-events-none"></div>

            {/* 3. Floating Particles (CSS Animation) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-20 animate-float"
                        style={{
                            width: Math.random() * 4 + 1 + 'px',
                            height: Math.random() * 4 + 1 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDuration: Math.random() * 10 + 10 + 's',
                            animationDelay: Math.random() * 5 + 's'
                        }}
                    />
                ))}
            </div>


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header with Floating 3D Gift */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="relative group scale-75 md:scale-90 origin-left">
                            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-pink-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-black rounded-lg p-1.5 ring-1 ring-white/10">
                                <Gift className="w-5 h-5 text-yellow-400 animate-bounce-slight" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-200 tracking-tight">
                                Flash Deals
                            </h2>
                            <div className="flex items-center gap-2 text-indigo-300 text-[10px]">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                </span>
                                Live Offers Ending Soon
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carousel Viewport */}
                <div className="relative group/carousel">
                    {/* Side Fades for Depth (Only if looping) */}
                    {shouldLoop && (
                        <>
                            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-r from-[#0F172A] to-transparent z-20 pointer-events-none"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-l from-[#0F172A] to-transparent z-20 pointer-events-none"></div>
                        </>
                    )}

                    <div className="overflow-hidden py-1">
                        <motion.div
                            className={`flex gap-3 ${shouldLoop ? '' : 'justify-center'}`} // Reduced gap
                            animate={{
                                x: shouldLoop ? `calc(-${currentIndex * (100 / itemsToShow)}% - ${currentIndex * 12}px)` : 0
                            }}
                            transition={isResetting ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 25 }}
                            onAnimationComplete={handleAnimationComplete}
                        >
                            {extendedCoupons.map((coupon, idx) => (
                                <motion.div
                                    key={`${coupon._id}-${idx}`}
                                    className={`flex-shrink-0 relative`}
                                    style={{
                                        width: `calc(${100 / itemsToShow}% - ${12 * (itemsToShow - 1) / itemsToShow}px)`
                                    }}
                                    whileHover={{ y: -2, scale: 1.01, zIndex: 10 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <div className="relative h-full overflow-hidden rounded-xl md:rounded-lg bg-[#1E293B]/80 md:bg-[#1E293B] border border-white/10 md:border-white/10 hover:border-indigo-500/50 transition-colors duration-500 group-hover/carousel:opacity-90 hover:!opacity-100 shadow-xl md:shadow-md backdrop-blur-sm md:backdrop-blur-none m-1">

                                        {/* Glass shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

                                        {/* Content - High Density Mobile Optimized */}
                                        <div className="p-3 flex flex-col h-full justify-between relative z-10">

                                            {/* Top: Discount & Meta */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-0.5">
                                                    {/* Discount Row - Tighter Leading */}
                                                    <div className="flex items-baseline gap-1.5 leading-none">
                                                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 drop-shadow-sm">
                                                            {coupon.discountPercentage}%
                                                        </span>
                                                        <span className="text-[10px] font-bold text-yellow-500/90 tracking-widest uppercase">OFF</span>
                                                    </div>

                                                    {/* Date - Secondary Compact */}
                                                    <div className="flex items-center gap-1 text-[9px] text-gray-400 font-medium ml-0.5">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        <span>Exp: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                {/* Status - Compact Badge */}
                                                <div className="flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                                    </span>
                                                    <span className="text-[9px] font-bold text-green-400 uppercase">Live</span>
                                                </div>
                                            </div>

                                            {/* Bottom: Action - Touch Optimized <44px */}
                                            <button
                                                onClick={() => copyToClipboard(coupon.code)}
                                                className="group/btn w-full mt-2 h-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded flex items-center justify-between px-3 transition-all active:scale-95"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Gift className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span className="font-mono text-sm font-bold text-white tracking-widest leading-none mt-0.5">
                                                        {coupon.code}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 border-l border-white/10 pl-3 py-1">
                                                    <span className="text-[9px] font-bold text-indigo-300 uppercase group-hover/btn:text-white transition-colors">
                                                        {copiedId === coupon.code ? 'Copied' : 'Copy'}
                                                    </span>
                                                    {copiedId === coupon.code ? (
                                                        <span className="text-green-400 text-[10px]">✓</span>
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-indigo-300 group-hover/btn:text-white" />
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* CSS for custom animations if not using tailwind config */}
            <style jsx>{`
                @keyframes bounce-slight {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(10px, -10px); }
                }
                .animate-bounce-slight {
                    animation: bounce-slight 2s infinite ease-in-out;
                }
                .animate-float {
                    animation-name: float;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </section>
    );
};

export default SpecialOffers;
