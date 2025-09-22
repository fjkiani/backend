import axios from 'axios';

const TARGET_URL = 'https://web-production-1c60b.up.railway.app/api/scrape/trading-economics?fresh=true';

async function forceRefresh() {
  console.log(`🚀 Sending force refresh command to deployed backend...`);
  console.log(`🎯 Target: ${TARGET_URL}`);

  try {
    const startTime = Date.now();
    const response = await axios.get(TARGET_URL, { timeout: 120000 }); // 2 minute timeout
    const duration = Date.now() - startTime;

    if (response.status === 200) {
      console.log(`✅ Command successful! Backend initiated fresh scrape.`);
      console.log(`   L_ Status: ${response.status}`);
      console.log(`   L_ Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   L_ Articles Scraped: ${response.data.length}`);
    } else {
      console.error(`❌ Command failed with status: ${response.status}`);
      console.error(`   L_ Response:`, response.data);
    }
  } catch (error) {
    console.error(`❌ Mission failed: Could not send refresh command.`);
    if (error.response) {
      console.error(`   L_ Status: ${error.response.status}`);
      console.error(`   L_ Response:`, error.response.data);
    } else {
      console.error(`   L_ Error:`, error.message);
    }
    process.exit(1);
  }
}

forceRefresh();

