-- Add paid_amount column to track partial payments
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;
