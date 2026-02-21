import React from 'react';

interface RazorpayCheckoutProps {
    currentPrice: number | null;
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({ currentPrice }) => {
    return (
        <button
            disabled
            className="w-full mt-4 bg-gray-200 text-gray-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed border-2 border-gray-300 flex justify-between items-center transition-all"
        >
            <span>Pay Now</span>
            <span>{currentPrice ? `₹${currentPrice.toFixed(2)}` : 'Wait...'}</span>
        </button>
    );
};

export default RazorpayCheckout;
