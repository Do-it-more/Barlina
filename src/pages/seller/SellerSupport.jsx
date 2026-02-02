import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    HelpCircle,
    MessageCircle,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader,
    ChevronDown,
    ChevronUp,
    Plus,
    Phone,
    Mail,
    FileText,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SellerSupport = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'general',
        message: ''
    });

    const categories = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'payment', label: 'Payment Issues' },
        { value: 'order', label: 'Order Related' },
        { value: 'product', label: 'Product Issues' },
        { value: 'account', label: 'Account Issues' },
        { value: 'technical', label: 'Technical Support' }
    ];

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const { data } = await api.get('/sellers/support-tickets');
            setTickets(data.tickets || []);
        } catch (error) {
            // If endpoint doesn't exist, just show empty state
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        if (!newTicket.subject.trim() || !newTicket.message.trim()) {
            showToast('Please fill all fields', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/sellers/support-tickets', newTicket);
            showToast('Support ticket submitted successfully', 'success');
            setNewTicket({ subject: '', category: 'general', message: '' });
            setShowNewTicket(false);
            fetchTickets();
        } catch (error) {
            showToast('Failed to submit ticket', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'OPEN': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
            'IN_PROGRESS': { bg: 'bg-amber-500/20', text: 'text-amber-400' },
            'RESOLVED': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
            'CLOSED': { bg: 'bg-gray-500/20', text: 'text-gray-400' }
        };
        return styles[status] || styles['OPEN'];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <HelpCircle className="h-6 w-6 text-violet-500" />
                            Seller Support
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Get help with your seller account
                        </p>
                    </div>
                    <button
                        onClick={() => setShowNewTicket(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Ticket
                    </button>
                </div>

                {/* Quick Help Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-violet-500/20 rounded-lg">
                                <FileText className="w-5 h-5 text-violet-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">FAQs</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Find answers to commonly asked questions
                        </p>
                        <a href="#" className="text-sm text-violet-400 hover:text-violet-300">
                            Browse FAQs →
                        </a>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Mail className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Email Support</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Reach out to our support team via email
                        </p>
                        <a href="mailto:seller-support@example.com" className="text-sm text-emerald-400 hover:text-emerald-300">
                            seller-support@example.com
                        </a>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Phone className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Phone Support</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Talk to our seller support team
                        </p>
                        <p className="text-sm text-blue-400">
                            +91 1800-XXX-XXXX (Mon-Sat, 9AM-6PM)
                        </p>
                    </div>
                </div>

                {/* Support Tickets */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-violet-500" />
                            Your Support Tickets
                        </h2>
                    </div>

                    {tickets.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                            {tickets.map((ticket) => (
                                <div key={ticket._id} className="p-4">
                                    <div
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedTicket(expandedTicket === ticket._id ? null : ticket._id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${getStatusBadge(ticket.status).bg}`}>
                                                {ticket.status === 'RESOLVED' ? (
                                                    <CheckCircle className={`w-5 h-5 ${getStatusBadge(ticket.status).text}`} />
                                                ) : (
                                                    <Clock className={`w-5 h-5 ${getStatusBadge(ticket.status).text}`} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    #{ticket.ticketId || ticket._id?.slice(-6)} • {new Date(ticket.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(ticket.status).bg} ${getStatusBadge(ticket.status).text}`}>
                                                {ticket.status?.replace(/_/g, ' ')}
                                            </span>
                                            {expandedTicket === ticket._id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {expandedTicket === ticket._id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                                        {ticket.message}
                                                    </p>
                                                    {ticket.response && (
                                                        <div className="mt-4 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                                                            <p className="text-xs text-violet-400 mb-1">Admin Response:</p>
                                                            <p className="text-gray-700 dark:text-gray-300 text-sm">{ticket.response}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">No support tickets yet</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                Create a new ticket if you need assistance
                            </p>
                        </div>
                    )}
                </div>

                {/* New Ticket Modal */}
                <AnimatePresence>
                    {showNewTicket && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                            onClick={() => setShowNewTicket(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Support Ticket</h2>
                                    <button onClick={() => setShowNewTicket(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                        <input
                                            type="text"
                                            value={newTicket.subject}
                                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                            placeholder="Brief description of your issue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                        <select
                                            value={newTicket.category}
                                            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                        <textarea
                                            value={newTicket.message}
                                            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 resize-none"
                                            placeholder="Describe your issue in detail..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Submit Ticket
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default SellerSupport;
