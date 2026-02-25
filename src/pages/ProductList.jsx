import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { Filter, SlidersHorizontal, ChevronDown, Loader, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductList = () => {
    const { category } = useParams();
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('keyword') || '';
    const queryCategory = searchParams.get('category') || '';

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [sortOption, setSortOption] = useState('bestSelling');
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [selectedCategories, setSelectedCategories] = useState((category || queryCategory) ? [(category || queryCategory).toLowerCase()] : []);
    const [minRating, setMinRating] = useState(0);
    const [onlyInStock, setOnlyInStock] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [pages, setPages] = useState(1);
    const [categoriesList, setCategoriesList] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories');
                setCategoriesList(data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const categoryParam = selectedCategories.length > 0 ? selectedCategories.join(',') : '';
                const { data } = await api.get(`/products?keyword=${keyword}&page=${pageNumber}&category=${categoryParam}&minPrice=0&maxPrice=${priceRange[1]}&rating=${minRating}&onlyInStock=${onlyInStock}&sort=${sortOption}&limit=8`);

                let fetchedProducts = [];
                if (Array.isArray(data)) {
                    fetchedProducts = data;
                    setPages(1);
                } else if (data.products) {
                    fetchedProducts = data.products;
                    setPages(data.pages);
                }

                setProducts(fetchedProducts);
                setFilteredProducts(fetchedProducts);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [keyword, pageNumber, selectedCategories, priceRange, sortOption, minRating, onlyInStock]);

    // Update selected categories when URL param or query param changes
    useEffect(() => {
        const activeCategory = category || queryCategory;
        if (activeCategory) {
            setSelectedCategories([activeCategory.toLowerCase()]);
        } else {
            setSelectedCategories([]);
        }
    }, [category, queryCategory]);

    // client-side redundant filters removed for performance and correctness
    // filteredProducts now always reflects exactly what the server says belongs on this page.

    // Reset to page 1 when filters or sorting changes
    useEffect(() => {
        setPageNumber(1);
    }, [keyword, selectedCategories, priceRange, sortOption, minRating, onlyInStock]);

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
        if (categoriesList.length > 0) return categoriesList.map(c => c.name);
        // Fallback to product categories if list not loaded
        const uniqueLower = [...new Set(products.map(p => (p.category || '').toLowerCase()))].filter(Boolean);
        return uniqueLower.map(lower => {
            const original = products.find(p => p.category?.toLowerCase() === lower)?.category;
            return original || lower;
        });
    }, [categoriesList, products]);

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

                    <div className="md:hidden flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold capitalize text-slate-900 dark:text-white">{category || 'All Products'}</h1>
                        <button
                            onClick={() => setIsMobileFilterOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all active:scale-95"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="font-semibold text-sm">Filters</span>
                        </button>
                    </div>

                    {/* Sidebar Filters */}
                    <div className={`
                        ${isSidebarVisible ? 'md:w-64' : 'md:w-0 md:opacity-0 md:pointer-events-none'}
                        flex-shrink-0 space-y-8
                        ${isMobileFilterOpen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 p-6 overflow-y-auto translate-x-0' : 'hidden md:block -translate-x-full md:translate-x-0'}
                        transition-all duration-300 ease-in-out
                    `}>
                        {isMobileFilterOpen && (
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="md:hidden absolute top-4 right-4 p-2.5 bg-gray-100 dark:bg-slate-800 rounded-full text-slate-900 dark:text-white shadow-sm active:scale-95 transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-24 transition-colors">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                    <SlidersHorizontal className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    <h2 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedCategories([]);
                                        setPriceRange([0, 5000]);
                                        setMinRating(0);
                                        setOnlyInStock(false);
                                    }}
                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider"
                                >
                                    Reset
                                </button>
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

                            {/* Mobile Apply Button */}
                            {isMobileFilterOpen && (
                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="md:hidden mt-8 w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95 transition-all"
                                >
                                    Apply Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => isMobileFilterOpen ? setIsMobileFilterOpen(false) : (window.innerWidth < 768 ? setIsMobileFilterOpen(true) : setIsSidebarVisible(!isSidebarVisible))}
                                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span>{isSidebarVisible ? 'Hide Filters' : 'Show Filters'}</span>
                                </button>
                                <p className="text-gray-500 dark:text-gray-400">Showing <span className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</span> products</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Sort by:</span>
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    <option value="bestSelling">Best Selling</option>
                                    <option value="newest">Newest Arrivals</option>
                                    <option value="lowToHigh">Price: Low to High</option>
                                    <option value="highToLow">Price: High to Low</option>
                                    <option value="rating">Top Rated</option>
                                </select>
                            </div>
                        </div>

                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
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
                        {/* Pagination Controls */}
                        {pages > 1 && (
                            <div className="flex justify-center items-center mt-16 gap-3">
                                <button
                                    onClick={() => {
                                        setPageNumber(p => Math.max(1, p - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={pageNumber === 1}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-1">
                                    {[...Array(pages).keys()].map((p) => {
                                        const pg = p + 1;
                                        if (pg === 1 || pg === pages || (pg >= pageNumber - 1 && pg <= pageNumber + 1)) {
                                            return (
                                                <button
                                                    key={pg}
                                                    onClick={() => {
                                                        setPageNumber(pg);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${pageNumber === pg
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-gray-100 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400'
                                                        }`}
                                                >
                                                    {pg}
                                                </button>
                                            );
                                        }
                                        if (pg === pageNumber - 2 || pg === pageNumber + 2) {
                                            return <span key={pg} className="px-1 text-gray-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => {
                                        setPageNumber(p => Math.min(pages, p + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={pageNumber === pages}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                                >
                                    Next
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
