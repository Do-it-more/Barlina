import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const AdminChatContext = createContext();

export const useAdminChat = () => useContext(AdminChatContext);

export const AdminChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // The full chat object
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false); // For red dot notification in sidebar
    const [unreadCounts, setUnreadCounts] = useState({}); // Per-chat unread counts { chatId: count }
    const [isChatOpen, setIsChatOpen] = useState(false); // Global toggle for the widget

    // Ref to track active chat ID for socket handlers (avoids stale closure)
    const activeChatIdRef = useRef(null);

    // Keep ref in sync with activeChat state
    useEffect(() => {
        activeChatIdRef.current = activeChat?._id?.toString() || null;
    }, [activeChat]);

    // 1. Initialize Socket
    useEffect(() => {
        // Only connect if user is admin/super_admin
        if (!user || user.role === 'user') return;

        // Socket connects to base server URL, not API endpoint
        // Remove /api suffix if present in VITE_API_URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const socketUrl = apiUrl.replace(/\/api\/?$/, '');

        console.log('[Chat] Connecting to socket at:', socketUrl);

        const newSocket = io(socketUrl, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Chat] Connected via Socket');
            newSocket.emit('setup_admin_socket', user);
        });

        // When server confirms we're set up, refetch chats for latest online status
        newSocket.on('connected', () => {
            console.log('[Chat] Server confirmed connection');
        });

        // Listen for global incoming messages (for unread counts/notifications)
        newSocket.on('receive_message', (message) => {
            console.log('[AdminChatContext] Received message via socket:', {
                msgId: message._id,
                chatId: message.chat?._id || message.chat,
                sender: message.sender?.name,
                content: message.content?.substring(0, 30)
            });
            handleGlobalMessageReceive(message);
        });

        // Listen for Online Status Updates
        newSocket.on('user_status', ({ userId, isOnline }) => {
            console.log('[Chat] User status update:', userId, isOnline);

            setChats(prevChats => prevChats.map(chat => {
                // Ensure string comparison
                if (chat.type === 'private' && chat.partnerId?.toString() === userId?.toString()) {
                    return { ...chat, isOnline };
                }
                return chat;
            }));

            // Also update activeChat if it matches
            setActiveChat(prev => {
                if (prev && prev.type === 'private' && prev.partnerId?.toString() === userId?.toString()) {
                    return { ...prev, isOnline };
                }
                return prev;
            });
        });

        // Listen for new chat creation (when added to a group)
        newSocket.on('new_chat_created', (newChat) => {
            console.log('[Chat] New chat created, adding to list:', newChat.chatName, newChat._id);
            setChats(prevChats => {
                // Robust duplicate check using string comparison
                const exists = prevChats.some(c => c._id?.toString() === newChat._id?.toString());
                if (exists) {
                    console.log('[Chat] Chat already exists, skipping:', newChat._id);
                    return prevChats;
                }
                return [newChat, ...prevChats];
            });
            // New chat is unread
            setHasUnreadMessages(true);
        });

        // Listen for chat deletion
        newSocket.on('chat_deleted', ({ chatId }) => {
            console.log('[Chat] Chat deleted:', chatId);
            setChats(prevChats => prevChats.filter(c => c._id?.toString() !== chatId?.toString()));
            // Clear unread count for this chat
            setUnreadCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[chatId];
                return newCounts;
            });
            // If active chat was deleted, clear it
            setActiveChat(prev => {
                if (prev?._id?.toString() === chatId?.toString()) {
                    return null;
                }
                return prev;
            });
        });

        return () => {
            // Clean up previous socket
            if (newSocket) newSocket.disconnect();
        };
    }, [user?._id]); // Only re-connect if the User ID actually changes

    // 2. Fetch Chat List
    const fetchChats = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/chat/rooms');
            // Deduplicate chats by _id
            const uniqueChats = data.reduce((acc, chat) => {
                const exists = acc.some(c => c._id?.toString() === chat._id?.toString());
                if (!exists) acc.push(chat);
                return acc;
            }, []);
            setChats(uniqueChats);
        } catch (error) {
            console.error("Failed to load chats", error);
        }
    }, []);

    // 3. Handle Incoming Message (Global Handler)
    const handleGlobalMessageReceive = (message) => {
        // Normalize chat ID from message
        const msgChatId = (message.chat?._id || message.chat)?.toString();
        const senderId = message.sender?._id?.toString();

        // If message is from someone else (not me), check if we should increment unread count
        if (senderId !== user?._id?.toString()) {
            // Only increment unread count if this chat is NOT currently active
            // Use the ref to get the current active chat ID (avoids stale closure)
            const currentActiveChatId = activeChatIdRef.current;

            if (msgChatId !== currentActiveChatId) {
                setHasUnreadMessages(true);

                // Increment unread count for this specific chat
                setUnreadCounts(prev => {
                    return {
                        ...prev,
                        [msgChatId]: (prev[msgChatId] || 0) + 1
                    };
                });
            }
        }

        // Update the chat list order (move to top)
        setChats(prevChats => {
            const chatIndex = prevChats.findIndex(c => c._id?.toString() === msgChatId);
            if (chatIndex === -1) {
                // If new chat (implicit creation), re-fetch might be needed or manually add
                fetchChats();
                return prevChats;
            }

            const updatedChat = {
                ...prevChats[chatIndex],
                lastMessage: message,
                lastMessageAt: new Date()
            };

            const newChats = [...prevChats];
            newChats.splice(chatIndex, 1);
            newChats.unshift(updatedChat);
            return newChats;
        });
    };

    // 4. Clear unread notification (for sidebar red dot)
    const clearUnreadNotification = useCallback(() => {
        setHasUnreadMessages(false);
    }, []);

    // 5. Clear unread count for a specific chat (when opening that chat)
    const clearChatUnreadCount = useCallback((chatId) => {
        setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[chatId];
            return newCounts;
        });

        // Check if there are any remaining unread counts
        setUnreadCounts(prev => {
            const hasAnyUnread = Object.values(prev).some(count => count > 0);
            if (!hasAnyUnread) {
                setHasUnreadMessages(false);
            }
            return prev;
        });
    }, []);

    // 6. Get total unread count (for sidebar badge)
    const getTotalUnreadCount = useCallback(() => {
        return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    }, [unreadCounts]);

    // 7. Delete Chat
    const deleteChat = useCallback(async (chatId) => {
        try {
            await api.delete(`/admin/chat/${chatId}`);
            // Remove from local state
            setChats(prevChats => prevChats.filter(c => c._id?.toString() !== chatId?.toString()));
            // Clear unread count
            setUnreadCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[chatId];
                return newCounts;
            });
            // Clear active chat if it was deleted
            setActiveChat(prev => {
                if (prev?._id?.toString() === chatId?.toString()) {
                    return null;
                }
                return prev;
            });
            return { success: true };
        } catch (error) {
            console.error("Failed to delete chat", error);
            return { success: false, error: error.response?.data?.message || 'Failed to delete' };
        }
    }, []);

    // 8. Open Chat with a specific user (create if doesn't exist)
    const openChat = useCallback(async (targetUser) => {
        if (!targetUser || !targetUser._id) {
            console.error('[Chat] Invalid target user');
            return;
        }

        try {
            // Check if a private chat already exists with this user
            const existingChat = chats.find(chat =>
                chat.type === 'private' &&
                chat.partnerId?.toString() === targetUser._id?.toString()
            );

            if (existingChat) {
                // Open existing chat
                setActiveChat(existingChat);
                setIsChatOpen(true);
                clearChatUnreadCount(existingChat._id);
            } else {
                // Create a new private chat
                const { data: newChat } = await api.post('/admin/chat', {
                    type: 'private',
                    memberId: targetUser._id
                });

                // Add to chats list
                setChats(prev => [newChat, ...prev]);
                setActiveChat(newChat);
                setIsChatOpen(true);
            }
        } catch (error) {
            console.error("Failed to open chat:", error);
        }
    }, [chats, clearChatUnreadCount]);

    return (
        <AdminChatContext.Provider value={{
            socket,
            chats,
            setChats,
            activeChat,
            setActiveChat,
            hasUnreadMessages,
            clearUnreadNotification,
            unreadCounts,
            clearChatUnreadCount,
            getTotalUnreadCount,
            isChatOpen,
            setIsChatOpen,
            fetchChats,
            deleteChat,
            openChat
        }}>
            {children}
        </AdminChatContext.Provider>
    );
};
