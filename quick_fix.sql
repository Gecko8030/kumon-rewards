-- Quick Fix for Kumon Rewards Database
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns to admin table
ALTER TABLE admin ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE admin ADD COLUMN IF NOT EXISTS name text;

-- 2. Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS level text DEFAULT 'Level A';
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS kumon_dollars integer DEFAULT 0;

-- 3. Clear existing data (since the IDs don't match auth users)
DELETE FROM admin;
DELETE FROM students;

-- 4. Add some sample rewards
INSERT INTO rewards (name, description, cost, image_url, category) VALUES
('Toy Car', 'A cool remote control car', 50, 'https://via.placeholder.com/150', 'toys'),
('Book Set', 'Educational book collection', 30, 'https://via.placeholder.com/150', 'books'),
('Art Supplies', 'Colored pencils and sketchbook', 25, 'https://via.placeholder.com/150', 'art')
ON CONFLICT DO NOTHING; 