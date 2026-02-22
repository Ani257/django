CREATE TABLE Products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    minimum_price DECIMAL(10, 2) NOT NULL,
    drop_time TIMESTAMP WITH TIME ZONE,
    brand_url VARCHAR(255)
);
-- Sample Data
INSERT INTO Products (name, current_price, minimum_price)
VALUES ('Vintage Leather Jacket', 150.00, 75.00),
    ('Gaming Laptop RTX 4080', 2500.00, 1800.00),
    ('Antique Wooden Desk', 450.00, 200.00),
    ('Mechanical Keyboard', 120.00, 60.00),
    ('Noise Cancelling Headphones', 300.00, 150.00);
-- Track user clicks for price drops (Limit 1 share per user per product)
CREATE TABLE user_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    -- Or VARCHAR(255) if using string-based auth IDs
    product_id UUID NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraint to only allow 1 share per user per product
    UNIQUE(user_id, product_id)
);