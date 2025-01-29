import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { NewsScheduler } from './services/news/scheduler.mjs';

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

// Debug environment loading
console.log('Environment loaded:', {
  envKeys: Object.keys(process.env).filter(key => 
    key.includes('SUPABASE') || 
    key.includes('DB_') || 
    key.includes('SERVICE_') ||
    key.includes('REDIS') ||
    key.includes('VITE_') ||
    key.includes('COHERE')
  ),
  supabase: {
    hasUrl: !!process.env.VITE_SUPABASE_URL,
    hasKey: !!process.env.VITE_SUPABASE_KEY,
    urlStart: process.env.VITE_SUPABASE_URL?.substring(0, 20) + '...',
  },
  cohere: {
    hasKey: !!process.env.COHERE_API_KEY
  }
});

// Now import the rest of the modules
import express from 'express';
import cors from 'cors';
import { scrapeNews } from './scraper.js';
import logger from './logger.js';
import config from './config.js';
import { initializeRoutes as initNewsRoutes } from './routes/news.js';
import analysisRoutes from './routes/analysis.js';
import axios from 'axios';
import { SupabaseStorage } from './services/storage/supabase/supabaseStorage.js';
import investing11Routes from './routes/investing11Routes.js';
import { Investing11Service } from './services/investing11Service.js';
import diffbotRoutes from './routes/diffbotRoutes.js';

const app = express();
const scheduler = new NewsScheduler();
const investing11Service = new Investing11Service();

// Set global timeout for all requests
app.use((req, res, next) => {
  // Set global timeout to 120 seconds
  req.setTimeout(120000);
  res.setTimeout(120000, () => {
    res.status(504).json({
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: !!process.env.REDIS_URL,
      supabase: !!process.env.VITE_SUPABASE_URL,
      diffbot: !!process.env.VITE_DIFFBOT_TOKEN
    }
  });
});

// Initialize SupabaseStorage first
let storage;
try {
  storage = new SupabaseStorage();
  logger.info('SupabaseStorage initialized successfully');
  
  // Start the scheduler after storage is initialized
  scheduler.start();
  logger.info('News scheduler started');
} catch (error) {
  logger.error('Failed to initialize services:', error);
  process.exit(1);
}

// Configure CORS
app.use(cors({
  origin: config.CORS.ORIGINS,
  methods: config.CORS.METHODS,
  credentials: true
}));

// Add body parser for JSON
app.use(express.json());

// Initialize routes with storage instance
const newsRouter = initNewsRoutes(storage);
app.use('/api/news', newsRouter);

// Add analysis routes
app.use('/api/analysis', analysisRoutes);

// Add Investing11 routes
app.use('/api/investing11', investing11Routes);

// Add Diffbot routes
app.use('/api/diffbot', diffbotRoutes);

// News scraping endpoint with improved timeout handling
app.get('/api/scrape/trading-economics', async (req, res) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, 110000); // Set to 110 seconds to allow for cleanup

  try {
    logger.info('Starting news scraping...', {
      forceFresh: req.query.fresh === 'true',
      timestamp: new Date().toISOString()
    });

    const forceFresh = req.query.fresh === 'true';
    
    // Pass abort signal to scrapeNews
    const articles = await Promise.race([
      scrapeNews(forceFresh, abortController.signal),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scraping timeout')), 110000)
      )
    ]);

    clearTimeout(timeoutId);
    
    if (!articles || articles.length === 0) {
      logger.warn('No articles found');
      return res.json([]);
    }
    
    logger.info('Scraped articles:', {
      count: articles.length,
      newest: articles[0]?.created_at,
      oldest: articles[articles.length - 1]?.created_at
    });

    // Store articles with timeout handling
    const storePromises = articles.map(article => 
      Promise.race([
        storage.storeArticle(article),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage timeout')), 5000)
        )
      ]).catch(error => {
        logger.error('Failed to store article:', {
          error: error.message,
          article: {
            title: article.title,
            url: article.url
          }
        });
        return null;
      })
    );

    await Promise.all(storePromises);
    
    res.json(articles);
  } catch (error) {
    clearTimeout(timeoutId);
    
    logger.error('Scraping error:', {
      message: error.message,
      name: error.name,
      isAbort: error.name === 'AbortError'
    });
    
    if (error.name === 'AbortError' || error.message === 'Scraping timeout') {
      res.status(504).json({ 
        error: 'Gateway Timeout',
        message: 'The scraping operation took too long to complete. Try using fresh=false to get cached data.'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to scrape news',
        message: error.message 
      });
    }
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});