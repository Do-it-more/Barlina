import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, ShoppingCart, Heart, Truck, ShieldCheck, RotateCcw, Package,
    ChevronLeft, ChevronRight, Minus, Plus, Share2, Bell, Check,
    ArrowLeft, Flame, ZoomIn, X, Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ShareButton from '../components/ShareButton';
import WishlistButton from '../components/WishlistButton';
import Rating from '../components/Rating';
import RecentlyViewed from '../components/product/RecentlyViewed';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [qty, setQty] = useState(1);
    const [selectedColor, setSelectedColor] = useState('');
    const [adding, setAdding] = useState(false);
    const [showZoom, setShowZoom] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    // Stock notification
    const [notifyEmail, setNotifyEmail] = useState('');
    const [notifyLoading, setNotifyLoading] = useState(false);
    const [notifySuccess, setNotifySuccess] = useState(false);

    // Settings
    const [globalSettings, setGlobalSettings] = useState({
        isGlobalStockActive: true,
        isStockCountVisible: true
    });

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/600';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
        return `${apiBase}${path}`;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const [productRes, settingsRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get('/settings').catch(() => ({ data: {} }))
                ]);
                setProduct(productRes.data);
                setGlobalSettings({
                    isGlobalStockActive: settingsRes.data?.isGlobalStockActive ?? true,
                    isStockCountVisible: settingsRes.data?.isStockCountVisible ?? true
                });

                // Set default color
                if (productRes.data.colors && productRes.data.colors.length > 0) {
                    setSelectedColor(productRes.data.colors[0]);
                }

                // Track recently viewed
                if (user) {
                    api.post(`/users/recently-viewed/${id}`).catch(() => { });
                }

                // Fetch related products
                api.get(`/products/${id}/related`).then(res => {
                    setRelatedProducts(res.data);
                }).catch(() => { });

            } catch (error) {
                console.error("Failed to fetch product", error);
                showToast("Product not found", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
        setSelectedImage(0);
        setQty(1);
        window.scrollTo(0, 0);
    }, [id]);

    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setAdding(true);
        await addToCart({ ...product, _id: product._id || product.id }, qty, selectedColor);
        setAdding(false);
    };

    const handleNotifyMe = async (e) => {
        e.preventDefault();
        if (!notifyEmail) return;
        setNotifyLoading(true);
        try {
            await api.post(`/products/${id}/subscribe`, { email: notifyEmail });
            setNotifySuccess(true);
            showToast("You'll be notified when this product is back in stock!", 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to subscribe', 'error');
        } finally {
            setNotifyLoading(false);
        }
    };

    const allImages = product
        ? [product.image, ...(product.images || [])].filter((img, i, arr) => img && arr.indexOf(img) === i)
        : [];

    const isOutOfStock = product?.isStockEnabled !== false && product?.countInStock === 0;
    const hasDiscount = product?.discountPrice > 0 && product?.discountPrice < product?.price;
    const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

    // Skeleton loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Image Skeleton */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
                            <div className="flex gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        </div>
                        {/* Info Skeleton */}
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
                            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
                            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-pulse" />
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full animate-pulse" />
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
                            <div className="h-14 bg-gray-200 dark:bg-slate-700 rounded-xl w-full animate-pulse mt-8" />
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <Package className="h-16 w-16 text-gray-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Product not found</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">The product you're looking for doesn't exist or has been removed.</p>
                    <Link to="/products" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                        Browse Products
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-indigo-600 transition-colors">Products</Link>
                    <span>/</span>
                    <Link to={`/category/${product.category}`} className="hover:text-indigo-600 transition-colors capitalize">{product.category}</Link>
                    <span>/</span>
                    <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* ====== IMAGE SECTION ====== */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <motion.div
                            className="relative aspect-square bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm cursor-zoom-in group"
                            onClick={() => setShowZoom(true)}
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={selectedImage}
                                    src={getImageUrl(allImages[selectedImage])}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </AnimatePresence>

                            {/* Zoom Icon Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                <ZoomIn className="h-8 w-8 text-white/0 group-hover:text-gray-500/80 transition-colors" />
                            </div>

                            {/* Navigation Arrows */}
                            {allImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === 0 ? allImages.length - 1 : prev - 1); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-white" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === allImages.length - 1 ? 0 : prev + 1); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight className="h-5 w-5 text-slate-700 dark:text-white" />
                                    </button>
                                </>
                            )}

                            {/* Discount Badge */}
                            {hasDiscount && (
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute top-4 left-4 flex items-center gap-1 bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-extrabold px-3 py-1.5 rounded-lg shadow-lg z-10"
                                >
                                    <Flame className="h-4 w-4 fill-yellow-300 text-yellow-100" />
                                    {discountPercent}% OFF
                                </motion.div>
                            )}

                            {/* Wishlist */}
                            <WishlistButton
                                productId={product._id || product.id}
                                rounded={true}
                                className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-slate-700 z-10 text-gray-600 dark:text-gray-300"
                            />
                        </motion.div>

                        {/* Thumbnail Strip */}
                        {allImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedImage === idx
                                            ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md'
                                            : 'border-gray-200 dark:border-slate-600 hover:border-indigo-400'
                                            }`}
                                    >
                                        <img src={getImageUrl(img)} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ====== PRODUCT INFO SECTION ====== */}
                    <div className="flex flex-col">
                        {/* Brand & Category */}
                        <div className="flex items-center gap-3 mb-3">
                            {product.brand && (
                                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                                    {product.brand}
                                </span>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{product.category}</span>
                        </div>

                        {/* Product Name */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                            {product.name}
                        </h1>

                        {/* Rating & Reviews */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-5 w-5 ${star <= Math.round(product.rating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-200 dark:text-slate-600'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {product.rating?.toFixed(1)} ({product.numReviews || product.reviews?.length || 0} reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                            {hasDiscount ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                        ₹{product.discountPrice.toLocaleString()}
                                    </span>
                                    <span className="text-lg text-gray-400 line-through">
                                        ₹{product.price.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                                        Save ₹{(product.price - product.discountPrice).toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                    ₹{product.price.toLocaleString()}
                                </span>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Inclusive of all taxes</p>
                        </div>

                        {/* Stock Status */}
                        <div className="mb-5">
                            {isOutOfStock ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                    <span className="text-sm font-bold text-red-600">Out of Stock</span>
                                </div>
                            ) : product.isStockEnabled === false || !globalSettings.isStockCountVisible ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">In Stock</span>
                                </div>
                            ) : product.countInStock <= 5 ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                        Only {product.countInStock} left — Hurry!
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">In Stock</span>
                                </div>
                            )}
                        </div>

                        {/* Color Selection */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="mb-5">
                                <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Color: <span className="capitalize">{selectedColor}</span></p>
                                <div className="flex gap-2">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${selectedColor === color
                                                ? 'border-indigo-600 ring-2 ring-indigo-600/30 scale-110'
                                                : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400'
                                                }`}
                                            style={{ backgroundColor: color.toLowerCase() }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity + Add to Cart */}
                        {!isOutOfStock ? (
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                {/* Quantity Selector */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 p-1">
                                    <button
                                        onClick={() => setQty(prev => Math.max(1, prev - 1))}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-white"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-12 text-center font-bold text-slate-900 dark:text-white">{qty}</span>
                                    <button
                                        onClick={() => setQty(prev => Math.min(product.isStockEnabled !== false ? product.countInStock : 99, prev + 1))}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Add to Cart Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAddToCart}
                                    disabled={adding}
                                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {adding ? (
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShoppingCart className="h-5 w-5" />
                                            Add to Cart
                                        </>
                                    )}
                                </motion.button>

                                {/* Share Button */}
                                <ShareButton product={product} variant="icon" />
                            </div>
                        ) : (
                            /* Notify Me Form */
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-indigo-600" />
                                    Get notified when back in stock
                                </p>
                                {notifySuccess ? (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <Check className="h-5 w-5" />
                                        <span className="font-medium">We'll notify you!</span>
                                    </div>
                                ) : (
                                    <form onSubmit={handleNotifyMe} className="flex gap-2">
                                        <input
                                            type="email"
                                            value={notifyEmail}
                                            onChange={(e) => setNotifyEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            required
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <button
                                            type="submit"
                                            disabled={notifyLoading}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-70"
                                        >
                                            {notifyLoading ? 'Subscribing...' : 'Notify Me'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Feature Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            {product.isCodAvailable && (
                                <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <Package className="h-5 w-5 text-green-600" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-gray-300">COD Available</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                <Truck className="h-5 w-5 text-blue-600" />
                                <span className="text-xs font-medium text-slate-700 dark:text-gray-300">
                                    {product.estimatedDeliveryDays ? `${product.estimatedDeliveryDays}-day delivery` : 'Standard Delivery'}
                                </span>
                            </div>
                            {product.returnPolicy?.isReturnable && (
                                <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <RotateCcw className="h-5 w-5 text-orange-600" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-gray-300">
                                        {product.returnPolicy.returnWindowDays || 7}-day returns
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                <span className="text-xs font-medium text-slate-700 dark:text-gray-300">Secure Payment</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== TABS SECTION ====== */}
                <div className="mt-12">
                    <div className="flex border-b border-gray-200 dark:border-slate-700 gap-1 overflow-x-auto">
                        {[
                            { key: 'description', label: 'Description' },
                            { key: 'specifications', label: 'Specifications' },
                            { key: 'reviews', label: `Reviews (${product.numReviews || product.reviews?.length || 0})` },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${activeTab === tab.key
                                    ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="py-6">
                        {/* Description Tab */}
                        {activeTab === 'description' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="prose prose-slate dark:prose-invert max-w-none"
                            >
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Specifications Tab */}
                        {activeTab === 'specifications' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700"
                            >
                                {product.specifications && product.specifications.length > 0 ? (
                                    <div className="space-y-6">
                                        {product.specifications.map((spec, idx) => (
                                            <div key={idx}>
                                                {spec.heading && (
                                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{spec.heading}</h4>
                                                )}
                                                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                                    {spec.items?.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="flex py-2.5">
                                                            <span className="w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">{item.key}</span>
                                                            <span className="w-2/3 text-sm text-slate-900 dark:text-white font-medium">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No specifications available</p>
                                )}
                            </motion.div>
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {product.reviews && product.reviews.length > 0 ? (
                                    product.reviews.map((review, idx) => (
                                        <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                        {review.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{review.name}</p>
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star
                                                                key={star}
                                                                className={`h-3 w-3 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200 dark:text-slate-600'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="ml-auto text-xs text-gray-400">
                                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                                        <Star className="h-12 w-12 text-gray-200 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No reviews yet</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to review this product!</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ====== RELATED PRODUCTS ====== */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12 border-t border-gray-200 dark:border-slate-700 pt-10">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">You May Also Like</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.slice(0, 4).map(p => (
                                <ProductCard key={p._id} product={p} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recently Viewed */}
                {user && <RecentlyViewed />}
            </main>

            <Footer />

            {/* ====== IMAGE ZOOM MODAL ====== */}
            <AnimatePresence>
                {showZoom && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setShowZoom(false)}
                    >
                        <button
                            onClick={() => setShowZoom(false)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
                            <img
                                src={getImageUrl(allImages[selectedImage])}
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />

                            {allImages.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setSelectedImage(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedImage(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail strip in zoom */}
                        {allImages.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-white' : 'border-white/30 hover:border-white/60'}`}
                                    >
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetail;
