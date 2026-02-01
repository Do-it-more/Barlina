import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import SpecialOffers from '../components/SpecialOffers';
import ContactSection from '../components/ContactSection';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { Truck, RotateCcw, ShieldCheck, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
    { name: 'New Arrivals', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop', badge: 'New' }, // Woman in light blue suit (Verified)
    { name: 'Silk Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop', badge: 'Selling' }, // Woman in Purple Saree (Verified)
    { name: 'Bridal Collection', image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&h=400&fit=crop', badge: 'Bridal' }, // Indian Bride in Red/Gold (Verified)
    { name: 'Designer Blouses', image: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=400&h=400&fit=crop' }, // Close up of fabric/saree detail
    { name: 'Lehengas', image: 'https://images.unsplash.com/photo-1585487000160-52c61aa01ce8?w=400&h=400&fit=crop' }, // Woman in Green/Gold traditional wear (Lehenga style)
    { name: 'Kurtis', image: 'https://images.unsplash.com/photo-1616186083705-03f9e6d80d21?w=400&h=400&fit=crop' }, // Woman in modern ethnic top
    { name: 'Salwar Suits', image: 'https://images.unsplash.com/photo-1520638531100-c02bea3238d7?w=400&h=400&fit=crop' }, // Woman in white ethnic outfit
    { name: 'Jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop' }, // Gold Necklace on mannequin
    { name: 'Festive Wear', image: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&h=400&fit=crop' }, // Rich Gold/Pink Saree detail
    { name: 'Cotton Sarees', image: 'https://images.unsplash.com/photo-1632514480749-d04586df36a5?w=400&h=400&fit=crop' }, // Woman in Yellow Cotton Saree
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1576403233156-654cb29796dc?w=400&h=400&fit=crop' }, // Bangles/Hands
    { name: 'Wedding Collection', image: 'https://images.unsplash.com/photo-1601121141461-9f6644cb8911?w=400&h=400&fit=crop' }, // Jewellery/Wedding detail
];

const features = [
    { icon: Truck, title: "Free Delivery", desc: "On all orders above ₹50" },
    { icon: RotateCcw, title: "Easy Returns", desc: "30-day money back guarantee" },
    { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected transactions" },
    { icon: Award, title: "Top Quality", desc: "Original products guaranteed" },
    { icon: Award, title: "Best Offers", desc: "Weekly Discounts" }, // Added to ensure visual balance if needed, or stick to 4. 
];
// restore to 4 to match design grid if horizontal scroll not used
const featuresList = features.slice(0, 4);

const Home = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await api.get('/products/top');
                setProducts(data);
            } catch (error) {
                console.error("Failed to fetch featured products", error);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="min-h-screen flex flex-col pb-16 md:pb-0">
            <Navbar />

            <main className="flex-grow">
                {/* Special Offers Section */}
                {/* Special Offers Section - Mobile Only (Desktop integration in Hero) */}
                <div className="md:hidden">
                    <SpecialOffers />
                </div>

                {/* Mobile View Toggle - Show only on larger screens if we want to separate, but here we can make responsive */}

                <div className="hidden md:block">
                    <Hero />
                </div>

                {/* Trending Collections - Animated Marquee for Mobile */}
                <section className="py-6 md:hidden overflow-hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                    <div className="mb-4 px-4 flex justify-between items-end">
                        <div>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">Discover</span>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none mt-1">Trending Now</h2>
                        </div>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600/50"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600/30"></span>
                        </div>
                    </div>

                    {/* Infinite Marquee */}
                    <div className="relative flex w-full">
                        <div className="flex gap-4 animate-scroll whitespace-nowrap px-4 w-max hover:paused">
                            {/* Duplicate list for infinite loop effect */}
                            {[...categories, ...categories].slice(0, 8).map((cat, idx) => (
                                <Link key={idx} to={`/products?category=${cat.name}`} className="relative group w-32 h-44 flex-shrink-0 rounded-2xl overflow-hidden shadow-md">
                                    <img
                                        // Use 3 verified images cyclically
                                        src={idx % 3 === 0
                                            ? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop' // Purple Saree
                                            : idx % 3 === 1
                                                ? 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=600&fit=crop' // Blue Suit
                                                : 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&h=600&fit=crop' // Bridal Red
                                        }
                                        alt={cat.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                        <div className="absolute bottom-3 left-3 text-white">
                                            <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest mb-0.5">Shop</p>
                                            <p className="text-sm font-bold leading-tight">{cat.name}</p>
                                        </div>
                                    </div>
                                    {(idx === 0 || idx === 1) && (
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            HOT
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <style>{`
                        @keyframes scroll {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-scroll {
                            animation: scroll 20s linear infinite;
                        }
                        .hover\\:paused:hover {
                            animation-play-state: paused;
                        }
                    `}</style>
                </section>



                {/* Featured Products */}
                <section className="py-20 bg-white dark:bg-slate-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-uppercase mb-2 block">Top Selection</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Featured Products</h2>
                            <p className="text-gray-500 dark:text-gray-400">Hand-picked products just for you. Get the best quality at the best price.</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                            {products.length > 0 ? products.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            )) : (
                                <p className="col-span-full text-center text-gray-400">Loading featured products...</p>
                            )}
                        </div>

                        <div className="mt-12 text-center">
                            <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-full font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
                                Load More Products
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <div>
                    <ContactSection />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Home;
