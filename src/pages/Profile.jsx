import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, Mail, Phone, Package, AlertCircle, Clock, CheckCircle, XCircle, X, Plus, Image, Video, Trash2, UploadCloud, MapPin, ChevronDown, ChevronUp, Camera, Edit2, Save, LogOut, Shield, ShieldCheck, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AddressBook from '../components/profile/AddressBook';
import Wallet from '../components/profile/Wallet';
const Profile = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [complaints, setComplaints] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [expandedComplaintId, setExpandedComplaintId] = useState(null);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [tempAddress, setTempAddress] = useState({});
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const { setUserData } = useAuth();

    // Super Admin Security States
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [emailForm, setEmailForm] = useState({ email: '' });
    const [phoneForm, setPhoneForm] = useState({ phoneNumber: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [securityOtp, setSecurityOtp] = useState('');
    const [imageError, setImageError] = useState(false);

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        // Use the env var or default to localhost:5001
        let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

        // Robustly remove '/api' and any trailing slashes to get the root (e.g., http://localhost:5001)
        let rootUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

        // Ensure path starts with a slash
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        return `${rootUrl}${cleanPath}`;
    };

    useEffect(() => {
        setImageError(false);
    }, [user?.profilePhoto]);

    // Prevent body and html scroll when modal is open
    useEffect(() => {
        if (showComplaintModal) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [showComplaintModal]);

    useEffect(() => {
        if (user) {
            // Handle both legacy string and new object address
            if (typeof user.address === 'string') {
                setTempAddress({ street: user.address });
            } else {
                setTempAddress(user.address || {});
            }
        }
        setTempName(user.name || '');
        setPhoneForm({ phoneNumber: user.phoneNumber || '' });
    }, [user]);

    const toggleComplaint = (id) => {
        setExpandedComplaintId(expandedComplaintId === id ? null : id);
    };

    const handleProfilePhotoUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const { data } = await api.put('/users/profile-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUserData(data); // key: update context
            showToast('Profile photo updated!', 'success');
        } catch (error) {
            console.error("Failed to update profile photo", error);
            showToast("Failed to update profile photo", "error");
        }
    };

    const handleDeleteProfilePhoto = async () => {
        const isConfirmed = await confirm('Remove Photo', "Are you sure you want to remove your profile photo?");
        if (!isConfirmed) return;
        try {
            const { data } = await api.delete('/users/profile-photo');
            setUserData(data);
            showToast("Profile photo removed!", "success");
        } catch (error) {
            console.error("Failed to remove profile photo", error);
            showToast("Failed to remove profile photo", "error");
        }
    };

    const handleDeleteAccount = async () => {
        const isConfirmed = await confirm('Delete Account', "Are you sure you want to permanently delete your account? This action cannot be undone.");
        if (isConfirmed) {
            try {
                await api.delete('/users/profile');
                showToast("Account deleted successfully", "success");

                // Perform cleanup
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                window.location.href = '/login';
            } catch (error) {
                console.error("Failed to delete account", error);
                showToast(error.response?.data?.message || 'Failed to delete account', 'error');
            }
        }
    };

    const handleAddressUpdate = async () => {
        try {
            const cleanAddress = {
                street: tempAddress.street || '',
                addressLine2: tempAddress.addressLine2 || '',
                city: tempAddress.city || '',
                state: tempAddress.state || '',
                postalCode: tempAddress.postalCode || '',
                country: tempAddress.country || '',
                phoneNumber: tempAddress.phoneNumber || ''
            };

            const { data } = await api.put('/users/profile', { address: cleanAddress });
            setUserData(data);
            setIsEditingAddress(false);
            showToast("Address updated!", "success");
        } catch (error) {
            console.error("Failed to update address", error);
            showToast(error.response?.data?.message || "Failed to update address", "error");
        }
    };

    const handleNameUpdate = async () => {
        try {
            const { data } = await api.put('/users/profile', { name: tempName });
            setUserData(data);
            setIsEditingName(false);
            showToast("Name updated!", "success");
        } catch (error) {
            console.error("Failed to update name", error);
            showToast("Failed to update name", "error");
        }
    };

    const fetchData = async () => {
        try {
            const [complaintsRes, ordersRes] = await Promise.all([
                api.get('/complaints/mycomplaints'),
                api.get('/orders/myorders')
            ]);
            setComplaints(complaintsRes.data);
            setOrders(ordersRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (user?.role === 'super_admin' || user?.role === 'admin') {
            checkTwoFactorStatus();
        }
    }, [user]);

    const checkTwoFactorStatus = async () => {
        try {
            const { data } = await api.get('/users/me');
            setIsTwoFactorEnabled(data.isTwoFactorEnabled);
            setEmailForm({ email: data.email });
        } catch (error) {
            console.error(error);
        }
    };

    const sendSecurityOtp = async (e) => {
        if (e) e.preventDefault();
        try {
            await api.post('/users/send-security-otp');
            setOtpSent(true);
            showToast('Security verification code sent to your email', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to send security code', 'error');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Validation
        if (user.role === 'super_admin' && !securityOtp) {
            showToast('Please enter the security verification code', 'error');
            return;
        }

        try {
            const payload = { ...passwordForm };
            if (user.role === 'super_admin') {
                payload.otp = securityOtp;
            }

            await api.put('/users/password', payload);
            showToast('Password updated successfully', 'success');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setSecurityOtp('');
            setOtpSent(false); // Reset flow
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update password', 'error');
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put('/users/profile', { email: emailForm.email });
            setUserData(data);
            showToast('Email updated successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update email', 'error');
        }
    };

    const handlePhoneUpdate = async (e) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(phoneForm.phoneNumber)) {
            showToast('Phone number must be exactly 10 digits', 'error');
            return;
        }
        try {
            const { data } = await api.put('/users/profile', { phoneNumber: phoneForm.phoneNumber });
            setUserData(data);
            showToast('Phone number updated successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update phone number', 'error');
        }
    };

    const toggleTwoFactor = async () => {
        try {
            const { data } = await api.put('/users/2fa');
            setIsTwoFactorEnabled(data.isTwoFactorEnabled);
            showToast(data.message, 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to toggle 2FA', 'error');
        }
    };

    const submitComplaint = async (e) => {
        e.preventDefault();
        if (!selectedOrderId) {
            setMessage({ type: 'error', text: 'Please select an order' });
            return;
        }
        setStatusMessage('Starting submission...');
        setMessage({ type: '', text: '' });

        let uploadedImagePaths = [];
        let uploadedVideoPath = '';

        try {
            // Upload Images
            if (selectedImages.length > 0) {
                setStatusMessage('Uploading images...');
                const formData = new FormData();
                selectedImages.forEach(file => {
                    formData.append('files', file);
                });

                // Note: /upload/multiple route needs to be verified if it uses 'files' or something else.
                // My backend route uses `upload.array('files', 5)`. Correct.
                const { data } = await api.post('/upload/multiple', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedImagePaths = data;
            }

            // Upload Video
            if (selectedVideo) {
                setStatusMessage('Uploading video (this may take a while)...');
                const formData = new FormData();
                formData.append('image', selectedVideo); // Reusing 'image' field for single upload middleware

                const { data } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedVideoPath = data;
            }

            setStatusMessage('Saving details...');
            await api.post('/complaints', {
                orderId: selectedOrderId,
                subject,
                description,
                images: uploadedImagePaths,
                video: uploadedVideoPath
            });

            setMessage({ type: 'success', text: 'Complaint submitted successfully.' });
            fetchData();
            setTimeout(() => {
                setShowComplaintModal(false);
                setSubject('');
                setDescription('');
                setSelectedOrderId('');
                setSelectedImages([]);
                setSelectedVideo(null);
                setImagePreviews([]);
                setMessage({ type: '', text: '' });
            }, 2000);
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message ||
                (typeof error.response?.data === 'string' ? error.response.data : '') ||
                error.message ||
                'Failed to submit complaint';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setStatusMessage('');
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedImages.length > 4) {
            showToast("You can only upload up to 4 images", "error");
            return;
        }
        setSelectedImages(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newImages = [...selectedImages];
        newImages.splice(index, 1);
        setSelectedImages(newImages);

        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* User Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center">
                            <div
                                className="w-24 h-24 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4 relative cursor-pointer group"
                                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                            >
                                {user?.profilePhoto && !imageError ? (
                                    <div className="w-full h-full rounded-full overflow-hidden">
                                        <img
                                            src={user.profilePhoto}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{user?.name?.charAt(0).toUpperCase()}</span>
                                )}

                                {/* Hover Overlay Hint */}
                                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>

                                {/* Dropdown Menu */}
                                {showPhotoOptions && (
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-gray-100 dark:border-slate-600 z-50 overflow-hidden py-1">
                                        <button
                                            className="w-full relative flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-left"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Camera className="h-4 w-4" />
                                            <span>Change Photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    handleProfilePhotoUpdate(e);
                                                    setShowPhotoOptions(false);
                                                }}
                                            />
                                        </button>

                                        {user?.profilePhoto && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProfilePhoto();
                                                    setShowPhotoOptions(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span>Remove Photo</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowPhotoOptions(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-left border-t border-gray-100 dark:border-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditingName ? (
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="text-center font-bold text-slate-900 dark:text-white bg-transparent border-b border-indigo-500 focus:outline-none w-full max-w-[200px]"
                                        autoFocus
                                    />
                                    <button onClick={handleNameUpdate} className="text-green-600 hover:text-green-700">
                                        <Save className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setIsEditingName(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 mb-1 group">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                                    <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            <div className="mb-6 flex flex-col gap-1 items-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                {user?.phoneNumber && <p className="text-sm text-gray-500 dark:text-gray-400">{user.phoneNumber}</p>}
                            </div>

                            {user?.role !== 'super_admin' && user?.role !== 'admin' && (
                                <div className="mt-4">
                                    {/* Address Book Logic Removed from here, moved to main content */}
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 space-y-3">
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 rounded-xl transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </button>
                                {user?.role !== 'super_admin' && user?.role !== 'admin' && (
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Account
                                    </button>
                                )}
                                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                    <Link to="/admin/dashboard" className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-xl transition-colors">
                                        <ShieldCheck className="h-4 w-4" />
                                        Go to Dashboard
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Address Book Section */}
                        {user?.role !== 'super_admin' && user?.role !== 'admin' && (
                            <>
                                <Wallet />
                                <AddressBook />
                            </>
                        )}

                        {/* Complaints Section */}
                        {user?.role !== 'super_admin' && user?.role !== 'admin' ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500" /> My Complaints
                                    </h3>
                                    <button
                                        onClick={() => setShowComplaintModal(true)}
                                        className="flex items-center gap-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        <Plus className="h-4 w-4" /> Raise New Complaint
                                    </button>
                                </div>
                                {complaints.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                        <p>No complaints raised yet.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {complaints.map((complaint) => (
                                            <div key={complaint._id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <div
                                                    className="flex items-center justify-between cursor-pointer"
                                                    onClick={() => toggleComplaint(complaint._id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getStatusColor(complaint.status).split(' ')[0]}`}>
                                                            <AlertCircle className={`h-5 w-5 ${getStatusColor(complaint.status).split(' ')[1]}`} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900 dark:text-white">{complaint.subject}</h4>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                ID: {complaint._id.slice(-6).toUpperCase()} • {new Date(complaint.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(complaint.status)}`}>
                                                            {complaint.status}
                                                        </span>
                                                        {expandedComplaintId === complaint._id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedComplaintId === complaint._id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-4 pl-14 space-y-3">
                                                                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                                                    <p className="font-medium mb-1">Description:</p>
                                                                    {complaint.description}
                                                                </div>
                                                                {complaint.adminResponse && (
                                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-sm">
                                                                        <p className="font-bold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-2">
                                                                            <ShieldCheck className="h-4 w-4" /> Admin Response
                                                                        </p>
                                                                        <p className="text-blue-700 dark:text-blue-300">{complaint.adminResponse}</p>
                                                                    </div>
                                                                )}
                                                                {(complaint.images?.length > 0 || complaint.video) && (
                                                                    <div className="flex gap-2 mt-2">
                                                                        {complaint.images?.map((img, i) => (
                                                                            <div key={i} className="flex flex-col gap-1">
                                                                                <a href={getImageUrl(img)} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 hover:opacity-80 transition-opacity">
                                                                                    <img src={getImageUrl(img)} alt="Evidence" className="w-full h-full object-cover" />
                                                                                </a>
                                                                                {/* Debug Info - Remove after fixing */}
                                                                                {/* <span className="text-[8px] text-gray-400 break-all w-16 leading-tight">{getImageUrl(img)}</span> */}
                                                                            </div>
                                                                        ))}
                                                                        {complaint.video && (
                                                                            <a href={getImageUrl(complaint.video)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-16 h-16 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 hover:opacity-80 transition-opacity" title="View Video">
                                                                                <Video className="h-6 w-6 text-indigo-500" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ... Super Admin Section ...
                            <div className="space-y-6">
                                {user?.role === 'super_admin' && (
                                    <>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <User className="h-5 w-5 text-indigo-500" /> Account Settings
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Email Update */}
                                            <form onSubmit={handleEmailChange} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
                                                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <Mail className="h-4 w-4" /> Update Email
                                                </h4>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        value={emailForm.email}
                                                        onChange={(e) => setEmailForm({ email: e.target.value })}
                                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                        required
                                                    />
                                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </form>

                                            {/* Phone Update */}
                                            <form onSubmit={handlePhoneUpdate} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
                                                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <Phone className="h-4 w-4" /> Update Mobile
                                                </h4>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="tel"
                                                        value={phoneForm.phoneNumber}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setPhoneForm({ phoneNumber: val });
                                                        }}
                                                        maxLength={10}
                                                        placeholder="Mobile Number"
                                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                    />
                                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </>
                                )}

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 pt-4">
                                    <Shield className="h-5 w-5 text-indigo-500" /> Security
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 2FA Section - SUPER ADMIN ONLY */}
                                    {user?.role === 'super_admin' && (
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Lock className="h-4 w-4" /> Two-Factor Authentication
                                            </h4>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {isTwoFactorEnabled ? 'Secure your account with 2FA.' : 'Add an extra layer of security.'}
                                                </div>
                                                <button
                                                    onClick={toggleTwoFactor}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isTwoFactorEnabled
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                                        : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                                                        }`}
                                                >
                                                    {isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Password Section */}
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Key className="h-4 w-4" /> Change Password
                                        </h4>
                                        <form onSubmit={handlePasswordChange} className="space-y-4">
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.current ? "text" : "password"}
                                                        placeholder="Current Password"
                                                        value={passwordForm.currentPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    >
                                                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? "text" : "password"}
                                                        placeholder="New Password"
                                                        value={passwordForm.newPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
                                                        required
                                                        minLength={6}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    >
                                                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.confirm ? "text" : "password"}
                                                        placeholder="Confirm New Password"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                        className={`w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all pr-12 ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-500'}`}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    >
                                                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
                                                Update Password
                                            </button>
                                        </form>

                                        {/* OTP Input for Super Admin */}
                                        {user?.role === 'super_admin' && otpSent && (
                                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg">
                                                <label className="block text-xs font-bold text-yellow-800 dark:text-yellow-500 mb-2 uppercase tracking-wide">
                                                    Security Verification Code
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter 6-digit Code"
                                                    value={securityOtp}
                                                    onChange={(e) => setSecurityOtp(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 mb-2"
                                                />
                                                <p className="text-xs text-yellow-700 dark:text-yellow-600">
                                                    A code has been sent to your email. It is required to change your password.
                                                </p>
                                            </div>
                                        )}

                                        {user?.role === 'super_admin' && !otpSent && (
                                            <div className="mt-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={sendSecurityOtp}
                                                    className="text-xs text-indigo-600 font-bold hover:underline"
                                                >
                                                    Need to change password? Get Code first.
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </main >
            <Footer />

            {/* Complaint Modal - Using Portal for z-index and scroll fix */}
            {showComplaintModal && createPortal(
                <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" /> Raise New Complaint
                            </h3>
                            <button onClick={() => setShowComplaintModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            {message.text && (
                                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={submitComplaint} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Order</label>
                                    <select
                                        value={selectedOrderId}
                                        onChange={(e) => setSelectedOrderId(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">-- Choose an Order --</option>
                                        {orders.map(order => (
                                            <option key={order._id} value={order._id}>
                                                {order.invoiceNumber ? `Invoice #${order.invoiceNumber}` : `Order #${order._id.slice(-6).toUpperCase()}`} - {new Date(order.createdAt).toLocaleDateString()} - ₹{order.totalPrice}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Subject</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">Select an issue</option>
                                        <option value="Damaged Product">Damaged Product</option>
                                        <option value="Wrong Item Received">Wrong Item Received</option>
                                        <option value="Product Quality Issue">Product Quality Issue</option>
                                        <option value="Size/Fit Issue">Size/Fit Issue</option>
                                        <option value="Delay in Delivery">Delay in Delivery</option>
                                        <option value="Payment Issue">Payment Issue</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        rows="4"
                                        placeholder="Please describe your issue in detail..."
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Attachments (Optional)</label>

                                    {/* Images */}
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 mb-2">Images (Max 4)</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {imagePreviews.map((src, index) => (
                                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {selectedImages.length < 4 && (
                                                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors">
                                                    <Image className="h-6 w-6 text-gray-400 group-hover:text-indigo-500" />
                                                    <span className="text-[10px] text-gray-500 mt-1">Add Image</span>
                                                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">Video (Max 1)</p>
                                        {!selectedVideo ? (
                                            <label className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 dark:bg-slate-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 cursor-pointer hover:border-indigo-500 transition-colors">
                                                <Video className="h-5 w-5 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-500">Upload Video</span>
                                                <input type="file" accept="video/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) setSelectedVideo(file);
                                                }} className="hidden" />
                                            </label>
                                        ) : (
                                            <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Video className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                                                    <span className="text-sm text-indigo-700 dark:text-indigo-300 truncate">{selectedVideo.name}</span>
                                                </div>
                                                <button type="button" onClick={() => setSelectedVideo(null)} className="text-red-500 hover:text-red-700 ml-2">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!!statusMessage}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {statusMessage || 'Submit Complaint'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
};

export default Profile;
