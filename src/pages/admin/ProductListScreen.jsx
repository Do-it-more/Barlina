import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    ArrowUpDown,
    Truck,
    Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const ProductListScreen = () => {
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const [globalCodEnabled, setGlobalCodEnabled] = useState(true);

    // Stock Editing State
    const [editingStockId, setEditingStockId] = useState(null);
    const [tempStockValue, setTempStockValue] = useState('');

    const startEditingStock = (product) => {
        setEditingStockId(product._id);
        setTempStockValue(product.countInStock);
    };

    const saveStock = async (product) => {
        const newStock = parseInt(tempStockValue);
        if (isNaN(newStock) || newStock < 0) {
            showToast('Invalid stock value', 'error');
            setEditingStockId(null);
            return;
        }

        if (newStock === product.countInStock) {
            setEditingStockId(null);
            return;
        }

        const oldProducts = [...products];
        // Optimistic Update
        setProducts(products.map(p => p._id === product._id ? { ...p, countInStock: newStock } : p));
        setEditingStockId(null);

        try {
            await api.put(`/products/${product._id}`, { countInStock: newStock });
            showToast('Stock updated successfully', 'success');
        } catch (error) {
            setProducts(oldProducts);
            showToast('Failed to update stock', 'error');
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            setGlobalCodEnabled(data.isCodAvailable);
        } catch (error) {
            console.error("Failed to fetch settings");
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories");
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchSettings();
    }, []);

    const deleteHandler = async (id) => {
        const isConfirmed = await confirm('Delete Product', 'Are you sure you want to delete this product?');
        if (isConfirmed) {
            try {
                await api.delete(`/products/${id}`);
                setProducts(products.filter((p) => p._id !== id));
                showToast('Product deleted successfully', 'success');
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to delete product', 'error');
            }
        }
    };

    const toggleCodStatus = async (product) => {
        if (!globalCodEnabled) {
            showToast("Enable Global COD in Settings first", "error");
            return;
        }
        try {
            const updatedStatus = !product.isCodAvailable;
            // Optimistic update
            setProducts(products.map(p => p._id === product._id ? { ...p, isCodAvailable: updatedStatus } : p));

            await api.put(`/products/${product._id}`, {
                isCodAvailable: updatedStatus
            });
            showToast(`COD ${updatedStatus ? 'Enabled' : 'Disabled'}`, 'success');
        } catch (error) {
            // Revert on failure
            setProducts(products.map(p => p._id === product._id ? { ...p, isCodAvailable: product.isCodAvailable } : p));
            showToast('Failed to update COD status', 'error');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProducts = useMemo(() => {
        return [...products]
            .filter(product => !selectedCategory || product.category?.toLowerCase() === selectedCategory.toLowerCase())
            .sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
    }, [products, selectedCategory, sortConfig]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Products</h1>

                <div className="flex gap-4">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category.name}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <Link
                        to="/admin/products/create"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th
                                    className="p-4 font-semibold cursor-pointer hover:text-indigo-600 transition-colors select-none"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Product
                                        {sortConfig.key === 'name' && (
                                            <ArrowUpDown className={`h-4 w-4 ${sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} transition-transform`} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="p-4 font-semibold cursor-pointer hover:text-indigo-600 transition-colors select-none"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-2">
                                        Category
                                        {sortConfig.key === 'category' && (
                                            <ArrowUpDown className={`h-4 w-4 ${sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} transition-transform`} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="p-4 font-semibold cursor-pointer hover:text-indigo-600 transition-colors select-none"
                                    onClick={() => handleSort('price')}
                                >
                                    <div className="flex items-center gap-2">
                                        Price
                                        {sortConfig.key === 'price' && (
                                            <ArrowUpDown className={`h-4 w-4 ${sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} transition-transform`} />
                                        )}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold">Offer</th>
                                <th className="p-4 font-semibold">COD</th>
                                <th className="p-4 font-semibold">Stock</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {sortedProducts.map((product) => (
                                <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                                            />
                                            <span className="font-medium text-slate-900 dark:text-white line-clamp-1">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400 capitalize">{product.category}</td>
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                                        {product.discountPrice > 0 ? (
                                            <div className="flex flex-col">
                                                <span>₹{product.price}</span>
                                            </div>
                                        ) : (
                                            `₹${product.price}`
                                        )}
                                    </td>
                                    <td className="p-4 pb-0 pt-4">
                                        {product.discountPrice > 0 && product.price > 0 ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <motion.div
                                                    animate={{ scale: [1, 1.05, 1] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                                    className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm"
                                                >
                                                    <Flame className="h-3 w-3 fill-yellow-200 text-yellow-100" />
                                                    {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% LIVE OFFER
                                                </motion.div>
                                                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                                    ₹{product.discountPrice}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleCodStatus(product)}
                                            disabled={!globalCodEnabled}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${!globalCodEnabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : product.isCodAvailable !== false ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-600'}`}
                                            title={!globalCodEnabled ? "Global COD is disabled in Settings" : (product.isCodAvailable !== false ? "Disable COD" : "Enable COD")}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.isCodAvailable !== false ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        {editingStockId === product._id ? (
                                            <input
                                                type="number"
                                                autoFocus
                                                min="0"
                                                value={tempStockValue}
                                                onChange={(e) => setTempStockValue(e.target.value)}
                                                onBlur={() => saveStock(product)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveStock(product)}
                                                className="w-20 px-2 py-1 text-sm border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        ) : (
                                            <span
                                                onClick={() => product.isStockEnabled !== false && startEditingStock(product)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold select-none ${product.isStockEnabled === false ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 cursor-default' : 'cursor-pointer hover:opacity-80 transition-opacity'} ${product.isStockEnabled !== false && product.countInStock > 0
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : product.isStockEnabled !== false ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''
                                                    }`}
                                                title={product.isStockEnabled === false ? "Stock tracking disabled" : "Click to edit stock"}
                                            >
                                                {product.isStockEnabled === false ? 'Unlimited' : product.countInStock > 0 ? `${product.countInStock} in stock` : 'Out of Stock'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/admin/products/${product._id}/edit`}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => deleteHandler(product._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {sortedProducts.map((product) => (
                    <div key={product._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{product.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 capitalize">{product.category}</p>

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex flex-col">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            ₹{product.discountPrice > 0 ? product.discountPrice : product.price}
                                        </span>
                                        {product.discountPrice > 0 ? (
                                            <motion.div
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                                className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm"
                                            >
                                                <Flame className="h-3 w-3 fill-yellow-200 text-yellow-100" />
                                                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                                            </motion.div>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                                No Offer
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center mt-1 h-4">
                                        {product.discountPrice > 0 && (
                                            <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {editingStockId === product._id ? (
                                        <input
                                            type="number"
                                            autoFocus
                                            min="0"
                                            value={tempStockValue}
                                            onChange={(e) => setTempStockValue(e.target.value)}
                                            onBlur={() => saveStock(product)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveStock(product)}
                                            className="w-16 px-2 py-1 text-[10px] border border-indigo-500 rounded bg-white text-slate-900"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (product.isStockEnabled !== false) startEditingStock(product);
                                            }}
                                            className={`px-2 py-1 rounded-full text-[10px] font-bold ${product.isStockEnabled === false ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 cursor-default' : 'cursor-pointer'} ${product.isStockEnabled !== false && product.countInStock > 0
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : product.isStockEnabled !== false ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''
                                                }`}
                                        >
                                            {product.isStockEnabled === false ? 'Unlimited' : product.countInStock > 0 ? `${product.countInStock} Stock` : 'No Stock'}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">COD</span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleCodStatus(product); }}
                                            disabled={!globalCodEnabled}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${!globalCodEnabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : product.isCodAvailable !== false ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-600'}`}
                                            title={!globalCodEnabled ? "Global COD is disabled in Settings" : (product.isCodAvailable !== false ? "Disable COD" : "Enable COD")}
                                        >
                                            <span
                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${product.isCodAvailable !== false ? 'translate-x-5' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between items-end pl-2 border-l border-gray-100 dark:border-slate-700 ml-2">
                            <Link
                                to={`/admin/products/${product._id}/edit`}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            >
                                <Edit className="h-4 w-4" />
                            </Link>
                            <button
                                onClick={() => deleteHandler(product._id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
};

export default ProductListScreen;
