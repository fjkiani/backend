-- Supabase Cron Jobs Setup for Railway Backend
-- Run these commands in your Supabase SQL Editor

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create high-frequency news scraping job (every 30 minutes)
-- This will run during market hours and off-hours
SELECT cron.schedule(
  'railway-news-scrape-high',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://web-production-9a14.up.railway.app/api/schedule/trigger-te-scrape',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-vercel-cron', 'true'
    ),
    timeout_milliseconds := 30000
  );
  $$
);

-- 3. Create low-frequency news scraping job (every 2 hours)
-- This provides backup coverage
SELECT cron.schedule(
  'railway-news-scrape-low',
  '0 */2 * * *', -- Every 2 hours
  $$
  SELECT net.http_post(
    url := 'https://web-production-9a14.up.railway.app/api/schedule/trigger-te-scrape',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-vercel-cron', 'true'
    ),
    timeout_milliseconds := 30000
  );
  $$
);

-- 4. Create market context generation job (daily at 6 AM UTC)
-- This generates fresh market context daily
SELECT cron.schedule(
  'railway-market-context-daily',
  '0 6 * * *', -- Daily at 6 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://web-production-9a14.up.railway.app/api/context/generate-now',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-vercel-cron', 'true'
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- 5. Check existing cron jobs
SELECT * FROM cron.job;

-- 6. Test the endpoint manually (optional)
-- SELECT net.http_post(
--   url := 'https://web-production-9a14.up.railway.app/api/schedule/trigger-te-scrape',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'x-vercel-cron', 'true'
--   ),
--   timeout_milliseconds := 30000
-- );
