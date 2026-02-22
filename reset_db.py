import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

product_id = "6ca22814-c1a4-42e2-bec5-fdb388806692"

# 1 minute from now in UTC
future_time = datetime.now(timezone.utc) + timedelta(minutes=1)
iso_time = future_time.isoformat()

print(f"Resetting product {product_id}...")
print(f"New drop time: {iso_time}")

# Reset the Vintage Leather Jacket to current_price = 150
response = supabase.table("products").update({
    "current_price": 150.0,
    "drop_time": iso_time
}).eq("id", product_id).execute()

print("Products table updated.")

# Also delete all user_shares for this product so you can click again!
response_shares = supabase.table("user_shares").delete().eq("product_id", product_id).execute()
print("User shares cleared.")
