import express from 'express';
import { scrapeNews } from '../scraper.js';
import logger from '../logger.js';
import { supabase } from '../supabase/client.js';
import { DiffbotService } from '../services/diffbot/DiffbotService.js';
import { SupabaseStorage } from '../services/storage/supabase/supabaseStorage.js';

const router = express.Router();

router.get('/news', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    
    // First, send an immediate response
    res.json({
      message: 'Scraping initiated. Please check back in a few minutes.',
      status: 'processing',
      timestamp: new Date().toISOString()
    });

    // Then continue processing in the background
    if (forceRefresh) {
      scrapeNews(true)
        .then(async (articles) => {
          logger.info('Background scraping completed:', {
            count: articles.length,
            timestamp: new Date().toISOString()
          });

          // Store the timestamp of successful scraping
          await supabase
            .from('system_status')
            .upsert([{
              key: 'last_scrape',
              value: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
        })
        .catch(error => {
          logger.error('Background scraping failed:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
        });
    }
  } catch (error) {
    logger.error('Error in /news endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to initiate scraping',
      message: error.message 
    });
  }
});

// New: Hard refresh Diffbot on key pages and store results
router.post('/hard-refresh', async (req, res) => {
  try {
    // Optional bearer token auth using CRON_TOKEN
    const authHeader = req.headers.authorization || '';
    const expected = process.env.CRON_TOKEN ? `Bearer ${process.env.CRON_TOKEN}` : null;
    if (expected && authHeader !== expected) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const defaultUrls = [
      'https://tradingeconomics.com/united-states/stock-market',
      'https://tradingeconomics.com/united-states/news',
      'https://tradingeconomics.com/united-states/government-bond-yield'
    ];
    const urls = (req.body && Array.isArray(req.body.urls) && req.body.urls.length > 0)
      ? req.body.urls
      : defaultUrls;

    const diffbot = new DiffbotService({ apiToken: process.env.DIFFBOT_TOKEN }, logger);
    const storage = new SupabaseStorage();

    const results = await Promise.allSettled(urls.map(url => diffbot.analyze(url)));

    const articles = [];
    const nowIso = new Date().toISOString();

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value?.objects?.length) {
        const objects = r.value.objects;
        objects.forEach(obj => {
          const title = obj.title || obj.pageTitle || `Trading Economics Update ${idx}`;
          const content = obj.text || obj.summary || obj.html || 'No content available';
          const pageUrl = obj.pageUrl || urls[idx];
          const date = obj.date ? new Date(obj.date).toISOString() : nowIso;

          articles.push({
            id: `te-diffbot-${Date.now()}-${articles.length}`,
            title,
            content,
            url: pageUrl,
            publishedAt: date,
            source: 'Trading Economics',
            category: 'Market News',
            sentiment: { score: 0, label: 'neutral', confidence: 0 },
            summary: obj.summary || content.slice(0, 280),
            author: 'Trading Economics',
            tags: ['Market News']
          });
        });
      } else if (r.status === 'rejected') {
        logger.error('Diffbot analyze failed', { url: urls[idx], error: r.reason?.message || r.reason });
      }
    });

    if (articles.length > 0) {
      await storage.storeArticles(articles);
    }

    return res.json({ ok: true, analyzed: urls.length, stored: articles.length });
  } catch (error) {
    logger.error('Error in /hard-refresh endpoint:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
