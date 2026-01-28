import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Award, Users, Globe, Heart } from 'lucide-react';

const About = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative py-20 bg-indigo-50 dark:bg-slate-800 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-300/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">About Barlina Fashion Design</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            We are on a mission to bring premium lifestyle products to your doorstep.
                            Quality, transparency, and customer satisfaction are at the heart of everything we do.
                        </p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <img
                                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="Our Team"
                                    className="rounded-3xl shadow-2xl"
                                />
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Story</h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Founded in 2024, Barlina Fashion Design started with a simple idea: technology and lifestyle accessories should be both beautiful and functional.
                                    What began as a small curated collection has grown into a diverse marketplace loved by thousands.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    We believe in sustainable growth and ethical sourcing. Every product in our catalog is hand-picked and rigorously tested to ensure it meets our high standards.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-16 bg-gray-50 dark:bg-slate-800/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Choose Us?</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: Award, title: "Premium Quality", desc: "Top-tier products from trusted brands." },
                                { icon: Users, title: "Customer First", desc: "9 AM - 5 PM support dedicated to your needs." },
                                { icon: Globe, title: "Global Shipping", desc: "Fast & detailed tracking worldwide." },
                                { icon: Heart, title: "Curated with Love", desc: "Only the best selection for you." }
                            ].map((item, index) => (
                                <div key={index} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default About;
