import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Upload, Loader, Link as LinkIcon, Image as ImageIcon, Camera, X, Trash2, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ProductEditScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const isEditMode = !!id;

    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [discountPrice, setDiscountPrice] = useState(0);
    const [images, setImages] = useState([]); // Store array of image URLs
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [countInStock, setCountInStock] = useState(0);
    const [isCodAvailable, setIsCodAvailable] = useState(true);
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState([]);

    // New States
    const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('');
    const [colors, setColors] = useState([]);

    const [colorInput, setColorInput] = useState('');

    // Return Policy State
    const [returnPolicy, setReturnPolicy] = useState({
        isReturnable: true,
        returnWindowDays: 7,
        returnType: 'REFUND'
    });

    // Specifications State
    const [specifications, setSpecifications] = useState([]);
    const [newSpecSection, setNewSpecSection] = useState('');
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');
    const [activeSpecSectionIndex, setActiveSpecSectionIndex] = useState(null);

    const [uploading, setUploading] = useState(false);

    // ... existing handlers ...

    const handleAddSpecSection = () => {
        if (newSpecSection.trim()) {
            setSpecifications([...specifications, { heading: newSpecSection.trim(), items: [] }]);
            setNewSpecSection('');
        }
    };

    const handleRemoveSpecSection = (index) => {
        const newSpecs = [...specifications];
        newSpecs.splice(index, 1);
        setSpecifications(newSpecs);
    };

    const handleAddSpecItem = (sectionIndex) => {
        if (newSpecKey.trim() && newSpecValue.trim()) {
            const newSpecs = [...specifications];
            newSpecs[sectionIndex].items.push({ key: newSpecKey.trim(), value: newSpecValue.trim() });
            setSpecifications(newSpecs);
            setNewSpecKey('');
            setNewSpecValue('');
        }
    };

    const handleRemoveSpecItem = (sectionIndex, itemIndex) => {
        const newSpecs = [...specifications];
        newSpecs[sectionIndex].items.splice(itemIndex, 1);
        setSpecifications(newSpecs);
    };
    const [imageInputMethod, setImageInputMethod] = useState('upload'); // 'upload', 'url', 'camera'
    const [urlInput, setUrlInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Camera state
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);

    const handleAddColor = () => {
        if (colorInput.trim()) {
            if (!colors.includes(colorInput.trim())) {
                setColors([...colors, colorInput.trim()]);
            }
            setColorInput('');
        }
    };

    const handleRemoveColor = (index) => {
        const newColors = [...colors];
        newColors.splice(index, 1);
        setColors(newColors);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories');
                setCategories(data);
                // Set default category if creating new product and categories exist
                if (!isEditMode && data.length > 0 && !category) {
                    setCategory(data[0].name);
                }
            } catch (error) {
                console.error("Failed to fetch categories");
            }
        };

        fetchCategories();

        if (isEditMode) {
            const fetchProduct = async () => {
                const { data } = await api.get(`/products/${id}`);
                setName(data.name);
                setPrice(data.price);
                setDiscountPrice(data.discountPrice || 0);
                // Handle backward compatibility or new array structure
                if (data.images && data.images.length > 0) {
                    setImages(data.images);
                } else if (data.image) {
                    setImages([data.image]);
                }
                setBrand(data.brand);
                setCategory(data.category);
                setCountInStock(data.countInStock);
                setIsCodAvailable(data.isCodAvailable !== undefined ? data.isCodAvailable : true);
                setEstimatedDeliveryDays(data.estimatedDeliveryDays || '');
                setColors(data.colors || []);
                setSpecifications(data.specifications || []);
                setDescription(data.description);
                if (data.returnPolicy) {
                    setReturnPolicy({
                        isReturnable: data.returnPolicy.isReturnable ?? true,
                        returnWindowDays: data.returnPolicy.returnWindowDays || 7,
                        returnType: data.returnPolicy.returnType || 'REFUND'
                    });
                }
            };
            fetchProduct();
        }
    }, [id, isEditMode]);

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (images.length >= 4) {
            showToast("Maximum 4 images allowed", "error");
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            const { data } = await api.post('/upload', formData, config);
            setImages([...images, data]);
            setUploading(false);
        } catch (error) {
            console.error(error);
            setUploading(false);
            showToast("Image upload failed", "error");
        }
    };

    const addUrlHandler = () => {
        if (!urlInput) return;
        if (images.length >= 4) {
            showToast("Maximum 4 images allowed", "error");
            return;
        }
        setImages([...images, urlInput]);
        setUrlInput('');
    };

    const removeImageHandler = (index) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const startCamera = async () => {
        if (images.length >= 4) {
            showToast("Maximum 4 images allowed", "error");
            return;
        }
        setImageInputMethod('camera');
        setShowCamera(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            showToast("Could not access camera", "error");
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const capturePhoto = async () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        canvas.toBlob(async (blob) => {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

            // Reuse upload logic
            const formData = new FormData();
            formData.append('image', file);
            setUploading(true);

            try {
                const config = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                };

                const { data } = await api.post('/upload', formData, config);
                setImages([...images, data]);
                setUploading(false);
                stopCamera();
            } catch (error) {
                console.error(error);
                setUploading(false);
                showToast("Image upload failed", "error");
            }
        }, 'image/jpeg');
    };


    const submitHandler = async (e) => {
        e.preventDefault();

        if (price < 0) {
            showToast("Price cannot be negative", "error");
            return;
        }
        if (countInStock < 0) {
            showToast("Stock count cannot be negative", "error");
            return;
        }
        if (discountPrice < 0) {
            showToast("Discount price cannot be negative", "error");
            return;
        }
        if (Number(discountPrice) > Number(price)) {
            showToast("Discount price cannot be greater than original price", "error");
            return;
        }

        setLoading(true);
        try {
            const productData = {
                name,
                price,
                discountPrice,
                images, // Send array of images
                image: images[0] || '', // Fallback for backward compatibility
                brand,
                category,
                countInStock,
                isCodAvailable,
                estimatedDeliveryDays,
                colors,
                specifications,
                description,
                returnPolicy
            };

            if (isEditMode) {
                await api.put(`/products/${id}`, productData);
            } else {
                await api.post('/products', productData);
            }
            showToast(`Product ${isEditMode ? 'updated' : 'created'} successfully`, "success");
            navigate('/admin/products');
        } catch (error) {
            console.error(error);
            showToast("Failed to save product", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Link to="/admin/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Products
            </Link>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                    {isEditMode ? 'Edit Product' : 'Create Product'}
                </h1>

                <form onSubmit={submitHandler} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter product name"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Price (₹)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={price}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setPrice('');
                                    } else {
                                        const num = Number(val);
                                        if (!isNaN(num) && num >= 0) {
                                            setPrice(num);
                                        }
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Offset Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={discountPrice}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setDiscountPrice('');
                                    } else {
                                        const num = Number(val);
                                        if (!isNaN(num) && num >= 0) {
                                            setDiscountPrice(num);
                                        }
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Optional"
                            />
                            <p className="text-xs text-gray-500">Set 0 for no discount</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Count</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={countInStock}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setCountInStock('');
                                    } else {
                                        const num = Number(val);
                                        if (!isNaN(num) && num >= 0) {
                                            setCountInStock(num);
                                        }
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Est. Delivery (Days)</label>
                            <input
                                type="number"
                                value={estimatedDeliveryDays}
                                onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Global Default"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use global store setting.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Colors</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={colorInput}
                                    onChange={(e) => setColorInput(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Color name or Hex code"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddColor();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddColor}
                                    className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((c, index) => (
                                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-sm">
                                        <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c.toLowerCase() }}></span>
                                        {c}
                                        <button type="button" onClick={() => handleRemoveColor(index)} className="text-red-500 hover:text-red-700">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Specifications Section */}
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Product Specifications</label>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSpecSection}
                                onChange={(e) => setNewSpecSection(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="New Section Heading (e.g. 'In The Box')"
                            />
                            <button
                                type="button"
                                onClick={handleAddSpecSection}
                                className="px-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                            >
                                Add Section
                            </button>
                        </div>

                        <div className="space-y-4">
                            {specifications.map((section, sIndex) => (
                                <div key={sIndex} className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{section.heading}</h3>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSpecSection(sIndex)}
                                            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                        >
                                            <Trash2 className="h-4 w-4" /> Remove Section
                                        </button>
                                    </div>

                                    {/* List Items */}
                                    <div className="space-y-2 mb-4">
                                        {section.items.map((item, iIndex) => (
                                            <div key={iIndex} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg text-sm border border-gray-100 dark:border-slate-700">
                                                <span className="font-medium text-gray-500 w-1/3">{item.key}</span>
                                                <span className="text-slate-900 dark:text-gray-200 flex-1">{item.value}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSpecItem(sIndex, iIndex)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Item Form */}
                                    <div className="flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100 dark:border-slate-700">
                                        <input
                                            type="text"
                                            value={activeSpecSectionIndex === sIndex ? newSpecKey : ''}
                                            onChange={(e) => {
                                                setActiveSpecSectionIndex(sIndex);
                                                setNewSpecKey(e.target.value);
                                            }}
                                            className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-transparent text-sm"
                                            placeholder="Label (e.g. Brand)"
                                        />
                                        <input
                                            type="text"
                                            value={activeSpecSectionIndex === sIndex ? newSpecValue : ''}
                                            onChange={(e) => {
                                                setActiveSpecSectionIndex(sIndex);
                                                setNewSpecValue(e.target.value);
                                            }}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-transparent text-sm"
                                            placeholder="Value (e.g. Portronics)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddSpecItem(sIndex)}
                                            className="bg-gray-100 dark:bg-slate-700 text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-600"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50">
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="isCodAvailable"
                                id="isCodAvailable"
                                checked={isCodAvailable}
                                onChange={(e) => setIsCodAvailable(e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6 transition-all duration-300"
                            />
                            <label htmlFor="isCodAvailable" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${isCodAvailable ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}></label>
                        </div>
                        <div>
                            <label htmlFor="isCodAvailable" className="block text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                                Cash on Delivery Available
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isCodAvailable ? 'Customers can pay with COD for this product.' : 'Online payment only for this product.'}
                            </p>
                        </div>
                    </div>

                    {/* Return Policy Section */}
                    <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Return Policy</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {returnPolicy.isReturnable ? 'Returns Enabled' : 'Non-Returnable'}
                                </span>
                                <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        id="isReturnable"
                                        checked={returnPolicy.isReturnable}
                                        onChange={(e) => setReturnPolicy({ ...returnPolicy, isReturnable: e.target.checked })}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6 transition-all duration-300"
                                    />
                                    <label htmlFor="isReturnable" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${returnPolicy.isReturnable ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}></label>
                                </div>
                            </div>
                        </div>

                        {returnPolicy.isReturnable && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Return Window (Days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="90"
                                        value={returnPolicy.returnWindowDays}
                                        onChange={(e) => setReturnPolicy({ ...returnPolicy, returnWindowDays: Number(e.target.value) })}
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Return Type</label>
                                    <select
                                        value={returnPolicy.returnType}
                                        onChange={(e) => setReturnPolicy({ ...returnPolicy, returnType: e.target.value })}
                                        className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="REFUND">Refund Only</option>
                                        <option value="REPLACEMENT">Replacement Only</option>
                                        <option value="BOTH">Refund or Replacement</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
                            <select
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand</label>
                            <input
                                type="text"
                                required
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Apple, Samsung, etc."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Product Images ({images.length}/4)
                        </label>

                        {/* Image Preview Grid */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={img}
                                            alt={`Product ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImageHandler(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input Methods */}
                        {images.length < 4 && !showCamera && (
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMethod('upload')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${imageInputMethod === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'}`}
                                    >
                                        <Upload className="h-4 w-4" /> Upload
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMethod('url')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${imageInputMethod === 'url' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'}`}
                                    >
                                        <LinkIcon className="h-4 w-4" /> URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200`}
                                    >
                                        <Camera className="h-4 w-4" /> Camera
                                    </button>
                                </div>

                                {imageInputMethod === 'upload' && (
                                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                                        {uploading ? (
                                            <div className="flex justify-center">
                                                <Loader className="animate-spin h-8 w-8 text-indigo-600" />
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="file"
                                                    onChange={uploadFileHandler}
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center">
                                                    <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG (max 4 images)</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {imageInputMethod === 'url' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        <button
                                            type="button"
                                            onClick={addUrlHandler}
                                            className="bg-indigo-600 text-white px-6 rounded-xl font-medium hover:bg-indigo-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Camera UI */}
                        {showCamera && (
                            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden max-w-2xl w-full relative">
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                    <div className="relative aspect-video bg-black">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4 flex justify-center bg-gray-50 dark:bg-slate-900">
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            disabled={uploading}
                                            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30"
                                        >
                                            {uploading ? <Loader className="animate-spin h-6 w-6" /> : <Camera className="h-6 w-6" />}
                                            {uploading ? 'Processing...' : 'Capture Photo'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            required
                            rows="4"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Product details..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader className="animate-spin h-5 w-5" />}
                        {isEditMode ? 'Update Product' : 'Create Product'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductEditScreen;
