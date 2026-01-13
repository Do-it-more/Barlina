import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { Filter, SlidersHorizontal, ChevronDown, Loader, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductList = () => {
    const { category } = useParams();
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('keyword') || '';
    const queryCategory = searchParams.get('category') || '';

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [sortOption, setSortOption] = useState('newest');
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [selectedCategories, setSelectedCategories] = useState((category || queryCategory) ? [(category || queryCategory).toLowerCase()] : []);
    const [minRating, setMinRating] = useState(0);
    const [onlyInStock, setOnlyInStock] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Pass keyword to backend
                const { data } = await api.get(`/products?keyword=${keyword}`);
                setProducts(data);
                // We re-apply filtering logic client-side as well for price/category on top of the search result
                setFilteredProducts(data);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [keyword]); // Re-fetch when keyword changes

    // Update selected categories when URL param or query param changes
    useEffect(() => {
        const activeCategory = category || queryCategory;
        if (activeCategory) {
            setSelectedCategories([activeCategory.toLowerCase()]);
        } else {
            setSelectedCategories([]);
        }
    }, [category, queryCategory]);

    // Filter products logic
    useEffect(() => {
        let result = products;

        // Category Filter
        if (selectedCategories.length > 0) {
            result = result.filter(p => selectedCategories.includes(p.category.toLowerCase()));
        }

        // Price Filter
        result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        // Rating Filter
        if (minRating > 0) {
            result = result.filter(p => (p.rating || 0) >= minRating);
        }

        // Stock Filter
        if (onlyInStock) {
            result = result.filter(p => (p.countInStock || 0) > 0);
        }

        // Sorting
        if (sortOption === 'lowToHigh') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortOption === 'highToLow') {
            result.sort((a, b) => b.price - a.price);
        } else if (sortOption === 'rating') {
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortOption === 'newest') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setFilteredProducts([...result]);
    }, [selectedCategories, priceRange, sortOption, category, products, minRating, onlyInStock]);

    const toggleCategory = (cat) => {
        const lowerCat = cat.toLowerCase();
        if (selectedCategories.includes(lowerCat)) {
            if (category && category.toLowerCase() === lowerCat) return;
            setSelectedCategories(selectedCategories.filter(c => c !== lowerCat));
        } else {
            setSelectedCategories([...selectedCategories, lowerCat]);
        }
    };

    const allCategories = useMemo(() => {
        const uniqueLower = [...new Set(products.map(p => p.category.toLowerCase()))];
        // Map back to the original capitalization if possible, or just capitalize properly
        return uniqueLower.map(lower => {
            const original = products.find(p => p.category.toLowerCase() === lower)?.category;
            return original || lower;
        });
    }, [products]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <Loader className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Mobile Filter Toggle */}
                    <div className="md:hidden flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold capitalize text-slate-900 dark:text-white">{category || 'All Products'}</h1>
                        <button
                            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                            <Filter className="h-4 w-4" /> Filters
                        </button>
                    </div>

                    {/* Sidebar Filters */}
                    <div className={`
            md:w-64 flex-shrink-0 space-y-8
            ${isMobileFilterOpen ? 'block' : 'hidden md:block'}
          `}>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-24 transition-colors">
                            <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                                <SlidersHorizontal className="h-5 w-5" />
                                <h2 className="font-bold text-lg">Filters</h2>
                            </div>

                            {/* Categories */}
                            <div className="mb-8">
                                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Categories</h3>
                                <div className="space-y-2">
                                    {allCategories.map((cat, idx) => (
                                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`
                            w-5 h-5 rounded border flex items-center justify-center transition-colors
                            ${selectedCategories.includes(cat.toLowerCase()) ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' : 'border-gray-300 dark:border-slate-600 group-hover:border-indigo-400'}
                         `}>
                                                {selectedCategories.includes(cat.toLowerCase()) && <ChevronDown className="h-3 w-3 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedCategories.includes(cat.toLowerCase())}
                                                onChange={() => toggleCategory(cat)}
                                            />
                                            <span className="text-gray-600 dark:text-gray-400 capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-8 pb-8 border-b border-gray-100 dark:border-slate-700">
                                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Price Range</h3>
                                <input
                                    type="range"
                                    min="0"
                                    max="5000"
                                    step="50"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full accent-indigo-600 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer transition-all"
                                />
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                                    <span>₹{priceRange[0]}</span>
                                    <span>₹{priceRange[1]}</span>
                                </div>
                            </div>

                            {/* Ratings */}
                            <div className="mb-8 pb-8 border-b border-gray-100 dark:border-slate-700">
                                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Minimum Rating</h3>
                                <div className="space-y-2">
                                    {[4, 3, 2].map((r) => (
                                        <label key={r} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="rating"
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                                checked={minRating === r}
                                                onChange={() => setMinRating(minRating === r ? 0 : r)}
                                            />
                                            <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="text-gray-600 dark:text-gray-300 font-medium">{r} Stars & Up</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Availability */}
                            <div>
                                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Availability</h3>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`
                            w-10 h-6 rounded-full p-1 transition-colors duration-300
                            ${onlyInStock ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}
                          `}>
                                        <div className={`
                              w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300
                              ${onlyInStock ? 'translate-x-4' : 'translate-x-0'}
                            `} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={onlyInStock}
                                        onChange={() => setOnlyInStock(!onlyInStock)}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">In Stock Only</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                            <p className="text-gray-500 dark:text-gray-400">Showing <span className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</span> products</p>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Sort by:</span>
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    <option value="newest">Newest Arrivals</option>
                                    <option value="lowToHigh">Price: Low to High</option>
                                    <option value="highToLow">Price: High to Low</option>
                                    <option value="rating">Top Rated</option>
                                </select>
                            </div>
                        </div>

                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                <AnimatePresence>
                                    {filteredProducts.map(product => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-xl text-gray-500 dark:text-gray-400">No products found matching your criteria.</p>
                                <button
                                    onClick={() => { setSelectedCategories([]); setPriceRange([0, 2000]); }}
                                    className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductList;
