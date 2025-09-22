#!/usr/bin/env node

/**
 * ZETA MISSION: 1_market_recon.js
 *
 * WEAPON: Strategic Reconnaissance Bomber 💣
 *
 * OBJECTIVE: Identify the key URLs on Bloomberg.com for market intelligence.
 *
 * PRIMARY PAYLOAD: Tavily AI
 *
 * OUTPUT: A validated list of high-value target URLs (`recon_targets.json`).
 */

import { TavilyClient } from 'tavily';
import fs from 'fs';
import path from 'path';

const MISSION_OBJECTIVE = "What are the key URLs on Bloomberg.com for the main market overview, global news, and technology sector analysis?";

// This allows the script to be run with a custom objective for different targets
const customObjective = process.argv[2];

class StrategicReconAgent {
    constructor() {
        this.tavilyApiKey = process.env.TAVILY_API_KEY;
        if (!this.tavilyApiKey) {
            throw new Error("TAVILY_API_KEY environment variable not set. Mission aborted.");
        }
        this.tavily = new TavilyClient({ apiKey: this.tavilyApiKey });
    }

    async execute(objective = MISSION_OBJECTIVE, outputPath = 'zeta_missions/recon_targets.json') {
        console.log("🚀 ZETA RECON MISSION: ENGAGED 🚀");
        console.log("========================================");
        console.log(`💣 Bomber deployed. Objective: ${objective}`);

        try {
            const response = await this.tavily.search(objective, {
                search_depth: "advanced",
                max_results: 10,
            });

            console.log("✅ Reconnaissance complete. Analyzing targets...");

            const targets = this.analyzeAndValidate(response.results);

            if (targets.length > 0) {
                this.saveTargets(objective, targets, outputPath);
                console.log(`🎯 ${targets.length} high-value targets identified and saved.`);
            } else {
                console.log("No targets found.");
            }

            console.log("========================================");
            console.log("🎉 ZETA RECON MISSION: COMPLETE 🎉");
            return targets;

        } catch (error) {
            console.error("❌ MISSION FAILED:", error.message);
            console.log("========================================");
            throw error;
        }
    }

    analyzeAndValidate(results) {
        const keywords = ['markets', 'news', 'economy', 'technology', 'quote'];
        const validatedTargets = new Set(); // Use a Set to avoid duplicate URLs

        results.forEach(result => {
            try {
                const url = new URL(result.url);
                if (url.hostname.includes('bloomberg.com')) {
                    const path = url.pathname.toLowerCase();
                    if (keywords.some(keyword => path.includes(keyword))) {
                        // Prioritize root-level pages
                        if (path.split('/').length <= 3) {
                            validatedTargets.add(result.url);
                        }
                    }
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        });

        // Add a primary fallback target if others are not found
        if (validatedTargets.size === 0) {
            validatedTargets.add("https://www.bloomberg.com/markets");
        }

        return Array.from(validatedTargets);
    }

    saveTargets(objective, targets, outputPath) {
        const data = {
            missionObjective: objective,
            timestamp: new Date().toISOString(),
            targets: targets,
        };
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`✅ Target list saved to ${outputPath}`);
    }
}

// Self-execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    (async () => {
        try {
            const agent = new StrategicReconAgent();
            const customObjective = process.argv[2];
            let outputPath = 'zeta_missions/recon_targets.json';
            if (process.argv[3]) {
                outputPath = process.argv[3];
            }
            await agent.execute(customObjective, outputPath);
        } catch (error) {
            process.exit(1);
        }
    })();
}

export default StrategicReconAgent;
