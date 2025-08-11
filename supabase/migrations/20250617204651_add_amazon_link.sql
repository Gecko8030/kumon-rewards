-- Add amazon_link field to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS amazon_link text;

-- Update the rewards table to make description optional since we're using amazon_link
ALTER TABLE rewards ALTER COLUMN description DROP NOT NULL;
