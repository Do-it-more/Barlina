import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { Package, Truck, CheckCircle, Clock, ChevronRight, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/orders/myorders');
                const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sortedData);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusIcon = (isPaid, isDelivered, isCancelled) => {
        if (isCancelled) return <XCircle className="h-5 w-5 text-red-500" />;
        if (isDelivered) return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (isPaid) return <Truck className="h-5 w-5 text-indigo-500" />;
        return <Clock className="h-5 w-5 text-yellow-500" />;
    };

    const getStatusText = (isPaid, isDelivered, isCancelled) => {
        if (isCancelled) return "Cancelled";
        if (isDelivered) return "Delivered";
        if (isPaid) return "Processing / Shipped";
        return "Pending Payment";
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                        <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Orders</h1>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-500">
                            <Package className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No orders yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Start shopping to track your orders here.</p>
                        <Link to="/products" className="inline-block px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-full font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center border-b border-gray-50 dark:border-slate-700 pb-4 mb-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-sm text-gray-400 font-medium">{order.invoiceNumber ? 'Invoice' : 'Order ID'}</p>
                                        <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 truncate">#{order.invoiceNumber || order._id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 font-medium">Date</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{order.createdAt.substring(0, 10)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 font-medium">Payment</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">{order.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 font-medium">Total</p>
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">₹{order.totalPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex md:justify-end">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit ${order.isCancelled ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-slate-700'}`}>
                                            {getStatusIcon(order.isPaid, order.isDelivered, order.isCancelled)}
                                            <span className={`text-sm font-semibold ${order.isCancelled ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {getStatusText(order.isPaid, order.isDelivered, order.isCancelled)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-3">
                                        {order.orderItems.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-slate-600" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.qty} x ₹{item.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-end justify-end">
                                        <Link to={`/order/${order._id}`} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:gap-3 transition-all">
                                            Track Order <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default OrderList;
