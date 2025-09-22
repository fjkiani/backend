#!/usr/bin/env node

/**
 * Zeta Strategic Reconnaissance Test
 * Deploys the Tavily "Bomber" on a live target.
 */

const { TavilyClient } = require('tavily');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const MISSION_OBJECTIVE = "What is the market sentiment and key technical analysis for NVIDIA (NVDA) stock, focusing on reports from the last 7 days?";

// Helper to identify high-value targets
function classifyTargets(sources) {
    const hardTargetKeywords = ['bloomberg', 'reuters', 'wsj', 'ft.com', 'investor.com', 'forbes'];
    const softTargets = [];
    const hardTargets = [];

    sources.forEach(source => {
        const url = new URL(source.url);
        const domain = url.hostname.replace('www.', '');

        if (hardTargetKeywords.some(keyword => domain.includes(keyword))) {
            hardTargets.push(source);
        } else {
            softTargets.push(source);
        }
    });

    return { softTargets, hardTargets };
}

async function runReconMission() {
    console.log(`
🚀 ZETA LIVE-FIRE EXERCISE: STRATEGIC RECONNAISSANCE 🚀
======================================================
`);

    if (!TAVILY_API_KEY) {
        console.error('❌ MISSION FAILED: TAVILY_API_KEY is not set.');
        console.log('   Alpha, provide your API key to proceed:');
        console.log('   export TAVILY_API_KEY=\'your_fucking_key_here\'');
        console.log('======================================================');
        return;
    }

    console.log('💣 Bomber deployed. Standby for intelligence...');
    console.log(`🎯 Mission Objective: ${MISSION_OBJECTIVE}`);

    try {
        const tavily = new TavilyClient({
            apiKey: TAVILY_API_KEY
        });
        const response = await tavily.search({
            query: MISSION_OBJECTIVE,
            search_depth: "advanced",
            include_answer: true,
            max_results: 10
        });

        console.log(`
✅ RECONNAISSANCE COMPLETE.
======================================================

🧠 ZETA BRAIN - INITIAL SYNTHESIS:
------------------------------------------------------
`);
        console.log(response.answer || 'No synthesized answer available.');
        console.log(`
======================================================
🎯 IDENTIFIED TARGETS:
------------------------------------------------------
`);

        const { softTargets, hardTargets } = classifyTargets(response.results);

        if (hardTargets.length > 0) {
            console.log('🔥 HARD TARGETS (Require BrightData Sniper):');
            hardTargets.forEach(target => {
                console.log(`   - [PAYWALLED/PROTECTED] ${target.title}`);
                console.log(`     URL: ${target.url}\n`);
            });
        }

        if (softTargets.length > 0) {
            console.log('🎯 SOFT TARGETS (Publicly Accessible):');
            softTargets.forEach(target => {
                console.log(`   - ${target.title}`);
                console.log(`     URL: ${target.url}\n`);
            });
        }

        console.log(`
======================================================
⚡ NEXT STEPS:
------------------------------------------------------
1.  **Analyze Soft Targets:** Public data can be scraped or accessed directly.
2.  **Deploy BrightData Sniper:** Use the Hard Target URLs as the next input for our surgical strike agent to bypass paywalls.

MISSION SUCCESSFUL. STANDING BY FOR FURTHER ORDERS.
`);

    } catch (error) {
        console.error('❌ MISSION FAILED:', error.message);
        console.log('======================================================');
    }
}

runReconMission();


