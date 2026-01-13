import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { Heart, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
    const { wishlist, loading } = useWishlist();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                        <Heart className="h-8 w-8 text-red-500 dark:text-red-400 fill-current" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Wishlist</h1>
                        <p className="text-gray-500 dark:text-gray-400">{wishlist.length} items saved</p>
                    </div>
                </div>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                        {wishlist.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-500">
                            <Heart className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Found something you like? Tap the heart icon to save it for later.</p>
                        <Link to="/products" className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-full font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors">
                            Explore Products
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Wishlist;
