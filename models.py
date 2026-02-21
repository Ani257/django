from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class PaymentStatus(str, Enum):
    pending = "pending"
    paid    = "paid"
    failed  = "failed"


class Order(SQLModel, table=True):
    """
    One row per Razorpay order.

    Lifecycle:
      1. Row inserted (status=pending) when /create-order is called.
      2. Row updated  (status=paid)    when /verify-payment succeeds.
      3. Row updated  (status=failed)  when /webhook receives payment.failed.
    """
    id:           Optional[int]     = Field(default=None, primary_key=True)
    order_id:     str               = Field(index=True, unique=True)   # Razorpay order ID
    payment_id:   Optional[str]     = Field(default=None)              # Razorpay payment ID
    amount:       int               = Field()                          # Amount in paise
    currency:     str               = Field(default="INR")
    status:       PaymentStatus     = Field(default=PaymentStatus.pending)
    created_at:   datetime          = Field(
                      default_factory=lambda: datetime.now(timezone.utc)
                  )
    updated_at:   Optional[datetime] = Field(default=None)
