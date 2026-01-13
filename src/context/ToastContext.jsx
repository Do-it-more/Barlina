import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success') => {
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

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-auto z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="pointer-events-auto w-full md:w-80 bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 backdrop-blur-md"
                        >
                            <div className="flex items-center p-4 gap-3">
                                <div className={`shrink-0 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                    {toast.type === 'success' ? (
                                        <CheckCircle className="h-6 w-6" />
                                    ) : (
                                        <XCircle className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-semibold text-sm ${toast.type === 'success' ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                                        {toast.type === 'success' ? 'Success' : 'Error'}
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
                            <div className={`h-1 w-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
