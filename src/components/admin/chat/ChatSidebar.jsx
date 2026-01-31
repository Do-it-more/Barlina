import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, X, User, Users, ArrowLeft, Check, Trash2, MoreVertical, AlertTriangle } from 'lucide-react';
import { useAdminChat } from '../../../context/AdminChatContext';
import { useAuth } from '../../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import api from '../../../services/api';

// Helper to get full image URL
const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
    return `${baseUrl}${url}`;
};

const ChatSidebar = () => {
    const { chats, setActiveChat, fetchChats, deleteChat, unreadCounts, clearChatUnreadCount } = useAdminChat();
    const { user: currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState({ show: false, chatId: null, x: 0, y: 0 });
    const [deleteModal, setDeleteModal] = useState({ show: false, chatId: null, chatName: '', isGroup: false });

    // User Picker State
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState('menu'); // 'menu' | 'private' | 'group'
    const [availableUsers, setAvailableUsers] = useState([]);
    const [pickerSearch, setPickerSearch] = useState('');

    // Group Creation State
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [groupStep, setGroupStep] = useState(1); // 1: Select Members, 2: Name Group

    const filteredChats = chats.filter(chat =>
        chat.chatName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const location = useLocation();

    // Fetch Admins for Picker
    useEffect(() => {
        if (isPickerOpen && (pickerMode === 'private' || pickerMode === 'group')) {
            const fetchAdmins = async () => {
                try {
                    const { data } = await api.get('/users');

                    // Determine allowed roles based on context (URL)
                    let allowedRoles = ['admin', 'super_admin', 'finance', 'seller_admin'];

                    // RESTRICTION 1: Seller Hub (Super Admin Management View)
                    // Admins want to chat with Sellers and other Admins (excluding Finance)
                    if (location.pathname.startsWith('/seller-management')) {
                        allowedRoles = ['admin', 'super_admin', 'seller_admin', 'seller'];
                    }
                    // RESTRICTION 2: Seller Portal (Seller View)
                    // Sellers want to chat with Admins (excluding Finance and other Sellers)
                    else if (location.pathname.startsWith('/seller')) {
                        allowedRoles = ['admin', 'super_admin', 'seller_admin'];
                    }

                    const admins = data.filter(u =>
                        allowedRoles.includes(u.role) &&
                        u._id !== currentUser._id
                    );
                    setAvailableUsers(admins);
                } catch (error) {
                    console.error("Failed to fetch admins", error);
                }
            };
            fetchAdmins();
        }
    }, [isPickerOpen, pickerMode, currentUser._id, location.pathname]);

    // Reset state when picker closes
    useEffect(() => {
        if (!isPickerOpen) {
            setPickerMode('menu');
            setSelectedMembers([]);
            setGroupName('');
            setGroupStep(1);
            setPickerSearch('');
        }
    }, [isPickerOpen]);

    const handleStartPrivateChat = async (userId) => {
        try {
            const { data } = await api.post('/admin/chat/init', { recipientId: userId });
            await fetchChats();
            setActiveChat(data);
            setIsPickerOpen(false);
        } catch (error) {
            console.error("Failed to start chat", error);
        }
    };

    const toggleMemberSelection = (userId) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) return;

        try {
            const { data } = await api.post('/admin/chat/group', {
                groupName: groupName.trim(),
                memberIds: selectedMembers
            });
            await fetchChats();
            setActiveChat(data);
            setIsPickerOpen(false);
        } catch (error) {
            console.error("Failed to create group", error);
            alert(error.response?.data?.message || "Failed to create group chat");
        }
    };

    const filteredPickerUsers = availableUsers.filter(u =>
        u.name.toLowerCase().includes(pickerSearch.toLowerCase())
    );

    const getSelectedMemberNames = () => {
        return selectedMembers
            .map(id => availableUsers.find(u => u._id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    // Show delete confirmation modal
    const showDeleteModal = (chatId) => {
        const chat = chats.find(c => c._id === chatId);
        setDeleteModal({
            show: true,
            chatId,
            chatName: chat?.chatName || 'this chat',
            isGroup: chat?.type === 'group'
        });
        setContextMenu({ show: false, chatId: null, x: 0, y: 0 });
    };

    // Handle opening a chat (clears unread count)
    const handleOpenChat = (chat) => {
        setActiveChat(chat);
        // Clear unread count for this chat
        if (unreadCounts[chat._id]) {
            clearChatUnreadCount(chat._id);
        }
    };

    // Handle delete chat confirmation
    const confirmDeleteChat = async () => {
        if (!deleteModal.chatId) return;

        const result = await deleteChat(deleteModal.chatId);
        if (!result.success) {
            // Show error in modal or handle differently
            console.error(result.error);
        }
        setDeleteModal({ show: false, chatId: null, chatName: '', isGroup: false });
    };

    // Handle context menu (right-click or long-press)
    const handleContextMenu = (e, chatId) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            show: true,
            chatId,
            x: e.clientX || e.touches?.[0]?.clientX || 0,
            y: e.clientY || e.touches?.[0]?.clientY || 0
        });
    };

    // Close context menu when clicking elsewhere
    useEffect(() => {
        const handleClickOutside = () => setContextMenu({ show: false, chatId: null, x: 0, y: 0 });
        if (contextMenu.show) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu.show]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r dark:border-slate-800 relative">
            {/* Header - Hidden since TeamChatScreen has its own */}

            {/* Search - More touch-friendly */}
            <div className="p-3 md:p-4 bg-gray-50/50 dark:bg-slate-900">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-3 md:py-2.5 rounded-xl bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white border border-gray-200 dark:border-slate-700 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Chat List - Larger touch targets on mobile */}
            <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
                {filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                            <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        No conversations found
                    </div>
                ) : (
                    filteredChats.map(chat => (
                        <div
                            key={chat._id}
                            onClick={() => handleOpenChat(chat)}
                            onContextMenu={(e) => handleContextMenu(e, chat._id)}
                            className="relative flex items-center gap-3 px-4 py-4 md:py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800/50 last:border-0 active:bg-indigo-50 dark:active:bg-indigo-900/20 group"
                        >
                            {/* Avatar - Larger on mobile */}
                            <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                                    {chat.chatAvatar ? (
                                        <img
                                            src={getImageUrl(chat.chatAvatar)}
                                            alt={chat.chatName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Hide broken image and show fallback
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    {/* Fallback - always rendered but hidden if image exists */}
                                    <span className={`text-indigo-600 font-bold text-lg dark:text-indigo-400 ${chat.chatAvatar ? 'hidden' : ''}`}>
                                        {chat.type === 'group' ? (
                                            <Users className="w-6 h-6" />
                                        ) : (
                                            chat.chatName?.charAt(0) || '?'
                                        )}
                                    </span>
                                </div>
                                {/* Online Status Dot (only for private chats) */}
                                {chat.type === 'private' && chat.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-800 dark:text-gray-200 truncate text-[15px] md:text-sm">
                                            {chat.chatName}
                                        </h3>
                                        {chat.type === 'group' ? (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                                                Team
                                            </span>
                                        ) : (
                                            (() => {
                                                const otherMember = chat.members?.find(m => m.user?._id !== currentUser?._id);
                                                const role = otherMember?.user?.role;

                                                if (!role) return null;

                                                if (role === 'finance') return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">Finance</span>;
                                                if (role === 'seller_admin') return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium border border-orange-200 dark:border-orange-800">Seller</span>;
                                                if (role === 'super_admin') return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800">Super Admin</span>;
                                                if (role === 'admin') return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">Admin</span>;
                                                return null;
                                            })()
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {chat.lastMessageAt && (
                                            <span className="text-[10px] text-gray-400 group-hover:hidden">
                                                {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false }).replace('about', '')}
                                            </span>
                                        )}
                                        {/* Delete button - shows on hover, hides timestamp */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); showDeleteModal(chat._id); }}
                                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/40"
                                            title={chat.type === 'group' ? 'Delete Group' : 'Delete Chat'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-[13px] md:text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                                        {chat.lastMessage ? (
                                            chat.lastMessage.contentType === 'image' ? '📷 Image' :
                                                chat.lastMessage.contentType === 'video' ? '🎥 Video' :
                                                    chat.lastMessage.content
                                        ) : (
                                            <span className="italic">No messages yet</span>
                                        )}
                                    </p>

                                    {/* Unread Count Badge */}
                                    {unreadCounts[chat._id] > 0 && (
                                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-green-500 text-white text-[11px] font-bold shadow-sm">
                                            {unreadCounts[chat._id] > 99 ? '99+' : unreadCounts[chat._id]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Button - New Chat - Positioned higher on mobile to avoid bottom nav */}
            <button
                className="absolute bottom-20 md:bottom-6 right-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 z-40"
                title="New Chat"
                onClick={() => setIsPickerOpen(true)}
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* NEW CHAT PICKER MODAL */}
            {isPickerOpen && (
                <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col animate-in fade-in duration-200">
                    {/* MENU MODE - Choose Chat Type */}
                    {pickerMode === 'menu' && (
                        <>
                            <div className="p-4 border-b dark:border-slate-800 flex items-center gap-3 bg-gray-50 dark:bg-slate-950">
                                <button onClick={() => setIsPickerOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-slate-800 dark:text-white">New Chat</h3>
                            </div>

                            <div className="p-4 space-y-3">
                                <button
                                    onClick={() => setPickerMode('private')}
                                    className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-800 dark:text-white">Private Chat</p>
                                        <p className="text-sm text-gray-500">Start a 1-on-1 conversation</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setPickerMode('group')}
                                    className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-800 dark:text-white">Team Chat</p>
                                        <p className="text-sm text-gray-500">Create a group with multiple members</p>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}

                    {/* PRIVATE CHAT MODE - Select One User */}
                    {pickerMode === 'private' && (
                        <>
                            <div className="p-4 border-b dark:border-slate-800 flex items-center gap-3 bg-gray-50 dark:bg-slate-950">
                                <button onClick={() => setPickerMode('menu')} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-slate-800 dark:text-white">Select Contact</h3>
                            </div>

                            <div className="p-3">
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm focus:outline-none dark:text-white"
                                    value={pickerSearch}
                                    onChange={(e) => setPickerSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Contacts</p>
                                {filteredPickerUsers.map(u => (
                                    <div
                                        key={u._id}
                                        onClick={() => handleStartPrivateChat(u._id)}
                                        className="flex items-center gap-3 p-3 px-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center border border-gray-200 dark:border-slate-600 overflow-hidden">
                                            {u.profilePhoto ? (
                                                <img
                                                    src={getImageUrl(u.profilePhoto)}
                                                    alt={u.name}
                                                    className="w-full h-full object-cover rounded-full"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <span className={`font-bold text-indigo-600 dark:text-indigo-400 ${u.profilePhoto ? 'hidden' : ''}`}>{u.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">{u.name}</p>
                                            <div className="flex items-center mt-1">
                                                {u.role === 'admin' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">Admin</span>}
                                                {u.role === 'super_admin' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800">Super Admin</span>}
                                                {u.role === 'finance' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">Finance</span>}
                                                {u.role === 'seller_admin' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium border border-orange-200 dark:border-orange-800">Seller Admin</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredPickerUsers.length === 0 && (
                                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">No admins found.</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* GROUP CHAT MODE - Step 1: Select Members */}
                    {pickerMode === 'group' && groupStep === 1 && (
                        <>
                            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-950">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setPickerMode('menu')} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">Select Members</h3>
                                        <p className="text-xs text-gray-500">{selectedMembers.length} selected</p>
                                    </div>
                                </div>
                                {selectedMembers.length > 0 && (
                                    <button
                                        onClick={() => setGroupStep(2)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>

                            <div className="p-3">
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm focus:outline-none dark:text-white"
                                    value={pickerSearch}
                                    onChange={(e) => setPickerSearch(e.target.value)}
                                />
                            </div>

                            {/* Selected Members Preview */}
                            {selectedMembers.length > 0 && (
                                <div className="px-4 py-2 border-b dark:border-slate-800">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMembers.map(id => {
                                            const member = availableUsers.find(u => u._id === id);
                                            return member ? (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                                                >
                                                    {member.name}
                                                    <button onClick={() => toggleMemberSelection(id)} className="hover:text-red-500">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Members</p>
                                {filteredPickerUsers.map(u => {
                                    const isSelected = selectedMembers.includes(u._id);
                                    return (
                                        <div
                                            key={u._id}
                                            onClick={() => toggleMemberSelection(u._id)}
                                            className={`flex items-center gap-3 p-3 px-4 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center border border-gray-200 dark:border-slate-600 relative overflow-hidden">
                                                {u.profilePhoto ? (
                                                    <img
                                                        src={getImageUrl(u.profilePhoto)}
                                                        alt={u.name}
                                                        className="w-full h-full object-cover rounded-full"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <span className={`font-bold text-indigo-600 dark:text-indigo-400 ${u.profilePhoto ? 'hidden' : ''}`}>{u.name.charAt(0)}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 dark:text-white">{u.name}</p>
                                                <div className="flex items-center mt-1">
                                                    {u.role === 'admin' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">Admin</span>}
                                                    {u.role === 'super_admin' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800">Super Admin</span>}
                                                    {u.role === 'finance' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">Finance</span>}
                                                    {u.role === 'seller_admin' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium border border-orange-200 dark:border-orange-800">Seller Admin</span>}
                                                </div>
                                            </div>
                                            {/* Checkbox */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'border-gray-300 dark:border-slate-600'
                                                }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* GROUP CHAT MODE - Step 2: Name the Group */}
                    {pickerMode === 'group' && groupStep === 2 && (
                        <>
                            <div className="p-4 border-b dark:border-slate-800 flex items-center gap-3 bg-gray-50 dark:bg-slate-950">
                                <button onClick={() => setGroupStep(1)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-slate-800 dark:text-white">Name Your Team</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Group Icon Preview */}
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <Users className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                {/* Group Name Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Team Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Marketing Team, Dev Squad"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {/* Members Preview */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Members ({selectedMembers.length + 1})
                                    </label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        You, {getSelectedMemberNames()}
                                    </p>
                                </div>

                                {/* Create Button */}
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={!groupName.trim()}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    Create Team Chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteModal({ show: false, chatId: null, chatName: '', isGroup: false })}
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
                            {deleteModal.isGroup ? 'Delete Group Chat?' : 'Delete Chat?'}
                        </h3>

                        {/* Message */}
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                            {deleteModal.isGroup
                                ? `This will permanently delete "${deleteModal.chatName}" and remove it for all members.`
                                : `This will clear your conversation with "${deleteModal.chatName}".`
                            }
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, chatId: null, chatName: '', isGroup: false })}
                                className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteChat}
                                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatSidebar;
