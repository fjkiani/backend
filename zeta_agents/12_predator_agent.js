#!/usr/bin/env node

/**
 * ZETA AGENT: 12_predator_agent.js
 *
 * WEAPON: "Alpha Predator" Dual-Armed Hunter-Killer Agent  Predator
 *
 * OBJECTIVE: A modular, command-line driven agent designed to hunt a specific URL.
 *            It is armed with two weapon systems:
 *            1. Primary: Diffbot Analyze API for fast, structured extraction.
 *            2. Fallback: The Zeta Kill Chain (Direct Strike + Brain Synthesis) for brute-force analysis.
 *
 * ACCEPTS: [target_name] [url_to_hunt] [output_path]
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import DirectStrikeAgent from '../zeta_missions/3_direct_strike.js';
import ZetaBrainAgent from '../zeta_missions/4_intelligence_synthesis.js';

class PredatorAgent {
    constructor(targetName, urlToHunt, outputPath) {
        if (!targetName || !urlToHunt || !outputPath) {
            throw new Error("Mission requires: <target_name> <url_to_hunt> <output_path>");
        }
        this.targetName = targetName;
        this.urlToHunt = urlToHunt;
        this.outputPath = outputPath;

        this.diffbotToken = process.env.DIFFBOT_TOKEN;
        this.strikeAgent = new DirectStrikeAgent();
        this.brainAgent = new ZetaBrainAgent();
    }

    async execute() {
        console.log(`🚀 Predator Agent hunting "${this.urlToHunt}" for target "${this.targetName}"...`);
        try {
            let report;
            // --- WEAPON 1: DIFFBOT SURGICAL STRIKE ---
            if (this.diffbotToken) {
                try {
                    console.log("   L_Weapon System 1: Engaging Diffbot...");
                    report = await this.huntWithDiffbot();
                    console.log("   L_Diffbot strike successful. Mission complete.");
                } catch (diffbotError) {
                    console.warn(`   L_Weapon System 1 FAILED: ${diffbotError.message}`);
                    console.warn("   L_Switching to fallback Weapon System 2: Zeta Kill Chain.");
                    report = await this.huntWithZeta();
                }
            } else {
                console.warn("   L_Diffbot token not found. Proceeding directly to Weapon System 2.");
                report = await this.huntWithZeta();
            }
            
            this.saveReport(report);
        } catch (error) {
            console.error(`❌ Predator Agent for "${this.targetName}" FAILED:`, error.message);
            throw error; // Propagate error to exit with non-zero code
        }
    }

    async huntWithDiffbot() {
        const diffbotUrl = `https://api.diffbot.com/v3/article?token=${this.diffbotToken}&url=${encodeURIComponent(this.urlToHunt)}`;
        const response = await axios.get(diffbotUrl);
        
        if (response.data.error || !response.data.objects || response.data.objects.length === 0) {
            throw new Error(`Diffbot returned an error or no objects: ${response.data.error || 'Empty response'}`);
        }
        
        const article = response.data.objects[0];
        // Standardize the output to our report format
        return {
            executive_summary: article.text.substring(0, 500) + '...',
            key_findings: article.tags ? article.tags.map(tag => `${tag.label} (score: ${tag.score})`) : [],
            sentiment_analysis: {
                sentiment: article.sentiment > 0.5 ? "Bullish" : (article.sentiment < -0.5 ? "Bearish" : "Neutral"),
                reasoning: `Diffbot calculated sentiment score: ${article.sentiment}`
            },
            source_weapon: 'Diffbot'
        };
    }

    async huntWithZeta() {
        console.log("   L_Weapon System 2: Engaging Zeta Kill Chain...");
        const html = await this.strikeAgent.execute(this.urlToHunt);
        const synthesisPrompt = `Synthesize the key information in this HTML from "${this.urlToHunt}" relevant to "${this.targetName}" into a final report with keys: "executive_summary", "key_findings", "sentiment_analysis".`;
        const reportText = await this.brainAgent.generate(synthesisPrompt);
        const finalReport = this.brainAgent.parseLLMResponse(reportText);
        finalReport.source_weapon = 'ZetaBrain';
        return finalReport;
    }

    saveReport(report) {
        fs.writeFileSync(this.outputPath, JSON.stringify(report, null, 2));
        console.log(`✅ Predator report for "${this.targetName}" saved to ${this.outputPath}`);
    }
}

// Self-execute
if (process.argv[1].endsWith('12_predator_agent.js')) {
    (async () => {
        const [targetName, urlToHunt, outputPath] = process.argv.slice(2);
        try {
            const agent = new PredatorAgent(targetName, urlToHunt, outputPath);
            await agent.execute();
        } catch (error) {
            process.exit(1);
        }
    })();
}
