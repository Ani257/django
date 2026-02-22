'use client';

import React, { useEffect, useState, useRef } from 'react';
import RazorpayCheckout from './RazorpayCheckout';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, MessageCircle, Twitter, Link as LinkIcon, Send } from 'lucide-react'; // Updated icons

// Using the same active UUID from our database
const PRODUCT_ID = '6ca22814-c1a4-42e2-bec5-fdb388806692';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const AuctionCard = () => {
    const [currentUserId] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateUUID());
    const [price, setPrice] = useState<number | null>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [dropTime, setDropTime] = useState<Date | null>(null);
    const [brandUrl, setBrandUrl] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0); // Time in milliseconds
    const [totalShares, setTotalShares] = useState<number>(0);
    const [isEnded, setIsEnded] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // State for WebSocket errors
    const [isShareModalOpen, setIsShareModalOpen] = useState(false); // State for Social Share Modal

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

            // Fetch initial total shares count
            try {
                const { count: shareCount, error: shareError } = await supabase
                    .from('user_shares')
                    .select('*', { count: 'exact', head: true })
                    .eq('product_id', PRODUCT_ID);

                if (!shareError && shareCount !== null) {
                    setTotalShares(shareCount);
                }
            } catch (err) {
                console.error("Failed to fetch initial shares count", err);
            }

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
        if (isEnded) return; // Do not connect if ended

        const ws = new WebSocket(`ws://${window.location.hostname}:8080/ws/auction/${PRODUCT_ID}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('connected');
        };

        ws.onmessage = (event) => {
            console.log('3. Received WebSocket message:', event.data);
            const data = JSON.parse(event.data);

            if (data.type === 'price_update') {
                setPrice(data.new_price);
                if (data.total_shares !== undefined) {
                    setTotalShares(data.total_shares);
                }
                setErrorMsg(null); // Clear errors on a successful price drop
            } else if (data.error) {
                // If the backend blocked the share (e.g. unique constraint), show the error.
                setErrorMsg(data.error);

                if (data.error.includes("The drop has ended")) {
                    setIsEnded(true);
                }

                // Clear the error message automatically after 3 seconds
                setTimeout(() => {
                    setErrorMsg(null);
                }, 3000);
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
    }, [isEnded]);

    // Countdown Timer logic
    useEffect(() => {
        if (!dropTime) return;

        const calculateTimeRemaining = () => {
            const now = new Date().getTime();
            const target = dropTime.getTime();
            const endTarget = target + (24 * 60 * 60 * 1000); // 24 hours later

            if (now >= endTarget) {
                // Drop has ended!
                setIsEnded(true);
                setTimeRemaining(0);
                if (wsRef.current) {
                    wsRef.current.close();
                }
            } else if (now >= target) {
                // Drop is active. Count down to end target? Or just keep it 0 as user stated.
                // We will count down to 0 for start as original logic, but here if user wanted 0 to mean end:
                // "If timeRemaining === 0 (meaning the countdown has finished): Change the ... text to DROP ENDED"
                // To adhere precisely, let's keep timeRemaining as time till start, but when it's over, `isEnded` is true
                setTimeRemaining(0);
            } else {
                // Drop hasn't started yet
                const difference = target - now;
                setTimeRemaining(Math.max(0, difference));
            }
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

    const executeSocialShare = (platform: string) => {
        try {
            // 1. Foolproof ID generation that CANNOT crash on mobile HTTP
            // Uses the valid format fallback we defined at the top
            const safeUserId = currentUserId;

            // 2. Fire the WebSocket signal immediately
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    action: 'share_click',
                    user_id: safeUserId
                }));
            } else {
                alert("Network disconnected. Please refresh the page.");
                return;
            }

            // 3. Close the modal
            setIsShareModalOpen(false);

            // 4. THE DEMO TRICK: Do NOT open the real app. 
            // This avoids mobile popup blockers entirely and keeps the WebSocket alive.
            alert(`Shared successfully to ${platform}! Watch the price drop.`);

        } catch (error: any) {
            // If anything fails, it will tell you exactly why on your phone screen
            alert("Mobile Demo Error: " + error.message);
        }
    }

    const isLocked = timeRemaining > 0;

    const handleShareClick = () => {
        if (!isLocked && !isEnded && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            setIsShareModalOpen(true);
        }
    };

    return (
        <div className="relative group overflow-hidden rounded-3xl bg-zinc-900/90 border border-zinc-800 p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all flex flex-col items-center max-w-md mx-auto w-full backdrop-blur-xl">
            {/* Status indicator and Verify Link Header */}
            <div className="w-full flex justify-between items-center mb-6">
                {brandUrl ? (
                    <a
                        href={brandUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                        Verify on Official Site <ExternalLink className="ml-1 w-3 h-3" />
                    </a>
                ) : (
                    <div></div> // Empty div to keep flex space-between intact
                )}

                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${isEnded ? 'text-red-500 bg-red-500/10 border border-red-500/20' : status === 'connected' ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
                    {!isEnded && <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-amber-500'}`}></span>}
                    {isEnded ? 'Ended' : status === 'connected' ? 'Live' : 'Connecting...'}
                </div>
            </div>

            {/* Hype Timer Display */}
            {dropTime && !isEnded && (
                <div className="mb-8 w-full">
                    <h3 className="text-center text-xs font-bold tracking-widest text-red-500 uppercase mb-2">
                        {timeRemaining > 0 ? 'Drop Starts In' : 'Drop Status'}
                    </h3>
                    <div className="text-center bg-black/60 rounded-2xl py-4 border border-zinc-800 shadow-inner">
                        {timeRemaining > 0 ? (
                            <span className="text-6xl font-mono tracking-tighter tabular-nums text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                                {formatTime(timeRemaining)}
                            </span>
                        ) : (
                            <span className="text-4xl font-black text-green-500 tracking-tight animate-pulse drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                                LIVE NOW
                            </span>
                        )}
                    </div>
                </div>
            )}

            {isEnded && (
                <div className="mb-8 w-full">
                    <h3 className="text-center text-xs font-bold tracking-widest text-red-500 uppercase mb-2">Drop Status</h3>
                    <div className="text-center bg-black/60 rounded-2xl py-4 border border-zinc-800 shadow-inner">
                        <span className="text-3xl font-black text-zinc-500 tracking-tight">
                            COMPLETED
                        </span>
                    </div>
                </div>
            )}



            <h2 className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-2">{isEnded ? 'Final Price' : 'Current Price'}</h2>

            <div className={`text-6xl sm:text-7xl font-black tracking-tighter mb-4 tabular-nums transition-colors duration-500 ${isLocked || isEnded ? 'text-zinc-600' : 'text-white drop-shadow-md'}`}>
                {price !== null ? `₹${price.toFixed(2)}` : '...'}
            </div>

            {/* Live Shares Counter */}
            <div className={`transform transition-all duration-300 ease-in-out flex items-center gap-2 mb-6 px-4 py-2 rounded-full ${totalShares > 0 ? 'bg-orange-500/10 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'opacity-0 scale-95'}`}>
                <span className="text-xl animate-pulse">🔥</span>
                <span className="text-orange-600 font-bold text-sm tracking-wide">
                    <span className="tabular-nums font-black text-lg">{totalShares.toLocaleString()}</span> People Shared This
                </span>
            </div>

            <Button
                onClick={handleShareClick}
                disabled={isLocked || isEnded || status !== 'connected'}
                className="w-full h-16 text-lg sm:text-xl font-black relative overflow-hidden group/btn shadow-[0_0_20px_rgba(239,68,68,0.2)] rounded-2xl transition-all border border-red-500/50 hover:border-red-500 bg-zinc-950 text-white hover:bg-zinc-900"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-30 pointer-events-none"></div>
                {isEnded ? 'DROP ENDED' : isLocked ? 'LOCKED UNTIL DROP' : 'SHARE TO DROP PRICE (₹1)'}
            </Button>

            {/* Error Message Box */}
            {errorMsg && (
                <div className="mt-3 text-red-500 text-sm font-bold text-center animate-pulse">
                    ⚠️ {errorMsg}
                </div>
            )}

            <p className="text-xs text-gray-500 mt-4 text-center font-medium">
                {isEnded ? 'This drop has ended. No more drops available.' : isLocked ? 'Waiting for countdown to finish.' : 'Clicking reduces the price by ₹1 for EVERYONE.'}
            </p>

            <div className="w-full mt-6 pt-6 border-t border-zinc-800">
                <RazorpayCheckout currentPrice={price} disabled={isEnded || isLocked} />
            </div>

            {/* Social Share Modal Overlay */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsShareModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-700 shadow-inner">
                            <Send className="w-8 h-8 text-white translate-x-0.5" />
                        </div>

                        <h3 className="text-xl font-black text-white mb-2 tracking-tight text-center">
                            SHARE TO DROP PRICE
                        </h3>
                        <p className="text-zinc-400 text-sm text-center mb-6 font-medium px-2">
                            Share your unique link. When someone clicks it, the price drops by ₹1 for everyone!
                        </p>

                        <div className="grid grid-cols-1 gap-3 w-full">
                            <button
                                onClick={() => executeSocialShare('whatsapp')}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all font-bold text-sm"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Share on WhatsApp
                            </button>

                            <button
                                onClick={() => executeSocialShare('twitter')}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 transition-all font-bold text-sm"
                            >
                                <Twitter className="w-5 h-5" />
                                Share on X/Twitter
                            </button>

                            <button
                                onClick={() => executeSocialShare('copy')}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 transition-all font-bold text-sm"
                            >
                                <LinkIcon className="w-5 h-5" />
                                Copy Link
                            </button>
                        </div>

                        <div className="w-full mt-6 flex justify-center">
                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 bg-black/40 px-3 py-1.5 rounded-full">
                                <span>ID: {currentUserId.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionCard;
