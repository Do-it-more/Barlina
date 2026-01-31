import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Rating from '../Rating';
import { Clock } from 'lucide-react';

const RecentlyViewed = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentlyViewed = async () => {
            try {
                const { data } = await api.get('/users/recently-viewed');
                // Backend returns array of { product: Object, viewedAt: Date }
                // We need to map it to just product, or keep it structure
                // Backend population path: 'recentlyViewed.product'
                // The response is user.recentlyViewed array.
                // [{ product: {name, ...}, viewedAt: ... }]
                setProducts(data);
            } catch (error) {
                console.error("Failed to fetch recently viewed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentlyViewed();
    }, []);

    if (!loading && products.length === 0) return null;

    return (
        <div className="mt-16 border-t border-gray-200 dark:border-slate-700 pt-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-600" /> Recently Viewed
            </h2>

            {loading ? (
                <div className="flex gap-6 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="min-w-[200px] h-64 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
                    {products.map((item) => {
                        const product = item.product;
                        if (!product) return null; // Handle deleted products

                        return (
                            <Link to={`/product/${product._id}`} key={product._id} className="min-w-[200px] w-[200px] group">
                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all p-3 border border-gray-100 dark:border-slate-700">
                                    <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 min-h-[40px] mb-1 group-hover:text-indigo-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="mb-2">
                                        <Rating value={product.rating} text={`${product.numReviews}`} />
                                    </div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        ₹{product.price}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RecentlyViewed;
