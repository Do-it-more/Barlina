import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Flame } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';

// Simple cache to avoid multiple API calls for the same settings on a page with multiple cards
let globalSettingsCache = null;
let globalSettingsPromise = null;

const ProductCard = React.memo(({ product }) => {
    const id = product.id || product._id;
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [adding, setAdding] = React.useState(false);
    const navigate = useNavigate();

    const [globalSettings, setGlobalSettings] = useState({
        isGlobalStockActive: true,
        isStockCountVisible: true
    });

    useEffect(() => {
        const loadSettings = async () => {
            if (globalSettingsCache) {
                setGlobalSettings({
                    isGlobalStockActive: globalSettingsCache.isGlobalStockActive ?? true,
                    isStockCountVisible: globalSettingsCache.isStockCountVisible ?? true
                });
                return;
            }

            if (!globalSettingsPromise) {
                globalSettingsPromise = api.get('/settings');
            }

            try {
                const { data } = await globalSettingsPromise;
                globalSettingsCache = data;
                setGlobalSettings({
                    isGlobalStockActive: data.isGlobalStockActive ?? true,
                    isStockCountVisible: data.isStockCountVisible ?? true
                });
            } catch (error) {
                console.error("Failed to load settings in ProductCard", error);
            }
        };

        loadSettings();
    }, []);


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

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/300';
        if (path.startsWith('http')) return path;
        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
        return `${apiBase}${path}`;
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 group relative cursor-pointer"
        >
            <div className="block relative aspect-square overflow-hidden bg-gray-50 dark:bg-slate-700">
                <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                <WishlistButton
                    productId={id}
                    rounded={true}
                    className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-900 z-10 text-gray-600 dark:text-gray-300"
                />

                {product.discountPrice > 0 && (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-lg z-10"
                    >
                        <Flame className="h-3 w-3 fill-yellow-300 text-yellow-100" />
                        <span>{Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF</span>
                    </motion.div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/50 to-transparent">
                    <button
                        onClick={handleAddToCart}
                        disabled={adding || (product.isStockEnabled !== false && product.countInStock === 0)}
                        className={`w-full py-3 font-semibold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${product.isStockEnabled !== false && product.countInStock === 0 ? 'bg-gray-100 text-gray-400 opacity-90' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}
                    >
                        {product.isStockEnabled !== false && product.countInStock === 0 ? (
                            <span className="text-sm">Out of Stock</span>
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
                    <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{product.name}</h3>
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
                        {product.discountPrice > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-slate-900 dark:text-white">
                                    ₹{product.discountPrice.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                    ₹{product.price.toLocaleString()}
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                    {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                                </span>
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
