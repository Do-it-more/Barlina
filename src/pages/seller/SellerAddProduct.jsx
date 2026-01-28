import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
    ArrowLeft,
    Package,
    Upload,
    Plus,
    X,
    Save,
    Send,
    Image as ImageIcon,
    IndianRupee,
    Tag,
    FileText,
    Layers,
    Truck,
    RotateCcw,
    Clock
} from 'lucide-react';

const SellerAddProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(!!id);
    const [categories, setCategories] = useState([]);

    const [product, setProduct] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category: '',
        brand: '',
        countInStock: '',
        image: '',
        images: [],
        colors: [],
        specifications: [],
        isCodAvailable: true,
        estimatedDeliveryDays: 7,
        returnPolicy: {
            isReturnable: true,
            returnWindowDays: 7,
            returnType: 'REFUND'
        },
        listingStatus: 'DRAFT'
    });

    const [newColor, setNewColor] = useState('');
    const [newSpec, setNewSpec] = useState({ heading: '', key: '', value: '' });

    const isEditMode = !!id;
    const isLiveEditing = isEditMode && product.listingStatus === 'APPROVED';

    useEffect(() => {
        fetchCategories();
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchProduct = async () => {
        setFetchLoading(true);
        try {
            const { data } = await api.get(`/products/${id}`);
            setProduct({
                name: data.name || '',
                description: data.description || '',
                price: data.price || '',
                discountPrice: data.discountPrice || '',
                category: data.category || '',
                brand: data.brand || '',
                countInStock: data.countInStock || '',
                image: data.image || '',
                images: data.images || [],
                colors: data.colors || [],
                specifications: data.specifications || [],
                isCodAvailable: data.isCodAvailable !== false,
                estimatedDeliveryDays: data.estimatedDeliveryDays || 7,
                returnPolicy: data.returnPolicy || { isReturnable: true, returnWindowDays: 7, returnType: 'REFUND' },
                listingStatus: data.listingStatus || 'DRAFT'
            });
        } catch (error) {
            showToast('Failed to load product', 'error');
            navigate('/seller/products');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProduct(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleReturnPolicyChange = (field, value) => {
        setProduct(prev => ({
            ...prev,
            returnPolicy: { ...prev.returnPolicy, [field]: value }
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProduct(prev => ({ ...prev, image: data.url }));
            showToast('Image uploaded successfully', 'success');
        } catch (error) {
            showToast('Failed to upload image', 'error');
        }
    };

    const handleAdditionalImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProduct(prev => ({ ...prev, images: [...prev.images, data.url] }));
            showToast('Image added', 'success');
        } catch (error) {
            showToast('Failed to upload image', 'error');
        }
    };

    const removeAdditionalImage = (index) => {
        setProduct(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const addColor = () => {
        const colorToAdd = newColor.trim();
        if (colorToAdd && !product.colors.includes(colorToAdd)) {
            setProduct(prev => ({ ...prev, colors: [...prev.colors, colorToAdd] }));
            setNewColor('');
        }
    };

    const removeColor = (color) => {
        setProduct(prev => ({
            ...prev,
            colors: prev.colors.filter(c => c !== color)
        }));
    };

    const addSpecification = () => {
        if (newSpec.heading && newSpec.key && newSpec.value) {
            const existingSection = product.specifications.find(s => s.heading === newSpec.heading);
            if (existingSection) {
                setProduct(prev => ({
                    ...prev,
                    specifications: prev.specifications.map(s =>
                        s.heading === newSpec.heading
                            ? { ...s, items: [...s.items, { key: newSpec.key, value: newSpec.value }] }
                            : s
                    )
                }));
            } else {
                setProduct(prev => ({
                    ...prev,
                    specifications: [...prev.specifications, {
                        heading: newSpec.heading,
                        items: [{ key: newSpec.key, value: newSpec.value }]
                    }]
                }));
            }
            setNewSpec({ heading: newSpec.heading, key: '', value: '' });
        }
    };

    const removeSpecItem = (headingIndex, itemIndex) => {
        setProduct(prev => ({
            ...prev,
            specifications: prev.specifications.map((section, i) => {
                if (i === headingIndex) {
                    const newItems = section.items.filter((_, j) => j !== itemIndex);
                    return newItems.length > 0 ? { ...section, items: newItems } : null;
                }
                return section;
            }).filter(Boolean)
        }));
    };

    const validateProduct = () => {
        const errors = [];
        if (!product.name) errors.push('Product name is required');
        if (!product.description) errors.push('Description is required');
        if (!product.price || product.price <= 0) errors.push('Valid price is required');
        if (!product.category) errors.push('Category is required');
        if (!product.brand) errors.push('Brand is required');
        if (!product.image) errors.push('Main image is required');
        if (!product.countInStock && product.countInStock !== 0) errors.push('Stock count is required');

        return errors;
    };

    const handleSubmit = async (submitForReview = false) => {
        const errors = validateProduct();
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...product,
                price: Number(product.price),
                discountPrice: Number(product.discountPrice) || 0,
                countInStock: Number(product.countInStock),
                estimatedDeliveryDays: Number(product.estimatedDeliveryDays),
                submitForReview
            };

            if (isLiveEditing) {
                // Filter payload for live products to avoid backend errors
                const livePayload = {
                    price: payload.price,
                    discountPrice: payload.discountPrice,
                    countInStock: payload.countInStock
                };
                await api.put(`/sellers/products/${id}`, livePayload);
                showToast('Price and Stock updated successfully!', 'success');
            } else if (isEditMode) {
                await api.put(`/sellers/products/${id}`, payload);
                showToast('Product updated successfully!', 'success');
            } else {
                await api.post('/sellers/products', payload);
                showToast(submitForReview ? 'Product submitted for review!' : 'Product saved as draft!', 'success');
            }

            navigate('/seller/products');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save product', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/seller/products')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isEditMode ? 'Update your product details' : 'Fill in the details to create a new product'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-indigo-600" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Product Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={product.name}
                                    onChange={handleChange}
                                    placeholder="Enter product name"
                                    disabled={isLiveEditing}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 ${isLiveEditing ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Category *</label>
                                <select
                                    name="category"
                                    value={product.category}
                                    onChange={handleChange}

                                    disabled={isLiveEditing}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 ${isLiveEditing ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Brand *</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={product.brand}
                                    onChange={handleChange}
                                    placeholder="Enter brand name"

                                    disabled={isLiveEditing}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 ${isLiveEditing ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    name="description"
                                    value={product.description}
                                    onChange={handleChange}
                                    placeholder="Describe your product in detail"
                                    rows={4}

                                    disabled={isLiveEditing}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 ${isLiveEditing ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <IndianRupee className="h-5 w-5 text-indigo-600" />
                            Pricing & Stock
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={product.price}
                                    onChange={handleChange}
                                    placeholder="000"
                                    min="0"
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Price (₹)</label>
                                <input
                                    type="number"
                                    name="discountPrice"
                                    value={product.discountPrice}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                    min="0"
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Stock Count *</label>
                                <input
                                    type="number"
                                    name="countInStock"
                                    value={product.countInStock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-indigo-600" />
                            Product Images
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Main Image *</label>
                                <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center">
                                    {product.image ? (
                                        <div className="relative">
                                            <img src={product.image} alt="Main" className="w-full h-40 object-cover rounded-lg" />
                                            <button
                                                onClick={() => setProduct(prev => ({ ...prev, image: '' }))}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload main image</p>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        </label>
                                    )}
                                    {isLiveEditing && (
                                        <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center backdrop-blur-[1px] rounded-lg z-10 cursor-not-allowed">
                                            <span className="bg-white px-2 py-1 rounded text-xs font-bold text-gray-500 shadow-sm border border-gray-200">Cannot edit</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Additional Images</label>
                                <div className="relative grid grid-cols-3 gap-2">
                                    {product.images.map((img, idx) => (
                                        <div key={idx} className="relative">
                                            <img src={img} alt={`Additional ${idx}`} className="w-full h-20 object-cover rounded-lg" />
                                            <button
                                                onClick={() => removeAdditionalImage(idx)}
                                                className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {product.images.length < 4 && (
                                        <label className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg h-20 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <Plus className="h-6 w-6 text-gray-400" />
                                            <input type="file" accept="image/*" onChange={handleAdditionalImageUpload} className="hidden" />
                                        </label>
                                    )}
                                    {isLiveEditing && (
                                        <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center backdrop-blur-[1px] rounded-lg z-10 cursor-not-allowed"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colors */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-600" />
                            Colors (Optional)
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {product.colors.map((color, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-sm">
                                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></span>
                                    {color}
                                    <button onClick={() => removeColor(color)} className="ml-1 text-gray-500 hover:text-red-500">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addColor()}
                                placeholder="e.g., Red, #FF0000"
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                            />
                            <button
                                type="button"
                                onClick={addColor}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Delivery & Return */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-indigo-600" />
                            Delivery & Returns
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Estimated Delivery (Days)</label>
                                <input
                                    type="number"
                                    name="estimatedDeliveryDays"
                                    value={product.estimatedDeliveryDays}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Return Window (Days)</label>
                                <input
                                    type="number"
                                    value={product.returnPolicy.returnWindowDays}
                                    onChange={(e) => handleReturnPolicyChange('returnWindowDays', Number(e.target.value))}
                                    min="0"
                                    max="90"
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Return Type</label>
                                <select
                                    value={product.returnPolicy.returnType}
                                    onChange={(e) => handleReturnPolicyChange('returnType', e.target.value)}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                >
                                    <option value="REFUND">Refund Only</option>
                                    <option value="REPLACEMENT">Replacement Only</option>
                                    <option value="BOTH">Both</option>
                                    <option value="NO_RETURN">No Returns</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isCodAvailable"
                                    checked={product.isCodAvailable}
                                    onChange={handleChange}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm">Cash on Delivery Available</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={product.returnPolicy.isReturnable}
                                    onChange={(e) => handleReturnPolicyChange('isReturnable', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm">Returnable</span>
                            </label>
                        </div>
                    </div>

                    {isLiveEditing && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                This product is <strong>Live</strong>. You can only update <strong>Price</strong> and <strong>Stock</strong> instantly.
                                To update other details, please delete and recreate or contact support.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                        onClick={() => navigate('/seller/products')}
                        className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={loading || isLiveEditing}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${isLiveEditing ? 'hidden' : ''}`}
                    >
                        <Send className="h-4 w-4" />
                        {loading ? 'Submitting...' : 'Submit for Review'}
                    </button>
                    {isLiveEditing && (
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? 'Updating...' : 'Update Price & Stock'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerAddProduct;
