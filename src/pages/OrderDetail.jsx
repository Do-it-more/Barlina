import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Check, Truck, Package, MapPin, CreditCard, Calendar, ArrowLeft, Printer, AlertCircle, X, Star, XCircle, FileText, RotateCcw, Image as ImagePlus, Video, Trash2, CheckCircle } from 'lucide-react';
import Barcode from 'react-barcode';

const OrderDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const [returnEligibility, setReturnEligibility] = useState({}); // Map of itemId -> eligibility object
    // Return Modal State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedReturnItem, setSelectedReturnItem] = useState(null);
    const [returnReason, setReturnReason] = useState('DAMAGED'); // Default enum
    const [returnComments, setReturnComments] = useState('');

    const fetchOrderData = async () => {
        try {
            const [orderRes, eligibilityRes] = await Promise.all([
                api.get(`/orders/${id}`),
                api.get(`/returns/eligibility/${id}`).catch(() => ({ data: [] })) // Handle error gracefully if return logic fails
            ]);

            setOrder(orderRes.data);

            // Map eligibility array to object for easier lookup by itemId
            const eligibilityMap = {};
            if (eligibilityRes.data && Array.isArray(eligibilityRes.data)) {
                eligibilityRes.data.forEach(item => {
                    eligibilityMap[item.itemId] = item;
                });
            }
            setReturnEligibility(eligibilityMap);

        } catch (error) {
            console.error("Failed to fetch order details", error);
            showToast("Failed to load order details", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleCancelOrder = async () => {
        const isConfirmed = await confirm('Cancel Order', 'Are you sure you want to cancel this order? This action cannot be undone.');
        if (isConfirmed) {
            try {
                await api.put(`/orders/${id}/cancel`);
                await api.put(`/orders/${id}/cancel`);
                fetchOrderData(); // Refresh order details
                showToast('Order cancelled successfully.', 'success');
            } catch (error) {
                console.error("Failed to cancel order", error);
                showToast(error.response?.data?.message || 'Failed to cancel order', 'error');
            }
        }
    };

    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [subject, setSubject] = useState('');
    const [isOtherSubject, setIsOtherSubject] = useState(false);
    const [description, setDescription] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Attachment State
    const [complaintImages, setComplaintImages] = useState([]);
    const [complaintVideo, setComplaintVideo] = useState(null);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (complaintImages.length + files.length > 4) {
            setMessage({ type: 'error', text: 'Maximum 4 images allowed.' });
            return;
        }
        setComplaintImages([...complaintImages, ...files]);
    };

    const removeImage = (index) => {
        setComplaintImages(complaintImages.filter((_, i) => i !== index));
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                setMessage({ type: 'error', text: 'Video size should be less than 50MB.' });
                return;
            }
            setComplaintVideo(file);
        }
    };

    const submitComplaint = async (e) => {
        e.preventDefault();

        // Validation: Attachments are mandatory
        if (complaintImages.length === 0) {
            setMessage({ type: 'error', text: 'Please upload at least one image.' });
            return;
        }
        if (!complaintVideo) {
            setMessage({ type: 'error', text: 'Please upload a video evidence.' });
            return;
        }

        setSubmitLoading(true);
        setMessage({ type: '', text: '' });
        try {
            let imageUrls = [];
            let videoUrl = '';

            // Upload Images
            if (complaintImages.length > 0) {
                const formData = new FormData();
                complaintImages.forEach(file => formData.append('files', file));
                const { data } = await api.post('/upload/multiple', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrls = data;
            }

            // Upload Video
            if (complaintVideo) {
                const formData = new FormData();
                formData.append('image', complaintVideo); // Using 'image' field as per route
                const { data } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                videoUrl = data; // Returns string path
            }

            await api.post('/complaints', {
                orderId: id,
                subject,
                description,
                images: imageUrls,
                video: videoUrl
            });

            // Close form and show success popup
            setShowComplaintModal(false);
            setSubject('');
            setDescription('');
            setComplaintImages([]);
            setComplaintVideo(null);
            setMessage({ type: '', text: '' });
            setShowSuccessPopup(true);

        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit complaint' });
        } finally {
            setSubmitLoading(false);
        }
    };

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');

    const openReviewModal = (item) => {
        if (user && (user.role === 'admin' || user.role === 'super_admin')) return; // Disable review for admins
        if (order.isCancelled) return; // Disable reviews for cancelled orders

        const productData = {
            _id: item.product._id || item.product,
            name: item.name
        };
        setSelectedProduct(productData);
        setReviewRating(0);
        setReviewComment('');
        setShowReviewModal(true);
    };

    const submitReviewHandler = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await api.post(`/products/${selectedProduct._id || selectedProduct}/reviews`, {
                rating: reviewRating,
                comment: reviewComment
            });
            setMessage({ type: 'success', text: 'Review submitted successfully!' });
            // Close modal after short delay to show success message
            setTimeout(() => {
                setShowReviewModal(false);
                setMessage({ type: '', text: '' });
            }, 2000);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 404) {
                setMessage({ type: 'error', text: 'This product has been discontinued and cannot be reviewed.' });
            } else {
                setMessage({ type: 'error', text: error.response?.data?.message || 'Error submitting review' });
            }
        } finally {
            setSubmitLoading(false);
        }
    };
    // Return Logic
    const openReturnModal = (item) => {
        setSelectedReturnItem(item);
        setReturnReason('DAMAGED');
        setReturnComments('');
        setShowReturnModal(true);
    };

    const submitReturnHandler = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            await api.post(`/returns/request/${id}`, {
                itemId: selectedReturnItem._id,
                reason: returnReason,
                comments: returnComments
            });
            showToast('Return requested successfully', 'success');
            setShowReturnModal(false);
            fetchOrderData(); // Refresh to update status
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to request return', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    // Pickup Schedule Logic
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [pickupDate, setPickupDate] = useState('');
    const [selectedReturnRequestItem, setSelectedReturnRequestItem] = useState(null);

    const openPickupModal = (item) => {
        setSelectedReturnRequestItem(item);
        // Default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setPickupDate(tomorrow.toISOString().split('T')[0]);
        setShowPickupModal(true);
    };

    const submitPickupSchedule = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            await api.put(`/returns/${selectedReturnRequestItem.returnRequestId}/schedule`, {
                pickupDate
            });
            showToast('Pickup scheduled successfully', 'success');
            setShowPickupModal(false);
            fetchOrderData();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to schedule pickup', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-xl text-gray-500">Order not found</p>
        </div>
    );

    const isReturned = order.status === 'RETURNED';

    const steps = [
        { label: 'Order Placed', completed: true, date: order.createdAt, icon: Calendar },
        {
            label: order.paymentMethod === 'COD' ? 'Order Confirmed' : 'Payment Confirmed',
            completed: order.paymentMethod === 'COD' ? true : order.isPaid,
            date: order.paidAt,
            icon: CreditCard
        },
        {
            label: 'Shipped',
            completed: order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' || order.isDelivered || isReturned,
            icon: Truck
        },
        {
            label: 'Out for Delivery',
            completed: order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' || order.isDelivered || isReturned,
            icon: MapPin
        },
        {
            label: 'Delivered',
            completed: order.isDelivered || order.status === 'DELIVERED' || isReturned,
            date: order.deliveredAt,
            icon: Package
        },
    ];

    const activeReturnItems = order.orderItems.filter(i => i.returnStatus && i.returnStatus !== 'NONE');
    if (activeReturnItems.length > 0) {
        const statuses = activeReturnItems.map(i => i.returnStatus);
        const hasStatus = (s) => statuses.includes(s);

        if (hasStatus('APPROVED') || hasStatus('PICKUP_SCHEDULED') || hasStatus('PICKED_UP') || hasStatus('REFUNDED') || isReturned) {
            steps.push({
                label: 'Return Approved',
                completed: true,
                icon: CheckCircle
            });
        }
        if (hasStatus('PICKUP_SCHEDULED') || hasStatus('PICKED_UP') || hasStatus('REFUNDED')) {
            steps.push({
                label: 'Pickup Scheduled',
                completed: true,
                icon: Truck
            });
        }
        if (hasStatus('PICKED_UP') || hasStatus('REFUNDED')) {
            steps.push({
                label: 'Picked Up',
                completed: true,
                icon: Package
            });
        }
        if (hasStatus('REFUNDED')) {
            steps.push({
                label: 'Refunded',
                completed: true,
                icon: CreditCard
            });
        }
    } else if (isReturned) {
        steps.push({
            label: 'Returned',
            completed: true,
            date: order.updatedAt,
            icon: RotateCcw
        });
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <style>{`
                @media print {
                    .page-break { page-break-after: always; break-after: page; }
                }
            `}</style>
            <div className="print:hidden">
                <Navbar />
            </div>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full print:p-0 print:max-w-none">
                {/* Print Header */}
                <div className="hidden print:block mb-8 border-b pb-4">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">INVOICE</h1>
                    <div className="flex justify-between items-end">
                        <div>
                            {order.invoiceNumber && (
                                <p className="text-gray-600">Invoice #: <span className="font-bold text-slate-900 text-xl">{order.invoiceNumber}</span></p>
                            )}
                            <p className="text-gray-600">Order Ref: <span className="font-mono text-gray-400">#{order.invoiceNumber || order._id}</span></p>
                            <p className="text-gray-600">Date: <span className="font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</span></p>
                            <div className="mt-4">
                                <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Billed To:</p>
                                <p className="font-bold text-slate-900">{order.user.name}</p>
                                <p className="text-sm text-gray-600">{order.user.email}</p>
                                <p className="text-sm text-gray-600">{order.user.phoneNumber}</p>
                            </div>
                            <div className="mt-4">
                                <Barcode value={order.invoiceNumber || order._id} width={1.5} height={50} fontSize={14} displayValue={false} />
                                <p className="text-xs text-center font-mono mt-1">{order.invoiceNumber || order._id}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-indigo-600 mb-1">Barlina Fashion</h2>
                            <div className="text-sm text-gray-500 space-y-0.5">
                                <p>123 Fashion Street, T. Nagar</p>
                                <p>Chennai, Tamil Nadu 600017</p>
                                <p>Phone: +91 98765 43210</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:hidden gap-4">
                    <div className="w-full md:w-auto">
                        <Link to="/orders" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium mb-3">
                            <ArrowLeft className="h-4 w-4" /> Back to Orders
                        </Link>
                        {order.invoiceNumber && (
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="h-6 w-6 text-indigo-500" />
                                Invoice {order.invoiceNumber}
                            </h2>
                        )}
                    </div>

                    {/* Action Buttons - Stack on mobile, Row on Desktop */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {!order.isCancelled && !order.isDelivered && (
                            <button
                                onClick={handleCancelOrder}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/30 px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm font-medium text-sm"
                            >
                                <XCircle className="h-4 w-4" /> Cancel
                            </button>
                        )}
                        <button
                            onClick={() => setShowComplaintModal(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-4 py-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm font-medium text-sm"
                        >
                            <AlertCircle className="h-4 w-4" /> Complaint
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={order.isCancelled}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors shadow-sm font-medium text-sm ${order.isCancelled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                            <Printer className="h-4 w-4" /> Invoice
                        </button>
                    </div>
                </div>

                {/* Admin Delivery Date Control */}
                {(['admin', 'super_admin'].includes(user?.role)) && !order.isDelivered && !order.isCancelled && (
                    <div className="mb-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/30 print:hidden">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-orange-500" /> Admin Delivery Control
                        </h3>
                        <div className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Update Expected Delivery Date</label>
                                <input
                                    type="date"
                                    defaultValue={order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : ''}
                                    onChange={async (e) => {
                                        try {
                                            await api.put(`/orders/${order._id}/delivery-date`, { date: e.target.value });
                                            showToast('Delivery date updated', 'success');
                                            await api.put(`/orders/${order._id}/delivery-date`, { date: e.target.value });
                                            showToast('Delivery date updated', 'success');
                                            fetchOrderData();
                                        } catch (err) {
                                            showToast('Failed to update date', 'error');
                                        }
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 pb-2">
                                Changing this will update the "Expected Delivery" date shown to the customer.
                            </p>
                        </div>
                    </div>
                )}

                {
                    order.isCancelled && (
                        <div className="mb-6 mx-auto max-w-3xl bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg print:hidden">
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-red-500/10 rounded-full">
                                    <XCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Order Cancelled</h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        This order was cancelled on <span className="font-semibold text-slate-900 dark:text-white">{new Date(order.cancelledAt).toLocaleString()}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        The refund will be processed within 7 working days.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                }

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:flex print:flex-col">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6 print:space-y-4 print:order-2">
                        {/* Status Tracker - Hide in Print */}
                        {!order.isCancelled && (
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 print:hidden">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Order Status</h2>
                                <div className="relative">
                                    {/* Background Line */}
                                    <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-slate-700"></div>

                                    {/* Progress Line (Animated) */}
                                    <div
                                        className="absolute left-[23px] top-2 w-0.5 bg-indigo-600 transition-all duration-1000 ease-out"
                                        style={{
                                            height: `${Math.max(0, (steps.filter(s => s.completed).length - 1) / (steps.length - 1) * 100)}%`
                                        }}
                                    ></div>

                                    <div className="space-y-8 relative">
                                        {steps.map((step, index) => {
                                            const isLastCompleted = index === steps.map(s => s.completed).lastIndexOf(true);
                                            const Icon = step.icon;

                                            return (
                                                <div
                                                    key={index}
                                                    className="relative flex items-start gap-4"
                                                >
                                                    <div className="relative z-10 flex items-center justify-center">
                                                        {/* Glowing Ripple for Active Step */}


                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step.completed
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-300 dark:text-gray-600'
                                                            } ${isLastCompleted ? 'ring-4 ring-indigo-50 dark:ring-indigo-900/40' : ''}`}>
                                                            {Icon ? <Icon className="h-6 w-6" strokeWidth={1.5} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                                                        </div>
                                                    </div>
                                                    <div className={`pt-1 transition-all duration-500 ${isLastCompleted ? 'translate-x-1' : ''}`}>
                                                        <p className={`font-bold text-lg ${step.completed ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                                                            }`}>
                                                            {step.label}
                                                        </p>
                                                        {step.date && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                                                {new Date(step.date).toLocaleString([], {
                                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expected Delivery */}
                        {!order.isDelivered && !order.isCancelled && order.expectedDeliveryDate && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/20 flex items-center justify-between mb-0 mt-6 print:hidden">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <Truck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Expected Delivery</p>
                                        <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                            {new Date(order.expectedDeliveryDate).toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Items */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 print:shadow-none print:border print:border-gray-200 print:mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 print:text-xl print:border-b print:pb-2">Items Purchased</h2>
                            <div className="space-y-4">
                                {order.orderItems.map((item, index) => {
                                    const eligibility = returnEligibility[item._id];
                                    const canReturn = eligibility?.isEligible;
                                    const returnStatus = item.returnStatus || 'NONE'; // Default to NONE for legacy orders

                                    return (
                                        <div
                                            key={index}
                                            className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50"
                                        >
                                            <div className="flex gap-4 flex-1">
                                                <div className="relative shrink-0">
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {item.product ? (
                                                        <Link to={`/products/${item.product._id || item.product}`} className="font-bold text-slate-800 dark:text-white block mb-1 hover:text-indigo-600 truncate">
                                                            {item.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-bold text-gray-400 block mb-1 truncate">
                                                            {item.name} (Unavailable)
                                                        </span>
                                                    )}
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Qty: {item.qty} × ₹{item.price}</p>

                                                    {/* Return Status Badge (Left Aligned) */}
                                                    {returnStatus !== 'NONE' && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${returnStatus === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            returnStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                returnStatus === 'REFUNDED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    returnStatus === 'PICKUP_SCHEDULED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                        returnStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                            }`}>
                                                            {returnStatus === 'COMPLETED' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                            {returnStatus.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 print:hidden">
                                                <p className="font-bold text-slate-900 dark:text-white">₹{(item.qty * item.price).toFixed(2)}</p>


                                                {/* Return Actions */}
                                                {!order.isCancelled && order.isDelivered && (
                                                    <div className="mt-1 flex flex-col items-end gap-2">
                                                        {returnStatus !== 'NONE' ? (
                                                            <>
                                                                {/* Badge moved to left */}
                                                                {returnStatus === 'APPROVED' && (
                                                                    <button
                                                                        onClick={() => openPickupModal(item)}
                                                                        className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1"
                                                                    >
                                                                        <Calendar className="h-3 w-3" /> Schedule Pickup
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            canReturn ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setSubject('');
                                                                        setIsOtherSubject(false);
                                                                        setDescription('');
                                                                        setShowComplaintModal(true);
                                                                    }}
                                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/30"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" /> Return / Complaint
                                                                </button>
                                                            ) : (
                                                                eligibility?.reasons?.length > 0 && (
                                                                    <span className="text-xs text-gray-400" title={eligibility.reasons.join(', ')}>
                                                                        Not Returnable
                                                                    </span>
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                                {/* Review Action */}
                                                {item.product && (!['admin', 'super_admin'].includes(user?.role)) && !order.isCancelled && order.isDelivered && (
                                                    <button
                                                        onClick={() => openReviewModal(item)}
                                                        className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg transition-colors border border-amber-100 dark:border-amber-900/30"
                                                    >
                                                        <Star className="h-3 w-3" /> Write Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 print:grid print:grid-cols-2 print:gap-8 print:space-y-0 print:order-1 page-break">
                        {/* Shipping Info */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 print:shadow-none print:border print:border-gray-200">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 print:text-lg">
                                <MapPin className="h-4 w-4 text-indigo-500" /> Shipping Address
                            </h3>
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 print:text-base">
                                <p className="font-medium text-slate-800 dark:text-white">{order.user.name}</p>
                                <p>{order.shippingAddress.address}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                                <p>{order.shippingAddress.postalCode}</p>
                                <p>Phone: {order.user.phoneNumber || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 print:shadow-none print:border print:border-gray-200">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 print:text-lg">
                                <CreditCard className="h-4 w-4 text-indigo-500" /> Payment Summary
                            </h3>
                            <div className="space-y-2 text-sm print:text-base">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Items Total</span>
                                    <span>₹{order.itemsPrice?.toFixed(2) || (order.totalPrice - (order.taxPrice || 0) - (order.shippingPrice || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Shipping</span>
                                    <span>₹{order.shippingPrice?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Tax</span>
                                    <span>₹{order.taxPrice?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-700 mt-2">
                                    <span>Total Paid</span>
                                    <span>₹{order.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 bg-transparent">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Method: <span className="text-slate-700 dark:text-gray-300">{order.paymentMethod}</span></p>
                                {order.isPaid && (
                                    <>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paid on: <span className="text-slate-700 dark:text-gray-300">{new Date(order.paidAt).toLocaleString()}</span></p>
                                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded print:border print:border-green-600">PAID</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Gratitude Quote */}
                        <div className="hidden print:block col-span-2 mt-8 text-center border-t border-gray-200 pt-6">
                            <p className="font-serif italic text-lg text-slate-600">"Thank you for shopping with us! We hope you love your purchase."</p>
                        </div>
                    </div>
                </div>
            </main >

            <div className="print:hidden">
                <Footer />
            </div>

            {/* Review Modal */}
            {
                showReviewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500 fill-current" /> Write a Review
                                </h3>
                                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <h4 className="font-medium text-slate-800 dark:text-gray-200">{selectedProduct?.name}</h4>
                                </div>

                                {message.text && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <form onSubmit={submitReviewHandler} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setReviewRating(s)}
                                                    className={`p-1 transition-transform hover:scale-110 ${s <= reviewRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                                >
                                                    <Star className={`h-8 w-8 ${s <= reviewRating ? 'fill-current' : ''}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment</label>
                                        <textarea
                                            rows="4"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Share your experience..."
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitLoading || reviewRating === 0}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitLoading ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Complaint Modal */}
            {
                showComplaintModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700 shrink-0">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" /> Raise New Complaint
                                </h3>
                                <button onClick={() => setShowComplaintModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {message.text && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <form onSubmit={submitComplaint} className="space-y-5">
                                    {/* Order Read-only Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Order</label>
                                        <div className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                                            {order.invoiceNumber ? `Invoice #${order.invoiceNumber}` : `Order #${order._id}`}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Subject</label>
                                        <div className="space-y-3">
                                            <select
                                                value={isOtherSubject ? 'Other' : subject}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        setIsOtherSubject(true);
                                                        setSubject('');
                                                    } else {
                                                        setIsOtherSubject(false);
                                                        setSubject(val);
                                                    }
                                                }}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            >
                                                <option value="">Select an issue</option>
                                                <option value="Damaged Product">Damaged Product</option>
                                                <option value="Wrong Item Received">Wrong Item Received</option>
                                                <option value="Other">Other</option>
                                            </select>

                                            {isOtherSubject && (
                                                <input
                                                    type="text"
                                                    value={subject}
                                                    onChange={(e) => setSubject(e.target.value)}
                                                    required={isOtherSubject}
                                                    placeholder="Please specify the issue..."
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all animate-in fade-in slide-in-from-top-1"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            rows="4"
                                            placeholder="Please describe your issue in detail..."
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    {/* Attachments Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Attachments (Required)</label>

                                        {/* Images */}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Images (Max 4) <span className="text-red-500">*</span></p>
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {complaintImages.map((file, index) => (
                                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 group">
                                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {complaintImages.length < 4 && (
                                                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <ImagePlus className="h-6 w-6 text-gray-400 mb-1" />
                                                    <span className="text-[10px] text-gray-400 font-medium">Add Image</span>
                                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" multiple />
                                                </label>
                                            )}
                                        </div>

                                        {/* Video */}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Video (Max 1) <span className="text-red-500">*</span></p>
                                        {complaintVideo ? (
                                            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Video className="h-5 w-5 text-indigo-500 shrink-0" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{complaintVideo.name}</span>
                                                </div>
                                                <button type="button" onClick={() => setComplaintVideo(null)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <Video className="h-5 w-5 text-gray-400" />
                                                <span className="text-sm text-gray-500 font-medium">Upload Video Evidence</span>
                                                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                    >
                                        {submitLoading ? 'Submitting...' : 'Submit Complaint'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Return Request Modal */}
            {
                showReturnModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <RotateCcw className="h-5 w-5 text-indigo-500" /> Request Return
                                </h3>
                                <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg flex gap-3 mb-6">
                                    <img src={selectedReturnItem?.image} alt="" className="w-12 h-12 rounded object-cover" />
                                    <div>
                                        <p className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1">{selectedReturnItem?.name}</p>
                                        <p className="text-xs text-gray-500">Qty: {selectedReturnItem?.qty}</p>
                                    </div>
                                </div>

                                <form onSubmit={submitReturnHandler} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Return</label>
                                        <select
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="DAMAGED">Damaged Item</option>
                                            <option value="WRONG_ITEM">Wrong Item Received</option>
                                            <option value="DEFECTIVE">Defective / Not Working</option>
                                            <option value="NOT_AS_DESCRIBED">Not As Described</option>
                                            <option value="SIZE_ISSUE">Size / Fit Issue</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Comments</label>
                                        <textarea
                                            value={returnComments}
                                            onChange={(e) => setReturnComments(e.target.value)}
                                            rows="3"
                                            placeholder="Please describe the issue..."
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {submitLoading ? 'Submitting Request...' : 'Submit Request'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Success Popup */}
            {
                showSuccessPopup && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500 animate-in zoom-in duration-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complaint Submitted!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">
                                We have received your complaint and will get back to you shortly.
                            </p>
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="w-full bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }
            {/* Pickup Schedule Modal */}
            {showPickupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Truck className="h-5 w-5 text-indigo-500" /> Schedule Pickup
                            </h3>
                            <button onClick={() => setShowPickupModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={submitPickupSchedule} className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Your return has been approved! Please select a convenient date for our courier partner to pick up the item.
                                </p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Pickup Date</label>
                                    <input
                                        type="date"
                                        value={pickupDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const day = new Date(e.target.value).getDay();
                                            if (day === 0) {
                                                alert("Pickups are not available on Sundays. Please choose a working day.");
                                                return;
                                            }
                                            setPickupDate(e.target.value);
                                        }}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Pickup available for next 5 working days (Excl. Sunday).</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 mt-2"
                                >
                                    {submitLoading ? 'Scheduling...' : 'Confirm Pickup'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default OrderDetail;
