/*
  # Initial Schema for Kumon Rewards System

  1. New Tables
    - `students`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `level` (text)
      - `avatar_url` (text, nullable)
      - `kumon_dollars` (integer, default 0)
      - `created_at` (timestamp)
    
    - `admins`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamp)
    
    - `rewards`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `cost` (integer)
      - `image_url` (text)
      - `category` (text)
      - `available` (boolean, default true)
      - `created_at` (timestamp)
    
    - `goals`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `reward_id` (uuid, references rewards)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `amount` (integer)
      - `type` (text, 'earned' or 'spent')
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for admins to manage all data
    - Add policies for students to read rewards and manage their own goals

  3. Functions
    - `add_kumon_dollars` function to safely add dollars to student accounts
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  level text NOT NULL DEFAULT 'Level A',
  avatar_url text,
  kumon_dollars integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  cost integer NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'toys',
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES rewards(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'spent')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admins policies
CREATE POLICY "Admins can read own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Admins can update all students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- Rewards policies (everyone can read)
CREATE POLICY "Anyone can read rewards"
  ON rewards
  FOR SELECT
  TO authenticated
  USING (available = true);

CREATE POLICY "Admins can manage rewards"
  ON rewards
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- Goals policies
CREATE POLICY "Students can read own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can read all goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Admins can update all goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- Transactions policies
CREATE POLICY "Students can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can read all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Admins can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- Function to safely add Kumon dollars
CREATE OR REPLACE FUNCTION add_kumon_dollars(student_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE students 
  SET kumon_dollars = kumon_dollars + amount 
  WHERE id = student_id;
END;
$$;

-- Insert sample data
INSERT INTO rewards (name, description, cost, image_url, category) VALUES
  ('LEGO Building Set', 'Creative building blocks for hours of fun', 200, 'https://images.pexels.com/photos/298825/pexels-photo-298825.jpeg', 'toys'),
  ('Art Supply Kit', 'Complete set of colored pencils, markers, and paper', 100, 'https://images.pexels.com/photos/1153213/pexels-photo-1153213.jpeg', 'toys'),
  ('Science Experiment Kit', 'Fun and educational science experiments', 150, 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg', 'books'),
  ('Nintendo Switch Game', 'Popular video game for entertainment', 300, 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg', 'electronics'),
  ('Book Series Set', 'Collection of age-appropriate books', 75, 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg', 'books'),
  ('Board Game Collection', 'Fun family board games', 125, 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg', 'toys'),
  ('Gift Card - Target', '$25 Target gift card', 250, 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg', 'gift-cards'),
  ('Movie Theater Tickets', 'Two movie tickets for weekend fun', 180, 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg', 'experiences');

ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_url text;