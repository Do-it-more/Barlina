import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
    User,
    Building2,
    Mail,
    Phone,
    MapPin,
    Edit3,
    Save,
    X,
    Loader,
    CheckCircle,
    AlertCircle,
    Store,
    Tag,
    Globe,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const SellerProfile = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [seller, setSeller] = useState(null);
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        sellerType: '',
        businessCategory: '',
        businessAddress: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        }
    });

    useEffect(() => {
        fetchSellerProfile();
    }, []);

    const fetchSellerProfile = async () => {
        try {
            const { data } = await api.get('/sellers/profile');
            setSeller(data);
            setFormData({
                businessName: data.businessName || '',
                ownerName: data.ownerName || '',
                email: data.email || '',
                phone: data.phone || '',
                sellerType: data.sellerType || '',
                businessCategory: data.businessCategory || '',
                businessAddress: data.businessAddress || {
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India'
                }
            });
        } catch (error) {
            showToast('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            businessAddress: { ...prev.businessAddress, [field]: value }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/sellers/profile', {
                businessName: formData.businessName,
                ownerName: formData.ownerName,
                email: formData.email,
                phone: formData.phone,
                businessAddress: formData.businessAddress
            });
            showToast('Profile updated successfully', 'success');
            setIsEditing(false);
            fetchSellerProfile();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'APPROVED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'PENDING_VERIFICATION': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            'UNDER_REVIEW': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'REJECTED': 'bg-red-500/20 text-red-400 border-red-500/30',
            'SUSPENDED': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return statusColors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Store className="h-6 w-6 text-violet-500" />
                            Business Profile
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your business information
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {seller && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(seller.status)}`}>
                                {seller.status?.replace(/_/g, ' ')}
                            </span>
                        )}
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Business Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-violet-500" />
                            Business Information
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Business Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white font-medium">{formData.businessName || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Owner Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.ownerName}
                                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white font-medium">{formData.ownerName || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                <Mail className="w-4 h-4 inline mr-1" /> Email
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{formData.email || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                <Phone className="w-4 h-4 inline mr-1" /> Phone
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{formData.phone || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                <Tag className="w-4 h-4 inline mr-1" /> Business Category
                            </label>
                            <p className="text-gray-900 dark:text-white">{formData.businessCategory || '-'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Seller Type
                            </label>
                            <p className="text-gray-900 dark:text-white">{formData.sellerType || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Address Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-violet-500" />
                            Business Address
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Street Address</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.businessAddress.street}
                                    onChange={(e) => handleAddressChange('street', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{formData.businessAddress.street || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">City</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.businessAddress.city}
                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{formData.businessAddress.city || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">State</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.businessAddress.state}
                                    onChange={(e) => handleAddressChange('state', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{formData.businessAddress.state || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pincode</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.businessAddress.pincode}
                                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white">{formData.businessAddress.pincode || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Country</label>
                            <p className="text-gray-900 dark:text-white">{formData.businessAddress.country || 'India'}</p>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                {seller && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-violet-500" />
                                Account Details
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Seller ID</label>
                                <p className="text-gray-900 dark:text-white font-mono text-lg font-bold">{seller.user?._id?.slice(-6).toUpperCase() || seller._id?.slice(-6).toUpperCase()}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Commission Rate</label>
                                <p className="text-gray-900 dark:text-white">{seller.commissionPercentage}%</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member Since</label>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(seller.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SellerProfile;
