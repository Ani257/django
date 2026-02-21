import { useState } from "react";
import CheckoutButton from "./CheckoutButton";

const FINAL_PRICE = 500; // ₹500 — change this or pass it as a prop/from API

export default function AuctionPage() {
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);

    function handleSuccess(result) {
        setIsError(false);
        setMessage("🎉 Payment successful! Your order has been confirmed.");
        console.log("Verified payment response:", result);
    }

    function handleFailure(err) {
        setIsError(true);
        setMessage(`❌ Payment failed: ${err}`);
        console.error("Payment error:", err);
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                backgroundColor: "#f9fafb",
                fontFamily: "'Inter', sans-serif",
                padding: "24px",
            }}
        >
            {/* Card */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    padding: "48px 40px",
                    maxWidth: "420px",
                    width: "100%",
                    textAlign: "center",
                }}
            >
                {/* Header */}
                <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px", color: "#111827" }}>
                    Reverse Auction Checkout
                </h1>

                <p style={{ color: "#6b7280", margin: "0 0 32px", fontSize: "15px" }}>
                    Congratulations! You won the auction.
                </p>

                {/* Price badge */}
                <div
                    style={{
                        display: "inline-block",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        padding: "10px 24px",
                        marginBottom: "32px",
                    }}
                >
                    <span style={{ fontSize: "13px", color: "#15803d", fontWeight: 600, display: "block" }}>
                        FINAL PRICE
                    </span>
                    <span style={{ fontSize: "32px", fontWeight: 800, color: "#166534" }}>
                        ₹{FINAL_PRICE.toLocaleString("en-IN")}
                    </span>
                </div>

                {/* Checkout button */}
                <div>
                    <CheckoutButton
                        amount={FINAL_PRICE}
                        description="Reverse Auction — Winning Bid"
                        prefill={{ name: "", email: "", contact: "" }}
                        onSuccess={handleSuccess}
                        onFailure={handleFailure}
                    />
                </div>

                {/* Status message */}
                {message && (
                    <p
                        style={{
                            marginTop: "24px",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 500,
                            backgroundColor: isError ? "#fef2f2" : "#f0fdf4",
                            color: isError ? "#dc2626" : "#16a34a",
                            border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
                        }}
                    >
                        {message}
                    </p>
                )}

                <p style={{ marginTop: "24px", fontSize: "12px", color: "#9ca3af" }}>
                    Secured by Razorpay · 256-bit SSL encryption
                </p>
            </div>
        </div>
    );
}
