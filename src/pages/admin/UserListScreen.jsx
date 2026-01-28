import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, Shield, User, ShieldCheck, Plus, Copy, Check, Facebook, Mail, Search, MessageSquare, Wallet, Store, Edit2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../context/AuthContext';
import { useAdminChat } from '../../context/AdminChatContext';

// Helper Component for Avatar with Fallback
const UserAvatar = ({ user }) => {
    const [imgError, setImgError] = useState(false);

    // Reset error state if the photo URL changes
    useEffect(() => {
        setImgError(false);
    }, [user.profilePhoto]);

    if (user.profilePhoto && !imgError) {
        return (
            <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                    // Prevent infinite loop if fallback also fails (though we switch to text here)
                    e.target.onerror = null;
                    setImgError(true);
                }}
            />
        );
    }

    return (
        <span className="text-sm">
            {user.name?.charAt(0).toUpperCase() || '?'}
        </span>
    );
};

const UserListScreen = () => {
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const { user: currentUser } = useAuth(); // Rename to avoid conflict with user in map
    const { openChat } = useAdminChat();
    const [users, setUsers] = useState([]);
    const [allCategories, setAllCategories] = useState([]); // New State
    const [copiedEmail, setCopiedEmail] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'admin', 'user'

    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

    // Access Modal State
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [accessForm, setAccessForm] = useState({
        isAdmin: false,
        permissions: {
            orders: false,
            returns: false,
            complaints: false,
            inquiries: false,
            users: false,
            products: false,
            categories: false,
            coupons: false,
            settings: false,
            finance: false
        },
        assignedCategories: [], // New State
        role: 'user' // Added role
    });
    const [isRoleEditing, setIsRoleEditing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Users
                const { data: usersData } = await api.get('/users');
                let filteredUsers = usersData.filter(u => u.role !== 'super_admin');
                if (currentUser?.role !== 'super_admin') {
                    filteredUsers = filteredUsers.filter(u => u.role !== 'admin' && u.role !== 'super_admin');
                }
                setUsers(filteredUsers);

                // Fetch Categories (for RBAC modal)
                if (currentUser?.role === 'super_admin') {
                    const { data: catData } = await api.get('/categories');
                    setAllCategories(catData);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                if (error.response?.status === 403) {
                    showToast("Access Denied.", "error");
                }
            }
        };
        fetchData();
    }, [currentUser, showToast]);

    // Delete Handler
    const deleteHandler = async (id) => {
        // Prevent deleting yourself
        if (id === currentUser._id) {
            showToast("You cannot delete your own account", "error");
            return;
        }

        const isConfirmed = await confirm("Delete User", "Are you sure you want to delete this user? This action cannot be undone.");
        if (!isConfirmed) return;

        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            showToast("User deleted successfully", "success");
        } catch (error) {
            console.error("Delete error:", error);
            showToast(error.response?.data?.message || "Failed to delete user", "error");
        }
    };

    const openAccessModal = (user) => {
        if (currentUser?.role !== 'super_admin') {
            showToast("Access Denied: Only Super Admin can manage access", "error");
            return;
        }
        if (user.role === 'super_admin') return;

        setSelectedUser(user);
        setAccessForm({
            role: user.role, // Set current role
            permissions: {
                orders: user.permissions?.orders || false,
                returns: user.permissions?.returns || false,
                complaints: user.permissions?.complaints || false,
                inquiries: user.permissions?.inquiries || false,
                users: user.permissions?.users || false,
                products: user.permissions?.products || false,
                categories: user.permissions?.categories || false,
                coupons: user.permissions?.coupons || false,
                settings: user.permissions?.settings || false,
                finance: user.permissions?.finance || false
            },
            assignedCategories: user.assignedCategories || [] // Populate
        });
        setIsRoleEditing(false); // Reset edit mode
        setIsAccessModalOpen(true);
    };

    const handleAccessSave = async () => {
        try {
            const newRole = accessForm.role;

            // Unified Update Call (Role + Permissions + Categories)
            await api.put(`/admin/management/users/${selectedUser._id}/access`, {
                role: newRole,
                permissions: accessForm.permissions,
                categories: accessForm.assignedCategories
            });

            // Update Local State
            setUsers(users.map(u => {
                if (u._id === selectedUser._id) {
                    return {
                        ...u,
                        role: newRole,
                        permissions: accessForm.permissions,
                        assignedCategories: accessForm.assignedCategories
                    };
                }
                return u;
            }));

            showToast(`Access rights updated for ${selectedUser.name}`, "success");
            setIsAccessModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to update access rights', 'error');
        }
    };

    const togglePermission = (key) => {
        setAccessForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const toggleCategory = (catId) => {
        setAccessForm(prev => {
            const current = prev.assignedCategories;
            const updated = current.includes(catId)
                ? current.filter(id => id !== catId)
                : [...current, catId];
            return { ...prev, assignedCategories: updated };
        });
    };

    const copyToClipboard = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        showToast('Email copied to clipboard', 'success');
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    // Calculate Stats
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;

    // Filtered Users for Display
    const displayedUsers = users.filter(user => {
        // Role Filter matches
        const roleMatch = filter === 'all' || user.role === filter;

        // Search Filter matches
        const query = searchQuery.toLowerCase();
        const searchMatch =
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.phoneNumber?.includes(query);

        return roleMatch && searchMatch;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1>
                <Link to="/admin/users/create" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus className="h-5 w-5" />
                    Add User
                </Link>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white transition-colors"
                    placeholder="Search by name, email, or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Stats Cards */}
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {currentUser?.role === 'super_admin' && (
                    <div
                        onClick={() => setFilter(filter === 'admin' ? 'all' : 'admin')}
                        className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border cursor-pointer transition-all ${filter === 'admin'
                            ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-900/10'
                            : 'border-gray-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admins</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{adminCount}</p>
                            </div>
                            <div className={`p-2.5 rounded-full transition-colors ${filter === 'admin' ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                )}

                <div
                    onClick={() => setFilter(filter === 'finance' ? 'all' : 'finance')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border cursor-pointer transition-all ${filter === 'finance'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Finance</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{users.filter(u => u.role === 'finance').length}</p>
                        </div>
                        <div className={`p-2.5 rounded-full transition-colors ${filter === 'finance' ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                            <Wallet className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setFilter(filter === 'seller_admin' ? 'all' : 'seller_admin')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border cursor-pointer transition-all ${filter === 'seller_admin'
                        ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/50 dark:bg-orange-900/10'
                        : 'border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller Admin</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{users.filter(u => u.role === 'seller_admin').length}</p>
                        </div>
                        <div className={`p-2.5 rounded-full transition-colors ${filter === 'seller_admin' ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                            <Store className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setFilter(filter === 'user' ? 'all' : 'user')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border cursor-pointer transition-all ${filter === 'user'
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customers</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{userCount}</p>
                        </div>
                        <div className={`p-2.5 rounded-full transition-colors ${filter === 'user' ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            <User className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">User</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Role (Click to Change)</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {displayedUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden shadow-sm border border-indigo-50">
                                            <UserAvatar user={user} />
                                        </div>
                                        {currentUser?.role === 'super_admin' || currentUser?.role === 'admin' ? (
                                            <Link
                                                to={`/admin/users/${user._id}`}
                                                className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
                                                title="View Full Profile"
                                            >
                                                {user.name}
                                            </Link>
                                        ) : (
                                            <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 group">
                                            <a href={`mailto:${user.email}`} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                                                {user.email}
                                            </a>
                                            <button
                                                onClick={() => copyToClipboard(user.email)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-opacity"
                                                title="Copy Email"
                                            >
                                                {copiedEmail === user.email ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => openAccessModal(user)}
                                            disabled={currentUser?.role !== 'super_admin'}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${user.role === 'admin'
                                                ? 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:border-purple-800'
                                                : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700'
                                                } ${currentUser?.role !== 'super_admin' ? 'cursor-default opacity-80' : ''}`}
                                            title={currentUser?.role === 'super_admin' ? "Manage Access & Permissions" : "View Only"}
                                        >
                                            {user.role === 'admin' ? (
                                                <>
                                                    <ShieldCheck className="h-3 w-3" />
                                                    <span>Admin Access</span>
                                                </>
                                            ) : user.role === 'finance' ? (
                                                <>
                                                    <Wallet className="h-3 w-3" />
                                                    <span>Finance Admin</span>
                                                </>
                                            ) : user.role === 'seller_admin' ? (
                                                <>
                                                    <Store className="h-3 w-3" />
                                                    <span>Seller Admin</span>
                                                </>
                                            ) : (
                                                <>
                                                    <User className="h-3 w-3" />
                                                    <span>Customer</span>
                                                </>
                                            )}
                                        </button>
                                        {/* Permission Badges Preview */}
                                        {(user.role === 'admin' || user.role === 'finance' || user.role === 'seller_admin') && (
                                            <div className="flex gap-1 mt-1.5 flex-wrap max-w-[200px]">
                                                {user.permissions?.orders && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Orders</span>}
                                                {user.permissions?.returns && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Returns</span>}
                                                {user.permissions?.complaints && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Complaints</span>}
                                                {user.permissions?.inquiries && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Inquiries</span>}
                                                {user.permissions?.products && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Products</span>}
                                                {user.permissions?.categories && <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Cats</span>}
                                                {user.permissions?.coupons && <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">Coupons</span>}
                                                {user.permissions?.finance && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Finance</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => deleteHandler(user._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {displayedUsers.map((user) => (
                    <div key={user._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold overflow-hidden shadow-sm border border-indigo-50 dark:border-indigo-800">
                                    <UserAvatar user={user} />
                                </div>
                                <div className="overflow-hidden">
                                    {currentUser?.role === 'super_admin' || currentUser?.role === 'admin' ? (
                                        <Link
                                            to={`/admin/users/${user._id}`}
                                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors block"
                                        >
                                            {user.name}
                                        </Link>
                                    ) : (
                                        <h3 className="font-bold text-slate-900 dark:text-white">{user.name}</h3>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <a href={`mailto:${user.email}`} className="text-sm text-gray-500 dark:text-gray-400 truncate hover:text-indigo-600">
                                            {user.email}
                                        </a>
                                        <button onClick={() => copyToClipboard(user.email)}>
                                            {copiedEmail === user.email ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => openAccessModal(user)}
                                disabled={currentUser?.role !== 'super_admin'}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${user.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    : user.role === 'finance'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : user.role === 'seller_admin'
                                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                                    } ${currentUser?.role !== 'super_admin' ? 'opacity-80' : ''}`}
                            >
                                {user.role === 'admin' ? (
                                    <ShieldCheck className="h-4 w-4" />
                                ) : user.role === 'finance' ? (
                                    <Wallet className="h-4 w-4" />
                                ) : user.role === 'seller_admin' ? (
                                    <Store className="h-4 w-4" />
                                ) : (
                                    <ShieldCheck className="h-4 w-4" />
                                )}
                                {user.role === 'admin' ? 'Manage Access' :
                                    user.role === 'finance' ? 'Finance Admin' :
                                        user.role === 'seller_admin' ? 'Seller Admin' :
                                            'Assign Role'}
                            </button>

                            <button
                                onClick={() => deleteHandler(user._id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Access Control Modal */}
            {isAccessModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Assign Responsibilities</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage access for <span className="font-semibold text-indigo-600">{selectedUser?.name}</span></p>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Role Toggle */}
                            {/* Role Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Role</p>
                                    {!isRoleEditing ? (
                                        <button
                                            onClick={() => setIsRoleEditing(true)}
                                            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded transition-colors"
                                        >
                                            <Edit2 className="h-3 w-3" /> Edit
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsRoleEditing(false);
                                                // Reset role to original if desired, but user might want to keep selection open to save
                                                // For now just toggle lock. Ideally we could revert to original role here if needed,
                                                // but standard UX often just re-locks or cancels.
                                                // Let's re-lock.
                                            }}
                                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                        >
                                            <X className="h-3 w-3" /> Cancel
                                        </button>
                                    )}
                                </div>
                                <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${!isRoleEditing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                                    {[
                                        { id: 'user', label: 'User (Customer)', icon: User },
                                        { id: 'admin', label: 'Admin', icon: ShieldCheck },
                                        { id: 'finance', label: 'Finance Admin', icon: Wallet },
                                        { id: 'seller_admin', label: 'Seller Admin', icon: Store },
                                    ].map((roleOption) => (
                                        <button
                                            key={roleOption.id}
                                            disabled={!isRoleEditing}
                                            onClick={() => setAccessForm({ ...accessForm, role: roleOption.id })}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${accessForm.role === roleOption.id
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                : 'border-gray-100 dark:border-slate-700 hover:border-indigo-300'
                                                }`}
                                        >
                                            <roleOption.icon className="h-4 w-4" />
                                            <span className="font-semibold text-xs">{roleOption.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2FA Toggle (Super Admin Control) */}
                            {(accessForm.role === 'admin' || accessForm.role === 'finance' || accessForm.role === 'seller_admin') && (
                                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">Two-Factor Auth</p>
                                            <p className="text-xs text-gray-500">Force enable/disable 2FA for this admin</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!selectedUser) return;
                                            const confirmMsg = selectedUser.isTwoFactorEnabled
                                                ? "Disable 2FA for this user?"
                                                : "Enable 2FA for this user?";

                                            const isConfirmed = await confirm("Toggle 2FA", confirmMsg);
                                            if (!isConfirmed) return;

                                            try {
                                                const { data } = await api.put(`/admin/management/users/${selectedUser._id}/2fa`);
                                                showToast(data.message, "success");

                                                // Update local state
                                                setSelectedUser(prev => ({ ...prev, isTwoFactorEnabled: data.isTwoFactorEnabled }));
                                                setUsers(users.map(u => u._id === selectedUser._id ? { ...u, isTwoFactorEnabled: data.isTwoFactorEnabled } : u));
                                            } catch (error) {
                                                console.error(error);
                                                showToast("Failed to toggle 2FA", "error");
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedUser?.isTwoFactorEnabled
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-400'
                                            }`}
                                    >
                                        {selectedUser?.isTwoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                            )}

                            {/* Permissions Grid */}
                            <div className={`space-y-3 transition-all duration-300 ${(accessForm.role === 'admin' || accessForm.role === 'finance' || accessForm.role === 'seller_admin') ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Work Assignment (Modules)</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { key: 'orders', label: 'Order Management', desc: 'Process orders, update status, delivery' },
                                        { key: 'returns', label: 'Return Management', desc: 'Handle return requests, pickups' },
                                        { key: 'products', label: 'Product Management', desc: 'Create, edit, delete products' },
                                        { key: 'categories', label: 'Category Management', desc: 'Manage product categories' },
                                        { key: 'coupons', label: 'Coupon Management', desc: 'Manage discount coupons' },
                                        { key: 'complaints', label: 'Complaint Management', desc: 'Resolve user complaints & tickets' },
                                        { key: 'inquiries', label: 'Inquiry Management', desc: 'View and reply to contact forms' },
                                        { key: 'finance', label: 'Finance Access', desc: 'Access to financial records & dashboard' },
                                        { key: 'settings', label: 'Store Settings', desc: 'View and modify global settings' },
                                    ].map((perm) => (
                                        <div
                                            key={perm.key}
                                            onClick={() => (accessForm.role !== 'user') && togglePermission(perm.key)}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${accessForm.permissions[perm.key]
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-100 dark:border-slate-700 hover:border-indigo-200'
                                                }`}
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">{perm.label}</p>
                                                <p className="text-xs text-gray-500">{perm.desc}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${accessForm.permissions[perm.key] ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-slate-600'
                                                }`}>
                                                {accessForm.permissions[perm.key] && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Category Scope Section */}
                            <div className={`space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700 transition-all duration-300 ${(accessForm.role === 'admin' || accessForm.role === 'finance' || accessForm.role === 'seller_admin') ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category Scope (Recommended)</p>
                                    <p className="text-xs text-gray-500 mt-1">Restrict admin to specific categories. Leave empty for access to ALL categories.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/30">
                                    {allCategories.map(cat => (
                                        <label key={cat._id} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={accessForm.assignedCategories.includes(cat._id)}
                                                onChange={() => toggleCategory(cat._id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-gray-300">{cat.name}</span>
                                        </label>
                                    ))}
                                    {allCategories.length === 0 && (
                                        <p className="text-xs text-gray-400 col-span-2 text-center py-2">No categories found in store.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50">
                            <button
                                onClick={() => setIsAccessModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAccessSave}
                                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserListScreen;
