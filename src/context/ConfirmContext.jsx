import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
    });

    const confirm = (title, message) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                message,
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {confirmState.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={confirmState.onCancel}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                        <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {confirmState.title}
                                        </h3>
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
                                    {confirmState.message}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={confirmState.onCancel}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmState.onConfirm}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={confirmState.onCancel}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
};
