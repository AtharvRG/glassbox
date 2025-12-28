-- =====================================================
-- GLASSBOX DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Table to track the high-level execution (e.g., "Competitor Search: Nike")
create table if not exists executions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  status text default 'running', -- 'running', 'completed', 'failed'
  metadata jsonb default '{}'::jsonb -- Stores high-level context like user_id or environment
);

-- 2. Table to track the individual logic steps
create table if not exists steps (
  id uuid default gen_random_uuid() primary key,
  execution_id uuid references executions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  step_name text not null,
  step_order int not null,
  input jsonb,
  output jsonb,
  reasoning text, -- The core "X-Ray" feature: Why did this happen?
  status text default 'success',
  duration_ms int
);

-- 3. Products table for competitor analysis
create table if not exists products (
  id text primary key,
  title text not null,
  price decimal(10,2) not null,
  rating decimal(2,1) not null,
  reviews int not null,
  category text not null,
  keywords text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for efficient querying
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_keywords on products using gin(keywords);

-- 4. Enable Realtime (Optional but good for dashboards)
alter publication supabase_realtime add table executions;
alter publication supabase_realtime add table steps;
alter publication supabase_realtime add table products;

-- 5. Disable RLS for this specific demo to prevent "Permission Denied" errors
-- In a production app, we would add specific policies here.
alter table executions enable row level security;
create policy "Public Access" on executions for all using (true);

alter table steps enable row level security;
create policy "Public Access" on steps for all using (true);

alter table products enable row level security;
create policy "Public Access" on products for all using (true);


-- =====================================================
-- SEED DATA: ~35 Products across 6 categories
-- =====================================================

-- Clear existing products (optional, comment out if you want to append)
-- truncate table products;

insert into products (id, title, price, rating, reviews, category, keywords) values

-- =====================================================
-- WATER BOTTLES (7 products)
-- =====================================================
('wb-001', 'HydroFlask 32oz Wide Mouth Water Bottle', 44.95, 3.8, 2200, 'water-bottle', array['water', 'bottle', 'insulated', 'stainless', 'hydroflask', 'reusable', 'drinking', 'wide mouth']),
('wb-002', 'Yeti Rambler 26oz Insulated Bottle', 35.00, 4.7, 8500, 'water-bottle', array['water', 'bottle', 'insulated', 'yeti', 'rambler', 'stainless', 'drinking', 'premium']),
('wb-003', 'Cheap Plastic Water Bottle', 5.99, 2.4, 45, 'water-bottle', array['water', 'bottle', 'plastic', 'cheap', 'disposable', 'drinking', 'basic']),
('wb-004', 'Simple Clear Plastic Water Bottle 16oz', 12.99, 4.9, 12850, 'water-bottle', array['water', 'bottle', 'plastic', 'clear', 'simple', 'basic', 'bpa-free', 'lightweight']),
('wb-005', 'Stainless Steel Sports Water Bottle', 18.99, 4.3, 2200, 'water-bottle', array['water', 'bottle', 'stainless', 'steel', 'sports', 'metal', 'durable']),
('wb-006', 'Nalgene 32oz Wide Mouth BPA-Free', 14.95, 4.6, 15200, 'water-bottle', array['water', 'bottle', 'nalgene', 'bpa-free', 'wide mouth', 'durable', 'outdoor']),
('wb-007', 'CamelBak Chute Mag 25oz', 16.00, 4.4, 6800, 'water-bottle', array['water', 'bottle', 'camelbak', 'magnetic', 'cap', 'leak-proof', 'sports']),

-- =====================================================
-- RUNNING SHOES (6 products)
-- =====================================================
('rs-001', 'Nike Air Zoom Pegasus 40', 130.00, 4.5, 8900, 'running-shoes', array['running', 'shoes', 'nike', 'pegasus', 'cushioned', 'daily trainer', 'road']),
('rs-002', 'Adidas Ultraboost Light', 190.00, 4.7, 4500, 'running-shoes', array['running', 'shoes', 'adidas', 'ultraboost', 'boost', 'premium', 'responsive']),
('rs-003', 'Brooks Ghost 15', 140.00, 4.6, 12300, 'running-shoes', array['running', 'shoes', 'brooks', 'ghost', 'neutral', 'cushioned', 'comfortable']),
('rs-004', 'ASICS Gel-Kayano 30', 160.00, 4.4, 3200, 'running-shoes', array['running', 'shoes', 'asics', 'kayano', 'stability', 'support', 'gel']),
('rs-005', 'New Balance Fresh Foam 1080v13', 165.00, 4.5, 5600, 'running-shoes', array['running', 'shoes', 'new balance', 'fresh foam', 'plush', 'max cushion']),
('rs-006', 'Hoka Clifton 9', 145.00, 4.8, 9800, 'running-shoes', array['running', 'shoes', 'hoka', 'clifton', 'lightweight', 'cushioned', 'popular']),

-- =====================================================
-- WIRELESS EARBUDS (6 products)
-- =====================================================
('we-001', 'Apple AirPods Pro 2nd Gen', 249.00, 4.7, 45000, 'wireless-earbuds', array['earbuds', 'wireless', 'apple', 'airpods', 'noise cancelling', 'anc', 'premium']),
('we-002', 'Samsung Galaxy Buds2 Pro', 179.99, 4.4, 8900, 'wireless-earbuds', array['earbuds', 'wireless', 'samsung', 'galaxy', 'android', 'anc', 'comfortable']),
('we-003', 'Sony WF-1000XM5', 299.99, 4.6, 6700, 'wireless-earbuds', array['earbuds', 'wireless', 'sony', 'noise cancelling', 'premium', 'audiophile', 'anc']),
('we-004', 'Jabra Elite 85t', 179.99, 4.3, 4200, 'wireless-earbuds', array['earbuds', 'wireless', 'jabra', 'anc', 'calls', 'business', 'adjustable']),
('we-005', 'Anker Soundcore Liberty 4', 79.99, 4.5, 18500, 'wireless-earbuds', array['earbuds', 'wireless', 'anker', 'budget', 'value', 'spatial audio', 'affordable']),
('we-006', 'JBL Tune 230NC TWS', 99.95, 4.2, 7800, 'wireless-earbuds', array['earbuds', 'wireless', 'jbl', 'bass', 'anc', 'affordable', 'colorful']),

-- =====================================================
-- BACKPACKS (6 products)
-- =====================================================
('bp-001', 'Osprey Daylite Plus 20L', 75.00, 4.8, 5600, 'backpack', array['backpack', 'osprey', 'hiking', 'daypack', 'lightweight', 'outdoor', 'travel']),
('bp-002', 'North Face Borealis 28L', 99.00, 4.5, 12400, 'backpack', array['backpack', 'north face', 'laptop', 'school', 'commute', 'durable', 'popular']),
('bp-003', 'Herschel Little America', 109.99, 4.3, 8900, 'backpack', array['backpack', 'herschel', 'stylish', 'urban', 'laptop', 'fashion', 'vintage']),
('bp-004', 'JanSport Right Pack', 68.00, 4.6, 22100, 'backpack', array['backpack', 'jansport', 'classic', 'school', 'leather bottom', 'durable', 'warranty']),
('bp-005', 'Patagonia Black Hole 25L', 139.00, 4.7, 3400, 'backpack', array['backpack', 'patagonia', 'recycled', 'waterproof', 'outdoor', 'eco-friendly', 'durable']),
('bp-006', 'Amazon Basics Laptop Backpack', 29.99, 4.1, 45600, 'backpack', array['backpack', 'amazon', 'budget', 'laptop', 'basic', 'affordable', 'simple']),

-- =====================================================
-- YOGA MATS (5 products)
-- =====================================================
('ym-001', 'Manduka PRO Yoga Mat 6mm', 120.00, 4.8, 8900, 'yoga-mat', array['yoga', 'mat', 'manduka', 'pro', 'thick', 'premium', 'non-slip', 'durable']),
('ym-002', 'Liforme Original Yoga Mat', 149.95, 4.7, 4200, 'yoga-mat', array['yoga', 'mat', 'liforme', 'alignment', 'eco-friendly', 'grip', 'premium']),
('ym-003', 'Gaiam Essentials Thick Yoga Mat', 21.98, 4.4, 67000, 'yoga-mat', array['yoga', 'mat', 'gaiam', 'thick', 'affordable', 'beginner', 'cushion']),
('ym-004', 'Jade Harmony Professional Mat', 84.95, 4.6, 5600, 'yoga-mat', array['yoga', 'mat', 'jade', 'rubber', 'eco-friendly', 'grip', 'natural']),
('ym-005', 'Amazon Basics 1/2-Inch Yoga Mat', 19.49, 4.3, 89000, 'yoga-mat', array['yoga', 'mat', 'amazon', 'budget', 'thick', 'basic', 'affordable']),

-- =====================================================
-- TUMBLERS & COFFEE MUGS (5 products)
-- =====================================================
('tm-001', 'Stanley Quencher 40oz Tumbler', 45.00, 4.6, 34000, 'tumbler', array['tumbler', 'stanley', 'quencher', 'insulated', 'straw', 'large', 'trendy']),
('tm-002', 'Yeti Rambler 20 oz Travel Mug', 35.00, 4.8, 28000, 'tumbler', array['tumbler', 'yeti', 'rambler', 'insulated', 'durable', 'premium', 'stainless']),
('tm-003', 'Contigo Autoseal West Loop Travel Mug', 24.99, 4.5, 42000, 'tumbler', array['tumbler', 'contigo', 'travel', 'mug', 'autoseal', 'spill-proof', 'coffee']),
('tm-004', 'Hydro Flask 20oz Wide Mouth with Flex Sip Lid', 34.95, 4.4, 6700, 'tumbler', array['tumbler', 'hydroflask', 'insulated', 'coffee', 'tea', 'flex sip', 'versatile']),
('tm-005', 'Simple Modern 24oz Classic Tumbler', 18.99, 4.6, 52000, 'tumbler', array['tumbler', 'simple modern', 'budget', 'insulated', 'straw', 'value', 'colorful'])

on conflict (id) do update set
  title = excluded.title,
  price = excluded.price,
  rating = excluded.rating,
  reviews = excluded.reviews,
  category = excluded.category,
  keywords = excluded.keywords;
