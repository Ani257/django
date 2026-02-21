'use client';

import React, { useEffect, useState, useRef } from 'react';
import RazorpayCheckout from './RazorpayCheckout';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

// Using the same active UUID from our database
const PRODUCT_ID = '6ca22814-c1a4-42e2-bec5-fdb388806692';

const AuctionCard = () => {
    const [price, setPrice] = useState<number | null>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [dropTime, setDropTime] = useState<Date | null>(null);
    const [brandUrl, setBrandUrl] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0); // Time in milliseconds

    const wsRef = useRef<WebSocket | null>(null);
    const supabase = createClient();

    // Fetch initial product data from Supabase
    useEffect(() => {
        const fetchProductData = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('current_price, drop_time, brand_url')
                .eq('id', PRODUCT_ID)
                .single();

            if (error) {
                console.error("Error fetching product data:", error);
                return;
            }

            if (data) {
                setPrice(parseFloat(data.current_price));
                setBrandUrl(data.brand_url || null);
                if (data.drop_time) {
                    setDropTime(new Date(data.drop_time));
                }
            }
        };

        fetchProductData();
    }, [supabase]);

    // WebSocket logic
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/auction/${PRODUCT_ID}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'price_update') {
                setPrice(data.new_price);
            }
        };

        ws.onclose = () => {
            setStatus('disconnected');
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setStatus('disconnected');
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (!dropTime) return;

        const calculateTimeRemaining = () => {
            const now = new Date().getTime();
            const target = dropTime.getTime();
            const difference = target - now;
            setTimeRemaining(Math.max(0, difference));
        };

        // Calculate immediately 
        calculateTimeRemaining();

        // Update every second
        const intervalId = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(intervalId);
    }, [dropTime]);

    // Format millisecond duration to HH:MM:SS
    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [hours, minutes, seconds]
            .map(v => v < 10 ? "0" + v : v)
            .join(":");
    };

    const handleShareClick = () => {
        // Double check not visually disabled and socket is alive
        if (timeRemaining <= 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'share_click' }));
        }
    };

    const isLocked = timeRemaining > 0;

    return (
        <div className="relative group overflow-hidden rounded-3xl bg-white border border-gray-200 p-8 shadow-xl transition-all flex flex-col items-center max-w-md mx-auto w-full">
            {/* Status indicator and Verify Link Header */}
            <div className="w-full flex justify-between items-center mb-6">
                {brandUrl ? (
                    <a
                        href={brandUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Verify on Official Site <ExternalLink className="ml-1 w-3 h-3" />
                    </a>
                ) : (
                    <div></div> // Empty div to keep flex space-between intact
                )}

                <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${status === 'connected' ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'}`}>
                    <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    {status === 'connected' ? 'Live' : 'Connecting...'}
                </div>
            </div>

            {/* Hype Timer Display */}
            {dropTime && (
                <div className="mb-8 w-full">
                    <h3 className="text-center text-xs font-bold tracking-widest text-red-500 uppercase mb-2">Drop Starts In</h3>
                    <div className="text-center bg-gray-50 rounded-2xl py-4 border border-gray-100">
                        <span className="text-5xl font-black tracking-tighter tabular-nums text-gray-900">
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                </div>
            )}

            <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Current Price</h2>

            <div className={`text-6xl sm:text-7xl font-black tracking-tighter mb-8 tabular-nums transition-colors duration-500 ${isLocked ? 'text-gray-300' : 'text-gray-900'}`}>
                {price !== null ? `₹${price.toFixed(2)}` : '...'}
            </div>

            <Button
                onClick={handleShareClick}
                disabled={isLocked || status !== 'connected'}
                className="w-full h-16 text-lg sm:text-xl font-black relative overflow-hidden group/btn shadow-lg rounded-2xl transition-all"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-20 pointer-events-none"></div>
                {isLocked ? 'LOCKED UNTIL DROP' : 'SHARE TO DROP PRICE (₹1)'}
            </Button>

            <p className="text-xs text-gray-500 mt-4 text-center font-medium">
                {isLocked ? 'Waiting for countdown to finish.' : 'Clicking reduces the price by ₹1 for EVERYONE.'}
            </p>

            <div className="w-full mt-6 pt-6 border-t border-gray-100">
                <RazorpayCheckout currentPrice={price} />
            </div>
        </div>
    );
};

export default AuctionCard;
