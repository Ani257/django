'use client';

import React, { useState } from 'react';

// Extend window to support the Razorpay injected property
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayCheckoutProps {
    currentPrice: number | null;
    disabled?: boolean;
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({ currentPrice, disabled }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = async () => {
        if (!currentPrice) return;
        setLoading(true);

        try {
            // 1. Hit the backend mock order creation endpoint
            const orderRes = await fetch(`http://${window.location.hostname}:8080/razorpay/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: currentPrice, currency: 'INR' })
            });

            if (!orderRes.ok) throw new Error('Failed to create order');

            // 2. Simulate the Razorpay popup delay (1.5 seconds)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 3. Mark as successful!
            setSuccess(true);
            alert(`Payment Authorized at ₹${currentPrice}! Your intent is locked.`);

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error initiating checkout.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full mt-4 py-6 px-6 rounded-xl font-black border-2 bg-green-50 text-green-700 border-green-200 text-center shadow-inner text-xl">
                <span>🎉 INTENT LOCKED AT <span className="text-green-900 border-b-2 border-green-900">₹{currentPrice?.toFixed(2)}</span></span>
            </div>
        );
    }

    return (
        <button
            onClick={handlePayment}
            disabled={!currentPrice || loading}
            className={`w-full mt-4 py-4 px-6 rounded-xl font-bold border-2 flex justify-between items-center transition-all ${!currentPrice || loading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                : 'bg-black text-white cursor-pointer hover:bg-gray-800 border-black shadow-xl ring-2 ring-black ring-offset-2'
                }`}
        >
            <span>{loading ? 'Processing Server...' : 'Lock Intent Now'}</span>
            <span>{currentPrice ? `₹${currentPrice.toFixed(2)}` : 'Wait...'}</span>
        </button>
    );
};

export default RazorpayCheckout;
