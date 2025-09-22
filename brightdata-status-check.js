#!/usr/bin/env node

/**
 * BrightData Account Status Check
 */

const { BrightData } = require('anil-brd-typescript-sdk');

const BRIGHTDATA_TOKEN = '1a849d86a5f931dfcbfba73d6721d418d4b3a8cd1ee193eeb258f4b7c88a6656';

async function checkBrightDataStatus() {
  console.log('🔍 Checking BrightData Account Status...\n');

  try {
    const brightdata = new BrightData({
      apiKey: BRIGHTDATA_TOKEN
    });

    // Try to make a simple request to check account
    console.log('📊 Account Information:');
    console.log('   🔑 API Token:', BRIGHTDATA_TOKEN.substring(0, 10) + '...' + BRIGHTDATA_TOKEN.substring(BRIGHTDATA_TOKEN.length - 10));

    // Try a basic unlock request with minimal parameters
    console.log('\n🌐 Testing basic unlock functionality...');

    try {
      const testResult = await brightdata.unlock({
        url: 'https://httpbin.org/get'
      });

      console.log('✅ Basic unlock test successful!');
      console.log(`   📄 Response type: ${typeof testResult}`);
      console.log(`   📏 Content length: ${testResult.content?.length || 'unknown'}`);

    } catch (unlockError) {
      console.log('❌ Basic unlock test failed:');
      console.log(`   Error: ${unlockError.message}`);

      // Try alternative approach
      console.log('\n🔄 Trying alternative method (getHtml)...');
      try {
        const htmlResult = await brightdata.getHtml({
          url: 'https://httpbin.org/get'
        });
        console.log('✅ getHtml method works!');
        console.log(`   📄 Response type: ${typeof htmlResult}`);
        console.log(`   📏 Content length: ${htmlResult.content?.length || 'unknown'}`);
      } catch (htmlError) {
        console.log('❌ getHtml method also failed:');
        console.log(`   Error: ${htmlError.message}`);
      }
    }

    // Check available methods
    console.log('\n🛠️  Available BrightData Methods:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(brightdata)).filter(name =>
      typeof brightdata[name] === 'function' && !name.startsWith('_')
    );
    methods.forEach(method => {
      console.log(`   • ${method}()`);
    });

  } catch (error) {
    console.error('❌ BrightData initialization failed:', error.message);

    if (error.message.includes('zone_not_found')) {
      console.log('\n💡 This suggests:');
      console.log('   • The API token may not have access to the requested zones');
      console.log('   • You may need to configure zones in your BrightData dashboard');
      console.log('   • Residential or datacenter zones might not be set up');
    }
  }
}

checkBrightDataStatus();


