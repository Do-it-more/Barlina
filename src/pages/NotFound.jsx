import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="text-center relative z-10 max-w-lg w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <h1 className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 leading-none select-none">
                            404
                        </h1>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4"
                    >
                        Page not found
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto"
                    >
                        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-full font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <Home className="h-5 w-5" />
                            Back to Home
                        </Link>
                        <Link
                            to="/products"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-md active:scale-95"
                        >
                            <Search className="h-5 w-5" />
                            Browse Products
                        </Link>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NotFound;
