import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from razorpay_router import router as razorpay_router

load_dotenv()

# ── Allowed origins ───────────────────────────────────────────────────────────
# Set FRONTEND_URL in your Render/Vercel dashboard environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",   # Next.js dev server
    "http://127.0.0.1:3000",
    "https://*.vercel.app",    # Allows all Vercel subdomains (Crucial for production)
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    create_db_and_tables()
    yield


app = FastAPI(title="EccoWatt API", version="1.0.0", lifespan=lifespan)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(razorpay_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "EccoWatt API is running."}