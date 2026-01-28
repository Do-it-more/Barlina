import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Check, CheckCheck, Trash2, X, Users, ArrowLeft, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { useAdminChat } from '../../../context/AdminChatContext';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { format } from 'date-fns';

// Helper to get full image URL
const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
    return `${baseUrl}${url}`;
};

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

    // Multi-select state
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);

    // Delete modal state
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        messageIds: [],
        canDeleteForEveryone: false // true if I own all selected messages or I'm SuperAdmin
    });

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
        setIsSelectMode(false); // Exit select mode on chat switch
        setSelectedMessages([]);

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
            setMessages(prev => prev.map(m => {
                if (m._id?.toString() === updatedMsg._id?.toString()) {
                    // Merge: preserve original sender info if updated message doesn't have it fully populated
                    return {
                        ...m,
                        ...updatedMsg,
                        // Ensure sender is preserved - use updated if populated, otherwise keep original
                        sender: (updatedMsg.sender && updatedMsg.sender._id) ? updatedMsg.sender : m.sender
                    };
                }
                return m;
            }));
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

        // Listen for message deletion
        const handleMessageDeleted = ({ messageId, chatId: deletedChatId }) => {
            if (activeChatId === deletedChatId?.toString()) {
                setMessages(prev => prev.filter(m => m._id?.toString() !== messageId?.toString()));
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('message_update', handleMessageUpdate); // For global deletes
        socket.on('messages_read', handleMessagesRead);
        socket.on('typing', handleTyping);
        socket.on('stop_typing', handleStopTyping);
        socket.on('message_deleted', handleMessageDeleted);

        // Mark existing unread messages as read on mount
        api.put(`/admin/chat/${activeChatId}/read`).catch(err => console.error("Initial read mark failed", err));

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('message_update', handleMessageUpdate);
            socket.off('messages_read', handleMessagesRead);
            socket.off('typing', handleTyping);
            socket.off('stop_typing', handleStopTyping);
            socket.off('message_deleted', handleMessageDeleted);
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
        try {
            await api.post(`/admin/chat/${activeChat._id}/clear`, { global: false });
            setMessages([]);
            setShowMenu(false);
        } catch (error) {
            console.error("Failed to clear chat", error);
        }
    };

    // Toggle message selection
    const toggleMessageSelection = (msgId) => {
        setSelectedMessages(prev => {
            if (prev.includes(msgId)) {
                return prev.filter(id => id !== msgId);
            } else {
                return [...prev, msgId];
            }
        });
    };

    // Enter/Exit select mode
    const toggleSelectMode = () => {
        if (isSelectMode) {
            setSelectedMessages([]);
        }
        setIsSelectMode(!isSelectMode);
    };

    // Open delete modal for single message
    const openDeleteModalSingle = (msgId, isMyMessage) => {
        setDeleteModal({
            show: true,
            messageIds: [msgId],
            canDeleteForEveryone: isMyMessage || iAmSuperAdmin
        });
    };

    // Open delete modal for multiple selected messages
    const openDeleteModalMultiple = () => {
        if (selectedMessages.length === 0) return;

        // Check if all selected messages are mine (or I'm SuperAdmin)
        const allMine = selectedMessages.every(msgId => {
            const msg = messages.find(m => m._id === msgId);
            return msg?.sender._id === currentUser._id;
        });

        setDeleteModal({
            show: true,
            messageIds: selectedMessages,
            canDeleteForEveryone: allMine || iAmSuperAdmin
        });
    };

    // Handle delete with option
    const handleDeleteMessages = async (forEveryone = false) => {
        const { messageIds } = deleteModal;

        try {
            // Delete each message
            for (const msgId of messageIds) {
                await api.delete(`/admin/chat/message/${msgId}`, { data: { global: forEveryone } });

                if (!forEveryone) {
                    // Remove locally for "delete for me"
                    setMessages(prev => prev.filter(m => m._id !== msgId));
                }
            }

            // If deleting for everyone, socket will handle UI update
            if (forEveryone) {
                setMessages(prev => prev.map(m => {
                    if (messageIds.includes(m._id)) {
                        return { ...m, isDeletedGlobally: true, content: '' };
                    }
                    return m;
                }));
            }

            // Reset state
            setDeleteModal({ show: false, messageIds: [], canDeleteForEveryone: false });
            setSelectedMessages([]);
            setIsSelectMode(false);

        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // Close delete modal
    const closeDeleteModal = () => {
        setDeleteModal({ show: false, messageIds: [], canDeleteForEveryone: false });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Enhanced Header with Chat Info, Typing Indicator and Menu */}
            <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-3 py-3 md:py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    {/* Back Button (for mobile) - Larger touch target */}
                    <button
                        onClick={() => {
                            if (isSelectMode) {
                                setIsSelectMode(false);
                                setSelectedMessages([]);
                            } else {
                                setActiveChat(null);
                            }
                        }}
                        className="p-2 -ml-1 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors md:hidden active:bg-gray-200 dark:active:bg-slate-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Chat Avatar - Larger on mobile */}
                    {!isSelectMode ? (
                        <>
                            <div className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                                {activeChat?.chatAvatar ? (
                                    <img
                                        src={getImageUrl(activeChat.chatAvatar)}
                                        alt={activeChat.chatName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                {/* Fallback */}
                                <span className={`text-indigo-600 font-bold dark:text-indigo-400 ${activeChat?.chatAvatar ? 'hidden' : ''}`}>
                                    {activeChat?.type === 'group' ? (
                                        <Users className="w-5 h-5" />
                                    ) : (
                                        activeChat?.chatName?.charAt(0) || '?'
                                    )}
                                </span>
                            </div>

                            {/* Chat Name & Status */}
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-800 dark:text-white text-[15px] md:text-sm">{activeChat?.chatName}</h3>
                                    {activeChat?.type === 'group' ? (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                                            Team
                                        </span>
                                    ) : (
                                        (() => {
                                            const otherMember = activeChat?.members?.find(m => m.user?._id !== currentUser?._id);
                                            const role = otherMember?.user?.role;
                                            if (!role) return null;

                                            if (role === 'finance') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">Finance</span>;
                                            if (role === 'seller_admin') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium border border-orange-200 dark:border-orange-800">Seller</span>;
                                            if (role === 'super_admin') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800">Super Admin</span>;
                                            if (role === 'admin') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">Admin</span>;
                                            return null;
                                        })()
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
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-800 dark:text-white">
                                {selectedMessages.length} selected
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 relative">
                    {/* Multi-select mode buttons */}
                    {isSelectMode ? (
                        <>
                            <button
                                onClick={() => {
                                    // Select all messages
                                    setSelectedMessages(messages.map(m => m._id));
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                                Select All
                            </button>
                            {selectedMessages.length > 0 && (
                                <button
                                    onClick={openDeleteModalMultiple}
                                    className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={toggleSelectMode}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleSelectMode}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                title="Select Messages"
                            >
                                <CheckSquare className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </>
                    )}

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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950/50 scrollbar-hide">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender._id === currentUser._id;
                        const isSuperAdminSender = msg.sender.role === 'super_admin';
                        const showAvatar = !isMe && (index === 0 || messages[index - 1].sender._id !== msg.sender._id);
                        const isSelected = selectedMessages.includes(msg._id);

                        // Permissions:
                        // 1. I can delete my own message (soft)
                        // 2. SuperAdmin can delete ANY message (global)
                        const canDelete = isMe || iAmSuperAdmin;

                        return (
                            <div
                                key={msg._id}
                                className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'} ${isSelectMode ? 'cursor-pointer' : ''}`}
                                onClick={() => isSelectMode && toggleMessageSelection(msg._id)}
                            >
                                {/* Checkbox for select mode */}
                                {isSelectMode && (
                                    <div className={`flex items-center mr-2 ${isMe ? 'order-last ml-2 mr-0' : ''}`}>
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'border-gray-300 dark:border-slate-600'
                                            }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                )}

                                <div className={`flex max-w-[75%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* Avatar for Them */}
                                    {!isMe && (
                                        <div className="w-8 h-8 flex-shrink-0 flex flex-col items-center">
                                            {showAvatar ? (
                                                <img
                                                    src={getImageUrl(msg.sender.profilePhoto) || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=6366f1&color=fff`}
                                                    className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700"
                                                    alt={msg.sender.name}
                                                    onError={(e) => {
                                                        // Fallback to ui-avatars on error
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=6366f1&color=fff`;
                                                    }}
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
                                                ${isSelected ? 'ring-2 ring-indigo-500' : ''}
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
                                                            src={getImageUrl(msg.fileUrl)}
                                                            alt="Attachment"
                                                            className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={(e) => { e.stopPropagation(); setPreviewImage(getImageUrl(msg.fileUrl)); }}
                                                        />
                                                    )}
                                                    {msg.contentType === 'video' && (
                                                        <video src={getImageUrl(msg.fileUrl)} controls className="max-w-full rounded-lg mb-2" onClick={(e) => e.stopPropagation()} />
                                                    )}
                                                    {msg.contentType === 'document' && (
                                                        <a href={getImageUrl(msg.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded mb-2 hover:bg-black/20 transition-colors" onClick={(e) => e.stopPropagation()}>
                                                            <Paperclip className="w-4 h-4" />
                                                            <span className="underline truncate max-w-[150px]">{msg.fileName || 'Document'}</span>
                                                        </a>
                                                    )}

                                                    {/* Text Content */}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                </>
                                            )}
                                        </div>

                                        {/* Delete Button (Hovers outside bubble) - Only when not in select mode */}
                                        {!msg.isDeletedGlobally && canDelete && !isSelectMode && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openDeleteModalSingle(msg._id, isMe); }}
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

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeDeleteModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        {/* Warning Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">
                            Delete {deleteModal.messageIds.length > 1 ? `${deleteModal.messageIds.length} Messages` : 'Message'}?
                        </h3>

                        {/* Message */}
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            {deleteModal.canDeleteForEveryone
                                ? 'Choose how you want to delete this message:'
                                : 'This will remove the message from your view only.'
                            }
                        </p>

                        {/* Buttons */}
                        <div className="space-y-3">
                            {/* Delete for Everyone - Only if allowed */}
                            {deleteModal.canDeleteForEveryone && (
                                <button
                                    onClick={() => handleDeleteMessages(true)}
                                    className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete for Everyone
                                </button>
                            )}

                            {/* Delete for Me */}
                            <button
                                onClick={() => handleDeleteMessages(false)}
                                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${deleteModal.canDeleteForEveryone
                                    ? 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    : 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30'
                                    }`}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete for Me
                            </button>

                            {/* Cancel */}
                            <button
                                onClick={closeDeleteModal}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
