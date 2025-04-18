import express from 'express';
import logger from '../logger.js';
import { EconomicCalendarService } from '../services/calendar/EconomicCalendarService.js';
// Import the shared Google Genai service
import { googleGenaiService } from './analysis.js'; 
// Import the Earnings Calendar service
import earningsCalendarService from '../services/calendar/EarningsCalendarService.js';

const router = express.Router();

// Instantiate the service (consider dependency injection later for better testability)
let calendarService;
try {
    calendarService = new EconomicCalendarService();
} catch (error) {
    logger.error('Failed to instantiate EconomicCalendarService in routes:', error);
    // If the service fails, the routes using it won't work.
    calendarService = null; 
}

// GET /api/calendar/events
router.get('/events', async (req, res) => {
    logger.info('GET /api/calendar/events handler reached');

    if (!calendarService) {
        logger.error('Calendar service is not available.');
        return res.status(503).json({ error: 'Calendar service unavailable' });
    }

    // --- Parameter Validation --- 
    const { from, to, countries } = req.query;

    // Basic validation for date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !dateRegex.test(from)) {
        return res.status(400).json({ error: 'Invalid or missing "from" date parameter. Use YYYY-MM-DD format.' });
    }
    if (!to || !dateRegex.test(to)) {
        return res.status(400).json({ error: 'Invalid or missing "to" date parameter. Use YYYY-MM-DD format.' });
    }

    let countryList = ['US']; // Default to US
    if (countries) {
        countryList = countries.split(',').map(c => c.trim().toUpperCase());
        // Optional: Add validation for country codes if needed
    }
    // --- End Parameter Validation ---

    try {
        const events = await calendarService.fetchEvents(from, to, countryList);
        
        // --- Add Debug Log --- 
        logger.debug('Data being sent to frontend in /api/calendar/events', { 
            eventType: typeof events,
            isArray: Array.isArray(events),
            length: Array.isArray(events) ? events.length : 'N/A',
            sample: Array.isArray(events) ? events.slice(0, 2) : events // Log first 2 events or the whole thing if not array
        });
        // --- End Debug Log ---
        
        res.json({ 
            events, 
            message: `Fetched events from ${from} to ${to} for countries: ${countryList.join(', ')}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) { 
        // Service method already logs errors, but we log the route error too
        logger.error(`Error in calendar events route:`, { message: error.message, stack: error.stack });
        // Avoid sending detailed stack trace to client in production
        res.status(500).json({ 
            error: 'Failed to fetch calendar events',
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message 
        });
    }
});

// POST /api/calendar/interpret-event
router.post('/interpret-event', async (req, res) => {
    logger.info('POST /api/calendar/interpret-event handler reached');

    // Check if the analysis service is available
    if (!googleGenaiService) {
        logger.error('Google Genai service is not available for event interpretation.');
        return res.status(503).json({ error: 'Analysis service unavailable' });
    }

    // --- Input Validation --- 
    const event = req.body.event; // Expecting the full event object
    const marketOverview = req.body.marketOverview || 'No market overview context provided.'; // Get overview, provide default

    if (!event || typeof event !== 'object' || !event.indicator || !event.country) {
        logger.warn('Invalid event data received for interpretation', { body: req.body });
        return res.status(400).json({ error: 'Invalid or missing event data in request body.' });
    }
    // --- End Input Validation ---

    try {
        // --- Build Contextual Prompt --- 
        const isPastEvent = event.actual !== null;
        let promptContext = `Current Market Overview Context:
---
${marketOverview}
---

`;
        
        promptContext += `Event Details:
Indicator: ${event.indicator} (${event.country})
Period: ${event.period ?? 'N/A'}
Unit: ${event.unit ?? 'N/A'}
`;

        if (isPastEvent) {
            promptContext += `Status: Happened
Actual: ${event.actual}
Forecast: ${event.forecast ?? 'N/A'}
Previous: ${event.previous ?? 'N/A'}
`;
            promptContext += `
Task: Explain the significance of this actual result compared to the forecast/previous data, specifically for short-term traders, considering the provided market overview context. What impact might this outcome have had on market direction or volatility?`;
        } else {
            promptContext += `Status: Upcoming
Forecast: ${event.forecast ?? 'N/A'}
Previous: ${event.previous ?? 'N/A'}
`;
            promptContext += `
Task: Explain the potential significance of this upcoming release for short-term traders, considering the provided market overview context. What might happen if the actual result meets, beats, or misses the forecast/previous data, given the current market climate described in the overview? What potential impact on volatility or direction should traders watch for?`;
        }

        const prompt = `${promptContext}

Keep the explanation concise (2-4 sentences) and focused only on information inferable from the context. Do not give financial advice.`;

        // --- Call LLM --- 
        logger.debug('Sending contextual event interpretation prompt to Gemini', { indicator: event.indicator, isPast: isPastEvent });
        const result = await googleGenaiService.model.generateContent(prompt);
        const response = result.response;
        const interpretation = response.text().trim();

        logger.info('Successfully generated contextual interpretation for event', { indicator: event.indicator });

        res.json({ 
            interpretation,
            eventId: event.id 
        });

    } catch (error) { 
        logger.error(`Error interpreting calendar event: ${event.indicator}`, { 
            message: error.message,
            status: error.response?.status,
            details: error.response?.data?.error?.message || error.response?.data || error.details,
            stack: error.stack 
        });
        res.status(500).json({ 
            error: 'Failed to interpret calendar event',
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message 
        });
    }
});

// GET /api/calendar/earnings
router.get('/earnings', async (req, res) => {
    logger.info('GET /api/calendar/earnings (FMP) handler reached');

    if (!earningsCalendarService) {
        logger.error('Earnings calendar service (FMP) is not available.');
        return res.status(503).json({ error: 'Earnings calendar service unavailable' });
    }
    // Remove check for Google Genai service - no longer needed here

    // --- Parameter Validation --- 
    const { from, to } = req.query; 
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !dateRegex.test(from)) {
        return res.status(400).json({ error: 'Invalid or missing "from" date parameter. Use YYYY-MM-DD format.' });
    }
    if (!to || !dateRegex.test(to)) {
        return res.status(400).json({ error: 'Invalid or missing "to" date parameter. Use YYYY-MM-DD format.' });
    }
    // --- End Parameter Validation ---

    try {
        // Step 1: Fetch calendar range (ONLY)
        const calendarEvents = await earningsCalendarService.fetchEarnings(from, to); 
        logger.debug('FMP Earnings Calendar data fetched', { count: calendarEvents.length });

        // Step 2: Return calendar data directly
        res.json({ 
            earningsCalendar: calendarEvents, // Send the raw calendar events
            message: `Fetched FMP earnings from ${from} to ${to}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) { 
        // ---> ADD LOGGING HERE <---
        logger.error(`Error in GET /api/calendar/earnings route BEFORE sending response:`, { 
            errorMessage: error.message, 
            errorStack: error.stack,
            requestQuery: req.query 
        });
        logger.error(`Error in FMP earnings calendar route processing:`, { message: error.message, stack: error.stack });
        res.status(500).json({ 
            error: 'Failed to process earnings calendar data',
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message 
        });
    }
});

// --- NEW Route for On-Demand Earnings Analysis ---
router.post('/earnings/analyze', async (req, res) => {
    const { symbol, event } = req.body; // Expect symbol and the specific calendar event object
    logger.info(`POST /api/calendar/earnings/analyze received for symbol: ${symbol}`);

    // --- Validation ---
    if (!symbol) {
        return res.status(400).json({ error: 'Missing symbol in request body.' });
    }
    if (!event || typeof event !== 'object' || typeof event.epsEstimated === 'undefined') {
        // Check for epsEstimated existence, even if null, to ensure it's a valid event structure
        return res.status(400).json({ error: 'Missing or invalid event data in request body.' });
    }
    if (!earningsCalendarService) {
        logger.error('Earnings calendar service (FMP) is not available for history fetch.');
        return res.status(503).json({ error: 'Data service unavailable' });
    }
    if (!googleGenaiService) {
         logger.error('Google Genai service is not available for analysis.');
        return res.status(503).json({ error: 'Analysis service unavailable' });
    }
    // --- End Validation ---

    try {
        // Step 1: Fetch BOTH historical data and trend data in parallel
        const [historicalData, trendData] = await Promise.all([
            earningsCalendarService.fetchHistoricalEarnings(symbol),
            earningsCalendarService.fetchEarningsTrendData(symbol)
        ]);
        
        logger.debug(`Fetched historical data for ${symbol}`, { count: historicalData?.length ?? 0 });
        logger.debug(`Fetched trend data for ${symbol}`, { count: trendData?.length ?? 0 });

        // Step 2: Run LLM Analysis 
        if (typeof event.epsEstimated !== 'number') { 
            logger.info(`Skipping LLM analysis for ${symbol} - no estimate provided.`);
             return res.json({ 
                symbol: symbol,
                analysis: 'N/A (No Estimate)' 
            });
        }
        
        // Pass both historical and trend data to the analysis function
        const analysisText = await googleGenaiService.analyzeEarningsTrend(symbol, event, historicalData, trendData);
        logger.info(`LLM analysis completed for ${symbol}`);

        // Step 3: Return analysis
        res.json({ 
            symbol: symbol, 
            analysis: analysisText 
        });

    } catch (error) { 
        logger.error(`Error processing on-demand earnings analysis for ${symbol}:`, { 
            message: error.message, 
            stack: error.stack 
        });
        res.status(500).json({ 
            error: `Failed to analyze earnings trend for ${symbol}`,
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message 
        });
    }
});

export default router; 