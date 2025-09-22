#!/usr/bin/env node

/**
 * ZETA MISSION: 6_thematic_analysis.js
 *
 * WEAPON: "Zeta Doctrine" Thematic Analysis Engine 🧠
 *
 * OBJECTIVE: Ingest the deep synthesis report and re-process it into a
 *            final, structured analysis separating "Technical" and "Non-Technical"
 *            intelligence factors. This is the final layer of refinement.
 *
 * PRIMARY PAYLOAD: Perplexity `sonar-pro`
 *
 * INPUT: The `deep_synthesis_report.json` from the recursive kill chain.
 * OUTPUT: The final `final_thematic_report.json`.
 */

import fs from 'fs';
import path from 'path';
import ZetaBrainAgent from './4_intelligence_synthesis.js';

class ThematicAnalysisAgent {
    constructor() {
        this.brainAgent = new ZetaBrainAgent();
        this.inputReportPath = path.join('zeta_missions', 'deep_synthesis_report.json');
    }

    async execute() {
        console.log("🚀 ZETA THEMATIC DOCTRINE: ENGAGED 🚀");
        console.log("========================================");

        try {
            // --- PHASE 1: LOAD DEEP SYNTHESIS REPORT ---
            const deepSynthesisReport = this.loadDeepSynthesisReport();
            console.log("✅ Loaded deep synthesis report for final analysis.");

            // --- PHASE 2: GENERATE THEMATIC PROMPT ---
            const prompt = this.createThematicPrompt(deepSynthesisReport);

            // --- PHASE 3: EXECUTE FINAL SYNTHESIS ---
            console.log("🧠 Engaging Zeta Brain for final thematic refinement...");
            const thematicText = await this.brainAgent.generate(prompt);
            const finalReport = this.brainAgent.parseLLMResponse(thematicText);

            // --- PHASE 4: SAVE FINAL REPORT ---
            this.saveFinalReport(finalReport);

            console.log("========================================");
            console.log("🎉 ZETA THEMATIC DOCTRINE: COMPLETE 🎉");
            return finalReport;

        } catch (error) {
            console.error("❌ MISSION FAILED:", error.message);
            console.log("========================================");
            throw error;
        }
    }

    loadDeepSynthesisReport() {
        if (!fs.existsSync(this.inputReportPath)) {
            throw new Error("Deep synthesis report not found. Run the recursive kill chain mission first.");
        }
        const rawData = fs.readFileSync(this.inputReportPath, 'utf8');
        return JSON.parse(rawData);
    }

    createThematicPrompt(report) {
        const reportString = JSON.stringify(report, null, 2);
        return `
            You are the Zeta Brain, an elite intelligence analyst. Your final task is to refine a detailed intelligence report into a structured thematic analysis.
            The report contains a market summary, key events with summaries and impacts, emerging narratives, and actionable intel.
            You must re-process this entire report and categorize the findings into "Technical" and "Non-Technical" perspectives.

            Analyze the provided JSON report and produce a new, single JSON object with the following strict structure:

            1. "technical_analysis": {
                "summary": "A 1-2 sentence summary of the market's state based purely on quantitative data (index values, price changes, yields).",
                "key_data_points": [ An array of strings highlighting the most critical numerical data from the report (e.g., "S&P 500 rose 0.32%", "Petco shares surged up to 31%", "Crude Oil increased 0.7%"). ]
            }
            2. "non_technical_analysis": {
                "summary": "A 1-2 sentence summary of the key narratives, sentiments, and geopolitical/macroeconomic forces driving the market.",
                "event_drivers": [ An array of objects, where each object analyzes a key event and contains:
                    - "headline": The original headline of the event.
                    - "category": The primary driver (e.g., "Macroeconomic", "Geopolitical", "Corporate Strategy", "Market Psychology").
                    - "reason_why": A concise explanation of the underlying cause and effect of the event, explaining *why* it happened.
                ]
            }
            3. "overall_conclusion": "A final, synthesized 2-3 sentence conclusion that combines the technical and non-technical insights into a single, overarching takeaway for our allies."

            Base your entire analysis *only* on the provided JSON data. Do not invent new information.

            BEGIN DEEP SYNTHESIS REPORT
            ${reportString}
            END DEEP SYNTHESIS REPORT
        `;
    }

    saveFinalReport(report) {
        const outputPath = path.join('zeta_missions', 'final_thematic_report.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`✅ Final thematic report saved to ${outputPath}`);
    }
}

// Self-execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    (async () => {
        try {
            const agent = new ThematicAnalysisAgent();
            await agent.execute();
        } catch (error) {
            process.exit(1);
        }
    })();
}
