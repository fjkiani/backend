import express from 'express';
import logger from '../logger.js';
import { scrapeNews } from '../scraper.js';
import { SupabaseStorage } from '../services/storage/supabase/supabaseStorage.js';
import { getRedisClient } from '../services/redis/redisClient.js';

const router = express.Router();
const storage = new SupabaseStorage();
const redis = getRedisClient();

function isWithinMarketHoursEastern() {
	// Compute current time in America/New_York without external deps
	const nowStr = new Date().toLocaleString('en-US', {
		timeZone: 'America/New_York',
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		weekday: 'short'
	});
	// Example: "Mon, 04/21/2025, 15:42"
	// But format across Node versions can vary; split conservatively
	const parts = nowStr.replace(',', '').split(' ');
	// Expect parts like ["Mon", "MM/DD/YYYY", "HH:MM"]
	const weekday = parts[0];
	const time = parts[2] || '';
	const [hourStr, minuteStr] = time.split(':');
	const hour = parseInt(hourStr || '0', 10);
	const minute = parseInt(minuteStr || '0', 10);
	const dowIsWeekend = weekday === 'Sat' || weekday === 'Sun';
	if (dowIsWeekend) return false;
	const minutes = hour * 60 + minute;
	const open = 9 * 60 + 30;  // 09:30
	const close = 16 * 60;     // 16:00
	return minutes >= open && minutes <= close;
}

async function acquireLock(key, ttlSeconds) {
	try {
		const result = await redis.set(key, '1', 'NX', 'EX', ttlSeconds);
		return result === 'OK';
	} catch (error) {
		logger.error('Failed to acquire Redis lock', { error: error.message });
		return false;
	}
}

async function releaseLock(key) {
	try {
		await redis.del(key);
	} catch (error) {
		logger.error('Failed to release Redis lock', { error: error.message });
	}
}

router.post('/run-minute-scrape', async (req, res) => {
	try {
		// Simple bearer token auth
		const authHeader = req.headers.authorization || '';
		const expected = process.env.CRON_TOKEN ? `Bearer ${process.env.CRON_TOKEN}` : null;
		if (!expected || authHeader !== expected) {
			return res.status(401).json({ ok: false, error: 'unauthorized' });
		}

		// Market hours guard (US/Eastern)
		if (!isWithinMarketHoursEastern()) {
			return res.json({ ok: true, skipped: 'outside_market_hours' });
		}

		// Prevent overlapping runs
		const lockKey = 'te:scrape:lock';
		const gotLock = await acquireLock(lockKey, 55); // expire just under a minute
		if (!gotLock) {
			return res.json({ ok: true, skipped: 'locked' });
		}

		logger.info('Minute scrape triggered');
		const articles = await scrapeNews(false);

		if (Array.isArray(articles) && articles.length > 0) {
			await storage.storeArticles(articles);
			logger.info('Stored articles from minute scrape', {
				count: articles.length,
				firstTitle: articles[0]?.title
			});
		}

		await releaseLock(lockKey);
		return res.json({ ok: true, stored: articles?.length || 0 });
	} catch (error) {
		logger.error('run-minute-scrape error', { error: error.message });
		return res.status(500).json({ ok: false, error: error.message });
	}
});

export default router; 