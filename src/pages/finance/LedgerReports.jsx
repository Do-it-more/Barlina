import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import {
    FileText,
    Download,
    Filter,
    Search,
    Calendar,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    FileSpreadsheet,
    Printer,
    Trash2,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    Eye,
    X,
    CheckSquare,
    Square,
    Receipt,
    BookOpen
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const LedgerReports = () => {
    const { showToast } = useToast();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [viewRecord, setViewRecord] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const [filters, setFilters] = useState({
        type: '',
        startDate: '',
        endDate: '',
        search: '',
        minAmount: '',
        maxAmount: '',
        sortBy: 'date',
        sortOrder: 'desc'
    });

    const [runningBalance, setRunningBalance] = useState([]);

    useEffect(() => {
        fetchData();
    }, [filters.type, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.type) query.append('type', filters.type);
            if (filters.startDate) query.append('startDate', filters.startDate);
            if (filters.endDate) query.append('endDate', filters.endDate);

            const recordsRes = await api.get(`/finance?${query.toString()}`);
            let sortedRecords = recordsRes.data;

            // Client-side sorting
            sortedRecords.sort((a, b) => {
                if (filters.sortBy === 'date') {
                    return filters.sortOrder === 'desc'
                        ? new Date(b.date) - new Date(a.date)
                        : new Date(a.date) - new Date(b.date);
                }
                if (filters.sortBy === 'amount') {
                    return filters.sortOrder === 'desc'
                        ? b.amount - a.amount
                        : a.amount - b.amount;
                }
                return 0;
            });

            setRecords(sortedRecords);

            // Calculate running balance
            let balance = 0;
            const balances = sortedRecords.map(record => {
                if (record.type === 'INCOME') {
                    balance += record.amount;
                } else {
                    balance -= record.amount;
                }
                return balance;
            });
            setRunningBalance(balances);
        } catch (error) {
            console.error("Failed to fetch ledger data", error);
            showToast("Failed to load ledger data", 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filtered and paginated records
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matches =
                    record.category?.toLowerCase().includes(searchLower) ||
                    record.description?.toLowerCase().includes(searchLower) ||
                    record.type?.toLowerCase().includes(searchLower);
                if (!matches) return false;
            }

            // Amount range filter
            if (filters.minAmount && record.amount < parseFloat(filters.minAmount)) return false;
            if (filters.maxAmount && record.amount > parseFloat(filters.maxAmount)) return false;

            return true;
        });
    }, [records, filters.search, filters.minAmount, filters.maxAmount]);

    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    // Export functions
    const handleExportCSV = () => {
        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance', 'Created By'];
        const csvContent = [
            headers.join(','),
            ...filteredRecords.map((record, index) => [
                new Date(record.date).toLocaleDateString(),
                record.type,
                `"${record.category}"`,
                `"${record.description}"`,
                record.type === 'INCOME' ? `+${record.amount}` : `-${record.amount}`,
                runningBalance[index],
                record.createdBy?.name || 'System'
            ].join(','))
        ].join('\n');

        downloadFile(csvContent, 'text/csv', `ledger_report_${new Date().toISOString().split('T')[0]}.csv`);
        showToast("CSV exported successfully", 'success');
    };

    const handleExportPDF = () => {
        // Generate printable HTML for PDF
        const printWindow = window.open('', '_blank');
        const tableRows = filteredRecords.map((record, index) => `
            <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.type}</td>
                <td>${record.category}</td>
                <td>${record.description}</td>
                <td style="text-align: right; color: ${record.type === 'INCOME' ? 'green' : 'red'}">
                    ${record.type === 'INCOME' ? '+' : '-'}₹${record.amount.toLocaleString()}
                </td>
                <td style="text-align: right">₹${runningBalance[index]?.toLocaleString()}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Financial Ledger Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1e293b; margin-bottom: 5px; }
                    .subtitle { color: #64748b; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                    th { background: #f8fafc; font-weight: 600; color: #475569; }
                    tr:hover { background: #f8fafc; }
                    @media print { body { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <h1>Financial Ledger Report</h1>
                <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th style="text-align: right">Amount</th>
                            <th style="text-align: right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const downloadFile = (content, type, filename) => {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const toggleSelectAll = () => {
        if (selectedRecords.length === paginatedRecords.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(paginatedRecords.map(r => r._id));
        }
    };

    const toggleSelectRecord = (id) => {
        setSelectedRecords(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedRecords.length} records?`)) return;

        try {
            await Promise.all(selectedRecords.map(id => api.delete(`/finance/${id}`)));
            showToast(`${selectedRecords.length} records deleted`, 'success');
            setSelectedRecords([]);
            fetchData();
        } catch (error) {
            showToast("Failed to delete some records", 'error');
        }
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'INCOME': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: ArrowUpRight };
            case 'EXPENSE': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: ArrowDownRight };
            case 'SALARY': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: ArrowDownRight };
            case 'REFUND': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: ArrowDownRight };
            case 'ADJUSTMENT': return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: ArrowUpRight };
            default: return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: Receipt };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-emerald-500" />
                        Ledger & Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage transactions and generate financial statements
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-300"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
                    >
                        <Printer className="h-4 w-4" />
                        Print PDF
                    </button>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by category, description, or type..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters
                                ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </button>

                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="amount">Sort by Amount</option>
                    </select>

                    <button
                        onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
                        className="p-2.5 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        {filters.sortOrder === 'desc' ? (
                            <TrendingDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        ) : (
                            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        )}
                    </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="">All Types</option>
                                <option value="EXPENSE">Expenses</option>
                                <option value="SALARY">Salaries</option>
                                <option value="ADJUSTMENT">Adjustments</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Min Amount</label>
                                <input
                                    type="number"
                                    placeholder="₹0"
                                    value={filters.minAmount}
                                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Max Amount</label>
                                <input
                                    type="number"
                                    placeholder="₹∞"
                                    value={filters.maxAmount}
                                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions Bar */}
            {selectedRecords.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 flex items-center justify-between border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {selectedRecords.length} record(s) selected
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedRecords([])}
                            className="px-4 py-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-sm font-medium"
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-500" />
                        Transaction Ledger
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({filteredRecords.length} records)
                        </span>
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="py-16 text-center">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-4 text-left w-10">
                                        <button onClick={toggleSelectAll}>
                                            {selectedRecords.length === paginatedRecords.length ? (
                                                <CheckSquare className="h-5 w-5 text-indigo-600" />
                                            ) : (
                                                <Square className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {paginatedRecords.map((record, index) => {
                                    const styles = getTypeStyles(record.type);
                                    const globalIndex = (currentPage - 1) * recordsPerPage + index;
                                    return (
                                        <tr
                                            key={record._id}
                                            className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${selectedRecords.includes(record._id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                                }`}
                                        >
                                            <td className="px-4 py-4">
                                                <button onClick={() => toggleSelectRecord(record._id)}>
                                                    {selectedRecords.includes(record._id) ? (
                                                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {new Date(record.date).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${styles.bg} ${styles.text}`}>
                                                    <styles.icon className="h-3 w-3" />
                                                    {record.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-slate-800 dark:text-white">
                                                {record.category}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {record.description}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`text-sm font-bold ${record.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {record.type === 'INCOME' ? '+' : '-'}₹{record.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`text-sm font-medium ${runningBalance[globalIndex] >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    ₹{runningBalance[globalIndex]?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => setViewRecord(record)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filteredRecords.length)} of {filteredRecords.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page = i + 1;
                                if (totalPages > 5) {
                                    if (currentPage > 3) {
                                        page = currentPage - 2 + i;
                                    }
                                    if (currentPage > totalPages - 2) {
                                        page = totalPages - 4 + i;
                                    }
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                ? 'bg-emerald-600 text-white'
                                                : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Record Modal */}
            {viewRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transaction Details</h3>
                            <button
                                onClick={() => setViewRecord(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Date</label>
                                    <p className="text-slate-800 dark:text-white font-medium mt-1">
                                        {new Date(viewRecord.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Type</label>
                                    <p className="mt-1">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getTypeStyles(viewRecord.type).bg} ${getTypeStyles(viewRecord.type).text}`}>
                                            {viewRecord.type}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Category</label>
                                    <p className="text-slate-800 dark:text-white font-medium mt-1">{viewRecord.category}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Amount</label>
                                    <p className={`font-bold mt-1 text-lg ${viewRecord.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {viewRecord.type === 'INCOME' ? '+' : '-'}₹{viewRecord.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider">Description</label>
                                <p className="text-slate-800 dark:text-white mt-1">{viewRecord.description}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider">Created By</label>
                                <p className="text-slate-800 dark:text-white mt-1">{viewRecord.createdBy?.name || 'System'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LedgerReports;
