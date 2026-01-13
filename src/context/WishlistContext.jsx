import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlist([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/users/wishlist');
            setWishlist(data);
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleWishlist = async (productId) => {
        if (!user) {
            showToast("Please login to manage wishlist", "error");
            return;
        }

        try {
            const isListed = wishlist.some(item => (item._id === productId || item.id === productId));

            const { data } = await api.post(`/users/wishlist/${productId}`);

            if (isListed) {
                showToast("Removed from wishlist", "success");
            } else {
                showToast("Added to wishlist", "success");
            }

            fetchWishlist();
        } catch (error) {
            console.error("Failed to toggle wishlist", error);
            showToast(error.response?.data?.message || "Failed to update wishlist", "error");
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item._id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, loading }}>
            {children}
        </WishlistContext.Provider>
    );
};
