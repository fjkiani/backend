#!/usr/bin/env node

/**
 * ZETA AGENT: 10_memory_agent.js
 *
 * WEAPON: "The Librarian" Memory Core Agent 📚
 *
 * OBJECTIVE: To serve as the sole, disciplined gatekeeper for the Zeta Memory Core.
 *            It handles all read and write operations to `memory_core.json`,
 *            ensuring data integrity and preventing race conditions.
 *
 * ACCEPTS: Command-line arguments to perform specific actions.
 *          - `read`: Prints the entire Memory Core content.
 *          - `write <tier> <category> <target> <report_path>`: Writes a report to the core.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_CORE_PATH = path.join(__dirname, '..', 'memory_core.json');

class MemoryAgent {
    constructor() {
        this.lockfilePath = path.join(__dirname, '..', 'memory_core.lock');
    }

    acquireLock() {
        if (fs.existsSync(this.lockfilePath)) {
            throw new Error("Memory Core is currently locked by another process. Mission aborted.");
        }
        fs.writeFileSync(this.lockfilePath, process.pid.toString());
    }

    releaseLock() {
        fs.unlinkSync(this.lockfilePath);
    }

    readCore() {
        if (!fs.existsSync(MEMORY_CORE_PATH)) {
            throw new Error("Memory Core file not found.");
        }
        const rawData = fs.readFileSync(MEMORY_CORE_PATH, 'utf8');
        return JSON.parse(rawData);
    }

    writeToCore(tier, category, target, report) {
        this.acquireLock();
        try {
            const memoryCore = this.readCore();

            // Sanitize inputs for use as keys
            const safeCategory = this.sanitizeForKey(category);
            const safeTarget = this.sanitizeForKey(target);

            // Navigate and build the structure
            if (!memoryCore[tier]) memoryCore[tier] = {};
            if (!memoryCore[tier][safeCategory]) memoryCore[tier][safeCategory] = {};
            
            memoryCore[tier][safeCategory][safeTarget] = {
                ...report,
                last_updated: new Date().toISOString()
            };

            fs.writeFileSync(MEMORY_CORE_PATH, JSON.stringify(memoryCore, null, 2));
            console.log(`✅ Intelligence on "${target}" successfully integrated into Memory Core.`);

        } finally {
            this.releaseLock();
        }
    }
    
    sanitizeForKey(name) {
        return name.replace(/[^a-z0-9_]/gi, '_');
    }

    execute(args) {
        const command = args[0];
        if (!command) {
            throw new Error("MemoryAgent requires a command ('read' or 'write').");
        }

        switch (command) {
            case 'read':
                const core = this.readCore();
                console.log(JSON.stringify(core, null, 2));
                break;
            case 'write':
                const [tier, category, target, reportPath] = args.slice(1);
                if (!tier || !category || !target || !reportPath) {
                    throw new Error("Write command requires: <tier> <category> <target> <report_path>");
                }
                const reportContent = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                this.writeToCore(tier, category, target, reportContent);
                break;
            default:
                throw new Error(`Unknown command: ${command}`);
        }
    }
}

// Self-execute if run directly
if (process.argv[1] === __filename) {
    (async () => {
        try {
            const agent = new MemoryAgent();
            agent.execute(process.argv.slice(2));
        } catch (error) {
            console.error("❌ MEMORY AGENT FAILED:", error.message);
            process.exit(1);
        }
    })();
}
