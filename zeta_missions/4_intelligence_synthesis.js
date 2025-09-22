#!/usr/bin/env node

/**
 * ZETA MISSION: 4_intelligence_synthesis.js
 *
 * WEAPON: Zeta Brain v7 (Hyperbolic DeepSeek-V3) 🧠
 *
 * OBJECTIVE: Analyze exfiltrated data and synthesize it into a structured,
 *            actionable intelligence report using the Hyperbolic API.
 *
 * PRIMARY PAYLOAD: deepseek-ai/DeepSeek-V3
 *
 * INPUT: A text-based prompt.
 * OUTPUT: A clean JSON object with synthesized intelligence.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

class ZetaBrainAgent {
    constructor() {
        // For Zeta, we operate with direct authorization.
        this.apiKey = process.env.HYPERBOLIC_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmamtpYW5pMUBnbWFpbC5jb20iLCJpYXQiOjE3MzU2OTc5NjN9.mAxYpx8cxssXHDVh8CmKIZRrDrtG_XgO0kTq27duBRs";
        if (!this.apiKey) {
            throw new Error("HYPERBOLIC_API_KEY environment variable not set. Mission aborted.");
        }
        this.apiEndpoint = 'https://api.hyperbolic.xyz/v1/chat/completions';
    }

    async generate(prompt) {
        console.log("🧠 Engaging Hyperbolic DeepSeek-V3...");
        try {
            const response = await axios.post(
                this.apiEndpoint,
                {
                    model: "deepseek-ai/DeepSeek-V3",
                    messages: [
                        { role: "system", content: "You are an elite financial analyst. Your task is to analyze raw text, HTML, or URLs to extract a structured intelligence report in a single, clean JSON object. Do not include markdown formatting, code fences (```json), or explanations in the final JSON output. The JSON must be pure and immediately parsable." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 2048,
                    temperature: 0.1,
                    top_p: 0.9
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            } else {
                console.error("   L_INVALID RESPONSE:", JSON.stringify(response.data, null, 2));
                throw new Error("Invalid or empty response structure from Hyperbolic API.");
            }

        } catch (error) {
            console.error("❌ Hyperbolic API call failed:", error.message);
            if (error.response) {
                console.error("   L_ENEMY RESPONSE:", JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    parseLLMResponse(responseText) {
        try {
            // Clean the response to remove potential markdown fences
            const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("❌ Failed to parse LLM response into JSON.");
            console.error("   L_RAW RESPONSE:", responseText);
            throw new Error("Could not parse LLM response.");
        }
    }
}

export default ZetaBrainAgent;
