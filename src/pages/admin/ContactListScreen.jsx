import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Trash2, Search, Mail, Calendar, Eye, Phone, X } from 'lucide-react';

const ContactListScreen = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const fetchContacts = async () => {
        try {
            const { data } = await api.get('/contact');
            setContacts(data);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to fetch messages', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
        // Mark notifications as read
        api.put('/contact/mark-read').catch(err => console.error(err));
    }, []);

    const handleDelete = async (id) => {
        const isConfirmed = await confirm('Delete Message', 'Are you sure you want to delete this message?');
        if (isConfirmed) {
            try {
                await api.delete(`/contact/${id}`);
                showToast('Message deleted successfully', 'success');
                setContacts(contacts.filter(c => c._id !== id));
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to delete message', 'error');
            }
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (contact) => {
        setSelectedContact(contact);
    };

    const closeModal = () => {
        setSelectedContact(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Contact Inquiries</h1>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">User</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Subject</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Message</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Date</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredContacts.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No messages found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredContacts.map((contact) => (
                                            <tr key={contact._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-white">{contact.name}</span>
                                                        <a href={`mailto:${contact.email}`} className="text-gray-500 dark:text-gray-400 text-xs hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 mt-0.5">
                                                            <Mail className="h-3 w-3" />
                                                            {contact.email}
                                                        </a>
                                                        {contact.phone && (
                                                            <a href={`tel:${contact.phone}`} className="text-gray-500 dark:text-gray-400 text-xs hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 mt-0.5">
                                                                <Phone className="h-3 w-3" />
                                                                {contact.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-800 dark:text-slate-200 font-medium">{contact.subject}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-600 dark:text-gray-300 max-w-xs truncate" title={contact.message}>
                                                        {contact.message}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(contact.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openModal(contact)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                            title="View Message"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(contact._id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete Message"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden space-y-4">
                        {filteredContacts.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No messages found.
                            </div>
                        ) : (
                            filteredContacts.map((contact) => (
                                <div key={contact._id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{contact.subject}</h3>
                                        <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                                            <Calendar className="h-3 w-3" /> {new Date(contact.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{contact.name}</p>
                                            <p className="text-xs text-gray-500">{contact.email}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                        {contact.message}
                                    </p>

                                    <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                        <button
                                            onClick={() => openModal(contact)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-sm"
                                        >
                                            <Eye className="h-4 w-4" /> View Details
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact._id)}
                                            className="w-10 flex items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Message Detail Modal */}
            {selectedContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Details</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">From</label>
                                <div className="mt-1 flex items-start gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white text-lg">{selectedContact.name}</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                                <Mail className="h-4 w-4" /> {selectedContact.email}
                                            </a>
                                            {selectedContact.phone && (
                                                <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    <Phone className="h-4 w-4" /> {selectedContact.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</label>
                                <p className="mt-1 text-slate-900 dark:text-white font-medium">{selectedContact.subject}</p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</label>
                                <div className="mt-2 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedContact.message}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Sent on {new Date(selectedContact.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                            <a
                                href={`mailto:${selectedContact.email}`}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Mail className="h-4 w-4" /> Reply via Email
                            </a>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactListScreen;
