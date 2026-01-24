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
    { name: 'New Arrivals', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', badge: 'New' },
    { name: 'Silk Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', badge: 'Selling' },
    { name: 'Bridal Collection', image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', badge: 'Bridal' },
    { name: 'Designer Blouses', image: 'https://images.unsplash.com/photo-1583391733981-8498f288a5e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Lehengas', image: 'https://images.unsplash.com/photo-1583391733981-8498f288a5e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Kurtis', image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Salwar Suits', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Jewellery', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Festive Wear', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Cotton Sarees', image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Wedding Collection', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
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

                {/* Categories Section - Redesigned for Mobile (and Desktop) */}
                <section className="py-8 md:hidden bg-white dark:bg-slate-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                        {/* Title Banner */}
                        <div className="flex justify-center mb-8">
                            <div className="relative bg-gradient-to-r from-red-600 to-indigo-900 text-white px-10 py-2 rounded-sm shadow-md transform -skew-x-12">
                                <h2 className="text-xl md:text-2xl font-bold tracking-wider transform skew-x-12 uppercase" style={{ fontFamily: 'serif' }}>Top Categories</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 md:gap-8">
                            {categories.map((cat, idx) => (
                                <Link key={idx} to={`/products?category=${cat.name}`} className="flex flex-col items-center group cursor-pointer">
                                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-2">
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        {cat.badge && (
                                            <span className={`absolute top-0 left-0 text-[10px] text-white px-2 py-0.5 rounded-br-lg ${cat.badge === 'New' ? 'bg-red-500' : cat.badge === 'Selling' ? 'bg-indigo-600' : 'bg-pink-500'}`}>
                                                {cat.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] md:text-sm font-medium text-center text-slate-700 dark:text-gray-300 leading-tight">
                                        {cat.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
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
