import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from '../../logger.js';

// --- Constants ---
// Using Flash as it's generally faster and cheaper for tasks like synthesis
// Consider gemini-1.5-pro-latest if higher quality is needed and latency/cost allows
const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"; 
const MAX_OUTPUT_TOKENS = 1024; // Adjust as needed for overview length
const TEMPERATURE = 0.4; // Similar to Cohere setting
const TOP_P = 1;
const TOP_K = 1;

export class GoogleGenaiService {
  genAI;
  model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('No Google Generative AI (Gemini) API key found in env var GEMINI_API_KEY');
      throw new Error('Google Generative AI API key is required');
    }
    
    try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
            model: GEMINI_MODEL_NAME,
            generationConfig: {
                temperature: TEMPERATURE,
                topK: TOP_K,
                topP: TOP_P,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
            },
            // safetySettings: [], // Optional: Adjust safety settings if needed
        });
        logger.info(`GoogleGenaiService initialized with model: ${GEMINI_MODEL_NAME}`);
    } catch (error) {
        logger.error('Failed to initialize Google Generative AI SDK:', error);
        throw new Error(`Failed to initialize Google AI SDK: ${error.message}`);
    }
  }

  // Adapts the synthesis logic for Gemini
  async synthesizeOverview(initialThemes, detailedSummaries) {
    logger.info('Synthesizing market overview with Google Gemini.');
    
    const summaryEntries = Object.entries(detailedSummaries).filter(([url, summary]) => 
        summary && !summary.startsWith('Summary unavailable') && !summary.startsWith('Error'));

    if (summaryEntries.length === 0 && !initialThemes) {
        logger.warn('Gemini Synthesis: No themes or summaries available.');
        return 'Unable to generate market overview: No input data provided.';
    }

    const prompt = this.buildSynthesisPrompt(initialThemes, detailedSummaries);
    logger.debug('Built Gemini Synthesis Prompt:', { promptStart: prompt.substring(0, 300) + '...', promptLength: prompt.length });

    try {
        // Using generateContent for non-streaming
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        const synthesis = response.text();
        
        logger.info('Google Gemini market overview synthesis successful.');
        return synthesis.trim();

    } catch (error) {
      // Log concise error info
      logger.error('Google Gemini synthesis failed:', {
        message: error.message || 'Unknown error during Gemini synthesis',
        status: error.response?.status, // Include status if available in error
        // Attempt to log specific details from the API response if present
        details: error.response?.data?.error?.message || error.response?.data || error.details
      });
      return 'Error generating market overview via Gemini.'; // Return specific error message
    }
  }

  // Adapt the prompt slightly if needed for Gemini, but the Cohere one is likely fine
  buildSynthesisPrompt(initialThemes, detailedSummaries) {
    let summaryContext = 'No detailed summaries were provided.';

    const validSummaries = Object.entries(detailedSummaries).filter(([url, summary]) =>
        summary && !summary.startsWith('Summary unavailable') && !summary.startsWith('Error'));

    if (validSummaries.length > 0) {
      summaryContext = validSummaries.map(([url, summary], index) =>
        `Input Summary ${index + 1}:\n${summary}` // Labeling as "Input Summary"
      ).join('\n\n---\n\n');
    }

    // Revised Prompt Instructions
    return `You are a financial news analyst tasked with creating a concise market overview based *strictly* on the provided context below. Do not introduce external knowledge or make assumptions beyond what is stated in the input summaries.

Provided Context:
1. Initial Themes from Headlines: ${initialThemes || 'Not available.'}
2. Collection of Input Summaries:
---
${summaryContext}
---

Task: Analyze the Input Summaries and Initial Themes to generate a coherent market overview (approx. 5-7 sentences). Your analysis MUST focus on:
- **Explicitly Mentioned Data:** Identify and report any specific economic indicators (e.g., inflation rate, GDP growth, index points changes), company names, or figures mentioned in the summaries. Quote the values if available.
- **Stated Market Movers:** Describe the primary reasons *stated in the summaries* for market movements or sentiment (e.g., "The summary mentions rising yields...", "Trade tensions were cited as...").
- **Sentiment Clues:** Identify the overall sentiment conveyed *by the summaries themselves* (e.g., cautious, optimistic, concerned about X).
- **Conflicts & Gaps:** If summaries present conflicting information (e.g., positive data but negative sentiment description) or lack specific details (e.g., no figures provided), explicitly state this lack of information or conflict in your overview.

**Example of acknowledging missing info:** "While recession fears were mentioned, the provided summaries did not include specific data points supporting this."
**Example of quoting data:** "The Dow Jones Index saw a significant gain, rising 619 points (1.56%) according to one summary."

Generate the overview as a single block of text.

Market Overview:`;
  }

  // --- Method for Earnings Trend Analysis (Now accepts trendData) ---
  async analyzeEarningsTrend(symbol, upcomingEvent, historicalData, trendData) {
    logger.info(`Analyzing earnings trend for ${symbol} with Google Gemini (using history and trend data).`);

    // Extract latest historical result
    const latestHistory = historicalData?.[0]; 
    // Extract relevant trend data (e.g., current quarter '0q')
    const currentTrend = trendData?.find(t => t.period === '0q');

    // Validation (keep existing checks, maybe add check for trendData)
    if (!upcomingEvent || typeof upcomingEvent.epsEstimated !== 'number') {
        logger.warn(`analyzeEarningsTrend: Missing upcoming estimate for ${symbol}`);
        return 'Analysis unavailable: Missing upcoming estimate.';
    }
    if (!latestHistory || typeof latestHistory.epsActual !== 'number' || typeof latestHistory.epsEstimated !== 'number') {
        logger.warn(`analyzeEarningsTrend: Missing latest historical data (actual/estimate) for ${symbol}`);
        // Proceed without history if unavailable, but mention it
    }
    if (!currentTrend) {
        logger.warn(`analyzeEarningsTrend: Missing current trend data ('0q') for ${symbol}`);
         // Proceed without trend if unavailable, but mention it
    }

    // Build prompt using all available data
    const prompt = this.buildEarningsTrendPrompt(symbol, upcomingEvent, historicalData, currentTrend);
    logger.debug(`Built Gemini Earnings Trend Prompt for ${symbol}:`, { promptStart: prompt.substring(0, 300) + '...', promptLength: prompt.length });

    try {
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        const analysis = response.text();
        
        logger.info(`Google Gemini earnings trend analysis successful for ${symbol}.`);
        return analysis.trim();

    } catch (error) {
      logger.error(`Google Gemini earnings trend analysis failed for ${symbol}:`, {
        message: error.message || 'Unknown error during Gemini analysis',
        status: error.response?.status,
        details: error.response?.data?.error?.message || error.response?.data || error.details
      });
      return 'Error during trend analysis.';
    }
  }

  // Prompt builder now accepts and uses multiple historical points and currentTrend data
  buildEarningsTrendPrompt(symbol, upcomingEvent, historicalData, currentTrend) {
    // --- Format Historical Data --- 
    let historyContext = 'No recent historical earnings data provided.';
    // Take last 8 quarters, or fewer if less data available
    const historicalSlice = historicalData?.slice(0, 8) || []; 
    
    if (historicalSlice.length > 0) {
        historyContext = `Historical Earnings (Last ${historicalSlice.length} Quarters - Newest First):\n`;
        historyContext += historicalSlice.map(q => {
            let line = `  - ${q.date || 'N/A'}: Actual ${q.epsActual?.toFixed(2) ?? 'N/A'}, Estimate ${q.epsEstimated?.toFixed(2) ?? 'N/A'}`;
            if (typeof q.epsActual === 'number' && typeof q.epsEstimated === 'number' && q.epsEstimated !== 0) {
                const diff = q.epsActual - q.epsEstimated;
                const surprise = (diff / Math.abs(q.epsEstimated)) * 100;
                line += ` (Surprise: ${surprise >= 0 ? '+':''}${surprise.toFixed(1)}%)`;
            } else if (typeof q.epsActual === 'number' && typeof q.epsEstimated === 'number' && q.epsEstimated === 0) {
                line += ` (Met Estimate)`;
            }
            return line;
        }).join('\n');
    }

    // --- Format Upcoming Estimate --- 
    const upcomingEstimate = upcomingEvent.epsEstimated;
    const upcomingContext = `Upcoming Earnings Estimate (${upcomingEvent.date}): ${upcomingEstimate.toFixed(2)}`;

    // --- Format Estimate Trend Data --- 
    let trendContext = 'No current quarter estimate trend data provided.';
    if (currentTrend) {
        trendContext = `Estimate Trend (Current Quarter - ${currentTrend.period || '0q'}):\n`;
        trendContext += `  - Current Avg Estimate: ${currentTrend.earningsEstimate?.avg?.fmt || 'N/A'}\n`;
        trendContext += `  - 7 days ago: ${currentTrend.epsTrend?.['7daysAgo']?.fmt || 'N/A'}\n`;
        trendContext += `  - 30 days ago: ${currentTrend.epsTrend?.['30daysAgo']?.fmt || 'N/A'}\n`;
        trendContext += `  - Revisions Up (last 30d): ${currentTrend.epsRevisions?.upLast30days?.longFmt || '0'}\n`;
        trendContext += `  - Revisions Down (last 30d): ${currentTrend.epsRevisions?.downLast30days?.longFmt || '0'}`; 
    }

    // --- Build Final Prompt --- 
    return `You are a concise financial analyst providing an earnings preview for ${symbol} based ONLY on the provided data.

Context:
1. ${historyContext}
2. ${upcomingContext}
3. ${trendContext}

Task: Provide a brief analysis (3-4 sentences) covering these points:
- What is the pattern of earnings surprises (beats/misses) in the recent historical quarters provided?
- How have analyst estimates for the upcoming quarter changed recently, and how many revisions have occurred?
- Synthesize these historical patterns and recent estimate trends to provide a brief outlook context for the upcoming earnings release. Avoid speculation or external data.

Analysis:`;
  }
  // --- End Method ---
}

// export default GoogleGenaiService; 