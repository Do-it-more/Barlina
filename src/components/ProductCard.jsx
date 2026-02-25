import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Heart, Flame, Share2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { getImageUrl } from '../utils/image';

const ProductCard = React.memo(({ product }) => {
    const id = product.id || product._id;
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { settings: globalSettings } = useSettings();
    const [adding, setAdding] = React.useState(false);
    const navigate = useNavigate();


    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        if (product.countInStock === 0 && (product.isStockEnabled !== false)) return;

        setAdding(true);
        await addToCart(product, 1);
        setAdding(false);
    };



    const handleCardClick = () => {
        navigate(`/product/${id}`);
    };

    const isStockCountVisible = globalSettings.isStockCountVisible;

    // Logic: 
    // If Product Stock Disabled (Unlimited) OR Global Count Hidden -> Show "In Stock" (Green), Hide Count.
    // If Normal -> Show Count logic.

    return (
        <motion.div
            whileHover={{ y: -8 }}
            onClick={handleCardClick}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 group relative cursor-pointer h-full flex flex-col"
        >
            <div className="block relative aspect-square min-h-[150px] sm:min-h-[200px] overflow-hidden bg-gray-50 dark:bg-slate-700">
                <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1584433144859-1fc3ab84a9ec?w=600&q=80'; // Reliable fallback image (Technology/Modern)
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                <WishlistButton
                    productId={id}
                    rounded={true}
                    className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-900 z-10 text-gray-600 dark:text-gray-300"
                />

                {/* Quick Share Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const shareUrl = `${window.location.origin}/product/${id}`;
                        const shareTitle = product.name;
                        const sharePrice = product.discountPrice > 0 && product.discountPrice < product.price
                            ? `₹${product.discountPrice.toLocaleString()}`
                            : `₹${product.price.toLocaleString()}`;

                        if (navigator.share) {
                            navigator.share({
                                title: shareTitle,
                                text: `Check out ${shareTitle} - ${sharePrice}!`,
                                url: shareUrl,
                            }).catch(() => { });
                        } else {
                            navigator.clipboard.writeText(shareUrl);
                            showToast('Link copied!', 'success');
                        }
                    }}
                    className="absolute top-3 right-14 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-900 z-10 text-gray-600 dark:text-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                    title="Share"
                >
                    <Share2 className="h-4 w-4" />
                </button>

                {product.discountPrice > 0 && product.discountPrice < product.price && (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-lg z-10"
                    >
                        <Flame className="h-3 w-3 fill-yellow-300 text-yellow-100" />
                        <span>{Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF</span>
                    </motion.div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                    <button
                        onClick={handleAddToCart}
                        disabled={adding || (product.isStockEnabled !== false && product.countInStock === 0)}
                        className={`w-full py-2.5 sm:py-3 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm ${product.isStockEnabled !== false && product.countInStock === 0 ? 'bg-gray-100 text-gray-400 opacity-90' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white active:scale-95'}`}
                    >
                        {product.isStockEnabled !== false && product.countInStock === 0 ? (
                            <span>Out of Stock</span>
                        ) : adding ? (
                            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <ShoppingCart className="h-4 w-4" />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="p-3 sm:p-5">
                <div className="flex items-center space-x-1 mb-2">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{product.rating}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">({product.numReviews || (product.reviews ? product.reviews.length : 0)})</span>
                </div>
                <div>
                    <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors min-h-[2.5rem] sm:min-h-[3.5rem]">{product.name}</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 capitalize">{product.category}</p>

                <div className="mb-3">
                    {product.isStockEnabled !== false && product.countInStock === 0 ? (
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                            <span className="text-[10px] sm:text-xs font-semibold text-red-500">Out of Stock</span>
                        </div>
                    ) : !isStockCountVisible || product.isStockEnabled === false ? (
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                            <span className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400">
                                In Stock
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${product.countInStock <= 5 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                            <span className={`text-[10px] sm:text-xs font-medium ${product.countInStock <= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                {product.countInStock <= 5 ? `Only ${product.countInStock} left` : `${product.countInStock} in stock`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col mt-auto">
                        {product.discountPrice > 0 && product.discountPrice < product.price ? (
                            <div className="flex items-center gap-2 relative overflow-hidden group/price">
                                {/* Shimmer overlay on hover */}
                                <div
                                    className="absolute inset-0 -translate-x-full group-hover/price:translate-x-full transition-transform duration-1000 ease-in-out"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                                        pointerEvents: 'none',
                                    }}
                                />

                                {/* Discount Price - bouncy entrance */}
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 15,
                                        delay: 0.1
                                    }}
                                    className="text-xl font-bold text-slate-900 dark:text-white relative"
                                >
                                    <motion.span
                                        animate={{
                                            textShadow: [
                                                '0 0 0px rgba(34,197,94,0)',
                                                '0 0 8px rgba(34,197,94,0.4)',
                                                '0 0 0px rgba(34,197,94,0)',
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        ₹{product.discountPrice.toLocaleString()}
                                    </motion.span>
                                </motion.span>

                                {/* Original Price - slide in with animated strikethrough */}
                                <motion.span
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                    className="text-sm text-gray-500 relative inline-block"
                                >
                                    <span>₹{product.price.toLocaleString()}</span>
                                    {/* Animated strikethrough line */}
                                    <motion.span
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
                                        className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-red-500/70 dark:bg-red-400/70"
                                        style={{ transformOrigin: 'left', pointerEvents: 'none' }}
                                    />
                                </motion.span>

                                {/* Discount % badge - pop in with glow pulse */}
                                <motion.span
                                    initial={{ scale: 0, rotate: -12 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 12,
                                        delay: 0.5
                                    }}
                                    className="relative"
                                >
                                    <motion.span
                                        animate={{
                                            boxShadow: [
                                                '0 0 0px rgba(34,197,94,0)',
                                                '0 0 12px rgba(34,197,94,0.3)',
                                                '0 0 0px rgba(34,197,94,0)',
                                            ]
                                        }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-[11px] sm:text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-md"
                                    >
                                        {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                                    </motion.span>
                                </motion.span>
                            </div>
                        ) : (
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                                ₹{product.price.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default ProductCard;
