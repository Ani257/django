import hashlib
import hmac
import json
import os
from datetime import datetime, timezone

import razorpay
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models import Order, PaymentStatus

# ── Load environment variables from .env ──────────────────────────────────────
load_dotenv()

RAZORPAY_KEY_ID         = os.environ["RAZORPAY_KEY_ID"]
RAZORPAY_KEY_SECRET     = os.environ["RAZORPAY_KEY_SECRET"]
RAZORPAY_WEBHOOK_SECRET = os.environ["RAZORPAY_WEBHOOK_SECRET"]

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

router = APIRouter(prefix="/razorpay", tags=["Razorpay"])


# ── Request / Response schemas ────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    amount: float         # Amount in INR (e.g. 500 = ₹500). Converted to paise internally.
    currency: str = "INR"
    receipt: str | None = None


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ── POST /razorpay/create-order ───────────────────────────────────────────────
@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(
    payload: CreateOrderRequest,
    session: Session = Depends(get_session),
):
    """
    Create a Razorpay order and save a pending record to the database.

    - **amount**: Amount in INR (e.g. 500 = ₹500)
    - **currency**: Defaults to INR
    - **receipt**: Optional receipt identifier
    """
    try:
        amount_in_paise = int(payload.amount * 100)  # Convert INR → paise
        order_data: dict = {
            "amount": amount_in_paise,
            "currency": payload.currency,
            "payment_capture": 0,
        }
        if payload.receipt:
            order_data["receipt"] = payload.receipt

        import uuid
        # Mocking the Razorpay SDK for hackathon demo
        order = {
            "id": f"order_mock_{uuid.uuid4().hex[:8]}",
            "amount": amount_in_paise,
            "currency": order_data["currency"],
            "status": "created"
        }

        # Persist a pending Order row in the database
        # pyre-ignore[28]: Pyre does not understand SQLModel kwargs
        db_order = Order(
            **{
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "status": PaymentStatus.pending,
            }
        )
        session.add(db_order)
        session.commit()

        return CreateOrderResponse(
            **{
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
            }
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {str(e)}")


# ── POST /razorpay/verify-payment ─────────────────────────────────────────────
@router.post("/verify-payment")
def verify_payment(
    payload: VerifyPaymentRequest,
    session: Session = Depends(get_session),
):
    """
    Verify the Razorpay payment signature, then update the DB record to 'paid'.

    Validates the HMAC-SHA256 signature to confirm the payment was not
    tampered with between Razorpay and your frontend.
    """
    # 1. Verify HMAC signature
    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(
        key=RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg=body.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature.")

    # 2. Update the Order row in the database
    statement = select(Order).where(Order.order_id == payload.razorpay_order_id)
    db_order = session.exec(statement).first()

    if db_order:
        db_order.payment_id = payload.razorpay_payment_id
        db_order.status     = PaymentStatus.paid
        db_order.updated_at = datetime.now(timezone.utc)
        session.add(db_order)
        session.commit()
    else:
        # Order not found in DB — still return success (Razorpay side is valid)
        # but log a warning for investigation
        print(f"⚠️  Order {payload.razorpay_order_id} not found in DB after successful payment.")

    return {
        "status":     "success",
        "message":    "Payment verified and recorded.",
        "order_id":   payload.razorpay_order_id,
        "payment_id": payload.razorpay_payment_id,
    }


# ── POST /razorpay/webhook ────────────────────────────────────────────────────
@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(...),
    session: Session = Depends(get_session),
):
    """
    Razorpay Webhook endpoint.

    Razorpay sends signed POST requests here for events like
    payment.captured, payment.failed, order.paid, etc.

    Register this URL in Razorpay Dashboard → Webhooks:
        https://yourdomain.com/razorpay/webhook
    """
    raw_body: bytes = await request.body()

    # Verify the webhook signature
    expected_signature = hmac.new(
        key=RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    event      = json.loads(raw_body.decode("utf-8"))
    event_type = event.get("event", "")

    # ── Handle events ────────────────────────────────────────────────────────
    if event_type == "payment.captured":
        payment    = event["payload"]["payment"]["entity"]
        order_id   = payment["order_id"]
        payment_id = payment["id"]

        db_order = session.exec(select(Order).where(Order.order_id == order_id)).first()
        if db_order:
            db_order.payment_id = payment_id
            db_order.status     = PaymentStatus.paid
            db_order.updated_at = datetime.now(timezone.utc)
            session.add(db_order)
            session.commit()
        print(f"✅ payment.captured — order: {order_id} | payment: {payment_id}")

    elif event_type == "payment.failed":
        payment  = event["payload"]["payment"]["entity"]
        order_id = payment["order_id"]

        db_order = session.exec(select(Order).where(Order.order_id == order_id)).first()
        if db_order:
            db_order.status     = PaymentStatus.failed
            db_order.updated_at = datetime.now(timezone.utc)
            session.add(db_order)
            session.commit()
        print(f"❌ payment.failed — order: {order_id}")

    elif event_type == "order.paid":
        order    = event["payload"]["order"]["entity"]
        order_id = order["id"]
        print(f"📦 order.paid — order: {order_id}")

    # Always return 200 quickly — Razorpay retries if it doesn't get 200
    return {"status": "ok"}
