import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../../../context/SettingsContext';

const InvoiceModal = ({ isOpen, onClose, order }) => {
    const printRef = useRef();
    const { settings } = useSettings();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Invoice-${order?.invoiceNumber || order?._id}`,
    });

    if (!isOpen || !order) return null;

    const companyName = settings?.companyName || 'Barlina Fashion';
    const companyAddress = settings?.companyAddress || '123 Fashion Street, T. Nagar, Chennai, Tamil Nadu 600017';
    const companyPhone = settings?.companyPhone || '+91 98765 43210';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Printer className="h-5 w-5 text-indigo-500" /> Invoice Preview
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Printer className="h-4 w-4" /> Print Invoice
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-slate-950">

                    {/* INVOICE PAPER DESIGN */}
                    <div
                        ref={printRef}
                        className="bg-white text-slate-800 mx-auto max-w-[210mm] min-h-[297mm] p-[10mm] shadow-lg print:shadow-none print:m-0 flex flex-col"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        {/* Header Title */}
                        <div className="mb-2">
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">INVOICE</h1>
                        </div>

                        {/* Invoice Details */}
                        <div className="mb-8 text-sm text-slate-600 space-y-1">
                            <p><span className="text-slate-500">Invoice #:</span> <span className="font-bold text-slate-900">{order.invoiceNumber || order._id.toString().slice(-6).toUpperCase()}</span></p>
                            <p><span className="text-slate-500">Order Ref:</span> #{order._id.toString().slice(-6).toUpperCase()}</p>
                            <p><span className="text-slate-500">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>

                        {/* Billed To & Company Info */}
                        <div className="flex justify-between items-start mb-8">
                            {/* Left: Billed To */}
                            <div className="w-1/2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">BILLED TO:</h3>
                                <p className="font-bold text-slate-900 text-lg">{order.user?.name}</p>
                                <p className="text-sm text-slate-500">{order.user?.email}</p>

                                {/* Barcode placed here per reference */}
                                <div className="mt-4">
                                    <Barcode
                                        value={order.invoiceNumber || order._id}
                                        width={1.5}
                                        height={40}
                                        fontSize={10}
                                        displayValue={true}
                                        background="#ffffff"
                                        lineColor="#000000"
                                        margin={0}
                                    />
                                </div>
                            </div>

                            {/* Right: Company Info */}
                            <div className="w-1/2 text-right">
                                <h2 className="text-xl font-bold text-indigo-600 mb-1">{companyName}</h2>
                                <div className="text-sm text-slate-600 whitespace-pre-line">
                                    {typeof companyAddress === 'object' && companyAddress !== null ? (
                                        <>
                                            {companyAddress.doorNo && <p>{companyAddress.doorNo}</p>}
                                            {companyAddress.street && <p>{companyAddress.street}</p>}
                                            {companyAddress.city && <p>{companyAddress.city}</p>}
                                            {companyAddress.district && <p>{companyAddress.district}</p>}
                                            {companyAddress.state && <p>{companyAddress.state}</p>}
                                            {companyAddress.pincode && <p>{companyAddress.pincode}</p>}
                                        </>
                                    ) : (
                                        <p>{companyAddress}</p>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600">Phone: {companyPhone}</p>
                            </div>
                        </div>

                        {/* Two Column Cards */}
                        <div className="flex gap-6 mb-12">

                            {/* Left Card: Shipping Address */}
                            <div className="flex-1 border border-gray-200 rounded-xl p-6">
                                <h3 className="text-slate-400 font-bold mb-4 flex items-center gap-2">
                                    <span className="text-indigo-500 text-lg">📍</span> Shipping Address
                                </h3>
                                <div className="space-y-1 text-slate-600 text-sm">
                                    <p className="font-medium text-slate-800 text-base">{order.user?.name}</p>
                                    <p>{order.shippingAddress?.address}</p>
                                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                                    <p>{order.shippingAddress?.country}</p>
                                    <p className="mt-2 text-slate-500">Phone: {order.shippingAddress?.phoneNumber || order.user?.phoneNumber || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Right Card: Payment Summary */}
                            <div className="flex-1 border border-gray-200 rounded-xl p-6 bg-slate-50/50">
                                <h3 className="text-slate-400 font-bold mb-4 flex items-center gap-2">
                                    <span className="text-indigo-500 text-lg">💳</span> Payment Summary
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Items Total</span>
                                        <span className="font-medium">₹{order.itemsPrice ? order.itemsPrice.toFixed(2) : order.totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span className="font-medium">₹{order.shippingPrice ? order.shippingPrice.toFixed(2) : '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Tax</span>
                                        <span className="font-medium">₹{order.taxPrice ? order.taxPrice.toFixed(2) : '0.00'}</span>
                                    </div>

                                    <div className="h-px bg-slate-200 my-2"></div>

                                    <div className="flex justify-between text-lg font-bold text-slate-800">
                                        <span>Total Paid</span>
                                        <span>₹{order.totalPrice.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-4 mt-2">
                                        <p className="text-xs text-slate-400">Method: <span className="uppercase font-medium text-slate-600">{order.paymentMethod}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Quote */}
                        <div className="mt-auto pt-8 border-t border-gray-100 text-center">
                            <p className="text-slate-500 italic font-serif">"Thank you for shopping with us! We hope you love your purchase."</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
