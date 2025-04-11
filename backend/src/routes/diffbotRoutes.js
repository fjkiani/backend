import express from 'express';
import { scrapeNews } from '../scraper.js';
import logger from '../logger.js';
import { supabase } from '../supabase/client.js';

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

export default router;
