import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Check, CheckCheck, Trash2, X, Users, ArrowLeft } from 'lucide-react';
import { useAdminChat } from '../../../context/AdminChatContext';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { format } from 'date-fns';

const ChatWindow = () => {
    const { activeChat, setActiveChat, socket } = useAdminChat();
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [showMenu, setShowMenu] = useState(false); // Header Menu Toggle
    const [previewImage, setPreviewImage] = useState(null); // Image Preview Modal

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Determines if I am SuperAdmin (for elevated actions)
    const iAmSuperAdmin = currentUser?.role === 'super_admin';

    // 1. Join Room & Fetch History
    useEffect(() => {
        if (!activeChat) return;

        const chatId = activeChat._id?.toString() || activeChat._id;

        const fetchMessages = async () => {
            try {
                const { data } = await api.get(`/admin/chat/${chatId}/messages`);
                setMessages(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching messages", error);
                setLoading(false);
            }
        };

        fetchMessages();
        setLoading(true); // Reset loading state on chat switch
        setShowMenu(false); // Close menu on switch

        // Join Room Helper - ensure string format
        const joinRoom = () => {
            if (socket && chatId) {
                console.log("[ChatWindow] Joining room:", chatId);
                socket.emit('join_chat_room', chatId);
            }
        };

        joinRoom();

        // Re-join on reconnection
        if (socket) {
            socket.on('connect', joinRoom);
        }

        return () => {
            if (socket) {
                console.log("[ChatWindow] Leaving room:", chatId);
                socket.emit('leave_chat_room', chatId);
                socket.off('connect', joinRoom);
            }
        };
    }, [activeChat, socket]);

    // 2. Real-time Listeners
    useEffect(() => {
        if (!socket || !activeChat) return;

        const activeChatId = activeChat._id?.toString() || activeChat._id;

        const handleReceiveMessage = (msg) => {
            // Normalize chat ID from message
            const msgChatId = (msg.chat?._id || msg.chat)?.toString();

            console.log("[ChatWindow] Received message:", {
                msgChatId,
                activeChatId,
                matches: msgChatId === activeChatId,
                msgContent: msg.content?.substring(0, 20)
            });

            // Only append if it belongs to THIS open chat
            if (msgChatId === activeChatId) {
                setMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m._id?.toString() === msg._id?.toString())) {
                        console.log("[ChatWindow] Duplicate message ignored");
                        return prev;
                    }
                    console.log("[ChatWindow] Adding new message to chat");
                    return [...prev, msg];
                });
                scrollToBottom();

                // If message is from other person, Mark as Read immediately
                if (msg.sender._id?.toString() !== currentUser._id?.toString()) {
                    api.put(`/admin/chat/${activeChatId}/read`).catch(err => console.error("Read receipt failed", err));
                }
            }
        };

        const handleMessageUpdate = (updatedMsg) => {
            setMessages(prev => prev.map(m => m._id?.toString() === updatedMsg._id?.toString() ? updatedMsg : m));
        };

        const handleMessagesRead = ({ chatId, userId, readAt }) => {
            if (activeChatId === chatId?.toString()) {
                setMessages(prev => prev.map(msg => {
                    // Update 'readBy' for my messages
                    if (msg.sender._id?.toString() === currentUser._id?.toString()) {
                        // Avoid duplicates
                        const alreadyRead = msg.readBy?.some(r =>
                            (r.user?.toString() || r.user?._id?.toString()) === userId?.toString()
                        );
                        if (!alreadyRead) {
                            return {
                                ...msg,
                                readBy: [...(msg.readBy || []), { user: userId, readAt }]
                            };
                        }
                    }
                    return msg;
                }));
            }
        };

        const handleTyping = ({ room, user }) => {
            if (room?.toString() === activeChatId && user._id?.toString() !== currentUser._id?.toString()) {
                setTypingUser(user);
                setIsTyping(true);
            }
        };

        const handleStopTyping = ({ room }) => {
            if (room?.toString() === activeChatId) {
                setIsTyping(false);
                setTypingUser(null);
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('message_update', handleMessageUpdate); // For global deletes
        socket.on('messages_read', handleMessagesRead);
        socket.on('typing', handleTyping);
        socket.on('stop_typing', handleStopTyping);

        // Mark existing unread messages as read on mount
        api.put(`/admin/chat/${activeChatId}/read`).catch(err => console.error("Initial read mark failed", err));

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('message_update', handleMessageUpdate);
            socket.off('messages_read', handleMessagesRead);
            socket.off('typing', handleTyping);
            socket.off('stop_typing', handleStopTyping);
        };
    }, [socket, activeChat, currentUser._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 3. Typing Emitters
    const handleInput = (e) => {
        setNewMessage(e.target.value);

        const chatId = activeChat._id?.toString() || activeChat._id;

        if (socket && chatId) {
            socket.emit('typing', { room: chatId, user: currentUser });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', { room: chatId });
            }, 2000);
        }
    };

    // 4. Send Message
    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !activeChat) return;

        const chatId = activeChat._id?.toString() || activeChat._id;

        const formData = new FormData();
        formData.append('chatId', chatId);
        formData.append('content', newMessage);
        if (attachment) {
            formData.append('file', attachment);
        }

        try {
            if (socket) {
                socket.emit('stop_typing', { room: chatId });
            }
            // Clear input immediately for better UX
            setNewMessage('');
            setAttachment(null);

            // Send to Backend
            const { data } = await api.post('/admin/chat/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Optimistically update UI using backend response
            setMessages(prev => {
                if (prev.some(m => m._id?.toString() === data._id?.toString())) return prev;
                return [...prev, data];
            });

        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message: " + (error.response?.data?.message || "Unknown error"));
        }
    };

    // 5. File Selection
    const handleFileSelect = (e) => {
        if (e.target.files[0]) {
            if (e.target.files[0].size > 50 * 1024 * 1024) {
                alert("File too large (Max 50MB)");
                return;
            }
            setAttachment(e.target.files[0]);
        }
    };

    // 6. Action Handlers (Clear/Delete)
    const handleClearChat = async () => {
        if (!window.confirm("Are you sure you want to clear this chat history?")) return;

        try {
            await api.post(`/admin/chat/${activeChat._id}/clear`, { global: false }); // Always local clear by default for safety
            setMessages([]); // Clear locally immediately
            setShowMenu(false);
        } catch (error) {
            alert("Failed to clear chat");
        }
    };

    const handleDeleteMessage = async (msgId, global = false) => {
        if (!window.confirm("Delete this message?")) return;

        try {
            await api.delete(`/admin/chat/message/${msgId}`, { data: { global } });

            if (global) {
                // Socket update will handle it
            } else {
                // Remove locally
                setMessages(prev => prev.filter(m => m._id !== msgId));
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Enhanced Header with Chat Info, Typing Indicator and Menu */}
            <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-3 py-3 md:py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    {/* Back Button (for mobile) - Larger touch target */}
                    <button
                        onClick={() => setActiveChat(null)}
                        className="p-2 -ml-1 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors md:hidden active:bg-gray-200 dark:active:bg-slate-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Chat Avatar - Larger on mobile */}
                    <div className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                        {activeChat?.chatAvatar ? (
                            <img src={activeChat.chatAvatar} alt={activeChat.chatName} className="w-full h-full object-cover" />
                        ) : activeChat?.type === 'group' ? (
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                            <span className="text-indigo-600 font-bold dark:text-indigo-400">
                                {activeChat?.chatName?.charAt(0) || '?'}
                            </span>
                        )}
                    </div>

                    {/* Chat Name & Status */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 dark:text-white text-[15px] md:text-sm">{activeChat?.chatName}</h3>
                            {activeChat?.type === 'group' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                                    Team
                                </span>
                            )}
                        </div>
                        {isTyping ? (
                            <p className="text-xs text-indigo-500 font-medium animate-pulse">
                                {typingUser?.name.split(' ')[0]} is typing...
                            </p>
                        ) : activeChat?.type === 'group' ? (
                            <p className="text-xs text-gray-500">{activeChat?.members?.length || 0} members</p>
                        ) : activeChat?.isOnline ? (
                            <p className="text-xs text-green-500">Online</p>
                        ) : (
                            <p className="text-xs text-gray-400">Offline</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 py-1 z-50">
                            <button
                                onClick={handleClearChat}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Clear Chat History
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950/50">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender._id === currentUser._id;
                        const isSuperAdminSender = msg.sender.role === 'super_admin';
                        const showAvatar = !isMe && (index === 0 || messages[index - 1].sender._id !== msg.sender._id);

                        // Permissions:
                        // 1. I can delete my own message (soft)
                        // 2. SuperAdmin can delete ANY message (global)
                        const canDelete = isMe || iAmSuperAdmin;

                        return (
                            <div key={msg._id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[75%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* Avatar for Them */}
                                    {!isMe && (
                                        <div className="w-8 h-8 flex-shrink-0 flex flex-col items-center">
                                            {showAvatar ? (
                                                <img
                                                    src={msg.sender.profilePhoto || `https://ui-avatars.com/api/?name=${msg.sender.name}`}
                                                    className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700"
                                                    alt={msg.sender.name}
                                                />
                                            ) : <div className="w-8 h-8" />}
                                        </div>
                                    )}

                                    {/* Message Content & Actions Container */}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group`}>
                                        {/* Name Label */}
                                        {!isMe && showAvatar && (
                                            <span className="text-[10px] text-gray-500 ml-1 mb-1">
                                                {msg.sender.name} {isSuperAdminSender && <span className="text-indigo-500 font-bold ml-1">★ SA</span>}
                                            </span>
                                        )}

                                        {/* Bubble */}
                                        <div
                                            className={`
                                                relative px-4 py-2 rounded-2xl text-sm shadow-sm
                                                ${isMe
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-tl-none'}
                                                ${isSuperAdminSender && !isMe ? 'ring-2 ring-indigo-100 dark:ring-indigo-900/30' : ''}
                                            `}
                                        >
                                            {/* Deleted Global Check */}
                                            {msg.isDeletedGlobally ? (
                                                <div className="italic text-gray-400 flex items-center gap-1">
                                                    <Trash2 className="w-3 h-3" /> Message was deleted
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Attachments */}
                                                    {msg.contentType === 'image' && (
                                                        <img
                                                            src={msg.fileUrl}
                                                            alt="Attachment"
                                                            className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => setPreviewImage(msg.fileUrl)}
                                                        />
                                                    )}
                                                    {msg.contentType === 'video' && (
                                                        <video src={msg.fileUrl} controls className="max-w-full rounded-lg mb-2" />
                                                    )}
                                                    {msg.contentType === 'document' && (
                                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded mb-2 hover:bg-black/20 transition-colors">
                                                            <Paperclip className="w-4 h-4" />
                                                            <span className="underline truncate max-w-[150px]">{msg.fileName || 'Document'}</span>
                                                        </a>
                                                    )}

                                                    {/* Text Content */}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                </>
                                            )}
                                        </div>

                                        {/* Delete Button (Hovers outside bubble) */}
                                        {!msg.isDeletedGlobally && canDelete && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg._id, iAmSuperAdmin)} // Pass global=true if SA
                                                className={`
                                                    absolute top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-slate-800 text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10
                                                    ${isMe ? '-left-10' : '-right-10'}
                                                `}
                                                title="Delete Message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* Meta (Time & Status) */}
                                        <div className="flex items-center gap-1 mt-1 mr-1">
                                            <span className="text-[10px] text-gray-400">
                                                {format(new Date(msg.createdAt), 'h:mm a')}
                                            </span>
                                            {isMe && !msg.isDeletedGlobally && (
                                                <span className={msg.readBy?.length > 0 ? "text-blue-500" : "text-gray-400"}>
                                                    <CheckCheck className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Safe area padding for mobile bottom nav */}
            <div className="p-3 pb-4 md:pb-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
                {attachment && (
                    <div className="flex items-center gap-2 mb-2 p-2.5 bg-indigo-50 dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700">
                        <Paperclip className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{attachment.name}</span>
                        <button onClick={() => setAttachment(null)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSend} className="flex items-end gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:bg-gray-200 dark:active:bg-slate-700"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    />

                    <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center min-h-[48px] md:min-h-[44px] border border-gray-200 dark:border-slate-700">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleInput}
                            placeholder="Type a message..."
                            className="w-full bg-transparent px-4 py-3 md:py-2 focus:outline-none text-sm text-slate-800 dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !attachment}
                        className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Download Button */}
                    <a
                        href={previewImage}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 left-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors z-10 flex items-center gap-2"
                    >
                        <Paperclip className="w-4 h-4" />
                        Download
                    </a>

                    {/* Image */}
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
