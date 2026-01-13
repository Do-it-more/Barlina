import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Loader } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const CategoryEditScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const isEditMode = !!id;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [order, setOrder] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            const fetchCategory = async () => {
                const { data } = await api.get('/categories'); // Ideally get by ID, but list is small
                const cat = data.find(c => c._id === id);
                if (cat) {
                    setName(cat.name);
                    setDescription(cat.description);
                    setOrder(cat.order);
                }
            };
            fetchCategory();
        }
    }, [id, isEditMode]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const categoryData = { name, description, order: Number(order) };
            if (isEditMode) {
                await api.put(`/categories/${id}`, categoryData);
            } else {
                await api.post('/categories', categoryData);
            }
            showToast(`Category ${isEditMode ? 'updated' : 'created'} successfully`, "success");
            navigate('/admin/categories');
        } catch (error) {
            showToast("Failed to save category", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <Link to="/admin/categories" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Categories
            </Link>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                    {isEditMode ? 'Edit Category' : 'Create Category'}
                </h1>

                <form onSubmit={submitHandler} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort Order</label>
                        <input
                            type="number"
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader className="animate-spin h-5 w-5" />}
                        {isEditMode ? 'Update' : 'Create'} Category
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CategoryEditScreen;
