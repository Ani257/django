"""
Main application file for the Reverse Auction API.
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client, create_client

from database import create_db_and_tables
from razorpay_router import router as razorpay_router

# Ensure environment variables are loaded
load_dotenv(".env")
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

supabase: Optional[Client] = None

try:
    if SUPABASE_URL == "https://your-project.supabase.co":
        print("Warning: Using placeholder SUPABASE_URL")

    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:  # pylint: disable=broad-exception-caught
    print(f"Error initializing Supabase client: {e}")


class ConnectionManager:
    """Manages active WebSocket connections for products."""

    def __init__(self) -> None:
        # Store active connections per product:
        # {product_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, product_id: str) -> None:
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        if product_id not in self.active_connections:
            self.active_connections[product_id] = []
        self.active_connections[product_id].append(websocket)

    def disconnect(self, websocket: WebSocket, product_id: str) -> None:
        """Remove a disconnected WebSocket."""
        if product_id in self.active_connections:
            if websocket in self.active_connections[product_id]:
                self.active_connections[product_id].remove(websocket)
            if not self.active_connections[product_id]:
                self.active_connections.pop(product_id, None)

    async def broadcast(self, message: Dict[str, Any], product_id: str) -> None:
        """Send a JSON message to all connected clients for a product."""
        if product_id in self.active_connections:
            for connection in list(self.active_connections[product_id]):
                try:
                    await connection.send_json(message)
                except RuntimeError:
                    pass


manager = ConnectionManager()


# Allowed origins
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",   # Next.js dev server
    "http://127.0.0.1:3000",
    "https://*.vercel.app",    # Allows all Vercel subdomains
    "*",                       # Temporarily allow all for local testing
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    create_db_and_tables()
    yield

app = FastAPI(title="Reverse Auction API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Allows specified origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(razorpay_router)


@app.get("/")
def read_root() -> Dict[str, str]:
    """Root endpoint."""
    return {"status": "ok", "message": "Welcome to the Reverse Auction API"}


@app.get("/products")
def get_products() -> Dict[str, Any]:
    """Retrieve all products from Supabase and their share count."""
    if not supabase:
        return {"error": "Supabase client not initialized properly."}

    assert supabase is not None
    # 1. Fetch products
    response = supabase.table("products").select("*").execute()
    products = response.data

    # 2. Fetch share counts for each product
    if products:
        for product in products:
            product_id = product["id"]
            # Supabase Python client exact count query
            count_res = supabase.table("user_shares").select("*", count="exact").eq("product_id", product_id).execute()
            product["total_shares"] = count_res.count if count_res.count is not None else 0

    return {"data": products}


@app.websocket("/ws/auction/{product_id}")
async def websocket_auction_endpoint(
    websocket: WebSocket, product_id: str
) -> None:
    """WebSocket endpoint for live auction updates and bidding."""
    await manager.connect(websocket, product_id)
    if not supabase:
        await websocket.send_json(
            {"error": "Supabase client not initialized properly."}
        )
        manager.disconnect(websocket, product_id)
        return

    assert supabase is not None

    try:
        while True:
            data = await websocket.receive_json()
            print(f"--> [WS] Received data: {data}")
            if data.get("action") == "share_click":
                user_id = data.get("user_id")

                if not user_id:
                    await websocket.send_json({"error": "User ID is required to share"})
                    continue

                # 1. Try to record the share
                try:
                    share_response = (
                        supabase.table("user_shares")
                        .insert({"user_id": user_id, "product_id": product_id})
                        .execute()
                    )
                    print(f"--> [DB] Supabase response: {share_response}")
                except Exception as e:
                    # Supabase python client raises an exception on constraint failure
                    err_message = str(e)
                    print(f"Supabase exception: {e}")
                    if "duplicate key value violates unique constraint" in err_message.lower():
                        await websocket.send_json({"error": "You have already shared this drop!"})
                    else:
                        await websocket.send_json({"error": "Could not record share"})
                    continue

                if getattr(share_response, 'error', None) and share_response.error:
                     print(f"Supabase error response: {share_response.error}")
                     # For some client versions, errors are returned instead of raised
                     if share_response.error.code == "23505": # PostgreSQL unique violation code
                         await websocket.send_json({"error": "You have already shared this drop!"})
                     else:
                        await websocket.send_json({"error": "Could not record share"})
                     continue

                # 2. Query current state of the product
                response = (
                    supabase.table("products")
                    .select("current_price, minimum_price, drop_time")
                    .eq("id", product_id)
                    .execute()
                )

                if not response.data or len(response.data) == 0:
                    await websocket.send_json({"error": "Product not found"})
                    continue

                product = response.data[0]
                if not isinstance(product, dict):
                    continue

                current_price = float(product.get("current_price", 0))
                minimum_price = float(product.get("minimum_price", 0))

                # Check drop_time
                drop_time_str = product.get("drop_time")
                if isinstance(drop_time_str, str):
                    # Handle Supabase Z notation for UTC
                    drop_time_parsed = datetime.fromisoformat(
                        drop_time_str.replace("Z", "+00:00")
                    )
                    now_utc = datetime.now(timezone.utc)
                    if now_utc < drop_time_parsed:
                        err = {"error": "Drop has not started yet"}
                        await websocket.send_json(err)
                        continue
                        
                    if now_utc > drop_time_parsed + timedelta(hours=24):
                        err = {"error": "The drop has ended! Processing winners..."}
                        await websocket.send_json(err)
                        continue

                # 3. Deduct price if it hasn't reached minimum
                if current_price > minimum_price:
                    # Ensure we don't drop below minimum
                    new_price = max(current_price - 1.0, minimum_price)

                    # 4. Update the new price in database
                    update_response = (
                        supabase.table("products")
                        .update({"current_price": new_price})
                        .eq("id", product_id)
                        .execute()
                    )

                    if update_response.data and len(update_response.data) > 0:
                        # Fetch the new exact total shares count
                        count_res = supabase.table("user_shares").select("*", count="exact").eq("product_id", product_id).execute()
                        current_share_count = count_res.count if hasattr(count_res, 'count') and count_res.count is not None else 0

                        # 5. Broadcast the new price and share count
                        updated_product = update_response.data[0]
                        if isinstance(updated_product, dict):
                            new_val = float(
                                updated_product.get("current_price", 0)
                            )
                            print(f"--> [WS] Broadcasting new price: {new_val} | Shares: {current_share_count}")
                            await manager.broadcast(
                                {
                                    "type": "price_update",
                                    "product_id": product_id,
                                    "new_price": new_val,
                                    "total_shares": current_share_count
                                },
                                product_id,
                            )
                    else:
                        await websocket.send_json(
                            {"error": "Failed to update price"}
                        )
                else:
                    msg = {"message": "Price has reached the minimum limit."}
                    await websocket.send_json(msg)

    except WebSocketDisconnect:
        manager.disconnect(websocket, product_id)
    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, product_id)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
