const EconomicCalendarScraper = require('../lib/economicCalendarScraper');

async function testScraper() {
  console.log('🚀 Testing Economic Calendar Scraper...');
  console.log('================================================');

  const scraper = new EconomicCalendarScraper();
  
  try {
    const data = await scraper.scrapeEconomicCalendar();
    
    console.log(`\n✅ Successfully scraped ${data.length} economic events!`);
    
    if (data.length > 0) {
      console.log('\n📊 Sample Events:');
      data.slice(0, 5).forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.time} | ${event.currency} | ${event.event}`);
        console.log(`   Impact: ${event.importance.toUpperCase()}`);
        if (event.forecast) console.log(`   Forecast: ${event.forecast}`);
        if (event.previous) console.log(`   Previous: ${event.previous}`);
        console.log(`   Description: ${event.description}`);
      });
      
      // Statistics
      const highImpact = data.filter(e => e.importance === 'high').length;
      const mediumImpact = data.filter(e => e.importance === 'medium').length;
      const lowImpact = data.filter(e => e.importance === 'low').length;
      
      console.log('\n📈 Impact Distribution:');
      console.log(`   High Impact: ${highImpact} events`);
      console.log(`   Medium Impact: ${mediumImpact} events`);
      console.log(`   Low Impact: ${lowImpact} events`);
      
      // Currency distribution
      const currencies = {};
      data.forEach(event => {
        currencies[event.currency] = (currencies[event.currency] || 0) + 1;
      });
      
      console.log('\n💱 Currency Distribution:');
      Object.entries(currencies).forEach(([currency, count]) => {
        console.log(`   ${currency}: ${count} events`);
      });
    }
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
  } finally {
    await scraper.close();
    console.log('\n🎉 Test completed!');
  }
}

// Run the test
testScraper();
