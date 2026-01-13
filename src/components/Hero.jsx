import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import SpecialOffers from './SpecialOffers';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2, // Stagger effect for children
            delayChildren: 0.3,
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 50, damping: 20 }
    }
};

const floatVariants = {
    animate: {
        y: [0, -15, 0],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

const floatReverseVariants = {
    animate: {
        y: [0, 15, 0],
        transition: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
        }
    }
};

const Hero = () => {
    return (
        <div className="relative bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 overflow-hidden min-h-[calc(100vh-5rem)] flex flex-col transition-colors duration-300">
            {/* Special Offers Integration for Desktop */}
            <div className="w-full z-20">
                <SpecialOffers />
            </div>

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-300/20 dark:bg-indigo-900/20 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3 animate-pulse-slow delay-700"></div>

            <div className="flex-grow flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-8 md:py-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

                    {/* Left Content */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >


                        {/* Badge */}
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.4)]">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 dark:bg-indigo-400"></span>
                            </span>
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wide">New Collection 2025</span>
                        </motion.div>

                        {/* Heading - Word by Word Animation */}
                        <div className="overflow-hidden">
                            <motion.h1
                                className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                                    }
                                }}
                            >
                                {["Level", "Up", "Your"].map((word, i) => (
                                    <motion.span key={i} className="inline-block mr-3 md:mr-4" variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                                    }}>
                                        {word}
                                    </motion.span>
                                ))}
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x inline-block">
                                    {["Style", "Game"].map((word, i) => (
                                        <motion.span key={i} className="inline-block mr-3 md:mr-4" variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                                        }}>
                                            {word}
                                        </motion.span>
                                    ))}
                                </span>
                            </motion.h1>
                        </div>

                        {/* Description */}
                        <motion.p variants={itemVariants} className="text-lg text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed font-medium">
                            Explore our curated collection of premium tech and lifestyle gear.
                            Enjoy <span className="text-slate-900 dark:text-white font-bold bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200 px-1 rounded">50% off</span> on top brands this week.
                        </motion.p>

                        {/* Buttons */}
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link to="/products" className="group relative px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-full font-bold overflow-hidden shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all">
                                <motion.div
                                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                                {/* Load Pulse Animation */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-white/30"
                                    animate={{ scale: [1, 1.1, 1], opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.5, delay: 1, repeat: 0 }}
                                />
                                <span className="relative flex items-center justify-center gap-2">
                                    Shop Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                            <Link to="/products" className="group/btn px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full font-bold border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-indigo-500 hover:bg-purple-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-lg flex items-center justify-center relative overflow-hidden">
                                <span className="relative z-10 flex items-center gap-2">
                                    View Collections
                                    <motion.span
                                        initial={{ x: -5, opacity: 0 }}
                                        whileHover={{ x: 0, opacity: 1 }}
                                        className="hidden group-hover/btn:inline-block"
                                    >
                                        →
                                    </motion.span>
                                </span>
                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-indigo-500 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300 origin-left"></div>
                            </Link>
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div variants={itemVariants} className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-[3px] border-white dark:border-slate-900 shadow-sm overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="font-bold text-lg text-slate-900 dark:text-white">4.9</span>
                                    <div className="flex text-yellow-400 text-sm">★★★★★</div>
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">from 10k+ happy reviews</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Image */}
                    <div className="relative hidden lg:block perspective-1000">
                        <motion.div
                            initial={{ opacity: 0, rotateY: -10, scale: 0.9 }}
                            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative z-10 w-full aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/20 group"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                alt="Fashion Model"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />


                        </motion.div>

                        {/* Background Glow Element */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] blur-lg opacity-30 -z-10 transform rotate-3 scale-105"></div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-[3rem] blur-lg opacity-30 -z-10 transform -rotate-2 scale-105"></div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky CTA - High Conversion Driver */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 2, type: 'spring' }}
                className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
            >
                <Link to="/products" className="block w-full bg-slate-900/90 backdrop-blur-md text-white font-bold text-center py-3.5 rounded-full shadow-2xl border border-white/10 relative overflow-hidden group">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Shop Deals <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 to-purple-600/50 opacity-0 group-active:opacity-100 transition-opacity" />
                </Link>
            </motion.div>

        </div>
    );
};

export default Hero;
