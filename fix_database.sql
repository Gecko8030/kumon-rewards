-- Fix Kumon Rewards Database Structure
-- Run this in your Supabase SQL editor

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

-- 4. Create some sample rewards for testing
INSERT INTO rewards (name, description, cost, image_url, category) VALUES
('Toy Car', 'A cool remote control car', 50, 'https://via.placeholder.com/150', 'toys'),
('Book Set', 'Educational book collection', 30, 'https://via.placeholder.com/150', 'books'),
('Art Supplies', 'Colored pencils and sketchbook', 25, 'https://via.placeholder.com/150', 'art'),
('Puzzle', '1000 piece jigsaw puzzle', 40, 'https://via.placeholder.com/150', 'games'),
('Science Kit', 'Fun experiments for kids', 60, 'https://via.placeholder.com/150', 'science');

-- 5. Instructions for creating demo users:
-- Go to Authentication > Users in your Supabase dashboard
-- Create these users manually:
-- 
-- Admin user:
-- Email: admin@demo.com
-- Password: password123
-- 
-- Student user:  
-- Email: student@demo.com
-- Password: password123
--
-- After creating them, get their user IDs and run the INSERT statements below
-- (Replace the UUIDs with the actual user IDs from auth.users)

-- 6. Insert demo users (replace UUIDs with actual auth user IDs)
-- INSERT INTO admin (id, email, name) VALUES 
-- ('REPLACE_WITH_ADMIN_USER_ID', 'admin@demo.com', 'Demo Admin');

-- INSERT INTO students (id, email, name, level, kumon_dollars) VALUES 
-- ('REPLACE_WITH_STUDENT_USER_ID', 'student@demo.com', 'Demo Student', 'Level A', 100); 