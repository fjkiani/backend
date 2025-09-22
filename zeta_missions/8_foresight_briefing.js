#!/usr/bin/env node

/**
 * ZETA MISSION: 8_foresight_briefing.js
 *
 * WEAPON: "Market Foresight" Predictive Analysis Engine 🔮
 *
 * OBJECTIVE: Take a raw block of text containing forward-looking market intelligence
 *            and use the Zeta Brain to synthesize it into a structured, predictive
 *            "Week Ahead" briefing.
 *
 * PRIMARY PAYLOAD: Perplexity `sonar-pro`
 *
 * INPUT: A hardcoded block of raw intelligence text.
 * OUTPUT: The final `foresight_briefing.json`.
 */

import fs from 'fs';
import path from 'path';
import ZetaBrainAgent from './4_intelligence_synthesis.js';

// Raw intelligence gathered from a reliable web search, bypassing unreliable recon APIs.
const RAW_INTEL_DUMP = `
    To refine our focus and gain a comprehensive understanding of the stock market's trajectory, it's essential to analyze both technical and non-technical factors influencing upcoming movements. Here's a structured approach:

    1. Key Economic Events and Indicators:
    - Labor Day Market Closure: On Monday, September 1, 2025, U.S. stock markets, including the NYSE and Nasdaq, will be closed in observance of Labor Day. Regular trading will resume on Tuesday, September 2.
    - Federal Reserve Policy Decision: The Federal Reserve is scheduled to announce its policy decision on September 17, 2025. Recent dovish signals from Fed Chair Jerome Powell have heightened expectations for a potential rate cut, with futures markets estimating a 75% probability of a quarter-point reduction.
    - Economic Data Releases:
      - Employment Data: The nonfarm payrolls report, set for release on September 5, 2025, will provide insights into job growth and unemployment rates, influencing the Fed's policy considerations.
      - Inflation Metrics: The Personal Consumption Expenditures (PCE) Price Index, the Fed's preferred inflation gauge, is also due in early September. Recent data indicates inflation remains above the 2% target, with the PCE at 2.6% annually.

    2. Sector-Specific Developments:
    - Interest Rate Sensitivity: Anticipated rate cuts could benefit cyclical sectors such as energy, financials, and consumer discretionary, which are currently under-owned by active investors. Conversely, traditionally defensive sectors like consumer staples and healthcare may face challenges.
    - Small-Cap Stocks: There's a notable rotation from large-cap tech stocks to smaller-cap equities. The Russell 2000 small-cap index surged 7.3% in August, outperforming the Nasdaq 100's 1.5% gain. This shift is partly driven by expectations of lower interest rates, which tend to favor small-cap stocks.

    3. Corporate Earnings Reports:
    - Adobe (NASDAQ: ADBE): Scheduled to announce earnings in early September, with a focus on its Creative Cloud and Experience Cloud segments. Insights into subscription growth and product development will be pivotal.
    - GameStop (NYSE: GME): Investors are keen on the company's strategic initiatives, especially its pivot towards e-commerce and technology-driven opportunities in the gaming sector.

    4. Geopolitical and Policy Factors:
    - Trade Policies: The expansion of tariffs announced in February 2025 has impacted sectors like technology, manufacturing, and consumer goods. Companies are grappling with increased costs and supply chain disruptions, contributing to market volatility.
    - Global Economic Outlook: Challenges such as China's property sector issues and Europe's energy concerns pose risks to multinational corporations, potentially affecting earnings and investor sentiment.
`;

class ForesightBriefingAgent {
    constructor() {
        this.brainAgent = new ZetaBrainAgent();
        this.briefingTimestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        this.briefingDir = path.join('zeta_missions', 'briefings', this.briefingTimestamp);
    }

    async execute() {
        console.log("🚀 ZETA FORESIGHT BRIEFING: ENGAGED 🚀");
        console.log("========================================");

        try {
            // Ensure the briefing directory for today exists
            fs.mkdirSync(this.briefingDir, { recursive: true });

            const prompt = this.createForesightPrompt(RAW_INTEL_DUMP);

            console.log("🧠 Engaging Zeta Brain for predictive analysis...");
            const briefingText = await this.brainAgent.generate(prompt);
            const finalBriefing = this.brainAgent.parseLLMResponse(briefingText);

            this.saveFinalBriefing(finalBriefing);

            console.log("========================================");
            console.log("🎉 ZETA FORESIGHT BRIEFING: COMPLETE 🎉");
            return finalBriefing;

        } catch (error) {
            console.error("❌ MISSION FAILED:", error.message);
            console.log("========================================");
            throw error;
        }
    }

    createForesightPrompt(intel) {
        return `
            You are the Zeta Brain, an elite intelligence analyst specializing in predictive market analysis.
            Your task is to analyze a raw block of text and synthesize it into a structured "Week Ahead" intelligence briefing.
            Focus on extracting forward-looking events, identifying key players, and assessing potential market impact.

            Analyze the provided text and produce a single JSON object with the following strict structure:

            1. "key_macroeconomic_events": [ An array of objects, each representing a major upcoming economic event. Include:
                - "event_name": The name of the event (e.g., "Federal Reserve Policy Decision").
                - "date": The scheduled date of the event.
                - "category": A specific economic category (e.g., "Monetary Policy", "Labor Market", "Inflation", "Market Holiday").
                - "potential_impact": A brief, 1-sentence analysis of why this event is significant for the market.
            ]
            2. "companies_to_watch": [ An array of objects, each representing a company with a significant upcoming event (like earnings). Include:
                - "company_name": The name of the company.
                - "ticker": The stock ticker (e.g., "ADBE").
                - "event": A short description of the upcoming event (e.g., "Q3 Earnings Report").
                - "category": This should always be "Corporate Earnings".
                - "key_focus": A brief explanation of what investors will be looking for.
            ]
            3. "dominant_market_narratives": [ An array of strings describing the key themes or stories currently driving the market (e.g., "Anticipation of a Fed rate cut is fueling a rotation into cyclical and small-cap stocks."). ]
            4. "strategic_summary": "A final, synthesized 2-3 sentence conclusion that provides a high-level strategic overview for the week ahead."

            Base your entire analysis *only* on the provided text.

            BEGIN RAW INTEL DUMP
            ${intel}
            END RAW INTEL DUMP
        `;
    }

    saveFinalBriefing(briefing) {
        // Save the master briefing
        const masterBriefingPath = path.join(this.briefingDir, '_master_briefing.json');
        fs.writeFileSync(masterBriefingPath, JSON.stringify(briefing, null, 2));
        console.log(`✅ Master foresight briefing saved to ${masterBriefingPath}`);

        // Create organized subdirectories for deep dives
        briefing.key_macroeconomic_events.forEach(event => {
            const eventDir = path.join(this.briefingDir, this.sanitizeForFilename(event.event_name));
            fs.mkdirSync(eventDir, { recursive: true });
        });
        briefing.companies_to_watch.forEach(company => {
            const companyDir = path.join(this.briefingDir, this.sanitizeForFilename(company.ticker));
            fs.mkdirSync(companyDir, { recursive: true });
        });
        console.log("✅ Created organized subdirectories for future deep dives.");
    }

    sanitizeForFilename(name) {
        return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
}

// Self-execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    (async () => {
        try {
            const agent = new ForesightBriefingAgent();
            await agent.execute();
        } catch (error) {
            process.exit(1);
        }
    })();
}
