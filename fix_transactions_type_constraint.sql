-- Fix the transactions table constraint to allow 'removed' type
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the new constraint that includes 'removed'
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('earned', 'spent', 'removed'));

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'transactions_type_check' 
AND conrelid = 'transactions'::regclass;
