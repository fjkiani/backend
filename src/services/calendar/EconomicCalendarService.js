import axios from 'axios';
import logger from '../../logger.js';
import { redis } from '../../routes/analysis.js'; // Import the shared Redis client

const CALENDAR_API_HOST = 'economic-events-calendar.p.rapidapi.com';
const CALENDAR_API_ENDPOINT = '/economic-events/tradingview';

export class EconomicCalendarService {
    constructor() {
        // this.apiKey = process.env.VITE_RAPIDAPI_KEY; // Using the existing RapidAPI key
        this.apiKey = process.env.ECONOMIC_CALENDAR_RAPIDAPI_KEY; // Use a specific key name
        if (!this.apiKey) {
            // logger.error('RapidAPI Key not found in environment variable: VITE_RAPIDAPI_KEY for Calendar Service');
            logger.error('API Key not found in environment variable: ECONOMIC_CALENDAR_RAPIDAPI_KEY for Calendar Service');
            throw new Error('API Key configuration error for Calendar Service');
        }
        logger.info('EconomicCalendarService initialized');
    }

    /**
     * Fetches economic events from the RapidAPI endpoint.
     * @param {string} startDate - Start date in YYYY-MM-DD format.
     * @param {string} endDate - End date in YYYY-MM-DD format.
     * @param {string[]} countries - Array of country codes (e.g., ['US', 'CA']).
     * @returns {Promise<Array<object>>} - A promise that resolves to an array of event objects.
     */
    async fetchEvents(startDate, endDate, countries = ['US']) {
        const countryString = countries.join(',');
        const cacheKey = `calendar:events:${startDate}:${endDate}:${countryString}`;

        // 1. Check Cache
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                logger.info('EconomicCalendarService: Cache HIT', { key: cacheKey });
                return JSON.parse(cachedData);
            }
        } catch (cacheError) {
            logger.error('EconomicCalendarService: Redis GET error', { key: cacheKey, error: cacheError });
            // Proceed to fetch from API if cache read fails
        }
        
        logger.info('EconomicCalendarService: Cache MISS, fetching from API', { key: cacheKey });

        // 2. Fetch from API (if cache miss or error)
        const url = `https://${CALENDAR_API_HOST}${CALENDAR_API_ENDPOINT}`;
        const options = {
            method: 'GET',
            url: url,
            params: {
                countries: countryString,
                from: startDate,
                to: endDate
            },
            headers: {
                'X-RapidAPI-Key': this.apiKey,
                'X-RapidAPI-Host': CALENDAR_API_HOST,
                'Accept': 'application/json'
            }
        };

        try {
            const response = await axios(options);

            // ---> ADD LOGGING HERE <---
            logger.debug('EconomicCalendarService: Received response from RapidAPI', {
                status: response.status,
                headers: response.headers,
                // Log only the start of the data to avoid huge logs
                dataSnippet: JSON.stringify(response.data)?.substring(0, 200) + '...'
            });

            // Validate response structure - Check for the 'result' key containing the array
            if (!response.data || !Array.isArray(response.data.result)) { 
                logger.error('EconomicCalendarService: Unexpected API response structure. Expected object with result array.', {
                    responseData: response.data // Log the actual received data
                });
                return []; 
            }

            const events = response.data.result; // Access the array within the 'result' key

            logger.info(`EconomicCalendarService: Successfully fetched ${events.length} events from API.`);
            
            // const events = response.data; // Store events before caching - REMOVED OLD LINE
            
            // 3. Store in Cache
            try {
                 // Only cache non-empty results to avoid caching temporary API issues returning empty lists
                if (events.length > 0) { 
                    await redis.set(cacheKey, JSON.stringify(events), 'EX', 3600); // Cache for 1 hour
                    logger.info('EconomicCalendarService: Result stored in cache', { key: cacheKey });
                } else {
                    logger.info('EconomicCalendarService: API returned empty list, not caching.', { key: cacheKey });
                }
            } catch (cacheSetError) {
                 logger.error('EconomicCalendarService: Redis SET error', { key: cacheKey, error: cacheSetError });
                 // Proceed even if caching fails
            }
            
            return events; 

        } catch (error) {
            logger.error('EconomicCalendarService: Error fetching events from API', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
                params: options.params
            });
            return []; 
        }
    }
} 