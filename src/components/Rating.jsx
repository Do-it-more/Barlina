import React from 'react';
import { Star } from 'lucide-react';

const Rating = ({ value, text, color = '#facc15' }) => {
    return (
        <div className="flex items-center gap-2">
            <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((rate) => (
                    <Star
                        key={rate}
                        className={`w-4 h-4 ${value >= rate
                                ? 'fill-current text-yellow-400'
                                : value >= rate - 0.5
                                    ? 'fill-current text-yellow-400 opacity-50' // Half star approx
                                    : 'text-gray-300 dark:text-gray-600'
                            }`}
                    />
                ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {text && text}
            </span>
        </div>
    );
};

export default Rating;
