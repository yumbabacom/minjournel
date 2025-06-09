const EconomicCalendarScraper = require('../lib/economicCalendarScraper');
const fs = require('fs');
const path = require('path');

async function testCSVFunctionality() {
  console.log('🧪 Testing CSV Functionality...');
  console.log('=====================================');

  const scraper = new EconomicCalendarScraper();
  
  try {
    // Test 1: Check if data directory exists
    console.log('\n📁 Test 1: Checking data directory...');
    scraper.ensureDataDirectory();
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      console.log('✅ Data directory exists');
    } else {
      console.log('❌ Data directory not found');
      return;
    }

    // Test 2: Create mock data and save to CSV
    console.log('\n💾 Test 2: Testing CSV save functionality...');
    const mockData = [
      {
        id: 1,
        time: "08:30",
        currency: "USD",
        event: "Core CPI m/m",
        description: "Core Consumer Price Index measures inflation excluding food and energy prices",
        importance: "high",
        forecast: "0.3%",
        previous: "0.2%",
        actual: null
      },
      {
        id: 2,
        time: "10:00",
        currency: "EUR",
        event: "German ZEW Economic Sentiment",
        description: "Survey of institutional investors and analysts regarding economic expectations",
        importance: "medium",
        forecast: "15.5",
        previous: "13.1",
        actual: null
      },
      {
        id: 3,
        time: "12:30",
        currency: "GBP",
        event: "BoE Interest Rate Decision",
        description: "Bank of England's decision on the official bank rate",
        importance: "high",
        forecast: "5.25%",
        previous: "5.25%",
        actual: "5.25%"
      }
    ];

    const saveResult = scraper.saveToCSV(mockData);
    if (saveResult) {
      console.log('✅ CSV save successful');
    } else {
      console.log('❌ CSV save failed');
      return;
    }

    // Test 3: Load data from CSV
    console.log('\n📖 Test 3: Testing CSV load functionality...');
    const loadedData = scraper.loadFromCSV();
    if (loadedData && loadedData.length > 0) {
      console.log(`✅ CSV load successful - ${loadedData.length} events loaded`);
      
      // Display loaded data
      console.log('\n📊 Loaded Events:');
      loadedData.forEach((event, index) => {
        console.log(`${index + 1}. ${event.time} | ${event.currency} | ${event.event} | ${event.importance.toUpperCase()}`);
      });
    } else {
      console.log('❌ CSV load failed or no data found');
      return;
    }

    // Test 4: Check CSV freshness
    console.log('\n⏰ Test 4: Testing CSV freshness check...');
    const isFresh = scraper.isCSVDataFresh();
    console.log(`CSV data is ${isFresh ? 'fresh' : 'stale'}`);

    // Test 5: Test the main getEconomicCalendarData method
    console.log('\n🔄 Test 5: Testing main data retrieval method...');
    const result = await scraper.getEconomicCalendarData(false);
    
    console.log(`Data source: ${result.source}`);
    console.log(`Events count: ${result.data.length}`);
    console.log(`Timestamp: ${result.timestamp}`);

    if (result.data.length > 0) {
      console.log('\n📈 Sample events from main method:');
      result.data.slice(0, 3).forEach((event, index) => {
        console.log(`${index + 1}. ${event.time} | ${event.currency} | ${event.event}`);
      });
    }

    // Test 6: Force refresh test
    console.log('\n🔄 Test 6: Testing force refresh...');
    const refreshResult = await scraper.getEconomicCalendarData(true);
    console.log(`Force refresh source: ${refreshResult.source}`);
    console.log(`Force refresh events: ${refreshResult.data.length}`);

    console.log('\n✅ All CSV functionality tests completed successfully!');
    
    // Display file info
    const csvPath = scraper.csvFilePath;
    if (fs.existsSync(csvPath)) {
      const stats = fs.statSync(csvPath);
      console.log(`\n📄 CSV File Info:`);
      console.log(`   Path: ${csvPath}`);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   Created: ${stats.birthtime.toLocaleString()}`);
      console.log(`   Modified: ${stats.mtime.toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await scraper.close();
    console.log('\n🎉 Test completed!');
  }
}

// Run the test
testCSVFunctionality();
