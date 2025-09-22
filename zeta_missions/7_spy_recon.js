#!/usr/bin/env node

/**
 * ZETA MISSION: 7_spy_recon.js
 *
 * WEAPON: "Spy" Advanced Reconnaissance Agent 🕵️
 *
 * OBJECTIVE: Overcome the limitations of simple URL scraping by using a two-stage
 *            reconnaissance process. First, ask a complex research question.
 *            Second, use the Zeta Brain to analyze the answer and extract
 *            high-value, precise target URLs from the text.
 *
 * PRIMARY PAYLOAD: Tavily API (Research) + Perplexity API (Analysis/Extraction)
 *
 * OUTPUT: A clean JSON file with precise calendar URLs (`forward_recon_targets.json`).
 */

import fs from 'fs';
import path from 'path';
import { TavilyClient } from 'tavily';
import ZetaBrainAgent from './4_intelligence_synthesis.js';

const RECON_OBJECTIVE = "Analyze the best free online sources to find a comprehensive economic calendar and a detailed stock market earnings calendar for the upcoming week. Include direct URLs in your answer.";

class SpyReconAgent {
    constructor() {
        this.tavilyApiKey = process.env.TAVILY_API_KEY;
        if (!this.tavilyApiKey) {
            throw new Error("TAVILY_API_KEY environment variable not set. Mission aborted.");
        }
        this.tavily = new TavilyClient({ apiKey: this.tavilyApiKey });
        this.brainAgent = new ZetaBrainAgent();
        this.outputPath = 'zeta_missions/forward_recon_targets.json';
    }

    async execute() {
        console.log("🚀 ZETA SPY RECON: ENGAGED 🚀");
        console.log("========================================");

        try {
            // --- PHASE 1: BROAD RESEARCH SWEEP ---
            console.log(`🕵️ Phase 1: Deploying Tavily for broad intelligence sweep...`);
            console.log(`   L_OBJECTIVE: ${RECON_OBJECTIVE}`);
            const researchResult = await this.tavily.search(RECON_OBJECTIVE, {
                search_depth: "advanced",
                include_answer: true,
                max_results: 5
            });

            if (!researchResult || !researchResult.answer) {
                throw new Error("Tavily failed to provide a research answer. Mission aborted.");
            }
            console.log("✅ Tavily research sweep complete. Received intelligence summary.");

            // --- PHASE 2: BRAIN-POWERED TARGET EXTRACTION ---
            console.log(`🧠 Phase 2: Deploying Zeta Brain to extract precise targets from research...`);
            const extractionPrompt = `
                From the following text, extract all fully-qualified URLs that appear to be direct links to economic calendars or earnings calendars.
                Return them as a single, clean JSON object with a single key "calendar_urls" which is an array of the extracted URL strings.
                Do not include any other text or explanation.

                BEGIN TEXT
                ${researchResult.answer}
                END TEXT
            `;

            const extractedText = await this.brainAgent.generate(extractionPrompt);
            const extractedJson = this.brainAgent.parseLLMResponse(extractedText);

            if (!extractedJson.calendar_urls || extractedJson.calendar_urls.length === 0) {
                throw new Error("Zeta Brain failed to extract any calendar URLs from the research text.");
            }

            this.saveTargets(extractedJson.calendar_urls);
            console.log(`✅ Zeta Brain extracted ${extractedJson.calendar_urls.length} high-value calendar targets.`);

            console.log("========================================");
            console.log("🎉 ZETA SPY RECON: COMPLETE 🎉");
            return extractedJson.calendar_urls;

        } catch (error) {
            console.error("❌ MISSION FAILED:", error.message);
            console.log("========================================");
            throw error;
        }
    }

    saveTargets(urls) {
        const data = {
            missionObjective: RECON_OBJECTIVE,
            timestamp: new new Date().toISOString(),
            targets: urls,
        };
        fs.writeFileSync(this.outputPath, JSON.stringify(data, null, 2));
        console.log(`✅ Spy targets saved to ${this.outputPath}`);
    }
}

// Self-execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    (async () => {
        try {
            const agent = new SpyReconAgent();
            await agent.execute();
        } catch (error) {
            process.exit(1);
        }
    })();
}
