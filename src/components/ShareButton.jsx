import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Share2,
    Copy,
    Check,
    X,
    MessageCircle, // WhatsApp
    Facebook,
    Twitter,
    Linkedin,
    Mail,
    Link2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ShareButton = ({
    product,
    className = '',
    variant = 'icon' // 'icon' or 'button'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef(null);
    const { showToast } = useToast();

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/product/${product._id}`
        : '';

    const shareTitle = product?.name || 'Check out this product!';
    const shareText = product?.description?.substring(0, 100) || `Check out ${product?.name} on Barlina Fashion!`;
    const sharePrice = product?.discountPrice > 0 && product?.discountPrice < product?.price
        ? `₹${product.discountPrice.toLocaleString()}`
        : `₹${product?.price?.toLocaleString()}`;

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Use native share API on mobile if available
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: `${shareText} - Only ${sharePrice}!`,
                    url: shareUrl,
                });
                showToast('Shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        } else {
            setIsOpen(true);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            showToast('Link copied to clipboard!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            showToast('Failed to copy link', 'error');
        }
    };

    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-500 hover:bg-green-600',
            iconColor: 'text-white',
            url: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} - ${sharePrice}\n${shareUrl}`)}`
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-600 hover:bg-blue-700',
            iconColor: 'text-white',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'Twitter',
            icon: Twitter,
            color: 'bg-sky-500 hover:bg-sky-600',
            iconColor: 'text-white',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${shareTitle} - ${sharePrice}`)}&url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            color: 'bg-blue-700 hover:bg-blue-800',
            iconColor: 'text-white',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'Email',
            icon: Mail,
            color: 'bg-gray-600 hover:bg-gray-700',
            iconColor: 'text-white',
            url: `mailto:?subject=${encodeURIComponent(`Check this out: ${shareTitle}`)}&body=${encodeURIComponent(`I found this amazing product!\n\n${shareTitle}\nPrice: ${sharePrice}\n\n${shareUrl}`)}`
        }
    ];

    const openShareWindow = (url) => {
        window.open(url, '_blank', 'width=600,height=400,scrollbars=yes');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Share Trigger Button */}
            {variant === 'button' ? (
                <button
                    onClick={handleNativeShare}
                    className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-full font-medium transition-all active:scale-95 ${className}`}
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </button>
            ) : (
                <button
                    onClick={handleNativeShare}
                    className={`w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-all active:scale-95 ${className}`}
                    title="Share this product"
                >
                    <Share2 className="h-5 w-5" />
                </button>
            )}

            {/* Share Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Share2 className="h-4 w-4 text-indigo-600" />
                                    Share Product
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {shareTitle}
                            </p>
                        </div>

                        {/* Social Share Options */}
                        <div className="p-4">
                            <div className="grid grid-cols-5 gap-3 mb-4">
                                {shareOptions.map((option) => (
                                    <button
                                        key={option.name}
                                        onClick={() => openShareWindow(option.url)}
                                        className={`flex flex-col items-center gap-1 group`}
                                        title={option.name}
                                    >
                                        <div className={`w-11 h-11 rounded-full ${option.color} flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95 shadow-lg`}>
                                            <option.icon className={`h-5 w-5 ${option.iconColor}`} />
                                        </div>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                            {option.name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Copy Link Section */}
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                    Or copy link
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden">
                                        <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                            {shareUrl}
                                        </span>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className={`flex-shrink-0 p-2.5 rounded-xl transition-all active:scale-95 ${copied
                                                ? 'bg-green-500 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShareButton;
