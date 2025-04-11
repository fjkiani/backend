import express from 'express';
import { RealTimeNewsService } from '../services/RealTimeNewsService.js';

const router = express.Router();
const realTimeNewsService = new RealTimeNewsService();

router.get('/news', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const articles = await realTimeNewsService.fetchNews(forceRefresh);
    res.json({ 
      articles, 
      message: forceRefresh ? 'Fetched fresh data' : 'Success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching RealTimeNews news:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message 
    });
  }
});

export default router; 