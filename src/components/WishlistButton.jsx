import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const WishlistButton = ({ productId, rounded = false, className = '' }) => {
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isWishlisted = isInWishlist(productId);

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Critical for event isolation

        if (!user) {
            navigate('/login', { state: { from: location } });
            return;
        }

        toggleWishlist(productId);
    };

    return (
        <button
            onClick={handleClick}
            className={`transition-colors flex items-center justify-center ${className} ${rounded ? 'rounded-full' : 'rounded-xl'}`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-current hover:text-red-500'}`}
            />
        </button>
    );
};

export default WishlistButton;
