import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2, Check, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AddressBook = ({ onSelect, selectedId }) => {
    const [addresses, setAddresses] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        label: 'Home',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phoneNumber: '',
        isDefault: false
    });
    const { showToast } = useToast();

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get('/users/addresses');
            setAddresses(data);
        } catch (error) {
            console.error('Failed to fetch addresses', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/users/addresses/${editingId}`, formData);
                showToast('Address updated successfully', 'success');
            } else {
                await api.post('/users/addresses', formData);
                showToast('Address added successfully', 'success');
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData({
                label: 'Home',
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'India',
                phoneNumber: '',
                isDefault: false
            });
            fetchAddresses();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save address', 'error');
        }
    };

    const handleEdit = (address) => {
        setFormData({
            label: address.label,
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phoneNumber: address.phoneNumber,
            isDefault: address.isDefault
        });
        setEditingId(address._id);
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await api.delete(`/users/addresses/${id}`);
            showToast('Address deleted', 'success');
            fetchAddresses();
        } catch (error) {
            showToast('Failed to delete address', 'error');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    My Addresses
                </h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                )}
            </div>

            <div className="p-6">
                {isAdding ? (
                    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label (e.g. Home, Office)</label>
                                <input
                                    type="text"
                                    name="label"
                                    value={formData.label}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                                <textarea
                                    name="street"
                                    value={formData.street}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    rows="2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isDefault"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">Set as default address</label>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingId(null); }}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-500/30"
                            >
                                {editingId ? 'Update Address' : 'Save Address'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                            <div
                                key={address._id}
                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group ${(selectedId === address._id) || (!selectedId && address.isDefault)
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500'
                                        : 'border-transparent bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                                onClick={() => onSelect && onSelect(address)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 dark:text-white">{address.label}</span>
                                        {address.isDefault && (
                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold rounded-full">Default</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(address); }}
                                            className="p-1.5 bg-white dark:bg-slate-600 rounded-lg text-gray-500 hover:text-indigo-600 shadow-sm"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(address._id); }}
                                            className="p-1.5 bg-white dark:bg-slate-600 rounded-lg text-gray-500 hover:text-red-600 shadow-sm"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{address.street}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{address.city}, {address.state} - {address.postalCode}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{address.country}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                                    📞 {address.phoneNumber}
                                </p>

                                {selectedId === address._id && (
                                    <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400">
                                        <Check className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressBook;
