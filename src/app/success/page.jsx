"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── Pure-CSS Confetti (no npm package needed) ─────────────────────────────────
function Confetti() {
    const colors = ["#16a34a", "#22c55e", "#86efac", "#2563eb", "#fbbf24", "#f472b6"];
    return (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
            {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} style={{
                    position: "absolute",
                    top: "-20px",
                    left: `${Math.random() * 100}%`,
                    width: `${6 + Math.random() * 8}px`,
                    height: `${6 + Math.random() * 8}px`,
                    backgroundColor: colors[i % colors.length],
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 1.5}s ease-in forwards`,
                }} />
            ))}
            <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SuccessPage() {
    const params = useSearchParams();
    const router = useRouter();
    const paymentId = params.get("payment_id") || "—";
    const orderId = params.get("order_id") || "—";
    const timerRef = useRef(null);

    // Auto-redirect to home after 8 s
    useEffect(() => {
        timerRef.current = setTimeout(() => router.push("/"), 8000);
        return () => clearTimeout(timerRef.current);
    }, [router]);

    return (
        <>
            <Confetti />
            <div style={{
                position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", minHeight: "100vh",
                fontFamily: "'Inter', sans-serif", padding: "24px", backgroundColor: "#f0fdf4",
            }}>
                <div style={{
                    background: "#fff", borderRadius: "20px", boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                    padding: "56px 48px", maxWidth: "460px", width: "100%", textAlign: "center",
                }}>
                    {/* Animated check icon */}
                    <div style={{
                        width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#dcfce7",
                        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
                    }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
                        Payment Successful!
                    </h1>
                    <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 32px" }}>
                        Your order has been confirmed. A receipt has been sent to your email.
                    </p>

                    {/* Receipt */}
                    <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px 20px", marginBottom: "32px", textAlign: "left" }}>
                        {[["Order ID", orderId], ["Payment ID", paymentId], ["Status", "Paid ✅"]].map(([label, value]) => (
                            <div key={label} style={{
                                display: "flex", justifyContent: "space-between", padding: "6px 0",
                                borderBottom: "1px solid #e5e7eb", fontSize: "13px",
                            }}>
                                <span style={{ color: "#6b7280" }}>{label}</span>
                                <span style={{ fontWeight: 600, color: "#111827", wordBreak: "break-all", maxWidth: "60%" }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    <Link href="/" style={{
                        display: "inline-block", padding: "12px 32px", backgroundColor: "#16a34a",
                        color: "#fff", borderRadius: "10px", fontWeight: 700, fontSize: "15px", textDecoration: "none",
                    }}>
                        Back to Home
                    </Link>

                    <p style={{ marginTop: "20px", fontSize: "12px", color: "#9ca3af" }}>
                        Redirecting automatically in 8 seconds…
                    </p>
                </div>
            </div>
        </>
    );
}
