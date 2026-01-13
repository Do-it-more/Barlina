import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Camera, X, Loader, Save, Package, LayoutDashboard } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ProfileDropdown = () => {
    const { user, logout, setUserData } = useAuth();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsEditing(false);
            }
        };

        // Use touchstart for mobile responsiveness to avoid ghost clicks vs mousedown
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const { data } = await api.put('/users/profile-photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUserData(data); // Update global user state
        } catch (error) {
            console.error("Failed to upload image", error);
            showToast("Failed to upload image", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!newName.trim() || newName === user.name) {
            setIsEditing(false);
            return;
        }

        try {
            const { data } = await api.put('/users/profile', { name: newName });
            setUserData(data);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update name", error);
            showToast("Failed to update name", "error");
        }
    };

    // Construct image URL (handle local uploads)
    const getProfileImg = () => {
        if (!user.profilePhoto) return null;
        if (user.profilePhoto.startsWith('http')) return user.profilePhoto;
        // Strip '/api' from the end of VITE_API_URL to get the base server URL
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
        return `${baseUrl}${user.profilePhoto}`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors focus:outline-none relative z-50 touch-manipulation"
                aria-label="User menu"
            >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-slate-600 top-trigger">
                    {user.profilePhoto ? (
                        <img src={getProfileImg()} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm md:text-base">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile Overlay Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 bg-black/20 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-24 left-4 right-4 md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-80 md:left-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-[999] origin-top-right fixed-mobile-dropdown"
                        >
                            <div className="p-6 text-center border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
                                <div className="relative inline-block">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-600 shadow-md relative group">
                                        {user.profilePhoto ? (
                                            <img src={getProfileImg()} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-3xl">{user.name.charAt(0).toUpperCase()}</span>
                                        )}

                                        {/* Overlay for upload */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                                        >
                                            <Camera className="h-6 w-6" />
                                        </div>
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 rounded-full">
                                            <Loader className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />

                                {isEditing ? (
                                    <div className="mt-3 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded focus:outline-none focus:border-indigo-500"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateName} className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
                                            <Save className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to={(user.role === 'admin' || user.role === 'super_admin') ? "/admin/dashboard" : "/profile"}
                                        className="mt-3 block group cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                            {user.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                                            {(user.role === 'admin' || user.role === 'super_admin') ? 'Go to Dashboard' : 'View Profile & Complaints'}
                                        </p>
                                    </Link>
                                )}
                            </div>

                            <div className="p-2">
                                {user.role !== 'admin' && user.role !== 'super_admin' && (
                                    <Link
                                        to="/orders"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        My Orders / Track
                                    </Link>
                                )}

                                {(user.role === 'admin' || user.role === 'super_admin') && (
                                    <Link
                                        to="/admin/dashboard"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-100/50 dark:border-indigo-900/50 mb-1"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        {user.role === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
                                    </Link>
                                )}
                                <button
                                    onClick={() => { setIsEditing(true); setNewName(user.name); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    Edit Profile Name
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors mt-1"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileDropdown;
