import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    MessageSquare,
    Search,
    Filter,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Send,
    User,
    Store,
    Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSupportTickets = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [filterStatus]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (searchTerm) params.search = searchTerm;

            const { data } = await api.get('/admin/support-tickets', { params });
            setTickets(data.tickets || []);
        } catch (error) {
            showToast('Failed to load tickets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (ticketId) => {
        if (!replyMessage.trim()) {
            showToast('Please enter a reply', 'error');
            return;
        }

        setReplying(true);
        try {
            await api.put(`/admin/support-tickets/${ticketId}/reply`, {
                response: replyMessage,
                status: 'RESOLVED'
            });
            showToast('Reply sent successfully', 'success');
            setReplyMessage('');
            fetchTickets(); // Refresh
        } catch (error) {
            showToast('Failed to send reply', 'error');
        } finally {
            setReplying(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            case 'IN_PROGRESS': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
            case 'RESOLVED': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
            case 'CLOSED': return 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Debounce could be added here
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchTickets();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Support Tickets</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and respond to seller inquiries</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search ticket ID or subject..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </form>
                    <select
                        className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
                <button
                    onClick={fetchTickets}
                    className="p-2 text-gray-500 hover:text-violet-500 transition-colors"
                >
                    <Filter className="h-5 w-5" />
                </button>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket._id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                onClick={() => setExpandedTicket(expandedTicket === ticket._id ? null : ticket._id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg border ${getStatusColor(ticket.status)} bg-opacity-10 text-opacity-100`}>
                                            {ticket.status === 'RESOLVED' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">#{ticket.ticketId}</span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Store className="w-3 h-3" />
                                                    {ticket.seller?.businessName || 'Unknown Seller'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-700">
                                                    {ticket.category?.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        {expandedTicket === ticket._id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedTicket === ticket._id && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700"
                                    >
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Message Area */}
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Issue Description</h4>
                                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                                            {ticket.message}
                                                        </div>
                                                    </div>

                                                    {ticket.response && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                                Admin Response
                                                            </h4>
                                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                                                {ticket.response}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Reply Form */}
                                                    {!ticket.response && (
                                                        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Send Response</h4>
                                                            <textarea
                                                                className="w-full p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-violet-500 min-h-[120px]"
                                                                placeholder="Type your response here..."
                                                                value={replyMessage}
                                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                            />
                                                            <div className="flex justify-end">
                                                                <button
                                                                    onClick={() => handleReply(ticket._id)}
                                                                    disabled={replying}
                                                                    className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                                                >
                                                                    {replying ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                                    Send Reply & Resolve
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Sidebar Info */}
                                                <div className="space-y-6">
                                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Seller Details</h4>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-xs">
                                                                    {ticket.seller?.businessName?.charAt(0) || 'S'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.seller?.businessName}</p>
                                                                    <p className="text-xs text-gray-500">{ticket.seller?.ownerName}</p>
                                                                </div>
                                                            </div>
                                                            <div className="pt-3 border-t border-gray-100 dark:border-slate-700 space-y-2">
                                                                <p className="text-xs text-gray-500">
                                                                    <span className="font-semibold block text-gray-700 dark:text-gray-300 mb-0.5">Contact</span>
                                                                    {ticket.seller?.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSupportTickets;
