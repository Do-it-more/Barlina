import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success') => { // type: 'success' | 'error' | 'info' | 'warning'
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const getToastStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle className="h-6 w-6" />,
                    colorClass: 'text-green-500',
                    bgClass: 'bg-green-500',
                    title: 'Success',
                    titleColor: 'text-slate-900 dark:text-white'
                };
            case 'error':
                return {
                    icon: <XCircle className="h-6 w-6" />,
                    colorClass: 'text-red-500',
                    bgClass: 'bg-red-500',
                    title: 'Error',
                    titleColor: 'text-red-600 dark:text-red-400'
                };
            case 'info':
                return {
                    icon: <Info className="h-6 w-6" />,
                    colorClass: 'text-blue-500',
                    bgClass: 'bg-blue-500',
                    title: 'Info',
                    titleColor: 'text-slate-900 dark:text-white'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="h-6 w-6" />,
                    colorClass: 'text-amber-500',
                    bgClass: 'bg-amber-500',
                    title: 'Warning',
                    titleColor: 'text-amber-600 dark:text-amber-400'
                };
            default:
                return {
                    icon: <Info className="h-6 w-6" />,
                    colorClass: 'text-blue-500',
                    bgClass: 'bg-blue-500',
                    title: 'Notification',
                    titleColor: 'text-slate-900 dark:text-white'
                };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed z-[100] hidden md:flex flex-col gap-2 pointer-events-none 
                /* Desktop: Top-Right Toast */
                md:top-20 md:right-4 md:left-auto md:w-auto md:transform-none"
            >
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const styles = getToastStyles(toast.type);
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                className="pointer-events-auto w-full md:w-80 bg-white dark:bg-slate-800 shadow-2xl rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 ring-1 ring-black/5"
                            >
                                <div className="flex items-center p-4 gap-3">
                                    <div className={`shrink-0 ${styles.colorClass}`}>
                                        {styles.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-semibold text-sm ${styles.titleColor}`}>
                                            {styles.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {toast.message}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeToast(toast.id)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className={`h-1 w-full ${styles.bgClass}`}></div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
