import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Activity,
    Search,
    Calendar,
    User,
    FileText,
    ArrowRight,
    Filter,
    Trash2,
    RotateCcw,
    Shield,
    Briefcase,
    List
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const AdminActivityLogScreen = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'auth', 'work'
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/management/activity-logs?pageNumber=${page}&keyword=${keyword}&type=${activeTab}`);
            setLogs(data.logs);
            setPages(data.pages);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            showToast("Failed to fetch activity logs", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, keyword, activeTab]);

    const handleSearch = (e) => {
        e.preventDefault();
        setKeyword(searchTerm);
        setPage(1);
    };

    const handleClearAll = async () => {
        const isConfirmed = await confirm("Clear All Logs", "Are you sure you want to permanently delete ALL activity logs? This action cannot be undone.");
        if (!isConfirmed) return;

        try {
            await api.delete('/admin/management/activity-logs');
            showToast("Activity logs cleared successfully", "success");
            fetchLogs(); // Refresh
        } catch (error) {
            console.error(error);
            showToast("Failed to clear logs", "error");
        }
    };

    const handleDeleteLog = async (id) => {
        const isConfirmed = await confirm("Delete Log", "Are you sure you want to delete this log entry?");
        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/management/activity-logs/${id}`);
            showToast("Log entry deleted", "success");
            // Optimistic update
            setLogs(logs.filter(log => log._id !== id));
        } catch (error) {
            console.error(error);
            showToast("Failed to delete log", "error");
        }
    };

    const getActionColor = (action) => {
        if (action.includes('CREATE')) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
        if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
        if (action.includes('APPROVE')) return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400';
        if (action.includes('REJECT')) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="h-6 w-6 text-indigo-500" />
                        Admin Activity Logs
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Track and monitor actions performed by administrators.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search by admin name..."
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </form>

                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors border border-red-200 dark:border-red-800"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden md:inline">Clear Logs</span>
                    </button>

                    <button
                        onClick={fetchLogs}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => { setActiveTab('all'); setPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    <List className="h-4 w-4" />
                    All Logs
                </button>
                <button
                    onClick={() => { setActiveTab('auth'); setPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'auth' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    <Shield className="h-4 w-4" />
                    Login/Logout
                </button>
                <button
                    onClick={() => { setActiveTab('work'); setPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'work' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    <Briefcase className="h-4 w-4" />
                    Work Activity
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No activity logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-5.5">
                                                    {format(new Date(log.createdAt), 'hh:mm a')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs uppercase">
                                                    {log.performedBy?.name?.substring(0, 2) || 'AD'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                                                        {log.performedBy?.name || 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                                        {log.performedBy?.role?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${getActionColor(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
                                                {log.note || log.details || 'No details provided'}
                                                {log.reason && (
                                                    <span className="block text-xs text-gray-500 mt-1 italic">
                                                        Reason: {log.reason}
                                                    </span>
                                                )}
                                                {log.statusFrom && log.statusTo && (
                                                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-900/50 px-2 py-1 rounded w-fit">
                                                        {log.statusFrom} <ArrowRight className="h-3 w-3" /> {log.statusTo}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteLog(log._id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Log"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-center gap-2">
                        {[...Array(pages).keys()].map((x) => (
                            <button
                                key={x + 1}
                                onClick={() => setPage(x + 1)}
                                className={`
                                    w-8 h-8 rounded-lg text-sm font-medium transition-colors
                                    ${x + 1 === page
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                {x + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActivityLogScreen;
