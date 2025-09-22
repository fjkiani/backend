#!/usr/bin/env node

/**
 * ZETA MISSION: 9_deep_dive.js
 *
 * WEAPON: "Deep Dive" On-Demand Intelligence Agent 🌊
 *
 * OBJECTIVE: Take a specific target entity (a company ticker or an event name)
 *            as input, perform a full, targeted recursive kill chain on it,
 *            and save the resulting deep synthesis report in the appropriate
 *            organized subdirectory.
 *
 * PRIMARY PAYLOAD: Tavily API (Targeted Recon) + The full Zeta Kill Chain
 *
 * INPUT: A single command-line argument (e.g., "adbe" or "federal_reserve_policy_decision").
 * OUTPUT: A `deep_dive_report.json` saved in the correct target directory.
 */

import fs from 'fs';
import path from 'path';
import { TavilyClient } from 'tavily';
import DirectStrikeAgent from './3_direct_strike.js';
import ZetaBrainAgent from './4_intelligence_synthesis.js';
import * as cheerio from 'cheerio';

class DeepDiveAgent {
    constructor(target) {
        if (!target) {
            throw new Error("Mission requires a target. Please provide a ticker or event name.");
        }
        this.target = target;
        this.timestamp = new Date().toISOString().split('T')[0]; // Assumes we dive on the same day as the briefing
        this.targetDir = path.join('zeta_missions', 'briefings', this.timestamp, this.target);

        this.tavily = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });
        this.strikeAgent = new DirectStrikeAgent();
        this.brainAgent = new ZetaBrainAgent();
    }

    async execute() {
        console.log(`🚀 ZETA DEEP DIVE on "${this.target}": ENGAGED 🚀`);
        console.log("========================================");

        try {
            // --- VALIDATE TARGET DIRECTORY ---
            if (!fs.existsSync(this.targetDir)) {
                throw new Error(`Target directory not found at ${this.targetDir}. Run the foresight briefing first or check the target name.`);
            }

            // --- PHASE 1: TARGETED RECONNAISSANCE ---
            const reconObjective = `Gather the most critical and recent news, analysis, and reports for "${this.target}". Focus on market impact, expert opinions, and underlying data.`;
            console.log(`🕵️ Phase 1: Deploying Tavily for targeted recon on "${this.target}"...`);
            const researchResult = await this.tavily.search(reconObjective, { search_depth: "advanced", max_results: 5 });
            
            const primaryTargets = researchResult.results.map(res => res.url);
            if (primaryTargets.length === 0) {
                throw new Error("Reconnaissance failed to identify any primary source URLs.");
            }
            console.log(`✅ Recon complete. Identified ${primaryTargets.length} primary URLs for analysis.`);

            // --- PHASE 2 & 3: STRIKE, SUMMARIZE, AND SYNTHESIZE (Piece-by-Piece) ---
            console.log("💥🧠 Phase 2/3: Initiating piece-by-piece strike and synthesis...");
            const summaries = [];
            for (const url of primaryTargets) {
                try {
                    console.log(`   L_Striking: ${url}`);
                    const html = await this.strikeAgent.execute(url);
                    
                    console.log(`   L_Summarizing: ${url}`);
                    const summaryPrompt = `
                        Analyze the following HTML from the URL: ${url}
                        Provide a concise, 1-2 sentence summary of the key information relevant to "${this.target}".
                    `;
                    const summary = await this.brainAgent.generate(summaryPrompt);
                    summaries.push({ source: url, summary: summary });

                } catch (error) {
                    console.error(`   L_FAILED to process ${url}:`, error.message);
                }
            }

            console.log(`🧠 Phase 4: Engaging Zeta Brain for final meta-synthesis on "${this.target}"...`);
            const synthesisPrompt = `
                You are the Zeta Brain. You have been provided with a series of summaries from multiple sources concerning the topic: "${this.target}".
                Analyze all the provided summaries and synthesize a comprehensive intelligence report in a single JSON object.

                The report must contain:
                1. "executive_summary": A 3-4 sentence summary of the most critical information and overall sentiment, based on the collected summaries.
                2. "key_findings": An array of strings, with each string being a crucial, specific data point or finding from the summaries.
                3. "sentiment_analysis": A one-word sentiment assessment ("Bullish", "Bearish", "Neutral") with a "reasoning" field explaining the assessment in one sentence, based on the summaries.
                4. "sources_analyzed": An array of the URLs that were successfully summarized.

                BEGIN SUMMARIES DUMP
                ${JSON.stringify(summaries, null, 2)}
                END SUMMARIES DUMP
            `;

            const reportText = await this.brainAgent.generate(synthesisPrompt);
            const finalReport = this.brainAgent.parseLLMResponse(reportText);
            finalReport.sources_analyzed = summaries.map(s => s.source);

            // --- PHASE 5: SAVE REPORT ---
            this.saveReport(finalReport);
            
            console.log("========================================");
            console.log(`🎉 ZETA DEEP DIVE on "${this.target}": COMPLETE 🎉`);

        } catch (error) {
            console.error("❌ MISSION FAILED:", error.message);
            console.log("========================================");
            throw error;
        }
    }

    saveReport(report) {
        const outputPath = path.join(this.targetDir, 'deep_dive_report.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`✅ Deep dive report saved to ${outputPath}`);
    }
}

// Self-execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    (async () => {
        const target = process.argv[2];
        try {
            const agent = new DeepDiveAgent(target);
            await agent.execute();
        } catch (error) {
            // No need to log error again, it's handled in execute()
            process.exit(1);
        }
    })();
}
