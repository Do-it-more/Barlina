import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import {
    PieChart as PieChartIcon,
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Target,
    Percent,
    LineChart,
    CalendarDays,
    Layers,
    Gauge,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const FinanceAnalytics = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [currentPeriod, setCurrentPeriod] = useState({
        income: 0,
        refunds: 0,
        expenses: 0,
        salaries: 0,
        netProfit: 0
    });
    const [previousPeriod, setPreviousPeriod] = useState({
        income: 0,
        refunds: 0,
        expenses: 0,
        salaries: 0,
        netProfit: 0
    });
    const [records, setRecords] = useState([]);
    const [timeRange, setTimeRange] = useState('month');
    const [monthlyTrend, setMonthlyTrend] = useState([]);

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const getDateRanges = () => {
        const endDate = new Date();
        const startDate = new Date();
        const prevEndDate = new Date();
        const prevStartDate = new Date();

        switch (timeRange) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                prevEndDate.setDate(startDate.getDate() - 1);
                prevStartDate.setDate(prevEndDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                prevEndDate.setDate(startDate.getDate() - 1);
                prevStartDate.setMonth(prevEndDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(endDate.getMonth() - 3);
                prevEndDate.setDate(startDate.getDate() - 1);
                prevStartDate.setMonth(prevEndDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                prevEndDate.setDate(startDate.getDate() - 1);
                prevStartDate.setFullYear(prevEndDate.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(endDate.getMonth() - 1);
        }

        return {
            current: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] },
            previous: { startDate: prevStartDate.toISOString().split('T')[0], endDate: prevEndDate.toISOString().split('T')[0] }
        };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { current, previous } = getDateRanges();

            const [currentRes, previousRes, recordsRes] = await Promise.all([
                api.get(`/finance/stats?startDate=${current.startDate}&endDate=${current.endDate}`),
                api.get(`/finance/stats?startDate=${previous.startDate}&endDate=${previous.endDate}`),
                api.get(`/finance?startDate=${current.startDate}&endDate=${current.endDate}`)
            ]);

            setCurrentPeriod(currentRes.data);
            setPreviousPeriod(previousRes.data);
            setRecords(recordsRes.data);

            // Calculate monthly trend (last 6 months)
            await calculateMonthlyTrend();
        } catch (error) {
            console.error("Failed to fetch analytics data", error);
            showToast("Failed to load analytics", 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthlyTrend = async () => {
        const trends = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

            try {
                const res = await api.get(`/finance/stats?startDate=${monthStart.toISOString().split('T')[0]}&endDate=${monthEnd.toISOString().split('T')[0]}`);
                trends.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    income: res.data.income || 0,
                    expenses: (res.data.expenses || 0) + (res.data.salaries || 0) + (res.data.refunds || 0),
                    profit: res.data.netProfit || 0
                });
            } catch (error) {
                trends.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                    income: 0,
                    expenses: 0,
                    profit: 0
                });
            }
        }

        setMonthlyTrend(trends);
    };

    // Calculate comparison percentages
    const getGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    // Category breakdown for pie chart
    const categoryBreakdown = useMemo(() => {
        const breakdown = records.reduce((acc, record) => {
            const existing = acc.find(item => item.category === record.category);
            if (existing) {
                existing.amount += record.amount;
            } else {
                acc.push({ category: record.category, amount: record.amount, type: record.type });
            }
            return acc;
        }, []);
        return breakdown.sort((a, b) => b.amount - a.amount).slice(0, 6);
    }, [records]);

    // Expense vs Income ratio
    const totalExpenses = currentPeriod.expenses + currentPeriod.salaries + currentPeriod.refunds;
    const expenseRatio = currentPeriod.income > 0 ? (totalExpenses / currentPeriod.income * 100).toFixed(1) : 0;
    const profitMargin = currentPeriod.income > 0 ? (currentPeriod.netProfit / currentPeriod.income * 100).toFixed(1) : 0;

    // Comparison Card Component
    const ComparisonCard = ({ title, current, previous, icon: Icon, color, format = 'currency' }) => {
        const growth = getGrowth(current, previous);
        const isPositive = parseFloat(growth) > 0;
        const isNeutral = parseFloat(growth) === 0;

        // Map color to proper icon and background styling
        const getColorClasses = (colorClass) => {
            const colorMap = {
                'bg-emerald-500': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
                'bg-red-500': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
                'bg-blue-500': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
                'bg-violet-500': { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
            };
            return colorMap[colorClass] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600' };
        };

        const colorClasses = getColorClasses(color);

        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colorClasses.bg} group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-6 w-6 ${colorClasses.text}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${isNeutral ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' :
                        isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                            'bg-red-100 dark:bg-red-900/30 text-red-600'
                        }`}>
                        {isNeutral ? <Minus className="h-3 w-3" /> : isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(growth)}%
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                    {format === 'currency' ? `₹${current.toLocaleString()}` : `${current}%`}
                </p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    vs ₹{previous.toLocaleString()} previous
                </p>
            </div>
        );
    };

    // Gauge Component
    const GaugeChart = ({ value, max = 100, label, color }) => {
        const percentage = Math.min((value / max) * 100, 100);
        const rotation = (percentage / 100) * 180 - 90;

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-32 h-16 overflow-hidden">
                    <div className="absolute w-32 h-32 rounded-full border-[12px] border-gray-200 dark:border-slate-700" />
                    <div
                        className={`absolute w-32 h-32 rounded-full border-[12px] border-transparent ${color}`}
                        style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center center'
                        }}
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}%</p>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">{label}</p>
            </div>
        );
    };

    // Bar Chart Component
    const TrendChart = ({ data }) => {
        const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses)));

        return (
            <div className="flex items-end justify-between gap-4 h-48">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="flex gap-1 h-40 items-end w-full justify-center">
                            <div
                                className="w-6 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all duration-500"
                                style={{ height: `${maxValue > 0 ? (item.income / maxValue) * 100 : 0}%` }}
                                title={`Income: ₹${item.income.toLocaleString()}`}
                            />
                            <div
                                className="w-6 bg-gradient-to-t from-red-500 to-red-400 rounded-t-md transition-all duration-500"
                                style={{ height: `${maxValue > 0 ? (item.expenses / maxValue) * 100 : 0}%` }}
                                title={`Expenses: ₹${item.expenses.toLocaleString()}`}
                            />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Donut Chart Component
    const DonutChart = ({ data }) => {
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        let cumulativePercentage = 0;

        const colors = [
            '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
        ];

        return (
            <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? (item.amount / total) * 100 : 0;
                        const dashArray = `${percentage} ${100 - percentage}`;
                        const dashOffset = -cumulativePercentage;
                        cumulativePercentage += percentage;

                        return (
                            <circle
                                key={item.category}
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke={colors[index % colors.length]}
                                strokeWidth="2.5"
                                strokeDasharray={dashArray}
                                strokeDashoffset={dashOffset}
                                className="transition-all duration-1000 ease-out"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">
                        {data.length}
                    </span>
                    <span className="text-xs text-gray-500">Categories</span>
                </div>
            </div>
        );
    };

    // Sparkline for trend
    const TrendSparkline = ({ data, color }) => {
        const max = Math.max(...data.map(d => d.profit));
        const min = Math.min(...data.map(d => d.profit));
        const range = max - min || 1;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.profit - min) / range) * 80 - 10;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`0,100 ${points} 100,100`}
                    fill={`url(#gradient-${color})`}
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-violet-500" />
                        Financial Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Insights, trends, and performance metrics
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl">
                    {['week', 'month', 'quarter', 'year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500" />
                </div>
            ) : (
                <>
                    {/* Comparison Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ComparisonCard
                            title="Total Revenue"
                            current={currentPeriod.income}
                            previous={previousPeriod.income}
                            icon={TrendingUp}
                            color="bg-emerald-500"
                        />
                        <ComparisonCard
                            title="Total Expenses"
                            current={currentPeriod.expenses}
                            previous={previousPeriod.expenses}
                            icon={TrendingDown}
                            color="bg-red-500"
                        />
                        <ComparisonCard
                            title="Salaries"
                            current={currentPeriod.salaries}
                            previous={previousPeriod.salaries}
                            icon={DollarSign}
                            color="bg-blue-500"
                        />
                        <ComparisonCard
                            title="Net Profit"
                            current={currentPeriod.netProfit}
                            previous={previousPeriod.netProfit}
                            icon={Target}
                            color="bg-violet-500"
                        />
                    </div>

                    {/* Performance Gauges */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-violet-500" />
                            Performance Indicators
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="relative inline-block">
                                    <svg className="w-40 h-40" viewBox="0 0 100 100">
                                        {/* Background circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            className="dark:stroke-slate-700"
                                        />
                                        {/* Progress circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke={parseFloat(profitMargin) >= 0 ? '#10b981' : '#ef4444'}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${Math.min(Math.abs(profitMargin), 100) * 2.51} 251`}
                                            transform="rotate(-90 50 50)"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-3xl font-bold ${parseFloat(profitMargin) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {profitMargin}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-3 font-medium">Profit Margin</p>
                            </div>

                            <div className="text-center">
                                <div className="relative inline-block">
                                    <svg className="w-40 h-40" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            className="dark:stroke-slate-700"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke={parseFloat(expenseRatio) <= 70 ? '#10b981' : parseFloat(expenseRatio) <= 90 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${Math.min(parseFloat(expenseRatio), 100) * 2.51} 251`}
                                            transform="rotate(-90 50 50)"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-3xl font-bold ${parseFloat(expenseRatio) <= 70 ? 'text-emerald-600' : parseFloat(expenseRatio) <= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {expenseRatio}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-3 font-medium">Expense Ratio</p>
                            </div>

                            <div className="text-center">
                                <div className="relative inline-block">
                                    <svg className="w-40 h-40" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            className="dark:stroke-slate-700"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="#8b5cf6"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${Math.min(100 - parseFloat(expenseRatio), 100) * 2.51} 251`}
                                            transform="rotate(-90 50 50)"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-violet-600">
                                            {(100 - parseFloat(expenseRatio)).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-3 font-medium">Savings Rate</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Trend Chart */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <LineChart className="h-5 w-5 text-violet-500" />
                                6-Month Trend
                            </h3>
                            {monthlyTrend.length > 0 ? (
                                <>
                                    <TrendChart data={monthlyTrend} />
                                    <div className="flex items-center justify-center gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            <span className="text-sm text-gray-500">Income</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <span className="text-sm text-gray-500">Expenses</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-gray-400">
                                    <p>No trend data available</p>
                                </div>
                            )}
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-violet-500" />
                                Category Breakdown
                            </h3>
                            {categoryBreakdown.length > 0 ? (
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <DonutChart data={categoryBreakdown} />
                                    <div className="flex-1 space-y-2">
                                        {categoryBreakdown.map((item, index) => {
                                            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500', 'bg-pink-500'];
                                            const total = categoryBreakdown.reduce((sum, i) => sum + i.amount, 0);
                                            const percentage = ((item.amount / total) * 100).toFixed(1);
                                            return (
                                                <div key={item.category} className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                                                        {percentage}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <Layers className="h-12 w-12 mb-3" />
                                    <p>No category data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profit Trend Line */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-violet-500" />
                            Profit Trend
                        </h3>
                        {monthlyTrend.length > 0 ? (
                            <div>
                                <TrendSparkline data={monthlyTrend} color="#8b5cf6" />
                                <div className="flex items-center justify-between mt-4">
                                    {monthlyTrend.map((item, index) => (
                                        <div key={index} className="text-center">
                                            <p className={`text-sm font-bold ${item.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                ₹{(item.profit / 1000).toFixed(1)}K
                                            </p>
                                            <p className="text-xs text-gray-400">{item.month}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-32 text-gray-400">
                                <p>No profit trend data available</p>
                            </div>
                        )}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white text-center group hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <p className="text-3xl font-bold">₹{(currentPeriod.income / 1000).toFixed(1)}K</p>
                            <p className="text-sm text-emerald-100 mt-1">Revenue</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white text-center group hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                            <p className="text-3xl font-bold">₹{(totalExpenses / 1000).toFixed(1)}K</p>
                            <p className="text-sm text-red-100 mt-1">Total Outflow</p>
                        </div>
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white text-center group hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Target className="h-6 w-6" />
                            </div>
                            <p className="text-3xl font-bold">₹{(currentPeriod.netProfit / 1000).toFixed(1)}K</p>
                            <p className="text-sm text-violet-100 mt-1">Net Profit</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white text-center group hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Layers className="h-6 w-6" />
                            </div>
                            <p className="text-3xl font-bold">{records.length}</p>
                            <p className="text-sm text-blue-100 mt-1">Transactions</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FinanceAnalytics;
