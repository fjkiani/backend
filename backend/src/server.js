import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Manually set environment variables
process.env.VITE_SUPABASE_URL = 'https://gpirjathvfoqjurjhdxq.supabase.co';
process.env.VITE_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwaXJqYXRodmZvcWp1cmpoZHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU3MTExMywiZXhwIjoyMDUwMTQ3MTEzfQ.M3ST5Hjqe8lOvwYdrnAQdS8YGHUB9zsOTOy-izK0bt0';
process.env.VITE_DIFFBOT_TOKEN = 'a70dd1af6e654f5dbb12f3cd2d1406bb';
process.env.REDIS_URL = 'redis://default:AcvYAAIjcDE2ZjFkNjg5MTE5ZWE0NWJkOWU1NjNiMjZkYWUyMjE0NXAxMA@shining-starfish-52184.upstash.io:6379';
process.env.COHERE_API_KEY = 'SbVIWS96eV1fw0Fjv7EfeBGyhfxWQHSZr0PXjhYc';

// Also set non-VITE versions
process.env.DB_URL = process.env.VITE_SUPABASE_URL;
process.env.SERVICE_KEY = process.env.VITE_SUPABASE_KEY;
process.env.DIFFBOT_TOKEN = process.env.VITE_DIFFBOT_TOKEN;

// Now import the rest of the modules
import express from 'express';
import cors from 'cors';
import { scrapeNews } from './scraper.js';
import logger from './logger.js';
import config from './config.js';
import { initializeRoutes as initNewsRoutes } from './routes/news.js';
import analysisRoutes from './routes/analysis.js';
import axios from 'axios';
import realTimeNewsRoutes from './routes/realTimeNewsRoutes.js';
import diffbotRoutes from './routes/diffbotRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import contextRoutes from './routes/contextRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';

const app = express();

// Lazy initialization of services
let storage;
let scheduler;

async function initializeServices() {
  if (storage) return storage;
  
  try {
    const { SupabaseStorage } = await import('./services/storage/supabase/supabaseStorage.js');
    storage = new SupabaseStorage();
    logger.info('SupabaseStorage initialized successfully');
    
    // Start the scheduler only in non-Vercel environments
    if (!process.env.VERCEL) {
      const { NewsScheduler } = await import('./services/news/scheduler.mjs');
      scheduler = new NewsScheduler();
      scheduler.start();
      logger.info('News scheduler started');
    }
    
    return storage;
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    // Don't throw - let the app start without storage for now
    return null;
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await initializeServices();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        redis: !!process.env.REDIS_URL,
        supabase: !!process.env.VITE_SUPABASE_URL,
        diffbot: !!process.env.VITE_DIFFBOT_TOKEN,
        storage: !!storage
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Configure CORS
app.use(cors({
  origin: config.CORS.ORIGINS,
  methods: config.CORS.METHODS,
  credentials: true
}));

// Add body parser for JSON
app.use(express.json());

// Initialize routes with lazy storage
app.use('/api/news', async (req, res, next) => {
  try {
    const storageInstance = await initializeServices();
    const newsRouter = initNewsRoutes(storageInstance);
    newsRouter(req, res, next);
  } catch (error) {
    logger.error('News routes error:', error);
    res.status(500).json({ error: 'Service initialization failed' });
  }
});

// Add analysis routes
app.use('/api/analysis', analysisRoutes);

// Update path and variable name for RealTimeNews routes
app.use('/api/real-time-news', realTimeNewsRoutes);

// Add Diffbot routes
app.use('/api/diffbot', diffbotRoutes);

// Add Calendar routes
app.use('/api/calendar', calendarRoutes);

// Add Context routes
app.use('/api/context', contextRoutes);

// Add Schedule routes (protected cron trigger)
app.use('/api/schedule', scheduleRoutes);

// News scraping endpoint
app.get('/api/scrape/trading-economics', async (req, res) => {
  try {
    const storageInstance = await initializeServices();
    if (!storageInstance) {
      return res.status(500).json({ error: 'Storage not available' });
    }
    
    logger.info('Starting news scraping...', {
      forceFresh: req.query.fresh === 'true',
      timestamp: new Date().toISOString()
    });

    const forceFresh = req.query.fresh === 'true';
    const articles = await scrapeNews(forceFresh);
    
    logger.info('Scraped articles:', {
      count: articles.length,
      newest: articles[0]?.created_at,
      oldest: articles[articles.length - 1]?.created_at
    });

    // Store scraped articles in Supabase
    for (const article of articles) {
      try {
        await storageInstance.storeArticle(article);
        logger.info('Stored article:', {
          title: article.title,
          created_at: article.created_at,
          url: article.url
        });
      } catch (error) {
        logger.error('Failed to store article:', {
          error: error.message,
          article: {
            title: article.title,
            url: article.url
          }
        });
      }
    }
    
    res.json(articles);
  } catch (error) {
    logger.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape news',
      message: error.message 
    });
  }
});

// Add test endpoint for Diffbot API
app.get('/api/test-diffbot', async (req, res) => {
  const targetUrl = 'https://tradingeconomics.com/united-states/news';
  logger.info('Testing Diffbot API with URL:', { targetUrl });

  try {
    const response = await axios.get('https://api.diffbot.com/v3/analyze', {
      params: {
        url: targetUrl,
        token: process.env.VITE_DIFFBOT_TOKEN,
        fields: '*',
        discussion: true,
        timeout: 30000
      }
    });

    logger.info('Diffbot API Response:', {
      status: response.status,
      objectCount: response.data.objects?.length || 0,
      types: response.data.objects?.map(obj => obj.type),
      firstObject: response.data.objects?.[0],
      discussionCount: response.data.objects?.[0]?.discussion?.length || 0
    });

    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    logger.error('Error calling Diffbot API:', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    res.status(500).json({
      status: 'error',
      error: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    // Keep this one for confirmation the server started
    console.log(`Server running on port ${PORT}`);
  });
}

export default function handler(req, res) {
  return app(req, res);
}