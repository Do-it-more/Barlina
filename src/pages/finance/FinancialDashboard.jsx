import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Plus,
    Trash2,
    Calendar
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const FinancialDashboard = () => {
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        income: 0,
        refunds: 0,
        expenses: 0,
        salaries: 0,
        netProfit: 0
    });
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    // Form State
    const [newItem, setNewItem] = useState({
        type: 'EXPENSE',
        category: '',
        amount: '',
        description: '',
        paymentMethod: 'BANK_TRANSFER',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(dateRange).toString();

            const statsRes = await api.get(`/finance/stats?${query}`);
            setStats(statsRes.data);

            const recordsRes = await api.get(`/finance?${query}`);
            setRecords(recordsRes.data);
        } catch (error) {
            console.error("Failed to fetch finance data", error);
            // toast.error("Failed to load financial data"); 
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance', newItem);
            showToast("Record added successfully", 'success');
            setShowAddModal(false);
            setNewItem({
                type: 'EXPENSE',
                category: '',
                amount: '',
                description: '',
                paymentMethod: 'BANK_TRANSFER',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to add record", 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await api.delete(`/finance/${id}`);
            showToast("Record deleted", 'success');
            fetchData();
        } catch (error) {
            showToast("Failed to delete record", 'error');
        }
    };

    const StatCard = ({ title, amount, icon: Icon, color, trend }) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">₹{amount?.toLocaleString()}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Department</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track Income, Expenses, Salaries, and Refunds</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="date"
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                    <input
                        type="date"
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                    >
                        <Plus className="h-4 w-4" /> Add Record
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Total Income" amount={stats.income} icon={DollarSign} color="text-green-600 bg-green-600" />
                <StatCard title="Total Refunds" amount={stats.refunds} icon={TrendingDown} color="text-orange-600 bg-orange-600" />
                <StatCard title="Total Expenses" amount={stats.expenses} icon={CreditCard} color="text-red-500 bg-red-500" />
                <StatCard title="Total Salaries" amount={stats.salaries} icon={TrendingUp} color="text-blue-600 bg-blue-600" />
                <StatCard title="Net Profit" amount={stats.netProfit} icon={DollarSign} color={stats.netProfit >= 0 ? "text-indigo-600 bg-indigo-600" : "text-red-600 bg-red-600"} />
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions (Expenses & Salaries)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {records.length > 0 ? (
                                records.map((record) => (
                                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.type === 'INCOME' ? 'bg-green-100 text-green-700' :
                                                record.type === 'EXPENSE' ? 'bg-red-100 text-red-700' :
                                                    record.type === 'SALARY' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-white font-medium">
                                            {record.category}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {record.description}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 dark:text-white">
                                            ₹{record.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(record._id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No manual records found. Income and Refunds are calculated automatically.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Record Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add Financial Record</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.type}
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="EXPENSE">Expense</option>
                                    <option value="SALARY">Salary</option>
                                    <option value="ADJUSTMENT">Adjustment</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Office Rent, Marketing, John Doe Salary"
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.amount}
                                    onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    required
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newItem.date}
                                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors mt-4"
                            >
                                Add Record
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialDashboard;
