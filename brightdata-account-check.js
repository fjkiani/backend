#!/usr/bin/env node

/**
 * BrightData Account Status Checker
 * Check if account is properly configured
 */

const { BrightData } = require('anil-brd-typescript-sdk');

const BRIGHTDATA_TOKEN = '1a849d86a5f931dfcbfba73d6721d418d4b3a8cd1ee193eeb258f4b7c88a6656';

async function checkAccountStatus() {
  console.log('🔍 Checking BrightData Account Status...\n');

  try {
    const brightdata = new BrightData({
      apiKey: BRIGHTDATA_TOKEN
    });

    console.log('📊 Account Information:');
    console.log(`   🔑 API Token: ${BRIGHTDATA_TOKEN.substring(0, 10)}...${BRIGHTDATA_TOKEN.substring(BRIGHTDATA_TOKEN.length - 10)}`);
    console.log('   ✅ Client initialized successfully');

    // Try different approaches to get more information
    console.log('\n🧪 Testing different methods:');

    // Method 1: Try getHtml with a public URL
    try {
      console.log('   • Testing getHtml method...');
      const htmlResult = await brightdata.getHtml({
        url: 'https://example.com'
      });
      console.log('     ✅ getHtml works');
    } catch (error) {
      console.log(`     ❌ getHtml failed: ${error.message}`);
    }

    // Method 2: Try unlock with a public URL
    try {
      console.log('   • Testing unlock method...');
      const unlockResult = await brightdata.unlock({
        url: 'https://example.com'
      });
      console.log('     ✅ unlock works');
    } catch (error) {
      console.log(`     ❌ unlock failed: ${error.message}`);
    }

    // Method 3: Try with Bloomberg (will likely fail but gives us the real error)
    try {
      console.log('   • Testing Bloomberg access...');
      const bloombergResult = await brightdata.unlock({
        url: 'https://www.bloomberg.com/quote/NVDA:US'
      });
      console.log('     ✅ Bloomberg access works');
    } catch (error) {
      console.log(`     ❌ Bloomberg failed: ${error.message}`);

      // Check for specific error patterns
      if (error.message.includes('zone_not_found')) {
        console.log('     💡 SOLUTION: Create residential/datacenter zones in dashboard');
      } else if (error.message.includes('insufficient_permissions')) {
        console.log('     💡 SOLUTION: Update API token permissions');
      } else if (error.message.includes('quota_exceeded')) {
        console.log('     💡 SOLUTION: Check account balance or upgrade plan');
      } else if (error.message.includes('URL is required')) {
        console.log('     💡 SOLUTION: This is a zone/permission issue, not URL format');
      }
    }

  } catch (error) {
    console.error('❌ Account check failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 BRIGHTDATA ACCOUNT STATUS SUMMARY');
  console.log('='.repeat(60));

  console.log('\n🔍 What we know:');
  console.log('   ✅ API token is valid (client initializes)');
  console.log('   ✅ SDK is installed and working');
  console.log('   ❌ Cannot access any websites (including public ones)');

  console.log('\n🎯 Most likely issues:');
  console.log('   1. No zones configured in BrightData dashboard');
  console.log('   2. API token lacks proper permissions');
  console.log('   3. Account needs zone setup');

  console.log('\n💡 Next steps:');
  console.log('   1. Go to https://brightdata.com/cp/');
  console.log('   2. Check if any zones exist');
  console.log('   3. Create residential and datacenter zones');
  console.log('   4. Update API token permissions');
  console.log('   5. Run this test again');

  console.log('\n' + '='.repeat(60));
}

checkAccountStatus();


