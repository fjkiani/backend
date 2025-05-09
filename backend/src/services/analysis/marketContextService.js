import logger from '../../logger.js';
import { supabase } from '../../supabase/client.js';
import { redis } from '../../routes/analysis.js'; // Assuming shared Redis client
import { EconomicCalendarService } from '../calendar/EconomicCalendarService.js';
import earningsCalendarService from '../calendar/EarningsCalendarService.js'; // Assuming default export
import { GoogleGenaiService } from './googleGenaiService.js';
import { get } from 'lodash-es';

// --- Constants --- 
const PREVIOUS_CONTEXT_DEFAULT = "No previous market context available.";
const NEWS_OVERVIEW_DEFAULT = "News overview not available.";
const RECENT_DAYS_FOR_CATALYSTS = 3; // Look ahead ~3 days for upcoming events
const REDIS_OVERVIEW_TE_KEY = 'overview:trading-economics';
const REDIS_OVERVIEW_RTNEWS_KEY = 'overview:realtime-news';
const SUPABASE_CONTEXT_TABLE = 'market_context';

export class MarketContextService {
    constructor() {
        // Initialize dependent services
        // Note: Consider dependency injection later for better testability
        try {
            this.economicCalendarService = new EconomicCalendarService();
            this.earningsCalendarService = earningsCalendarService; // Uses the default export instance
            this.googleGenaiService = new GoogleGenaiService(); // Assumes API key is set
            logger.info('MarketContextService initialized with dependencies.');
        } catch (error) {
            logger.error('Failed to initialize dependencies in MarketContextService', error);
            // Depending on which service failed, we might want to throw
            // or handle it gracefully in the generate method.
            // For now, log and continue, methods might fail later.
        }
    }

    async generateAndStoreContext() {
        logger.info('Starting generation of overall market context...');
        let previousContext = PREVIOUS_CONTEXT_DEFAULT;
        let teOverview = NEWS_OVERVIEW_DEFAULT;
        let rtNewsOverview = NEWS_OVERVIEW_DEFAULT;
        let upcomingEconCatalysts = "None identified.";
        let upcomingEarningsCatalysts = "None identified.";

        try {
            // --- Step 1: Fetch Previous Context from Supabase --- 
            const { data: latestContext, error: contextError } = await supabase
                .from(SUPABASE_CONTEXT_TABLE)
                .select('context_text')
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // Use maybeSingle to handle zero rows gracefully

            if (contextError) {
                logger.error('Failed to fetch previous market context from Supabase', contextError);
                // Continue with default previous context
            } else if (latestContext) {
                previousContext = latestContext.context_text;
                logger.info('Successfully fetched previous market context from Supabase.');
            } else {
                logger.info('No previous market context found in Supabase (first run?).');
            }

            // --- Step 2: Fetch Latest News Overviews from Redis Cache --- 
            try {
                const [cachedTe, cachedRt] = await Promise.all([
                    redis.get(REDIS_OVERVIEW_TE_KEY),
                    redis.get(REDIS_OVERVIEW_RTNEWS_KEY)
                ]);
                if (cachedTe) teOverview = cachedTe;
                if (cachedRt) rtNewsOverview = cachedRt;
                logger.info('Fetched cached news overviews', { 
                    teFound: !!cachedTe, 
                    rtFound: !!cachedRt 
                });
            } catch (redisError) {
                logger.error('Failed to fetch news overviews from Redis cache', redisError);
                // Continue with default overviews
            }

            // --- Step 3: Fetch Upcoming Economic Catalysts --- 
            try {
                const today = new Date();
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + RECENT_DAYS_FOR_CATALYSTS);
                
                const startDate = today.toISOString().split('T')[0];
                const endDate = futureDate.toISOString().split('T')[0];
                
                const econEvents = await this.economicCalendarService.fetchEvents(startDate, endDate, ['US']);
                const highImportanceEvents = econEvents.filter(event => event.importance >= 1); // Filter for high importance
                
                if (highImportanceEvents.length > 0) {
                    upcomingEconCatalysts = highImportanceEvents
                        .map(e => `${e.indicator} (${new Date(e.date).toLocaleDateString()})`)
                        .join(', ');
                } 
                logger.info('Fetched upcoming economic catalysts', { count: highImportanceEvents.length });
            } catch(econError) {
                logger.error('Failed to fetch/process upcoming economic catalysts', econError);
            }

            // --- Step 4: Fetch Upcoming Earnings Catalysts --- 
            try {
                const today = new Date();
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + RECENT_DAYS_FOR_CATALYSTS);
                
                const startDate = today.toISOString().split('T')[0];
                const endDate = futureDate.toISOString().split('T')[0];

                const earningsEvents = await this.earningsCalendarService.fetchEarnings(startDate, endDate);
                // TODO: Filter for significance later (e.g., based on market cap or a predefined list)
                const significantEarnings = earningsEvents; // For now, include all

                if (significantEarnings.length > 0) {
                     // Group by date for slightly better formatting
                     const groupedByDate = significantEarnings.reduce((acc, event) => {
                         const dateStr = new Date(event.date).toLocaleDateString();
                         if (!acc[dateStr]) acc[dateStr] = [];
                         acc[dateStr].push(event.symbol);
                         return acc;
                     }, {});
                     upcomingEarningsCatalysts = Object.entries(groupedByDate)
                         .map(([date, symbols]) => `${symbols.join(', ')} (${date})`)
                         .join('; ');
                }
                logger.info('Fetched upcoming earnings catalysts', { count: significantEarnings.length });
            } catch(earnError) {
                 logger.error('Failed to fetch/process upcoming earnings catalysts', earnError);
            }

