-- InteraktifMenu Database Schema
-- =================================
-- Multi-tenant SaaS platform for restaurant management
-- with tier-based feature access

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Stores user account information and subscription tier
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('tam_paket', 'yarim_paket', 'giris_paket')),
  restaurant_name TEXT,
  happy_hour_start TIME,
  happy_hour_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- =====================================================
-- PRODUCTS TABLE (Digital Menu)
-- =====================================================
-- Stores menu items with regular and happy hour pricing
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  happy_hour_price DECIMAL(10,2),
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX products_user_id_idx ON products(user_id);
CREATE INDEX products_category_idx ON products(category);

-- RLS Policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view active products for digital menu display
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);


-- =====================================================
-- ZONES TABLE (POS System)
-- =====================================================
-- Stores zone/area definitions (e.g., Garden, Floor 1)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX zones_user_id_idx ON zones(user_id);

-- RLS Policies for zones
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own zones" ON zones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own zones" ON zones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own zones" ON zones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own zones" ON zones
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- TABLES TABLE (POS System)
-- =====================================================
-- Stores individual tables within zones
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX tables_user_id_idx ON tables(user_id);
CREATE INDEX tables_zone_id_idx ON tables(zone_id);

-- RLS Policies for tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tables" ON tables
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tables" ON tables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tables" ON tables
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tables" ON tables
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- ORDERS TABLE (POS System)
-- =====================================================
-- Stores customer orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster queries
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_table_id_idx ON orders(table_id);
CREATE INDEX orders_status_idx ON orders(status);

-- RLS Policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- ORDER_ITEMS TABLE (POS System)
-- =====================================================
-- Stores individual items within orders with SNAPSHOT PRICING
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price_snapshot DECIMAL(10,2) NOT NULL, -- CRITICAL: Price at time of order
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX order_items_order_id_idx ON order_items(order_id);

-- RLS Policies for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own order items" ON order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own order items" ON order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );


-- =====================================================
-- PDF_MENUS TABLE (PDF Menu Feature)
-- =====================================================
-- Stores uploaded PDF menus
CREATE TABLE pdf_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX pdf_menus_user_id_idx ON pdf_menus(user_id);

-- RLS Policies for pdf_menus
ALTER TABLE pdf_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pdf menus" ON pdf_menus
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pdf menus" ON pdf_menus
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pdf menus" ON pdf_menus
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view PDF menus by ID for public access
CREATE POLICY "Public can view pdf menus by id" ON pdf_menus
  FOR SELECT USING (true);


-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, restaurant_name)
  VALUES (
    NEW.id,
    NEW.email,
    'giris_paket', -- Default to starter plan
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Note: These need to be created in Supabase Dashboard or via API
-- 1. product-images (public bucket for product photos)
-- 2. pdf-menus (public bucket for PDF menus, max 30MB)

-- Storage policies will need to be configured to:
-- - Allow authenticated users to upload to their own folders
-- - Allow public read access to all files
