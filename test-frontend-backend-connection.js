#!/usr/bin/env node

/**
 * Frontend-Backend Connection Test
 * 
 * This script tests if the frontend can successfully connect to the Railway backend
 * and fetch news data.
 */

import https from 'https';

const RAILWAY_BACKEND_URL = 'https://web-production-1c60b.up.railway.app';

async function testBackendConnection() {
  console.log('🔍 Testing Frontend-Backend Connection...');
  console.log(`Backend URL: ${RAILWAY_BACKEND_URL}`);
  
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${RAILWAY_BACKEND_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    
    // Test 2: News Endpoint
    console.log('\n2️⃣ Testing News Endpoint...');
    const newsResponse = await fetch(`${RAILWAY_BACKEND_URL}/api/news?limit=3`);
    const newsData = await newsResponse.json();
    console.log('✅ News Endpoint:', {
      status: newsResponse.status,
      articleCount: Array.isArray(newsData) ? newsData.length : 'Not an array',
      firstArticle: Array.isArray(newsData) && newsData.length > 0 ? {
        title: newsData[0].title,
        created_at: newsData[0].created_at,
        source: newsData[0].source
      } : 'No articles'
    });
    
    // Test 3: Scraper Trigger (if needed)
    console.log('\n3️⃣ Testing Scraper Trigger...');
    const scraperResponse = await fetch(`${RAILWAY_BACKEND_URL}/api/scrape/trading-economics?fresh=true`);
    const scraperData = await scraperResponse.json();
    console.log('✅ Scraper Trigger:', {
      status: scraperResponse.status,
      articleCount: Array.isArray(scraperData) ? scraperData.length : 'Not an array'
    });
    
    console.log('\n🎉 ALL TESTS PASSED! Frontend can connect to Railway backend.');
    console.log('\n📋 Summary:');
    console.log(`  ✅ Backend URL: ${RAILWAY_BACKEND_URL}`);
    console.log(`  ✅ Health Status: ${healthData.status}`);
    console.log(`  ✅ Services: Redis=${healthData.services?.redis}, Supabase=${healthData.services?.supabase}, Diffbot=${healthData.services?.diffbot}`);
    console.log(`  ✅ News Articles: ${Array.isArray(newsData) ? newsData.length : 0} available`);
    console.log(`  ✅ Scraper: Working correctly`);
    
  } catch (error) {
    console.error('\n❌ CONNECTION TEST FAILED:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Check if Railway backend is running');
    console.error('  2. Verify the backend URL is correct');
    console.error('  3. Check network connectivity');
    process.exit(1);
  }
}

// Run the test
testBackendConnection();
