# Railway Cron Jobs Configuration
# Add this to your Railway project settings

# Option 1: Railway Cron Jobs (if available)
# Go to Railway Dashboard → Your Project → Settings → Cron Jobs
# Add these cron jobs:

# High frequency scraping (every 30 minutes)
# Schedule: */30 * * * *
# Command: curl -X POST "https://web-production-9a14.up.railway.app/api/schedule/trigger-te-scrape" -H "Content-Type: application/json" -H "x-vercel-cron: true"

# Market hours scraping (every minute during trading hours)
# Schedule: */1 13-20 * * 1-5
# Command: curl -X POST "https://web-production-9a14.up.railway.app/api/schedule/trigger-te-scrape" -H "Content-Type: application/json" -H "x-vercel-cron: true"

# Low frequency backup (every 2 hours)
# Schedule: 0 */2 * * *
# Command: curl -X POST "https://web-production-9a14.up.railway.app/api/schedule/trigger-te-scrape" -H "Content-Type: application/json" -H "x-vercel-cron: true"

