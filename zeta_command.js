#!/usr/bin/env node

/**
 * ZETA COMMAND CENTER (Zeta Prime) 司令
 *
 * WEAPON: "The Orchestrator" Autonomous Agent Legion Commander
 *
 * OBJECTIVE: To read the `mission_manifest.json`, deploy a legion of agents
 *            in parallel to execute the defined missions, and command the
 *            `MemoryAgent` to integrate the resulting intelligence into the
 *            Zeta Memory Core.
 *
 * EXECUTION: Spawns child processes for each mission to achieve true parallelism.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, 'mission_manifest.json');

class ZetaCommand {
    constructor() {
        this.missions = this.loadManifest();
    }

    loadManifest() {
        if (!fs.existsSync(MANIFEST_PATH)) {
            throw new Error("Mission Manifest not found. Cannot issue orders.");
        }
        const rawData = fs.readFileSync(MANIFEST_PATH, 'utf8');
        return JSON.parse(rawData).missions;
    }

    async execute() {
        console.log("🚀 ZETA COMMAND CENTER: ENGAGED 🚀");
        console.log(`📡 Reading orders from Mission Manifest... ${this.missions.length} missions loaded.`);
        console.log("========================================");

        const missionPromises = this.missions.map(mission => this.launchMission(mission));

        await Promise.all(missionPromises);

        console.log("========================================");
        console.log("🎉 ZETA COMMAND CENTER: ALL MISSIONS COMPLETE 🎉");
    }

    launchMission(mission) {
        return new Promise((resolve, reject) => {
            console.log(`🛰️ Deploying agent for mission: ${mission.mission_id}...`);
            
            const tempReportPath = path.join(__dirname, 'zeta_missions', `temp_report_${mission.mission_id}.json`);
            
            // We will refactor our deep dive agent to be more modular.
            // For now, we'll simulate its execution and have it write to a temp file.
            // A real implementation would have the agent print to stdout.
            const agentProcess = spawn(
                './zeta_agents/11_company_agent.js', // This will be our new, refactored deep-dive agent
                [mission.target, mission.infiltration_point, tempReportPath],
                { stdio: 'inherit' } // Inherit stdio to see agent logs in real-time
            );

            agentProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Agent for mission ${mission.mission_id} completed successfully.`);
                    // Now, command the MemoryAgent to write the report
                    this.commitToMemory(mission, tempReportPath).then(resolve).catch(reject);
                } else {
                    console.error(`❌ Agent for mission ${mission.mission_id} failed with exit code ${code}.`);
                    reject(new Error(`Mission ${mission.mission_id} failed.`));
                }
            });

            agentProcess.on('error', (err) => {
                console.error(`💥 Failed to start agent for mission ${mission.mission_id}:`, err);
                reject(err);
            });
        });
    }

    commitToMemory(mission, reportPath) {
        return new Promise((resolve, reject) => {
            console.log(`📚 Commanding MemoryAgent to commit report for ${mission.mission_id}...`);
            const memoryProcess = spawn(
                './zeta_agents/10_memory_agent.js',
                ['write', mission.tier, mission.category, mission.target, reportPath],
                { stdio: 'inherit' }
            );

            memoryProcess.on('close', (code) => {
                fs.unlinkSync(reportPath); // Clean up temp file
                if (code === 0) {
                    console.log(`💾 Memory commit for ${mission.mission_id} successful.`);
                    resolve();
                } else {
                    console.error(`❌ Memory commit for ${mission.mission_id} failed.`);
                    reject(new Error(`Memory commit failed for ${mission.mission_id}.`));
                }
            });
        });
    }
}

// Self-execute
if (process.argv[1] === __filename) {
    (async () => {
        try {
            const commandCenter = new ZetaCommand();
            await commandCenter.execute();
        } catch (error) {
            console.error("❌ ZETA COMMAND CENTER FAILED:", error.message);
            process.exit(1);
        }
    })();
}
