import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const useActivityTracker = () => {
    const { user } = useAuth();

    useEffect(() => {
        // Only track admins
        if (!user || !['admin', 'super_admin', 'finance', 'seller_admin'].includes(user.role)) return;

        const handleUnload = () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            // Use fetch with keepalive as a modern beacon replacement that supports headers
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
            const endpoint = `${apiUrl}/api/admin/audit-logs/beacon`;

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                keepalive: true,
            }).catch(err => console.error("Session close beacon failed", err));
        };

        // 'pagehide' is reliable for tab close, refresh, and navigation away
        window.addEventListener('pagehide', handleUnload);

        return () => {
            window.removeEventListener('pagehide', handleUnload);
        };
    }, [user]);
};

export default useActivityTracker;
