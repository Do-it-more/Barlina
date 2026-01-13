import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi there! 👋 I'm your Barlina AI assistant. How can I help you today?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Check for simple client-side triggers first to save API calls
            const lowerInput = userMessage.text.toLowerCase();
            let botResponse = '';

            // This is where you would call your backend API
            const { data } = await api.post('/chat', { message: userMessage.text });

            // If backend provides a response, use it
            if (data && data.reply) {
                botResponse = data.reply;
            } else {
                botResponse = "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
            }

            const botMessage = { id: Date.now() + 1, text: botResponse, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "I apologize, but I'm experiencing technical difficulties. Please contact support if you need immediate assistance.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-24 md:bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
                    } bg-gradient-to-r from-indigo-600 to-purple-600 text-white`}
            >
                <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>
                <MessageSquare className="h-6 w-6 relative z-10" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-24 md:bottom-6 right-6 z-50 w-full max-w-[380px] h-[600px] max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg leading-tight">Barlina AI</h3>
                                    <p className="text-indigo-100 text-xs flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950/50 scroll-smooth">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-bl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shrink-0">
                            <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-gray-400 outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                                >
                                    {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </form>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
