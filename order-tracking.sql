-- =====================================================================
-- BK STORE — ORDER-TRACKING.SQL
-- Order Tracking & Shipment Status Schema Enhancements
-- =====================================================================

-- 1. Ensure order tracking & column aliases exist on public.orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_number VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS placed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100) DEFAULT 'Leopard Courier / TCS',
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50) DEFAULT 'processing';

-- 2. Performance Indexes for Order Tracking Queries
CREATE INDEX IF NOT EXISTS idx_orders_number_lookup 
ON public.orders (order_number);

CREATE INDEX IF NOT EXISTS idx_orders_email_lookup 
ON public.orders (email);

-- 3. Enable RLS Public Policy for Order Tracking by Number / Email
DROP POLICY IF EXISTS "Public track order by number" ON public.orders;
CREATE POLICY "Public track order by number" 
ON public.orders FOR SELECT 
USING (true);

-- End of order-tracking.sql
