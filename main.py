import os
from contextlib import asynccontextmanager
from typing import Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from supabase import create_client, Client

from database import create_db_and_tables
from razorpay_router import router as razorpay_router

# Load environment variables
load_dotenv(".env")
load_dotenv()

# Supabase setup
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

try:
    if SUPABASE_URL == "https://your-project.supabase.co":
        print("Warning: Using placeholder SUPABASE_URL")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client: {e}")
    supabase = None

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, product_id: str):
        await websocket.accept()
        if product_id not in self.active_connections:
            self.active_connections[product_id] = []
        self.active_connections[product_id].append(websocket)

    def disconnect(self, websocket: WebSocket, product_id: str):
        if product_id in self.active_connections:
            if websocket in self.active_connections[product_id]:
                self.active_connections[product_id].remove(websocket)
            if not self.active_connections[product_id]:
                del self.active_connections[product_id]

    async def broadcast(self, message: dict, product_id: str):
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
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(razorpay_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the Reverse Auction API"}

@app.get("/products")
def get_products():
    if not supabase:
        return {"error": "Supabase client not initialized properly."}
    
    response = supabase.table("products").select("*").execute()
    return {"data": response.data}
    
@app.websocket("/ws/auction/{product_id}")
async def websocket_auction_endpoint(websocket: WebSocket, product_id: str):
    await manager.connect(websocket, product_id)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("action") == "share_click":
                # 1. Query current state of the product
                response = supabase.table("products").select("current_price, minimum_price, drop_time").eq("id", product_id).execute()
                
                if not response.data:
                    await websocket.send_json({"error": "Product not found"})
                    continue
                    
                product = response.data[0]
                current_price = float(product["current_price"])
                minimum_price = float(product["minimum_price"])
                
                # Check drop_time
                drop_time_str = product.get("drop_time")
                if drop_time_str:
                    from datetime import datetime, timezone
                    drop_time_parsed = datetime.fromisoformat(drop_time_str.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) < drop_time_parsed:
                        await websocket.send_json({"error": "Drop has not started yet"})
                        continue
                
                # 2. Deduct price if it hasn't reached minimum
                if current_price > minimum_price:
                    new_price = max(current_price - 1.0, minimum_price)
                    
                    # 3. Update the new price in database
                    update_response = supabase.table("products").update({"current_price": new_price}).eq("id", product_id).execute()
                    
                    if update_response.data:
                        # 4. Broadcast the new price to all clients viewing this product
                        updated_product = update_response.data[0]
                        await manager.broadcast({
                            "type": "price_update",
                            "product_id": product_id,
                            "new_price": float(updated_product["current_price"])
                        }, product_id)
                    else:
                        await websocket.send_json({"error": "Failed to update price"})
                else:
                    await websocket.send_json({"message": "Price has reached the minimum limit."})
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket, product_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, product_id)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
