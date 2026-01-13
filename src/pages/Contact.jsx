import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Contact = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'phone') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.phone && formData.phone.length !== 10) {
            showToast('Please enter a valid 10-digit phone number', 'error');
            return;
        }

        setLoading(true);

        try {
            await api.post('/contact', formData);
            showToast('Message sent successfully! We will get back to you soon.', 'success');
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to send message', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow">
                {/* Header Section */}
                <section className="bg-slate-50 dark:bg-slate-800/50 py-16 md:py-24 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/5 blur-[100px]"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm mb-6"
                        >
                            Get in Touch
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6"
                        >
                            We'd love to hear from you.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                        >
                            Have a question or feedback? We're here to help. Send us a message and we'll respond within 24 hours.
                        </motion.p>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Contact Information</h2>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                                    Fill out the form and our team will get back to you within 24 hours.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Email Us</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">support@barlina.com</p>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Call Us</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">+1 (555) 123-4567</p>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 sm:col-span-2">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Visit Us</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        123 Fashion Ave, Suite 400<br />
                                        New York, NY 10018
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-700"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <MessageSquare className="h-6 w-6 text-indigo-600" />
                                Send a Message
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                                    <textarea
                                        name="message"
                                        rows="4"
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white resize-none"
                                        placeholder="Tell us more about your inquiry..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
