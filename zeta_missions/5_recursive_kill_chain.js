#!/usr/bin/env node

/**
 * ZETA MISSION: 5_recursive_kill_chain.js
 *
 * WEAPON: "Cluster Bomb" Recursive Intelligence Engine 💣
 *
 * OBJECTIVE: Automate the entire intelligence kill chain.
 *            1. Strike a primary target (e.g., Bloomberg Markets).
 *            2. Synthesize initial intel to identify headlines.
 *            3. Enrich targets by finding URLs for those headlines in the raw HTML.
 *            4. Launch secondary strikes on each headline URL.
 *            5. Perform a final, deep synthesis on the combined intelligence.
 *
 * OUTPUT: A comprehensive, multi-layered intelligence report (`deep_synthesis_report.json`).
 */

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import DirectStrikeAgent from './3_direct_strike.js';
import ZetaBrainAgent from './4_intelligence_synthesis.js';

const PRIMARY_TARGET_URL = 'https://www.bloomberg.com/markets';

class RecursiveKillChainOrchestrator {
    constructor() {
        this.strikeAgent = new DirectStrikeAgent();
        this.brainAgent = new ZetaBrainAgent();
    }

    async execute() {
        console.log("🚀 ZETA RECURSIVE KILL CHAIN: ENGAGED 🚀");
        console.log("========================================");

        try {
            // --- PHASE 1: INITIAL STRIKE ---
            console.log(`🎯 Phase 1: Launching initial strike on ${PRIMARY_TARGET_URL}...`);
            const mainPageHtml = await this.strikeAgent.execute(PRIMARY_TARGET_URL);
            const mainPageIntelPath = path.join('zeta_missions', 'synthesized_market_intel.json');

            // --- PHASE 2: INITIAL SYNTHESIS ---
            console.log("🧠 Phase 2: Performing initial synthesis to identify headlines...");
            const initialIntel = await this.brainAgent.execute();
            const headlines = initialIntel.top_headlines;
            if (!headlines || headlines.length === 0) {
                throw new Error("Initial synthesis failed to identify any headlines. Mission aborted.");
            }
            console.log(`✅ Identified ${headlines.length} high-value headline targets.`);

            // --- PHASE 3: TARGET ENRICHMENT ---
            console.log("🔗 Phase 3: Enriching targets by finding article URLs...");
            const articleUrls = this.enrichTargets(mainPageHtml, headlines);
            if (articleUrls.length === 0) {
                console.warn("⚠️ Could not find URLs for any identified headlines. Synthesis will be based on primary target only.");
            } else {
                 console.log(`✅ Found ${articleUrls.length} corresponding article URLs.`);
            }

            // --- PHASE 4: RECURSIVE STRIKES ---
            console.log("💥 Phase 4: Launching recursive strikes on article URLs...");
            const articleHtmlMap = {};
            for (const url of articleUrls) {
                console.log(`   L_Striking: ${url}`);
                try {
                    const articleHtml = await this.strikeAgent.execute(url);
                    articleHtmlMap[url] = articleHtml;
                    console.log(`   L_SUCCESS: Exfiltrated data from ${url}`);
                } catch (error) {
                    console.error(`   L_FAILED to strike ${url}:`, error.message);
                }
            }
             console.log("✅ Recursive strikes complete.");

            // --- PHASE 5: DEEP SYNTHESIS (Piece-by-Piece) ---
            console.log("🧠 Phase 5: Performing piece-by-piece deep synthesis...");
            const articleSummaries = await this.summarizeArticles(articleHtmlMap);
            const finalReport = await this.performMetaSynthesis(initialIntel, articleSummaries);
            this.saveFinalReport(finalReport);

            console.log("========================================");
            console.log("🎉 ZETA RECURSIVE KILL CHAIN: COMPLETE 🎉");

        } catch (error) {
            console.error("❌ MISSION FAILED:", error.message);
            console.log("========================================");
            throw error;
        }
    }

    enrichTargets(html, headlines) {
        const $ = cheerio.load(html);
        const urls = new Set(); // Use a Set to avoid duplicate URLs

        $('a').each((i, link) => {
            const linkText = $(link).text().trim();
            const href = $(link).attr('href');

            if (href) {
                for (const headline of headlines) {
                    // A simple heuristic: if the link text is a substantial part of the headline, it's a match.
                    if (headline.includes(linkText) && linkText.length > 20) {
                        // Resolve relative URLs
                        const absoluteUrl = new URL(href, PRIMARY_TARGET_URL).toString();
                        if (absoluteUrl.startsWith('https://www.bloomberg.com')) {
                             urls.add(absoluteUrl);
                        }
                    }
                }
            }
        });

        return Array.from(urls);
    }

    async summarizeArticles(articleHtmlMap) {
        const summaries = {};
        for (const [url, html] of Object.entries(articleHtmlMap)) {
            console.log(`   L_Summarizing: ${url}`);
            try {
                const prompt = `
                    Analyze the following raw HTML of a news article.
                    Extract the headline and provide a detailed 2-3 sentence summary of its content.
                    Return the result as a single, clean JSON object with keys "headline" and "summary".

                    HTML_CONTENT_BEGINS_HERE
                    ${html}
                    HTML_CONTENT_ENDS_HERE
                `;
                const text = await this.brainAgent.generate(prompt);
                summaries[url] = this.brainAgent.parseLLMResponse(text);
                console.log(`   L_SUCCESS: Summarized ${url}`);
            } catch (error) {
                console.error(`   L_FAILED to summarize ${url}:`, error.message);
                summaries[url] = { headline: "Error during synthesis", summary: error.message };
            }
        }
        return summaries;
    }
    
    async performMetaSynthesis(initialIntel, articleSummaries) {
        console.log("   L_Preparing final meta-synthesis prompt for Zeta Brain...");
        const combinedSummaries = JSON.stringify(articleSummaries, null, 2);

        const prompt = `
            You are the Zeta Brain, an elite intelligence synthesis AI.
            You have been provided with an initial market overview JSON and a JSON object containing summaries of several related news articles.
            Your mission is to perform a final meta-synthesis to generate a comprehensive, actionable intelligence report.

            Analyze all the provided context and produce a JSON object with the following structure:
            1.  "marketSummary": An object containing the initial 'overallMarketSentiment' and 'majorIndices' from the overview.
            2.  "keyEvents": An array of objects. Each object should be a news story from the summaries, including its "headline" and "summary". Add a "marketImpact" field analyzing how this news likely affects the market.
            3.  "emergingNarratives": A brief paragraph identifying connections, trends, or overarching themes you see across the different summaries and the market data.
            4.  "actionableIntel": A bulleted list of 2-3 key, actionable takeaways for an investor.

            Base your analysis *only* on the provided JSON data.

            INITIAL OVERVIEW:
            ${JSON.stringify(initialIntel, null, 2)}

            ARTICLE SUMMARIES:
            ${combinedSummaries}
        `;

        const text = await this.brainAgent.generate(prompt);
        return this.brainAgent.parseLLMResponse(text);
    }

    saveFinalReport(report) {
        const outputPath = path.join('zeta_missions', 'deep_synthesis_report.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`✅ Deep synthesis report saved to ${outputPath}`);
    }
}


// Self-execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    (async () => {
        try {
            const orchestrator = new RecursiveKillChainOrchestrator();
            await orchestrator.execute();
        } catch (error) {
            process.exit(1);
        }
    })();
}
