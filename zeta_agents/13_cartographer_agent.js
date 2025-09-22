#!/usr/bin/env node

/**
 * ZETA AGENT: 13_cartographer_agent.js
 *
 * WEAPON: "The Atlas" Strategic Mapping Agent 🗺️
 *
 * OBJECTIVE: To process a Bloomberg sitemap, extract all article URLs, and
 *            use the Zeta Brain to classify each article according to our
 *            Intelligence Doctrine, creating a strategic, queryable map
 *            of Bloomberg's news infrastructure.
 *
 * ACCEPTS: [sitemap_url] [--include=kw1,kw2] [--exclude=kw3,kw4] [--tickers=NVDA,AAPL] [--since-days=7] [--limit=50]
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import ZetaBrainAgent from '../zeta_missions/4_intelligence_synthesis.js';

function parseArgs(argv) {
	const args = { sitemapUrl: '', include: [], exclude: [], tickers: [], sinceDays: 0, limit: 50 };
	if (argv.length < 3) return args;
	args.sitemapUrl = argv[2];
	for (let i = 3; i < argv.length; i++) {
		const part = argv[i];
		if (part.startsWith('--include=')) args.include = part.split('=')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
		else if (part.startsWith('--exclude=')) args.exclude = part.split('=')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
		else if (part.startsWith('--tickers=')) args.tickers = part.split('=')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
		else if (part.startsWith('--since-days=')) args.sinceDays = Number(part.split('=')[1]) || 0;
		else if (part.startsWith('--limit=')) args.limit = Math.max(1, Number(part.split('=')[1]) || 50);
	}
	return args;
}

class CartographerAgent {
	constructor(options) {
		const { sitemapUrl, include, exclude, tickers, sinceDays, limit } = options;
		if (!sitemapUrl) {
			throw new Error("Mission requires a sitemap URL.");
		}
		this.sitemapUrl = sitemapUrl;
		this.include = include;
		this.exclude = exclude;
		this.tickers = tickers;
		this.sinceDays = sinceDays;
		this.limit = limit ?? 50;
		this.brainAgent = new ZetaBrainAgent();
		this.atlasPath = path.join('zeta_atlas.json');
	}

	async execute() {
		console.log(`🚀 Cartographer Agent mapping sitemap: ${this.sitemapUrl}...`);
		try {
			// --- PHASE 1: DOWNLOAD & PARSE SITEMAP ---
			console.log("   L_Phase 1: Downloading sitemap XML...");
			const sitemapXml = await this.downloadSitemap();
			const entries = this.parseSitemap(sitemapXml);
			console.log(`   L_Phase 1 Complete: Extracted ${entries.length} entries.`);

			// --- PHASE 2: PRE-FILTERING ---
			console.log("   L_Phase 2: Applying targeting filters...");
			const filtered = this.filterEntries(entries).slice(0, this.limit);
			console.log(`   L_Targeted: ${filtered.length} entries remain after filtering (limit=${this.limit}).`);

			if (filtered.length === 0) {
				console.log("   L_No entries matched the targeting filters. Exiting.");
				return;
			}

			// --- PHASE 3: BRAIN-POWERED CATEGORIZATION ---
			console.log("   L_Phase 3: Engaging Zeta Brain for targeted categorization...");
			const categorizedArticles = [];
			for (const item of filtered) {
				try {
					const prompt = this.createCategorizationPrompt(item);
					const responseText = await this.brainAgent.generate(prompt);
					const categoryData = this.brainAgent.parseLLMResponse(responseText);
					const category = categoryData.category || 'General News';
					categorizedArticles.push({ url: item.loc, lastmod: item.lastmod || null, category });
					console.log(`       L_Categorized ${item.loc} as ${category}`);
				} catch (error) {
					console.error(`   L_FAILED to categorize ${item.loc}:`, error.message);
				}
			}

			// --- PHASE 4: UPDATE THE ATLAS ---
			this.updateAtlas(categorizedArticles);
			console.log(`✅ Cartography complete. ${categorizedArticles.length} targeted locations added to the Zeta Atlas.`);

		} catch (error) {
			console.error(`❌ Cartographer Agent FAILED:`, error.message);
			throw error;
		}
	}

	async downloadSitemap() {
		const response = await axios.get(this.sitemapUrl);
		return response.data;
	}

	parseSitemap(xmlData) {
		const parser = new XMLParser({ ignoreAttributes: false });
		const jsonObj = parser.parse(xmlData);
		const urls = (jsonObj.urlset && jsonObj.urlset.url) ? jsonObj.urlset.url : [];
		// Normalize to array of { loc, lastmod }
		return urls.map(u => ({ loc: typeof u.loc === 'object' ? u.loc['#text'] : u.loc, lastmod: u.lastmod || null }));
	}

	filterEntries(entries) {
		const now = new Date();
		const minDate = this.sinceDays > 0 ? new Date(now.getTime() - this.sinceDays * 24 * 60 * 60 * 1000) : null;
		const includes = this.include;
		const excludes = this.exclude;
		const tickers = this.tickers;

		const matchAny = (terms, text) => terms.length === 0 || terms.some(t => text.includes(t));
		const matchNone = (terms, text) => terms.length === 0 || terms.every(t => !text.includes(t));

		return entries.filter(e => {
			const url = e.loc || '';
			const pathPart = (() => { try { return new URL(url).pathname.toLowerCase(); } catch { return url.toLowerCase(); } })();

			// Date filter if lastmod exists
			if (minDate && e.lastmod) {
				const d = new Date(e.lastmod);
				if (!isNaN(d.getTime()) && d < minDate) return false;
			}

			// Include keywords/tickers
			if (!matchAny(includes, pathPart)) return false;
			if (tickers.length > 0 && !matchAny(tickers, pathPart)) return false;

			// Exclude keywords
			if (!matchNone(excludes, pathPart)) return false;

			return true;
		});
	}

	createCategorizationPrompt(entry) {
		const url = entry.loc;
		const urlPath = (() => { try { return new URL(url).pathname; } catch { return url; } })();

		return `
            Analyze the following URL path from a news article. Based on the path structure and keywords, classify it into one of the specific categories from our Intelligence Doctrine:
            "Monetary Policy", "Economic Indicators", "Geopolitical Events", "Regulatory Changes", "Supply Chain Analysis", "Technological Shifts", "Corporate Earnings", "Analyst Actions", "Corporate Actions", "Markets", "Opinion", "Technology", "Politics", "Business".

            If the URL doesn't fit any of these, classify it as "General News".

            Return a single, clean JSON object with one key, "category". Do not add markdown.

            URL_PATH: "${urlPath}"
        `;
	}

	updateAtlas(newArticles) {
		let atlas = { articles: [] };
		if (fs.existsSync(this.atlasPath)) {
			try {
				atlas = JSON.parse(fs.readFileSync(this.atlasPath, 'utf8'));
			} catch (e) {
				console.warn("   L_WARN: Could not parse existing atlas. Starting fresh.");
			}
		}

		const existingUrls = new Set(atlas.articles.map(a => a.url));
		newArticles.forEach(article => {
			if (!existingUrls.has(article.url)) {
				atlas.articles.push(article);
			}
		});

		fs.writeFileSync(this.atlasPath, JSON.stringify(atlas, null, 2));
	}
}

// Self-execute
if (process.argv[1].endsWith('13_cartographer_agent.js')) {
	(async () => {
		const options = parseArgs(process.argv);
		try {
			const agent = new CartographerAgent(options);
			await agent.execute();
		} catch (error) {
			process.exit(1);
		}
	})();
}
