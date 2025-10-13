-- Add Market Hours High-Frequency Cron Job
-- Run this in your Supabase SQL Editor

-- Market hours scraping (every minute, Monday-Friday, 9:30 AM - 4:00 PM ET)
-- Note: Supabase cron uses UTC, so 9:30 AM ET = 1:30 PM UTC, 4:00 PM ET = 8:00 PM UTC
SELECT cron.schedule(
  'railway-market-hours-scrape',
  '*/1 13-20 * * 1-5', -- Every minute from 1:30 PM to 8:00 PM UTC, Monday-Friday
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

-- Verify all cron jobs are active
SELECT 
  jobname,
  schedule,
  active,
  CASE 
    WHEN jobname = 'railway-market-hours-scrape' THEN 'Market Hours (Every minute, Mon-Fri 9:30AM-4PM ET)'
    WHEN jobname = 'railway-te-scraper-high' THEN 'High Frequency (Every 30 minutes)'
    WHEN jobname = 'railway-te-scraper-low' THEN 'Low Frequency (Every 2 hours)'
    ELSE jobname
  END as description
FROM cron.job 
WHERE jobname LIKE 'railway%'
ORDER BY jobname;

