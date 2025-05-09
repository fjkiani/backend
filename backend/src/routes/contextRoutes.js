import express from 'express';
import logger from '../logger.js';
import { MarketContextService } from '../services/analysis/marketContextService.js';
import { supabase } from '../supabase/client.js';

const router = express.Router();

// --- Instantiate Service ---
// Ideally, use dependency injection later. For now, create an instance.
let marketContextService;
try {
  marketContextService = new MarketContextService();
} catch (error) {
  logger.error('Failed to instantiate MarketContextService in contextRoutes:', error);
  marketContextService = null; // Ensure routes fail gracefully if service is down
}

// --- Manual Trigger Endpoint --- 
router.post('/generate-now', async (req, res) => {
  logger.info('POST /api/context/generate-now handler reached');

  if (!marketContextService) {
    logger.error('MarketContextService is not available for manual generation.');
    return res.status(503).json({ error: 'Context generation service unavailable' });
  }

  try {
    // Call the generation method (don't wait for it to finish, let it run in background?)
    // Or wait and return success/fail?
    // Let's wait for now to confirm it runs.
    await marketContextService.generateAndStoreContext();
    
    logger.info('Manual context generation triggered successfully.');
    res.status(202).json({ message: 'Market context generation initiated successfully.' }); // 202 Accepted

  } catch (error) {
    // The service method logs its internal errors, log the trigger error here
    logger.error('Error triggering manual context generation:', { message: error.message });
    res.status(500).json({ 
      error: 'Failed to trigger market context generation',
      message: error.message 
    });
  }
});

// --- Read Endpoint (Phase 2 Implementation) --- 
router.get('/latest', async (req, res) => {
  logger.info('GET /api/context/latest handler reached');
  
  try {
    const { data, error } = await supabase
      .from('market_context') // Ensure this matches your table name
      .select('context_text, generated_at') // Select text and timestamp
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Returns null instead of error if no rows found

    if (error) {
      logger.error('Error fetching latest market context from Supabase', error);
      throw error; // Let the catch block handle it
    }

    if (data) {
      logger.info('Successfully fetched latest market context.', { generatedAt: data.generated_at });
      res.json({ 
        contextText: data.context_text,
        generatedAt: data.generated_at 
      });
    } else {
      logger.info('No market context found in Supabase.');
      res.status(404).json({ error: 'No market context found.' });
    }

  } catch (error) {
    logger.error('Error in GET /api/context/latest:', { message: error.message });
    res.status(500).json({ 
      error: 'Failed to fetch latest market context',
      message: error.message 
    });
  }
});

export default router; 