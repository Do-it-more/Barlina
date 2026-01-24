import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const Footer = () => {
    // State for mobile accordion sections
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <footer className="bg-white dark:bg-slate-900 pt-16 pb-24 md:pb-8 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-16">
                    {/* Brand Info */}
                    <div>
                        <Link to="/" className="inline-block mb-6 group">
                            <div className="flex flex-col items-start">
                                <span className="font-serif text-2xl md:text-3xl tracking-[0.15em] font-bold text-slate-900 dark:text-white leading-none group-hover:opacity-80 transition-opacity" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    BARLINA
                                </span>
                                <span className="text-[10px] md:text-xs tracking-[0.4em] font-light lowercase text-gray-500 dark:text-gray-400 mt-1 w-full text-center">
                                    fashion design
                                </span>
                            </div>
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Discover the latest trends in tech and lifestyle. Quality products, premium service, and fast delivery guaranteed.
                        </p>
                        <div className="flex space-x-4 mb-8 md:mb-0">
                            {/* Social icons removed */}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="border-b border-gray-100 dark:border-slate-800 md:border-none pb-4 md:pb-0">
                        <button
                            onClick={() => toggleSection('quickLinks')}
                            className="w-full flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white mb-2 md:mb-6 md:cursor-default"
                        >
                            Quick Links
                            <span className="md:hidden">
                                {openSection === 'quickLinks' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                        </button>
                        <ul className={`${openSection === 'quickLinks' ? 'block' : 'hidden'} md:block space-y-4`}>
                            {[
                                { name: 'Home', path: '/' },
                                { name: 'Shop', path: '/products' },
                                { name: 'About Us', path: '/about' },
                                { name: 'Contact', path: '/contact' },
                                { name: 'Become a Seller', path: '/seller/register' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={item.path} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-1">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="border-b border-gray-100 dark:border-slate-800 md:border-none pb-4 md:pb-0">
                        <button
                            onClick={() => toggleSection('customerService')}
                            className="w-full flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white mb-2 md:mb-6 md:cursor-default"
                        >
                            Customer Service
                            <span className="md:hidden">
                                {openSection === 'customerService' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                        </button>
                        <ul className={`${openSection === 'customerService' ? 'block' : 'hidden'} md:block space-y-4`}>
                            {[
                                { name: 'Order Tracking', path: '/orders' },
                                { name: 'Wishlist', path: '/wishlist' },
                                { name: 'Terms & Conditions', path: '/terms-conditions' },
                                { name: 'Privacy Policy', path: '/privacy-policy' },
                                { name: 'Returns', path: '/returns' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={item.path} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-1">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="border-b border-gray-100 dark:border-slate-800 md:border-none pb-4 md:pb-0">
                        <button
                            onClick={() => toggleSection('contactUs')}
                            className="w-full flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white mb-2 md:mb-6 md:cursor-default"
                        >
                            Contact Us
                            <span className="md:hidden">
                                {openSection === 'contactUs' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                        </button>
                        <ul className={`${openSection === 'contactUs' ? 'block' : 'hidden'} md:block space-y-4`}>
                            <li className="flex items-start gap-4">
                                <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=13/3+Mukasha+parur+villupuram"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                                >
                                    13/3, Mukasha parur, villupuram -123463
                                </a>
                            </li>
                            <li className="flex items-center gap-4">
                                <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <a
                                    href="tel:+918825635443"
                                    className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                    +91 88256 35443
                                </a>
                            </li>
                            <li className="flex items-center gap-4">
                                <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <a
                                    href="mailto:support@barlinafashion.com"
                                    className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                    support@barlinafashion.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        © {new Date().getFullYear()} Barlina Fashion Design. All rights reserved.
                    </p>

                </div>
            </div>
        </footer>
    );
};

export default Footer;
