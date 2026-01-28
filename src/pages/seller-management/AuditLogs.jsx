import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    Shield,
    Search,
    Filter,
    Download,
    Clock,
    User,
    Store,
    Package,
    FileText,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Ban,
    RefreshCw,
    Eye,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Activity,
    Lock,
    Unlock,
    DollarSign,
    Settings,
    ArrowUpRight,
    Sparkles
} from 'lucide-react';

const AuditLogs = () => {
    const { showToast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        action: '',
        targetModel: '',
        dateFrom: '',
        dateTo: '',
        role: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
        limit: 20
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.search && { search: filters.search }),
                ...(filters.action && { action: filters.action }),
                ...(filters.targetModel && { targetModel: filters.targetModel }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo }),
                ...(filters.role && { role: filters.role })
            });

            const { data } = await api.get(`/admin/audit-logs?${params}`);
            setLogs(data.logs || []);
            setPagination(prev => ({
                ...prev,
                pages: data.pages || 1,
                total: data.total || 0
            }));
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            showToast('Failed to load audit logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        const iconMap = {
            'SELLER_APPROVED': CheckCircle,
            'SELLER_REJECTED': XCircle,
            'SELLER_SUSPENDED': Ban,
            'SELLER_BLOCKED': Lock,
            'SELLER_REACTIVATED': Unlock,
            'SELLER_REVIEWED': Eye,
            'SELLER_COMMISSION_UPDATED': DollarSign,
            'SELLER_PAYOUT_STATUS_UPDATED': DollarSign,
            'PRODUCT_APPROVED': CheckCircle,
            'PRODUCT_REJECTED': XCircle,
            'PRODUCT_BLOCKED': Ban,
            'PRODUCT_FLAGGED': AlertTriangle,
            'ORDER_STATUS_CHANGED': Package,
            'SETTINGS_UPDATED': Settings,
            'USER_ROLE_CHANGED': User
        };
        return iconMap[action] || Activity;
    };

    const getActionColor = (action) => {
        if (action.includes('APPROVED') || action.includes('REACTIVATED')) {
            return 'text-emerald-400 bg-emerald-500/20';
        }
        if (action.includes('REJECTED') || action.includes('BLOCKED') || action.includes('SUSPENDED')) {
            return 'text-red-400 bg-red-500/20';
        }
        if (action.includes('FLAGGED') || action.includes('WARNING')) {
            return 'text-amber-400 bg-amber-500/20';
        }
        if (action.includes('REVIEWED') || action.includes('UPDATED')) {
            return 'text-blue-400 bg-blue-500/20';
        }
        return 'text-gray-400 bg-gray-500/20';
    };

    const getTargetIcon = (model) => {
        const iconMap = {
            'SELLER': Store,
            'PRODUCT': Package,
            'ORDER': FileText,
            'USER': User,
            'SETTINGS': Settings
        };
        return iconMap[model] || Activity;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const actionOptions = [
        'SELLER_APPROVED',
        'SELLER_REJECTED',
        'SELLER_SUSPENDED',
        'SELLER_BLOCKED',
        'SELLER_REACTIVATED',
        'SELLER_REVIEWED',
        'SELLER_COMMISSION_UPDATED',
        'SELLER_PAYOUT_STATUS_UPDATED',
        'PRODUCT_APPROVED',
        'PRODUCT_REJECTED',
        'PRODUCT_BLOCKED',
        'PRODUCT_FLAGGED',
        'ORDER_STATUS_CHANGED'
    ];

    const exportLogs = async () => {
        try {
            showToast('Preparing export...', 'info');
            const params = new URLSearchParams({
                export: 'csv',
                ...(filters.action && { action: filters.action }),
                ...(filters.targetModel && { targetModel: filters.targetModel }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo })
            });

            const response = await api.get(`/admin/audit-logs/export?${params}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            showToast('Export completed', 'success');
        } catch (error) {
            showToast('Failed to export logs', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-6 border border-slate-600">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full filter blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-400" />
                                System Audit Logs
                            </h1>
                            <p className="text-gray-400">Track all administrative actions and changes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${showFilters
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                        <button
                            onClick={exportLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700 animate-in slide-in-from-top">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    placeholder="Search by user, action, or details..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Action Type</label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500"
                            >
                                <option value="">All Actions</option>
                                {actionOptions.map(action => (
                                    <option key={action} value={action}>
                                        {action.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Target Type</label>
                            <select
                                value={filters.targetModel}
                                onChange={(e) => setFilters(prev => ({ ...prev, targetModel: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500"
                            >
                                <option value="">All Types</option>
                                <option value="SELLER">Seller</option>
                                <option value="PRODUCT">Product</option>
                                <option value="ORDER">Order</option>
                                <option value="USER">User</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => {
                                setFilters({
                                    search: '',
                                    action: '',
                                    targetModel: '',
                                    dateFrom: '',
                                    dateTo: '',
                                    role: ''
                                });
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-xs text-gray-400">Total Logs</p>
                    <p className="text-2xl font-bold text-white mt-1">{pagination.total}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-xs text-gray-400">Approvals</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {logs.filter(l => l.action?.includes('APPROVED')).length}
                    </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-xs text-gray-400">Rejections</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                        {logs.filter(l => l.action?.includes('REJECTED')).length}
                    </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-xs text-gray-400">Other Actions</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                        {logs.filter(l => !l.action?.includes('APPROVED') && !l.action?.includes('REJECTED')).length}
                    </p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="h-8 w-8 text-violet-400 animate-spin mx-auto mb-3" />
                        <p className="text-gray-400">Loading audit logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No audit logs found</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Timestamp</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Action</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Performed By</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Target</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Details</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {logs.map((log) => {
                                        const ActionIcon = getActionIcon(log.action);
                                        const TargetIcon = getTargetIcon(log.targetModel);

                                        return (
                                            <tr
                                                key={log._id}
                                                className="hover:bg-slate-700/30 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-gray-300">
                                                            {formatDate(log.createdAt)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${getActionColor(log.action)}`}>
                                                            <ActionIcon className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-medium text-white">
                                                            {log.action?.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                                                            {log.performedBy?.name?.charAt(0) || 'A'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-white">{log.performedBy?.name || 'System'}</p>
                                                            <p className="text-xs text-gray-500 capitalize">{log.performedBy?.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <TargetIcon className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-300">
                                                            {log.targetModel}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-400 max-w-xs truncate">
                                                        {log.details || log.reason || log.metadata?.notes || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="p-2 rounded-lg hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-3 bg-slate-700/30 flex items-center justify-between">
                            <p className="text-sm text-gray-400">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="p-2 rounded-lg bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-500 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-gray-300">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                                    disabled={pagination.page === pagination.pages}
                                    className="p-2 rounded-lg bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-500 transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-violet-400" />
                                Audit Log Details
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">Action</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${getActionColor(selectedLog.action)}`}>
                                            {React.createElement(getActionIcon(selectedLog.action), { className: 'h-4 w-4' })}
                                        </div>
                                        <span className="text-white font-medium">
                                            {selectedLog.action?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">Timestamp</p>
                                    <p className="text-white">{formatDate(selectedLog.createdAt)}</p>
                                </div>
                            </div>

                            <div className="bg-slate-700/50 rounded-xl p-4">
                                <p className="text-xs text-gray-400 mb-2">Performed By</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                                        {selectedLog.performedBy?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{selectedLog.performedBy?.name}</p>
                                        <p className="text-sm text-gray-400 capitalize">{selectedLog.performedBy?.role}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">Target Type</p>
                                    <p className="text-white">{selectedLog.targetModel}</p>
                                </div>
                                <div className="bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">Target ID</p>
                                    <p className="text-white font-mono text-sm">{selectedLog.targetId}</p>
                                </div>
                            </div>

                            {(selectedLog.details || selectedLog.reason) && (
                                <div className="bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">Details / Reason</p>
                                    <p className="text-white">{selectedLog.details || selectedLog.reason}</p>
                                </div>
                            )}

                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div className="bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 mb-2">Additional Data</p>
                                    <pre className="text-sm text-gray-300 bg-slate-900 p-3 rounded-lg overflow-x-auto">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-700">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
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

export default AuditLogs;
