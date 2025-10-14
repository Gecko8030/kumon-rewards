-- Create the remove_kumon_dollars function
-- Run this in your Supabase SQL Editor

-- Drop the existing function first if it exists
DROP FUNCTION IF EXISTS remove_kumon_dollars(UUID, INTEGER);

-- Create the function to remove Kumon dollars from students
CREATE OR REPLACE FUNCTION remove_kumon_dollars(
    p_student_id UUID,
    p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Get current balance first
    SELECT kumon_dollars INTO current_balance 
    FROM students 
    WHERE id = p_student_id;
    
    -- Check if student exists
    IF current_balance IS NULL THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;
    
    -- Check if student has enough balance
    IF current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Student has % dollars, trying to remove %', current_balance, p_amount;
    END IF;
    
    -- Update the student's Kumon dollars balance
    UPDATE students 
    SET kumon_dollars = current_balance - p_amount
    WHERE id = p_student_id;
    
    -- Log the transaction (optional - only if transactions table exists)
    BEGIN
        INSERT INTO transactions (student_id, amount, type, description)
        VALUES (p_student_id, p_amount, 'removed', 'Removed by admin');
    EXCEPTION
        WHEN OTHERS THEN
            -- If transactions table doesn't exist, just continue
            NULL;
    END;
    
    RAISE NOTICE 'Successfully removed % dollars from student %. New balance: %', 
        p_amount, p_student_id, current_balance - p_amount;
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to remove Kumon dollars: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_kumon_dollars(UUID, INTEGER) TO authenticated;

-- Test the function (optional - you can comment this out)
-- SELECT remove_kumon_dollars('00000000-0000-0000-0000-000000000000', 10);

-- Verify the function was created
SELECT 
    routine_name, 
    routine_type, 
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'remove_kumon_dollars' 
AND routine_schema = 'public';
