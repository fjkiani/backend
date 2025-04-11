-- Add columns if they don't exist
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS unique_key TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'articles_unique_key_constraint'
    ) THEN
        ALTER TABLE articles
        ADD CONSTRAINT articles_unique_key_constraint UNIQUE (unique_key);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_articles_unique_key 
ON articles(unique_key); 