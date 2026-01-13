import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MessageCircle, X, Send, Minimize2, Maximize2, Paperclip, Image as ImageIcon, Trash2 } from 'lucide-react';

const ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminChatWidget = ({ isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }) => {
    const { user } = useAuth();
    // Internal state if NOT controlled (optional, but let's strictly control it from layout for now to link sidebar)
    // Actually, to keep it simple, let's allow it to be self-managed IF props aren't passed, 
    // OR just rely on Layout managing it.
    // Let's assume layout manages it now.

    // BUT to avoid breaking if used elsewhere without props:
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;
    const setIsOpen = isControlled ? externalSetIsOpen : setInternalIsOpen;
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;

        // Connect Socket
        // Remove /api from endpoint if present for socket connection usually
        const socketUrl = ENDPOINT.replace('/api', '');
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        // Join Room
        newSocket.emit('join_admin_chat', {
            id: user._id,
            name: user.name,
            role: user.role
        });

        // Listen for messages
        newSocket.on('receive_message', (message) => {
            setMessages((prev) => {
                // Prevent duplicates if any
                if (prev.find(m => m._id === message._id)) return prev;
                return [...prev, message];
            });

            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
        });

        // Fetch History
        fetchHistory();

        return () => newSocket.disconnect();
    }, [user, isOpen]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/admin/chat');
            setMessages(data);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to load chat history", error);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            alert('Max 5 files allowed');
            return;
        }
        setSelectedFiles(prev => [...prev, ...files]);

        const newPreviews = files.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image',
            name: file.name
        }));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || !socket) return;

        try {
            const formData = new FormData();
            formData.append('content', newMessage);
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            // 1. Save to DB (Uploads handled by middleware)
            const { data: savedMessage } = await api.post('/admin/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Emit to Socket
            socket.emit('send_message', savedMessage);

            setNewMessage('');
            setSelectedFiles([]);
            setPreviews([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;

    return (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Chat Window */}
            {isOpen && (
                <div className={`
                    pointer-events-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 
                    shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all duration-300 mb-4
                    ${isMinimized ? 'w-72 h-14' : 'w-80 md:w-96 h-[500px]'}
                `}>
                    {/* Header */}
                    <div
                        className="bg-indigo-600 p-4 flex justify-between items-center cursor-pointer"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <div className="flex items-center gap-2 text-white">
                            <div className="relative">
                                <MessageCircle className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                            </div>
                            <h3 className="font-bold text-sm">Admin Team Chat</h3>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-100">
                            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white">
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    {!isMinimized && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950/50">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender._id === user._id || msg.sender === user._id;
                                    const showAvatar = idx === 0 || messages[idx - 1].sender._id !== msg.sender._id;

                                    return (
                                        <div key={msg._id || idx} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {!isMe && showAvatar && (
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-slate-800 items-center justify-center flex text-xs font-bold text-indigo-700 overflow-hidden mt-1">
                                                    {msg.sender.profilePhoto ? (
                                                        <img src={msg.sender.profilePhoto} alt={msg.sender.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        msg.sender.name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                            )}
                                            {!isMe && !showAvatar && <div className="w-8" />} {/* Spacer */}

                                            <div className={`
                                                max-w-[75%] px-4 py-2 rounded-2xl text-sm
                                                ${isMe
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-tl-none'
                                                }
                                            `}>
                                                {!isMe && showAvatar && (
                                                    <p className="text-[10px] opacity-70 mb-1 font-semibold">{msg.sender.name}</p>
                                                )}

                                                {/* Render Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className={`grid gap-1 mb-1 ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                        {msg.attachments.map((url, i) => {
                                                            const isVideo = url.match(/\.(mp4|webm|mov)$/i);
                                                            return (
                                                                <div key={i} className="rounded-lg overflow-hidden relative">
                                                                    {isVideo ? (
                                                                        <video src={url} controls className="w-full h-auto max-h-48 object-cover" />
                                                                    ) : (
                                                                        <img src={url} alt="attachment" className="w-full h-auto max-h-48 object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(url, '_blank')} />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {msg.content && <p>{msg.content}</p>}

                                                <p className={`text-[9px] mt-1 text-right ${isMe ? 'opacity-70' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* File Previews */}
                            {previews.length > 0 && (
                                <div className="p-2 flex gap-2 overflow-x-auto bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                                    {previews.map((file, idx) => (
                                        <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-white">
                                            {file.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xs">Video</div>
                                            ) : (
                                                <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                                            )}
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg shadow-sm hover:bg-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex gap-2 items-end">
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() && selectedFiles.length === 0}
                                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center relative group"
                >
                    <MessageCircle className="h-6 w-6" />

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                            {unreadCount}
                        </span>
                    )}
                    <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Team Chat
                    </span>
                </button>
            )}
        </div>
    );
};

export default AdminChatWidget;
