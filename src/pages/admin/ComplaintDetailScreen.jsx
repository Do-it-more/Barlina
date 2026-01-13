import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Save, AlertCircle, MessageSquare, CheckCircle, Video, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ComplaintDetailScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [adminResponse, setAdminResponse] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                const { data } = await api.get(`/complaints/${id}`);
                setComplaint(data);
                setStatus(data.status);
                setAdminResponse(data.adminResponse || '');
            } catch (error) {
                console.error("Failed to fetch complaint", error);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaint();
    }, [id]);

    const handleUpdate = async () => {
        setUpdateLoading(true);
        try {
            await api.put(`/complaints/${id}`, {
                status,
                adminResponse
            });
            showToast("Complaint updated successfully!", "success");
            // Refresh logic if needed or stay on page
        } catch (error) {
            showToast("Failed to update complaint", "error");
            console.error(error);
        } finally {
            setUpdateLoading(false);
        }
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

    const getFileUrl = (path) => {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
        return `${baseUrl}${path}`;
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div>;
    if (!complaint) return <div className="p-8 text-center text-red-500">Complaint not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => navigate('/admin/complaints')} className="flex items-center text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Complaints
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{complaint.subject}</h1>
                                <p className="text-sm text-gray-500">
                                    Complaint ID: <span className="font-mono text-slate-700 dark:text-gray-300">#{complaint._id}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    Created on: {new Date(complaint.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(complaint.status)}`}>
                                {complaint.status}
                            </span>
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-4">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-400" /> Description
                            </h3>
                            <p className="text-slate-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                {complaint.description}
                            </p>
                        </div>
                    </div>

                    {/* Evidence / Attachments */}
                    {(complaint.images?.length > 0 || complaint.video) && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-indigo-500" /> Evidence / Attachments
                            </h3>

                            {complaint.images?.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Images</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {complaint.images.map((img, idx) => (
                                            <a key={idx} href={getFileUrl(img)} target="_blank" rel="noreferrer" className="block relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                                <img src={getFileUrl(img)} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {complaint.video && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2"><Video className="h-4 w-4" /> Video</h4>
                                    <video controls className="w-full rounded-lg border border-gray-200 max-h-96 bg-black">
                                        <source src={getFileUrl(complaint.video)} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    {/* User Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Customer Details</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {complaint.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">{complaint.user?.name}</p>
                                    <p className="text-xs text-gray-500">{complaint.user?.email}</p>
                                </div>
                            </div>
                            <hr className="border-gray-100 dark:border-slate-700" />
                            <div>
                                <label className="text-xs text-gray-500">Related Order</label>
                                <p className="font-mono text-sm text-indigo-600 hover:underline cursor-pointer" onClick={() => navigate(`/admin/orders?invoice=${complaint.order?.invoiceNumber}`)}>
                                    {complaint.order?.invoiceNumber || complaint.order?._id?.slice(-6).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Resolution Action */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Resolution</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Update Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Admin Response</label>
                                <textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    rows="5"
                                    placeholder="Write a response to the customer..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                ></textarea>
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={updateLoading}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {updateLoading ? 'Forcing Update...' : <><Save className="h-4 w-4" /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetailScreen;
