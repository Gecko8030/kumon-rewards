-- Create transactions table for logging Kumon dollar changes
-- Run this in your Supabase SQL Editor

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'refund')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all transactions
CREATE POLICY "Admins can read all transactions" ON transactions
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy for admins to insert transactions
CREATE POLICY "Admins can insert transactions" ON transactions
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin WHERE admin.id = auth.uid()));

-- Policy for students to read their own transactions
CREATE POLICY "Students can read own transactions" ON transactions
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;
