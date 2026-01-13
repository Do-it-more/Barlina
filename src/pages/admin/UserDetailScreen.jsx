import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    User, Mail, Phone, MapPin, Package, AlertCircle, MessageSquare,
    ArrowLeft, Calendar, DollarSign, ExternalLink, RotateCcw
} from 'lucide-react';

const UserDetailScreen = () => {
    const { id } = useParams();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const { data } = await api.get(`/users/${id}/full-details`);
                setData(data);
                console.log(data);
            } catch (error) {
                console.error(error);
                showToast(error.response?.data?.message || 'Failed to fetch user details', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [id, showToast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <p className="text-gray-500 text-lg">User not found</p>
                <Link to="/admin/users" className="mt-4 text-indigo-600 hover:underline">
                    Back to Users
                </Link>
            </div>
        );
    }

    const { user, orders, complaints, returns, inquiries } = data;

    // Helper to get latest address from orders if not in user profile (user profile might not store address permanently depending on schema)
    // The User model usually doesn't store full address array based on standard MERN implementations unless specifically added.
    // We can try to grab the address from the most recent order.
    const latestOrder = orders.length > 0 ? orders[0] : null;
    // Prefer user profile address if available, otherwise use latest order shipping address
    const displayAddress = (user.address && user.address.street)
        ? user.address
        : latestOrder?.shippingAddress;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/admin/users" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Customer Profile</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View complete history and details</p>
                </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-start gap-3">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer Name</p>
                            <p className="font-medium text-slate-900 dark:text-white mt-1">{user.name}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300'
                                }`}>
                                {user.role.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email Address</p>
                            <p className="font-medium text-slate-900 dark:text-white mt-1 break-all">{user.email}</p>
                            {user.isEmailVerified && <span className="text-xs text-green-600 flex items-center gap-1">Verified</span>}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <Phone className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phone Number</p>
                            <p className="font-medium text-slate-900 dark:text-white mt-1">
                                {user.phoneNumber || (displayAddress?.phoneNumber) || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Address Details</p>
                            <div className="font-medium text-slate-900 dark:text-white mt-1 text-sm">
                                {displayAddress ? (
                                    <>
                                        <p>{displayAddress.street || displayAddress.address}</p>
                                        <p>{displayAddress.city}, {displayAddress.postalCode}</p>
                                        <p>{displayAddress.country}</p>
                                    </>
                                ) : (
                                    <p className="text-gray-400 italic">No address history found</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {[
                        { id: 'orders', name: 'Order History', icon: Package, count: orders.length },
                        { id: 'returns', name: 'Returns', icon: RotateCcw, count: returns.length },
                        { id: 'complaints', name: 'Complaints', icon: AlertCircle, count: complaints.length },
                        { id: 'inquiries', name: 'Inquiries', icon: MessageSquare, count: inquiries.length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
                            `}
                        >
                            <tab.icon className={`
                                -ml-0.5 mr-2 h-5 w-5
                                ${activeTab === tab.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500'}
                            `} />
                            {tab.name}
                            <span className={`
                                ml-2.5 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block
                                ${activeTab === tab.id
                                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                    : 'bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-gray-300'}
                            `}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[400px]">
                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="overflow-x-auto">
                        {orders.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No orders found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                #{order._id.substring(order._id.length - 6).toUpperCase()}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                                                ₹{order.totalPrice}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                <span className={`px-2 py-1 text-xs rounded-full ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {order.isPaid ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Link to={`/admin/orders/${order._id}`} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end gap-1">
                                                    View <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* RETURNS TAB */}
                {activeTab === 'returns' && (
                    <div className="overflow-x-auto">
                        {returns.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No return requests found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Return ID</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {returns.map((req) => (
                                        <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                #{req._id.substring(req._id.length - 6).toUpperCase()}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                <Link to={`/admin/orders/${req.order}`} className="hover:underline">
                                                    #{req.order.substring(req.order.length - 6).toUpperCase()}
                                                </Link>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                {req.reason}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* COMPLAINTS TAB */}
                {activeTab === 'complaints' && (
                    <div className="overflow-x-auto">
                        {complaints.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No complaints found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="p-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {complaints.map((comp) => (
                                        <tr key={comp._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                {comp.subject}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                <Link to={`/admin/orders/${comp.order}`} className="hover:underline">
                                                    #{comp.order.substring(comp.order.length - 6).toUpperCase()}
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${comp.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                    comp.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {comp.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                {new Date(comp.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Link to={`/admin/complaints/${comp._id}`} className="text-indigo-600 hover:text-indigo-900 text-sm">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* INQUIRIES TAB */}
                {activeTab === 'inquiries' && (
                    <div className="overflow-x-auto">
                        {inquiries.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No inquiries found for {user.email}.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {inquiries.map((inq) => (
                                        <tr key={inq._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                {inq.subject}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={inq.message}>
                                                {inq.message}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${inq.status === 'Replied' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {inq.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                {new Date(inq.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetailScreen;
