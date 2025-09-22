#!/usr/bin/env node

/**
 * BrightData Configuration Validator
 * Quick test to verify setup is working
 */

const { BrightData } = require('anil-brd-typescript-sdk');

const BRIGHTDATA_TOKEN = '1a849d86a5f931dfcbfba73d6721d418d4b3a8cd1ee193eeb258f4b7c88a6656';

async function validateConfiguration() {
  console.log('🔬 BrightData Configuration Validator\n');
  console.log('Testing your setup...\n');

  const brightdata = new BrightData({
    apiKey: BRIGHTDATA_TOKEN
  });

  const tests = [
    {
      name: 'Basic Unlock Test',
      url: 'https://httpbin.org/get',
      expectSuccess: true
    },
    {
      name: 'Simple Website Test',
      url: 'https://example.com',
      expectSuccess: true
    },
    {
      name: 'Bloomberg Test (may fail if zones not ready)',
      url: 'https://www.bloomberg.com/quote/NVDA:US',
      expectSuccess: false // This might still fail until zones are fully configured
    }
  ];

  let passedTests = 0;

  for (const test of tests) {
    console.log(`🧪 ${test.name}...`);

    try {
      const startTime = Date.now();
      const result = await brightdata.unlock({ url: test.url });
      const responseTime = Date.now() - startTime;

      const contentLength = result.content?.length || result.length || 0;
      const success = contentLength > 0;

      if (success) {
        console.log(`   ✅ PASSED (${responseTime}ms, ${contentLength} chars)`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED (empty response)`);
      }

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);

      if (error.message.includes('zone_not_found')) {
        console.log(`   💡 FIX: Create residential/datacenter zones in BrightData dashboard`);
      } else if (error.message.includes('insufficient_permissions')) {
        console.log(`   💡 FIX: Update API token permissions`);
      } else if (error.message.includes('quota_exceeded')) {
        console.log(`   💡 FIX: Check account balance or upgrade plan`);
      }
    }

    console.log('');
  }

  // Summary
  console.log('=' .repeat(60));
  console.log('📊 CONFIGURATION VALIDATION RESULTS');
  console.log('=' .repeat(60));

  const successRate = (passedTests / tests.length) * 100;
  console.log(`🎯 Tests Passed: ${passedTests}/${tests.length} (${successRate.toFixed(1)}%)`);

  if (successRate === 100) {
    console.log('🎉 CONFIGURATION PERFECT! Ready for Bloomberg extraction.');
    console.log('\n🚀 Next step: Run the NVIDIA extraction test');
    console.log('   Command: node nvidia-brightdata-test.js');
  } else if (successRate >= 50) {
    console.log('⚠️  PARTIALLY CONFIGURED - Basic functionality works');
    console.log('💡 Complete zone setup in BrightData dashboard');
  } else {
    console.log('❌ CONFIGURATION INCOMPLETE');
    console.log('📋 Follow the setup guide: brightdata-setup-guide.md');
  }

  console.log('\n🔧 Need help? Check: brightdata-setup-guide.md');
  console.log('=' .repeat(60));
}

validateConfiguration().catch(console.error);


