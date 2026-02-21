"use client";

import Script from "next/script";
import { useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";
const RAZORPAY_KEY_ID  = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "YOUR_KEY_ID";

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * PayNowButton
 *
 * Props:
 *  - amount      {number}  Amount in paise (e.g. 50000 = ₹500). Required.
 *  - currency    {string}  Defaults to "INR".
 *  - description {string}  Shown inside the Razorpay modal.
 *  - prefill     {object}  { name, email, contact } pre-filled in the modal.
 *  - onSuccess   {fn}      Called with the verified server response on success.
 *  - onFailure   {fn}      Called with an error string on failure.
 */
export default function PayNowButton({
  amount,
  currency = "INR",
  description = "Payment",
  prefill = {},
  onSuccess,
  onFailure,
}) {
  const [loading, setLoading] = useState(false);

  // ── Step 1: Create order on the FastAPI backend ──────────────────────────
  async function createOrder() {
    const res = await fetch(`${FASTAPI_BASE_URL}/razorpay/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create order.");
    }

    return res.json(); // { order_id, amount, currency }
  }

  // ── Step 2: Verify payment on the FastAPI backend ────────────────────────
  async function verifyPayment(paymentResponse) {
    const res = await fetch(`${FASTAPI_BASE_URL}/razorpay/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id:   paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature:  paymentResponse.razorpay_signature,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Payment verification failed.");
    }

    return res.json(); // { status: "success", message: "..." }
  }

  // ── Main handler ─────────────────────────────────────────────────────────
  async function handlePayNow() {
    setLoading(true);
    try {
      // 1. Get Razorpay order from backend
      const order = await createOrder();

      // 2. Open Razorpay checkout modal
      const options = {
        key:         RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        "EccoWatt",
        description,
        order_id:    order.order_id,
        prefill,

        handler: async function (response) {
          // 3. Verify the payment signature server-side
          try {
            const result = await verifyPayment(response);
            onSuccess?.(result);
          } catch (err) {
            onFailure?.(err.message);
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },

        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        onFailure?.(response.error.description);
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      onFailure?.(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      {/* Load the Razorpay checkout script once */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <button
        onClick={handlePayNow}
        disabled={loading}
        style={{
          padding: "12px 28px",
          backgroundColor: loading ? "#93c5fd" : "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s",
        }}
      >
        {loading ? "Processing…" : "Pay Now"}
      </button>
    </>
  );
}
