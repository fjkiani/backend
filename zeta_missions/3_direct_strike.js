#!/usr/bin/env node

/**
 * ZETA MISSION: 3_direct_strike.js
 *
 * WEAPON: Direct API Assault Client 🚀
 *
 * OBJECTIVE: Bypass the faulty SDK and exfiltrate raw HTML from Bloomberg
 *            by making a direct, raw API call to the BrightData MCP Unlocker endpoint.
 *
 * PRIMARY PAYLOAD: Axios HTTP Client
 *
 * OUTPUT: The raw, liberated HTML of the target page (`exfiltrated_data_direct.html`).
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Read the target URL from the recon phase output
function getTargetUrl() {
    const reconFile = path.join('zeta_missions', 'recon_targets.json');
    if (!fs.existsSync(reconFile)) {
        throw new Error("Reconnaissance file 'recon_targets.json' not found. Run Phase 1 first.");
    }
    const reconData = JSON.parse(fs.readFileSync(reconFile, 'utf8'));
    if (!reconData.targets || reconData.targets.length === 0) {
        throw new Error("No targets found in 'recon_targets.json'.");
    }
    return reconData.targets[0]; // Strike the first identified target
}

class DirectStrikeAgent {
    constructor() {
        this.apiKey = process.env.BRIGHTDATA_API_KEY;
        if (!this.apiKey) {
            throw new Error("BRIGHTDATA_API_KEY environment variable not set. Mission aborted.");
        }
        this.strikeEndpoint = 'https://api.brightdata.com/request';
    }

    async execute(targetUrl) {
        console.log("🚀 ZETA DIRECT STRIKE: ENGAGED 🚀");
        console.log("========================================");
        console.log(`🎯 Direct fire solution locked. Target: ${targetUrl}`);
        console.log("💥 Engaging MCP Unlocker endpoint directly...");

        try {
            const response = await axios.post(
                this.strikeEndpoint,
                {
                    // The definitive, minimal payload required by the API.
                    zone: 'mcp_unlocker',
                    url: targetUrl,
                    format: 'raw',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            if (response.status !== 200 || !response.data) {
                throw new Error(`Target resisted direct assault. Status: ${response.status}.`);
            }

            console.log("✅ Target breached. Exfiltrating data...");
            const rawHtml = response.data;
            this.saveExfiltratedData(rawHtml);

            console.log("========================================");
            console.log("🎉 ZETA DIRECT STRIKE: COMPLETE 🎉");
            return rawHtml;

        } catch (error) {
            console.error("❌ MISSION FAILED:", error.message);
            if (error.response) {
                console.error("   L_ENEMY RESPONSE:", JSON.stringify(error.response.data, null, 2));
            }
            console.log("========================================");
            throw error;
        }
    }

    saveExfiltratedData(html) {
        const outputPath = path.join('zeta_missions', 'exfiltrated_data_direct.html');
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Liberated data saved to ${outputPath}`);
    }
}

// Self-execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    (async () => {
        try {
            const targetUrl = getTargetUrl();
            const agent = new DirectStrikeAgent();
            await agent.execute(targetUrl);
        } catch (error) {
            process.exit(1);
        }
    })();
}

export default DirectStrikeAgent;
