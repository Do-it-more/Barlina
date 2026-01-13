import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const CategoryListScreen = () => {
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await api.get('/categories');
            setCategories(data);
        };
        fetchCategories();
    }, []);

    const deleteHandler = async (id) => {
        const isConfirmed = await confirm('Delete Category', 'Are you sure you want to delete this category?');
        if (isConfirmed) {
            try {
                await api.delete(`/categories/${id}`);
                setCategories(categories.filter(cat => cat._id !== id));
                showToast("Category deleted successfully", "success");
            } catch (error) {
                showToast('Failed to delete category', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Categories</h1>
                <Link
                    to="/admin/categories/create"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="h-5 w-5" />
                    Add Category
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                            <th className="p-4 font-semibold">Name</th>
                            <th className="p-4 font-semibold">Description</th>
                            <th className="p-4 font-semibold">Order</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {categories.map((category) => (
                            <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="p-4 font-medium text-slate-900 dark:text-white">{category.name}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-400">{category.description}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-400">{category.order}</td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            to={`/admin/categories/${category._id}/edit`}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => deleteHandler(category._id)}
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
    );
};

export default CategoryListScreen;
