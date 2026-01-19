import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminChat } from '../../context/AdminChatContext';
import { Users, MessageCircle, Sparkles } from 'lucide-react';
import ChatSidebar from '../../components/admin/chat/ChatSidebar';
import ChatWindow from '../../components/admin/chat/ChatWindow';

const TeamChatScreen = () => {
    const { activeChat, fetchChats, chats, clearUnreadNotification } = useAdminChat();

    // Clear unread notification when visiting this page
    useEffect(() => {
        clearUnreadNotification();
    }, [clearUnreadNotification]);

    // Initial load and periodic refresh for online status
    useEffect(() => {
        fetchChats();

        // Poll every 10 seconds to keep online status fresh
        const interval = setInterval(() => {
            fetchChats();
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchChats]);

    // Count online users
    const onlineCount = chats.filter(c => c.type === 'private' && c.isOnline).length;

    return (
        <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] pb-2">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl md:rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden"
            >
                {/* Header - More compact on mobile */}
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 px-4 py-3 md:p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hidden md:flex">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-base md:text-lg leading-tight flex items-center gap-2">
                                Team Chat
                                <Sparkles className="w-4 h-4 text-yellow-300 md:hidden" />
                            </h1>
                            <p className="text-indigo-100 text-[11px] md:text-xs flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {chats.length} conversations
                            </p>
                        </div>
                    </div>

                    {/* Online indicator */}
                    {onlineCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-full backdrop-blur-sm">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[11px] text-white font-medium">{onlineCount} online</span>
                        </div>
                    )}
                </div>

                {/* Content Area - Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - Chat List */}
                    <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r dark:border-slate-800`}>
                        <ChatSidebar />
                    </div>

                    {/* Chat Window */}
                    <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
                        {activeChat ? (
                            <ChatWindow />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6 shadow-lg">
                                    <MessageCircle className="w-12 h-12 text-indigo-400 dark:text-indigo-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Select a Conversation</h3>
                                <p className="text-sm text-center max-w-xs text-gray-500">
                                    Choose a chat from the sidebar or start a new conversation with the + button
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TeamChatScreen;
