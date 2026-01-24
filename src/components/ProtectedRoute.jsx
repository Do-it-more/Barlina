import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <Loader className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) {
        // Double check: If loading is done, user is null, AND no token in storage, redirect.
        // If there IS a token but user is null, it means verification failed or is in progress (but loading should cover progress).
        // Since loading is false here, we strictly redirect.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Safety check: specific role check or validation
    if (user && typeof user !== 'object') {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin' && user.role !== 'super_admin') {
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
