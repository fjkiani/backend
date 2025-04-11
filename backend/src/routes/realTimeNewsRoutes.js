import express from 'express';
import { RealTimeNewsService } from '../services/RealTimeNewsService.js';
import logger from '../logger.js';

// Log to confirm module is loaded
logger.info('realTimeNewsRoutes.js module loaded');

const router = express.Router();
const realTimeNewsService = new RealTimeNewsService();

router.get('/news', async (req, res) => {
  // Log to confirm the route handler is reached
  logger.info('GET /api/real-time-news/news handler reached', { 
    query: req.query,
    timestamp: new Date().toISOString()
  });
  try {
    const forceRefresh = req.query.refresh === 'true';
    const articles = await realTimeNewsService.fetchNews(forceRefresh);
    res.json({ 
      articles, 
      message: forceRefresh ? 'Fetched fresh data' : 'Success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Use logger for consistency
    logger.error('Error fetching RealTimeNews news:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message 
    });
  }
});

export default router; 