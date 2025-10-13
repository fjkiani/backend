-- Fix missing user_id column in articles table
-- Run this in your Supabase SQL Editor

-- Add user_id column to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'global';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);

-- Update existing articles to have user_id = 'global'
UPDATE articles 
SET user_id = 'global' 
WHERE user_id IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name = 'user_id';