            // --- Step 5 & 6: Build Prompt and Call LLM --- 
            if (!this.googleGenaiService) {
                logger.error('GoogleGenaiService not available for context synthesis.');
                throw new Error('LLM service dependency failed.'); // Throw if LLM service is critical
            }
            
            const prompt = this.buildContextPrompt(
                previousContext,
                teOverview,
                rtNewsOverview,
                upcomingEconCatalysts,
                upcomingEarningsCatalysts
            );
            
            logger.info('Sending prompt to LLM for context synthesis.');
            // TODO: Add option to select model (e.g., prefer Pro for this task)
            // For now, uses the default model configured in GoogleGenaiService
            const result = await this.googleGenaiService.model.generateContent(prompt);
            const response = result.response;
            const newContextText = response.text().trim();

            if (!newContextText) {
                logger.warn('LLM returned empty context text.');
                // Decide how to handle: store empty, throw error, use default? Let's store empty for now.
            }

            // --- Step 7: Store Result in Supabase --- 
            const { data: insertData, error: insertError } = await supabase
                .from(SUPABASE_CONTEXT_TABLE)
                .insert([{ context_text: newContextText || 'Context generation resulted in empty text.' }])
                .select(); // Select to confirm insertion

            if (insertError) {
                logger.error('Failed to store generated context in Supabase', insertError);
                throw insertError; // Re-throw storage error
            } else {
                logger.info('Successfully generated and stored new market context.', { 
                    newContextId: insertData?.[0]?.id, 
                    textLength: newContextText?.length 
                });
            }

        } catch (error) {
            logger.error('Error occurred during generateAndStoreContext', {
                message: error.message,
                stack: error.stack
            });
            // Handle error appropriately, maybe notify admin or retry later
        }
    }

    buildContextPrompt(previousContext, teOverview, rtNewsOverview, econCatalysts, earningsCatalysts) {
        // Construct the detailed prompt for the LLM
        const prompt = `
You are a financial analyst creating a daily market context summary.

PREVIOUS CONTEXT (From last update):
---
${previousContext}
---

LATEST NEWS OVERVIEWS:
---
Trading Economics Overview:
${teOverview}

RealTimeNews Overview:
${rtNewsOverview}
---

UPCOMING CATALYSTS (Next ${RECENT_DAYS_FOR_CATALYSTS} days):
---
Economic Events (High Importance):
${econCatalysts}

Earnings Reports:
${earningsCatalysts}
---

TASK:
Synthesize the information from the 'LATEST NEWS OVERVIEWS' and 'UPCOMING CATALYSTS'. Compare this to the 'PREVIOUS CONTEXT' to identify key changes, continuations, or resolutions of market themes/narratives. Provide your output in two distinct sections:

1.  **Updated Summary:** A concise (5-7 sentences) summary of the current market situation, sentiment, and key drivers based on the latest news overviews, explicitly referencing changes from the previous context.
2.  **Key Takeaways / Areas to Monitor:** 2-4 bullet points highlighting the most important things to watch based on the updated summary and upcoming catalysts (e.g., specific data points, event outcomes, sentiment shifts).

Structure your response clearly with these two sections. Do not include information not present in the provided context.

`;
        logger.debug('Built context prompt for LLM', { promptLength: prompt.length });
        return prompt;
    }
} 