-- Update Supabase Cron Jobs to Point to Railway Backend
-- Run these commands in your Supabase SQL Editor

-- 1. Delete the old cron jobs pointing to Vercel backends
SELECT cron.unschedule('te-scraper-high-freq');
SELECT cron.unschedule('te-scraper-low-freq');

-- 2. Create new cron jobs pointing to Railway backend
-- High frequency scraping (every 30 minutes)
SELECT cron.schedule(
  'railway-te-scraper-high',
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

-- Low frequency scraping (every 2 hours) 
SELECT cron.schedule(
  'railway-te-scraper-low',
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

-- 3. Verify the new cron jobs are created
SELECT * FROM cron.job WHERE jobname LIKE 'railway%';

-- 4. Test the Railway endpoint manually (optional)
-- SELECT net.http_post(
--   url := 'https://web-production-9a14.up.railway.app/api/schedule/trigger-te-scrape',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'x-vercel-cron', 'true'
--   ),
--   timeout_milliseconds := 30000
-- );
