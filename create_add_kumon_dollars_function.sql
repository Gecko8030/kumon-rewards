-- Create the missing add_kumon_dollars function
-- Run this in your Supabase SQL Editor

-- Create the function to add Kumon dollars to students
CREATE OR REPLACE FUNCTION add_kumon_dollars(
    p_student_id UUID,
    p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the student's Kumon dollars balance
    UPDATE students 
    SET kumon_dollars = kumon_dollars + p_amount
    WHERE students.id = p_student_id;
    
    -- Check if any rows were affected
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student with ID % not found', p_student_id;
    END IF;
    
    -- Log the transaction (optional)
    INSERT INTO transactions (student_id, amount, type, description)
    VALUES (p_student_id, p_amount, 'earned', 'Added by admin');
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to add Kumon dollars: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_kumon_dollars(UUID, INTEGER) TO authenticated;

-- Test the function (optional - you can comment this out)
-- SELECT add_kumon_dollars('00000000-0000-0000-0000-000000000000', 10);

-- Verify the function was created
SELECT 
    routine_name, 
    routine_type, 
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'add_kumon_dollars' 
AND routine_schema = 'public';
