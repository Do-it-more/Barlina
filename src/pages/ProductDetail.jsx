import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import WishlistButton from '../components/WishlistButton';
import { useToast } from '../context/ToastContext';
import { Star, ShoppingCart, ShoppingBag, Minus, Plus, Heart, Truck, ShieldCheck, ArrowLeft, ArrowRight, Loader, Banknote, MapPin, AlertCircle, RotateCcw, Tag, Flame } from 'lucide-react';
import RecentlyViewed from '../components/product/RecentlyViewed';

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [globalCodEnabled, setGlobalCodEnabled] = useState(true);
    // const [globalStockActive, setGlobalStockActive] = useState(true); // Deprecated
    const [globalStockCountVisible, setGlobalStockCountVisible] = useState(true);
    const [globalDeliveryDays, setGlobalDeliveryDays] = useState(5);
    const [globalAreReturnsActive, setGlobalAreReturnsActive] = useState(true);
    const [selectedColor, setSelectedColor] = useState('');

    // Delivery Check States
    const [pincode, setPincode] = useState('');
    const [isPincodeChecked, setIsPincodeChecked] = useState(false);
    const [showPolicyTooltip, setShowPolicyTooltip] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                setGlobalCodEnabled(data.isCodAvailable);
                // setGlobalStockActive(data.isGlobalStockActive !== false); // Ignored
                setGlobalStockCountVisible(data.isStockCountVisible !== false);
                setGlobalDeliveryDays(data.defaultEstimatedDeliveryDays || 5);
                setGlobalAreReturnsActive(data.areReturnsActive !== false); // Default true
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);



    const handleAddToCart = () => {
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            showToast("Please select a color", "error");
            return;
        }
        addToCart(product, quantity, selectedColor);
    };

    const handlePincodeCheck = () => {
        if (pincode.length === 6) {
            setIsPincodeChecked(true);
            showToast("Delivery available to this pincode", "success");
        } else {
            showToast("Please enter a valid 6-digit pincode", "error");
        }
    };

    const submitHandler = useCallback(async (e) => {
        e.preventDefault();
        try {
            await api.post(`/products/${id}/reviews`, { rating, comment });
            showToast('Review Submitted!', 'success');
            setComment('');
            setRating(0);
            // Reload product to show new review
            const { data } = await api.get(`/products/${id}`);
            setProduct(data);
        } catch (error) {
            showToast(error.response?.data?.message || 'Error submitting review', 'error');
        }
    }, [id, rating, comment, showToast]);

    const getImageUrl = useCallback((path) => {
        if (!path) return 'https://via.placeholder.com/300';
        if (path.startsWith('http')) return path;
        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
        return `${apiBase}${path}`;
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0); // Reset scroll to top on product change
        const fetchProduct = async () => {
            try {
                // Parallel fetch for product data and related items
                const [productRes, relatedRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/products/${id}/related`)
                ]);

                setProduct(productRes.data);
                setRelatedProducts(relatedRes.data);
            } catch (error) {
                console.error("Failed to fetch product data", error);
            } finally {
                setLoading(false);
            }
        };
        if (user && id) {
            // Track recently viewed without blocking
            api.post('/users/recently-viewed', { productId: id }).catch(err => console.error("Failed to track view", err));
        }
        fetchProduct();
    }, [id, user]);

    // Use real product images array if available, otherwise fallback to main image
    const images = useMemo(() => {
        if (!product) return [];
        const extraImages = product.images || [];
        // Ensure main image is first
        if (product.image && !extraImages.includes(product.image)) {
            return [product.image, ...extraImages];
        }
        return extraImages.length > 0 ? extraImages : (product.image ? [product.image] : []);
    }, [product]);

    // Calculate delivery date locally
    const deliveryDate = useMemo(() => {
        if (!product) return null;
        // Prioritize product-specific days, else use global setting, else default to 5
        const days = product.estimatedDeliveryDays || globalDeliveryDays || 5;
        const date = new Date();
        date.setDate(date.getDate() + parseInt(days));
        return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
    }, [product, globalDeliveryDays]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin h-10 w-10 text-indigo-600" /></div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Product not found</div>;

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Products
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                    {/* Image Gallery (Sticky on Desktop) */}
                    <div className="space-y-4 md:sticky md:top-24 h-fit">
                        <div className="aspect-square bg-gray-50 dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700 relative group">
                            <img
                                src={getImageUrl(images[activeImage])}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {product.discountPrice > 0 && product.discountPrice < product.price && (
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                    className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-extrabold px-4 py-2 rounded-full shadow-[0_10px_20px_rgba(220,38,38,0.3)] z-10"
                                >
                                    <Flame className="h-4 w-4 fill-yellow-300 text-yellow-100" />
                                    <span>
                                        {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                                    </span>
                                </motion.div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-900' : 'border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}
                                    >
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info (Scrollable) */}
                    <div className="flex flex-col">
                        <div className="mb-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wide">{product.category}</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{product.name}</h1>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating || 4.5) ? 'fill-current' : 'text-gray-200 dark:text-slate-600'}`} />
                                ))}
                            </div>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">({product.numReviews || 0} verified reviews)</span>
                        </div>

                        <div className="flex flex-col gap-1 mb-6">
                            {product.discountPrice > 0 && product.discountPrice < product.price ? (
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                            ₹{product.discountPrice.toLocaleString()}
                                        </span>
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-xl text-gray-400 dark:text-gray-500 line-through decoration-2 decoration-red-500/50">
                                                ₹{product.price.toLocaleString()}
                                            </span>
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                                You Save ₹{(product.price - product.discountPrice).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-4xl font-black text-slate-900 dark:text-white">
                                    ₹{product.price.toLocaleString()}
                                </span>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8 border-b border-gray-100 dark:border-slate-700 pb-8">
                            {product.description || "This premium product is crafted with attention to detail. Perfect for your daily needs and durable enough to last. Features state-of-the-art technology and modern design aesthetics."}
                        </p>

                        {/* Color Selection */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Color: <span className="text-gray-500 font-normal">{selectedColor}</span></h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.colors.map((color, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color ? 'border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900 scale-110' : 'border-gray-200 dark:border-slate-700 hover:border-gray-400'}`}
                                            title={color}
                                        >
                                            <span
                                                className="w-8 h-8 rounded-full border border-gray-100 shadow-inner"
                                                style={{ backgroundColor: color.toLowerCase() }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                {/* ... quantity selector ... */}
                                <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded-full bg-gray-50 dark:bg-slate-800">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-10 text-center font-bold text-slate-900 dark:text-white">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {product.isStockEnabled !== false && product.countInStock === 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                            <span className="text-sm font-semibold text-red-500">
                                                Out of Stock
                                            </span>
                                        </div>
                                    ) : product.isStockEnabled === false || !globalStockCountVisible ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                In Stock
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${product.countInStock > 5 ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                                                <span className={`text-sm font-semibold ${product.countInStock > 5 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                    {product.countInStock > 5 ? 'In Stock' : `Only ${product.countInStock} Left!`}
                                                </span>
                                            </div>
                                            {product.countInStock > 0 && product.countInStock <= 10 && (
                                                <p className="text-[10px] text-gray-400 font-medium italic">Hurry! Selling fast</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {user ? (
                                    (['admin', 'super_admin'].includes(user.role)) ? (
                                        <button
                                            disabled
                                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-bold text-lg bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-slate-700"
                                        >
                                            <ShoppingBag className="h-5 w-5" />
                                            Admin View Only
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={product.isStockEnabled !== false && product.countInStock === 0}
                                            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 ${product.isStockEnabled !== false && product.countInStock === 0 ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700'}`}
                                        >
                                            <ShoppingCart className="h-5 w-5" />
                                            {product.isStockEnabled !== false && product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    )
                                ) : (
                                    <Link
                                        to="/login"
                                        state={{ from: location }}
                                        className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 py-4 rounded-full font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate('/login', { state: { from: location } });
                                        }}
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        Login to Add
                                    </Link>
                                )}
                                <WishlistButton
                                    productId={product._id}
                                    rounded={true}
                                    className="w-14 h-14 border border-gray-200 dark:border-slate-600 hover:border-red-200 text-gray-500 dark:text-gray-400"
                                />
                            </div>
                        </div>



                        {/* Delivery Section */}
                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-700">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-500 font-medium w-20">Delivery</span>
                                    <div className="flex-1 max-w-xs relative">
                                        <div className="flex items-center border-b-2 border-indigo-600 pb-1">
                                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                            <input
                                                type="text"
                                                placeholder="Enter Delivery Pincode"
                                                maxLength={6}
                                                value={pincode}
                                                onChange={(e) => {
                                                    setPincode(e.target.value.replace(/\D/g, ''));
                                                    setIsPincodeChecked(false);
                                                }}
                                                className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-gray-400 text-sm font-medium"
                                            />
                                            <button
                                                onClick={handlePincodeCheck}
                                                className="text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                                            >
                                                Check
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {isPincodeChecked && (
                                    <div className="flex items-center gap-4">
                                        <span className="w-20"></span>
                                        <div className="flex items-center gap-2 relative">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                Delivery by {deliveryDate}
                                            </span>
                                            <span className="text-gray-400 text-sm">|</span>
                                            <span className="text-green-600 font-medium text-sm">Free</span>

                                            <div
                                                className="relative"
                                                onMouseEnter={() => setShowPolicyTooltip(true)}
                                                onMouseLeave={() => setShowPolicyTooltip(false)}
                                            >
                                                <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />

                                                {showPolicyTooltip && (
                                                    <div className="absolute z-50 left-0 bottom-full mb-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 p-4 text-xs leading-relaxed transform -translate-x-1/2 ml-2">
                                                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Shipping Policy:</h4>
                                                        <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-400">
                                                            <li>In case your order is not delivered even after the delivery confirmation email/SMS is shared with you, please contact us within 7 days to report this issue.</li>
                                                            <li>Issue reported after 7 days of delivery confirmation email/SMS being sent will be automatically rejected.</li>
                                                        </ul>
                                                        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white dark:bg-slate-800 border-r border-b border-gray-100 dark:border-slate-700"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <RotateCcw className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {globalAreReturnsActive && product.returnPolicy?.isReturnable ? `${product.returnPolicy.returnWindowDays || 7} Days Returnable` : 'No Returns Allowed'}
                                    </span>
                                    {globalAreReturnsActive && product.returnPolicy?.isReturnable && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {product.returnPolicy?.returnType === 'BOTH' ? 'Refund or Replacement' :
                                                product.returnPolicy?.returnType === 'REPLACEMENT' ? 'Replacement Only' : 'Refund Only'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 col-span-2">
                                <div className={`p-2 rounded-lg ${globalCodEnabled && product.isCodAvailable !== false ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                    <Banknote className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {globalCodEnabled && product.isCodAvailable !== false ? 'Cash on Delivery Available' : 'Online Payment Only'}
                                </span>
                            </div>
                        </div>

                        {/* Specifications Section */}
                        {product.specifications && product.specifications.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-700">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Specifications</h2>
                                <div className="space-y-8">
                                    {product.specifications.map((section, sIndex) => (
                                        <div key={sIndex} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                                            <div className="bg-gray-50 dark:bg-slate-900/60 px-6 py-3 border-b border-gray-100 dark:border-slate-700">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{section.heading}</h3>
                                            </div>
                                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                                {section.items.map((item, iIndex) => (
                                                    <div key={iIndex} className="grid grid-cols-3 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                        <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            {item.key}
                                                        </div>
                                                        <div className="col-span-2 text-sm text-slate-900 dark:text-white font-medium">
                                                            {item.value}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Reviews Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-100 dark:border-slate-800">
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Write a Review</h2>
                    {user ? (
                        <form onSubmit={submitHandler} className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 max-w-2xl">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Review</label>
                                <textarea
                                    rows="4"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your thoughts about this product..."
                                    className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder-gray-400"
                                    required
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={rating === 0 || !comment.trim()}
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Review
                            </button>
                        </form>
                    ) : (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center justify-between max-w-2xl">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Have you used this product?</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Sign in to share your experience with the community.</p>
                            </div>
                            <Link
                                to="/login"
                                state={{ from: location }}
                                className="px-6 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all"
                            >
                                Login
                            </Link>
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Customer Reviews ({product.numReviews})</h2>

                <div className="">
                    {/* Rating Graph & List */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Rating Distribution Graph */}
                        <div className="lg:col-span-4 h-fit sticky top-24 space-y-8">
                            <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Rating Breakdown</h3>
                                <div className="space-y-3">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = product.reviews.filter(r => r.rating === star).length;
                                        const total = product.reviews.length;
                                        const percentage = total === 0 ? 0 : (count / total) * 100;

                                        return (
                                            <div key={star} className="flex items-center gap-3 text-sm">
                                                <div className="flex items-center w-12 gap-1">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{star}</span>
                                                    <Star className="h-3 w-3 text-gray-400" />
                                                </div>
                                                <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-400 rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="w-10 text-right text-gray-500 dark:text-gray-400">
                                                    {percentage.toFixed(0)}%
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Review List */}
                        <div className="lg:col-span-8 space-y-6">
                            {product.reviews.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                    <div className="flex justify-center mb-4">
                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                                            <Star className="h-8 w-8 text-gray-300" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No reviews yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Be the first to share your thoughts on this product with the community.</p>
                                </div>
                            )}
                            {product.reviews.map((review) => (
                                <div key={review._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                                                {review.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">{review.name}</span>
                                                <div className="flex text-yellow-400 text-xs mt-0.5">
                                                    {[...Array(5)].map((_, r) => (
                                                        <Star key={r} className={`h-3 w-3 ${r < review.rating ? 'fill-current' : 'text-gray-200 dark:text-slate-600'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 font-medium bg-gray-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                                            {review.createdAt?.substring(0, 10)}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                {user && <RecentlyViewed />}
            </div>



            {/* Related Products */}
            <AnimatePresence>
                {relatedProducts.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 border-t border-gray-100 dark:border-slate-800 pt-16"
                    >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-10 flex items-center gap-3">
                            <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                            You May Also Like
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                            {relatedProducts.map((p, index) => (
                                <motion.div
                                    key={p._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                    <Link to={`/product/${p._id}`} className="group block bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-slate-700 h-full">
                                        <div className="aspect-[1/1] overflow-hidden bg-gray-50 dark:bg-slate-900 relative">
                                            <img
                                                src={getImageUrl(p.image)}
                                                alt={p.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {p.countInStock === 0 && (
                                                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
                                                    Out of Stock
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 sm:p-6">
                                            <div className="text-[8px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 sm:mb-2 px-1.5 sm:py-0.5 bg-indigo-50 dark:bg-indigo-900/30 w-fit rounded-full">
                                                {p.category}
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white truncate mb-1 sm:mb-2 text-sm sm:text-lg group-hover:text-indigo-600 transition-colors">
                                                {p.name}
                                            </h3>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 sm:mt-4 gap-1">
                                                <p className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">
                                                    {p.discountPrice > 0 ? (
                                                        <>
                                                            <span className="text-xs sm:text-sm text-gray-400 line-through mr-2">₹{p.price.toLocaleString()}</span>
                                                            ₹{p.discountPrice.toLocaleString()}
                                                        </>
                                                    ) : (
                                                        `₹${p.price.toLocaleString()}`
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-1 text-yellow-400">
                                                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                                                    <span className="text-[10px] sm:text-sm font-bold text-slate-600 dark:text-gray-400">{p.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* View More Button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mt-12 flex justify-center"
                        >
                            <Link
                                to={`/products?category=${encodeURIComponent(product.category)}`}
                                className="group flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full font-bold text-slate-700 dark:text-white hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white hover:border-slate-900 dark:hover:border-indigo-600 transition-all duration-300 shadow-sm hover:shadow-xl active:scale-95"
                            >
                                View More in {product.category}
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </motion.section>
                )}
            </AnimatePresence>

            <Footer />
        </div >
    );
};

export default ProductDetail;
