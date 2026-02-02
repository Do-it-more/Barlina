import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, X, Info, AlertTriangle, Package, MessageSquare, ShoppingBag, DollarSign, UserPlus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Initialize Socket Connection for Real-Time Notifications
    useEffect(() => {
        if (!user?._id) return;

        const defaultUrl = import.meta.env.DEV ? 'http://localhost:5001' : 'https://barlina-be-db.onrender.com';
        const apiUrl = import.meta.env.VITE_API_URL || defaultUrl;
        const socketUrl = apiUrl.replace(/\/api\/?$/, '');

        const newSocket = io(socketUrl, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Notification] Socket connected');
            // Join personal room for notifications
            newSocket.emit('setup_admin_socket', { id: user._id, name: user.name });
        });

        // Listen for real-time notifications
        newSocket.on('new_notification', (notification) => {
            console.log('[Notification] Received real-time notification:', notification);
            setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep max 20
            setUnreadCount(prev => prev + 1);

            // Play notification sound (optional)
            try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => { }); // Ignore if audio fails
            } catch (e) { }
        });

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [user?._id]);

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Fallback polling every 30 seconds (in case socket disconnects)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMarkAsRead = async (id, link, e) => {
        e?.stopPropagation();
        try {
            await api.put(`/notifications/${id}/read`);
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            if (link) {
                navigate(link);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const handleDeleteNotification = async (id, e) => {
        e?.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            const deletedNotification = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (!deletedNotification?.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
            case 'PAYMENT': return <DollarSign className="w-4 h-4 text-green-500" />;
            case 'ALERT': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'CHAT': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
            case 'SELLER': return <UserPlus className="w-4 h-4 text-orange-500" />;
            case 'SYSTEM': return <Info className="w-4 h-4 text-slate-500" />;
            default: return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'ORDER': return 'bg-blue-100 dark:bg-blue-900/30';
            case 'PAYMENT': return 'bg-green-100 dark:bg-green-900/30';
            case 'ALERT': return 'bg-red-100 dark:bg-red-900/30';
            case 'CHAT': return 'bg-indigo-100 dark:bg-indigo-900/30';
            case 'SELLER': return 'bg-orange-100 dark:bg-orange-900/30';
            case 'SYSTEM': return 'bg-slate-100 dark:bg-slate-700';
            default: return 'bg-gray-100 dark:bg-slate-700';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-orange-500 rounded-full border-2 border-white dark:border-slate-800">
                        <span className="text-[10px] font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-[100]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-semibold">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                            {isLoading && notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                        <Bell className="w-8 h-8 text-gray-300 dark:text-slate-500" />
                                    </div>
                                    <p className="font-medium">No notifications yet</p>
                                    <p className="text-xs mt-1">We'll notify you when something arrives</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleMarkAsRead(notification._id, notification.link)}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all duration-200 group relative ${!notification.isRead
                                                ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-indigo-500'
                                                : 'border-l-4 border-transparent'
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${getIconBg(notification.type)} transition-transform group-hover:scale-105`}>
                                                    {getIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`text-sm font-semibold truncate pr-2 ${!notification.isRead
                                                            ? 'text-slate-900 dark:text-white'
                                                            : 'text-gray-600 dark:text-gray-300'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </span>
                                                        {notification.link && (
                                                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                                                                View →
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => handleMarkAsRead(notification._id, null, e)}
                                                            className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                                                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
