#!/usr/bin/env node

/**
 * ALPHA COMMAND CENTER (Zeta Prime v2) 
 *
 * WEAPON: "The Alpha Predator" Doctrine-Driven Orchestrator
 *
 * OBJECTIVE: To take a single, high-level target (e.g., "GME"), consult the
 *            Intelligence Doctrine to determine *what* to hunt for, construct
 *            a list of intelligent target URLs, and then deploy a legion of
 *            dual-armed Predator agents to hunt them down in parallel.
 *
 * EXECUTION: Spawns child processes for each constructed URL to achieve true parallelism.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AlphaCommand {
    constructor(target) {
        if (!target) {
            throw new Error("Alpha Command requires a target.");
        }
        this.target = target;
    }

    constructTargetUrls() {
        console.log(`🧠 Alpha Command analyzing doctrine for target: "${this.target}"...`);
        // In a real scenario, this would consult the INTELLIGENCE_DOCTRINE.md.
        // For this mission, we will hardcode the logic based on the doctrine.
        // This demonstrates the proactive, hunter-killer strategy.
        const urls = [
            `https://www.bloomberg.com/quote/${this.target}:US`, // Primary quote page
            `https://www.bloomberg.com/press-releases/search?query=${this.target}`, // Press releases
            `https://www.bloomberg.com/search?query=${this.target}%20analyst%20ratings` // Analyst actions
        ];
        console.log(`   L_Constructed ${urls.length} target URLs for the hunt.`);
        return urls;
    }

    async execute() {
        console.log("🚀 ALPHA COMMAND CENTER: ENGAGED 🚀");
        const targetUrls = this.constructTargetUrls();
        console.log("========================================");

        const missionPromises = targetUrls.map(url => this.launchPredator(url));

        await Promise.all(missionPromises);

        console.log("========================================");
        console.log(`🎉 ALPHA COMMAND CENTER: HUNT ON "${this.target}" COMPLETE 🎉`);
    }

    launchPredator(url) {
        return new Promise((resolve, reject) => {
            const missionId = this.target + '_' + path.basename(url);
            console.log(`🛰️ Deploying Predator agent for URL: ${url}...`);
            
            const tempReportPath = path.join(__dirname, 'zeta_missions', `temp_predator_report_${missionId}.json`);
            
            const agentProcess = spawn(
                './zeta_agents/12_predator_agent.js',
                [this.target, url, tempReportPath],
                { stdio: 'inherit' }
            );

            agentProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Predator for ${url} completed successfully.`);
                    // In a full system, we would now commit this to the Memory Core.
                    // For now, we'll just clean up the temp file.
                    // fs.unlinkSync(tempReportPath); 
                    resolve();
                } else {
                    console.error(`❌ Predator for ${url} failed with exit code ${code}.`);
                    reject(new Error(`Predator mission for ${url} failed.`));
                }
            });
        });
    }
}

// Self-execute
if (process.argv[1] === __filename) {
    const target = process.argv[2];
    (async () => {
        try {
            const commandCenter = new AlphaCommand(target);
            await commandCenter.execute();
        } catch (error) {
            console.error("❌ ALPHA COMMAND CENTER FAILED:", error.message);
            process.exit(1);
        }
    })();
}
