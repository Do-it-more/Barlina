import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ContactSection = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/contact', formData);
            showToast('Message sent successfully! We will get back to you soon.', 'success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to send message', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 bg-gray-50 dark:bg-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-uppercase mb-2 block">Get in Touch</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
                    <p className="text-gray-500 dark:text-gray-400">Have a question or feedback? We're here to help.</p>
                </div>

                <div className="max-w-3xl mx-auto">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-700"
                    >
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-indigo-600" />
                            Send a Message
                        </h3>
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
        </section>
    );
};

export default ContactSection;
