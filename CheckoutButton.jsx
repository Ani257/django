"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ── Config (set in .env.local) ────────────────────────────────────────────────
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "YOUR_KEY_ID";

// ─────────────────────────────────────────────────────────────────────────────
/**
 * CheckoutButton
 *
 * Props
 * ─────
 * amount      {number}  Amount in INR, e.g. 500 for ₹500  (required)
 * currency    {string}  Defaults to "INR"
 * name        {string}  Business name shown in the modal
 * description {string}  Product description
 * prefill     {object}  { name, email, contact }
 * onSuccess   {fn}      Called with the verify response — router redirect is also triggered
 * onFailure   {fn}      Called with an error string
 * successPath {string}  Path to redirect after verified payment. Defaults to "/success"
 */
export default function CheckoutButton({
    amount,
    currency = "INR",
    name = "EccoWatt",
    description = "Payment",
    prefill = {},
    onSuccess,
    onFailure,
    successPath = "/success",
}) {
    const router = useRouter();
    const pollRef = useRef(null);

    const [rzpReady, setRzpReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);   // inline error message

    // ── Wait for window.Razorpay (loaded in layout) ──────────────────────────
    useEffect(() => {
        if (window.Razorpay) { setRzpReady(true); return; }

        let elapsed = 0;
        pollRef.current = setInterval(() => {
            elapsed += 100;
            if (window.Razorpay) {
                clearInterval(pollRef.current);
                setRzpReady(true);
            } else if (elapsed >= 10_000) {
                clearInterval(pollRef.current);
                setError("Razorpay failed to load. Please refresh the page.");
            }
        }, 100);

        return () => clearInterval(pollRef.current);
    }, []);

    // ── Step 1: Create order on FastAPI ──────────────────────────────────────
    async function fetchOrder() {
        const res = await fetch(`${FASTAPI_URL}/razorpay/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, currency }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Could not create order. Please try again.");
        }
        return res.json();
    }

    // ── Step 2: Verify payment on FastAPI ────────────────────────────────────
    async function verifyPayment(response) {
        const res = await fetch(`${FASTAPI_URL}/razorpay/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Payment verification failed. Contact support.");
        }
        return res.json();
    }

    // ── Main click handler ────────────────────────────────────────────────────
    async function handleCheckout() {
        if (!rzpReady || loading) return;
        setLoading(true);
        setError(null);

        try {
            const order = await fetchOrder();

            const options = {
                key: RAZORPAY_KEY,
                amount: order.amount,
                currency: order.currency,
                name,
                description,
                order_id: order.order_id,
                prefill,

                // ── Success handler: verify then redirect ──────────────────────────
                handler: async function (response) {
                    try {
                        const result = await verifyPayment(response);
                        onSuccess?.(result);

                        // Redirect to /success with payment_id as a query param
                        router.push(
                            `${successPath}?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`
                        );
                    } catch (err) {
                        setError(err.message);
                        onFailure?.(err.message);
                        setLoading(false);
                    }
                },

                // ── Modal dismissed (user cancelled) ──────────────────────────────
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setError("Payment was cancelled. You can try again.");
                    },
                },

                theme: { color: "#16a34a" },
            };

            const rzp = new window.Razorpay(options);

            // ── Payment failed inside the modal ───────────────────────────────────
            rzp.on("payment.failed", (response) => {
                const msg =
                    response.error?.description ||
                    response.error?.reason ||
                    "Payment failed. Please try a different payment method.";
                setError(msg);
                onFailure?.(msg);
                setLoading(false);
            });

            rzp.open();
        } catch (err) {
            // Network error or order creation failure
            setError(err.message);
            onFailure?.(err.message);
            setLoading(false);
        }
    }

    const isDisabled = !rzpReady || loading;

    return (
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <button
                id="razorpay-checkout-btn"
                onClick={handleCheckout}
                disabled={isDisabled}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "13px 32px",
                    backgroundColor: isDisabled ? "#86efac" : "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s, transform 0.1s, box-shadow 0.2s",
                    boxShadow: isDisabled ? "none" : "0 4px 14px rgba(22,163,74,0.35)",
                }}
                onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
                {loading
                    ? "Processing…"
                    : !rzpReady
                        ? "Loading…"
                        : `Pay ₹${amount.toLocaleString("en-IN")}`
                }
            </button>

            {/* Inline error message */}
            {error && (
                <div
                    role="alert"
                    style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: "13px",
                        fontWeight: 500,
                        maxWidth: "320px",
                        textAlign: "center",
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    );
}
