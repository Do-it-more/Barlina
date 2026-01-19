import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Edit, Trash2, CheckCircle, AlertCircle, Clock, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const ComplaintListScreen = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    const { user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const fetchComplaints = async () => {
        try {
            const { data } = await api.get('/complaints');
            setComplaints(data);
        } catch (error) {
            console.error("Failed to fetch complaints", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
        // Mark notifications as viewed
        api.put('/complaints/mark-viewed').catch(err => console.error(err));
    }, []);

    const handleDelete = async (id) => {
        if (await confirm('Delete Complaint', 'Are you sure you want to delete this complaint? This action cannot be undone.')) {
            try {
                await api.delete(`/complaints/${id}`);
                showToast('Complaint deleted successfully', 'success');
                fetchComplaints();
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to delete complaint', 'error');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-yellow-100 text-yellow-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredComplaints = complaints.filter(complaint => {
        const matchesFilter = filter === 'All' || complaint.status === filter;
        const matchesSearch = complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.order?._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Complaints Management</h2>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search by Order ID, Subject or Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <>
                        {/* Mobile View - Cards */}
                        <div className="md:hidden space-y-4">
                            {filteredComplaints.length > 0 ? (
                                filteredComplaints.map((complaint) => (
                                    <div key={complaint._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
                                                    #{complaint._id.slice(-6)}
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                                </span>
                                                <h3 className="font-bold text-slate-800 dark:text-white mt-1 line-clamp-1">{complaint.subject}</h3>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                        </div>

                                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-xs uppercase tracking-wider">User</span>
                                                <div className="text-right">
                                                    <span className="block font-medium text-slate-900 dark:text-white">{complaint.user?.name || 'Unknown'}</span>
                                                    <span className="block text-xs text-gray-400">{complaint.user?.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-xs uppercase tracking-wider">Order ID</span>
                                                <span className="font-mono text-indigo-500">{complaint.order?._id}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                to={`/admin/complaints/${complaint._id}`}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm shadow-indigo-200 dark:shadow-none"
                                            >
                                                <Eye className="h-4 w-4" /> View Details
                                            </Link>

                                            {user?.role === 'super_admin' && complaint.status === 'Closed' && (
                                                <button
                                                    onClick={() => handleDelete(complaint._id)}
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                                                    title="Delete Complaint"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 border-dashed">
                                    <p>No complaints found matching your criteria.</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-700 text-xs uppercase text-gray-500 font-semibold bg-gray-50 dark:bg-slate-900/50">
                                        <th className="p-4">Complaint ID</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Order ID</th>
                                        <th className="p-4">Subject</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredComplaints.length > 0 ? (
                                        filteredComplaints.map((complaint) => (
                                            <tr key={complaint._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="p-4 font-mono text-sm text-slate-800 dark:text-slate-200">
                                                    #{complaint._id.slice(-6)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{complaint.user?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500">{complaint.user?.email}</div>
                                                </td>
                                                <td className="p-4 font-mono text-sm text-indigo-600 dark:text-indigo-400">
                                                    {complaint.order?._id}
                                                </td>
                                                <td className="p-4 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                                    {complaint.subject}
                                                </td>
                                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(complaint.status)}`}>
                                                        {complaint.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            to={`/admin/complaints/${complaint._id}`}
                                                            className="inline-flex p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>

                                                        {user?.role === 'super_admin' && complaint.status === 'Closed' && (
                                                            <button
                                                                onClick={() => handleDelete(complaint._id)}
                                                                className="inline-flex p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                                title="Delete Complaint"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                                No complaints found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ComplaintListScreen;
