import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminChat } from '../../context/AdminChatContext';
import { MessageCircle, X, Users } from 'lucide-react';
import ChatSidebar from './chat/ChatSidebar';
import ChatWindow from './chat/ChatWindow';

const AdminChatWidget = () => {
    const {
        isChatOpen,
        setIsChatOpen,
        activeChat,
        setActiveChat,
        fetchChats
    } = useAdminChat();

    // Initial load and periodic refresh for online status
    useEffect(() => {
        if (isChatOpen) {
            fetchChats();

            // Poll every 10 seconds to keep online status fresh
            const interval = setInterval(() => {
                fetchChats();
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [isChatOpen, fetchChats]);

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsChatOpen(true)}
                className={`fixed bottom-24 md:bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${isChatOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
                    } bg-gradient-to-r from-indigo-600 to-blue-600 text-white`}
            >
                <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>
                <Users className="h-6 w-6 relative z-10" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-24 md:bottom-6 right-6 z-50 w-full max-w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                {activeChat && (
                                    <button
                                        onClick={() => setActiveChat(null)}
                                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg leading-tight">
                                        {activeChat ? activeChat.chatName : 'Team Chat'}
                                    </h3>
                                    <p className="text-indigo-100 text-xs flex items-center gap-1">
                                        {activeChat ? (
                                            activeChat.isOnline ? (
                                                <>
                                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                                    Online
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                                    Offline
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <MessageCircle className="w-3 h-3" />
                                                Private & Group Chats
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setIsChatOpen(false); setActiveChat(null); }}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden">
                            {activeChat ? (
                                <ChatWindow />
                            ) : (
                                <ChatSidebar />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminChatWidget;
