import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Info, AlertTriangle, Package, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

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

    const handleMarkAsRead = async (id, link) => {
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

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER': return <Package className="w-5 h-5 text-blue-500" />;
            case 'ALERT': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'CHAT': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
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
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-[100]"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
                            <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleMarkAsRead(notification._id, notification.link)}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex gap-3 ${!notification.isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''
                                                }`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-white dark:bg-slate-700 shadow-sm' : 'bg-gray-100 dark:bg-slate-800'
                                                }`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`text-sm font-semibold mb-1 ${!notification.isRead ? 'text-slate-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                                                        }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1.5">
                                                    {notification.message}
                                                </p>
                                                <span className="text-[10px] text-gray-400">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-gray-100 dark:border-slate-700 text-center">
                            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white w-full py-1">
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
