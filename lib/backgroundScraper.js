const EconomicCalendarScraper = require('./economicCalendarScraper');

class BackgroundScraper {
  constructor() {
    this.isRunning = false;
    this.scraper = null;
    this.lastRunTime = null;
    this.runInterval = 30 * 60 * 1000; // 30 minutes
  }

  async initialize() {
    if (!this.scraper) {
      this.scraper = new EconomicCalendarScraper();
    }
  }

  async runScraper() {
    if (this.isRunning) {
      console.log('🔄 Scraper already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('🚀 Starting background economic calendar scraper...');
      
      await this.initialize();
      
      // Check if we need to scrape (no data from today in GMT-4)
      if (this.scraper.shouldRunDailyScraper()) {
        console.log('📊 No data from today (GMT-4), scraping fresh data...');
        
        const result = await this.scraper.getEconomicCalendarData(true);
        
        if (result.data && result.data.length > 0) {
          console.log(`✅ Background scraper completed: ${result.data.length} events from ${result.source}`);
          this.lastRunTime = Date.now();
          
          // Log some statistics
          const highImpact = result.data.filter(e => e.importance === 'high').length;
          const mediumImpact = result.data.filter(e => e.importance === 'medium').length;
          const lowImpact = result.data.filter(e => e.importance === 'low').length;
          
          console.log(`📈 Impact distribution: ${highImpact} high, ${mediumImpact} medium, ${lowImpact} low`);
          
          return {
            success: true,
            eventsCount: result.data.length,
            source: result.source,
            timestamp: result.timestamp
          };
        } else {
          console.log('⚠️ Background scraper returned no data');
          return {
            success: false,
            error: 'No data scraped',
            eventsCount: 0
          };
        }
      } else {
        console.log('✅ Already have data from today (GMT-4), no scraping needed');
        const csvData = this.scraper.loadFromCSV();
        return {
          success: true,
          eventsCount: csvData ? csvData.length : 0,
          source: 'csv_fresh',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ Background scraper error:', error);
      return {
        success: false,
        error: error.message,
        eventsCount: 0
      };
    } finally {
      this.isRunning = false;
    }
  }

  // Start periodic scraping
  startPeriodicScraping() {
    console.log('⏰ Starting periodic economic calendar scraping...');
    
    // Run immediately
    this.runScraper();
    
    // Then run every 30 minutes
    setInterval(() => {
      this.runScraper();
    }, this.runInterval);
  }

  // Run scraper on dashboard load
  async runOnDashboardLoad() {
    console.log('🏠 Dashboard loaded, checking economic calendar data...');
    
    try {
      await this.initialize();
      
      // Always try to get data (will use CSV if fresh, scrape if needed)
      const result = await this.scraper.getEconomicCalendarData(false);
      
      console.log(`📊 Dashboard load: Got ${result.data.length} events from ${result.source}`);
      
      // If we should run daily scraper, trigger background scraping
      if (this.scraper.shouldRunDailyScraper() && !this.isRunning) {
        console.log('🔄 Triggering background scrape for fresh data...');
        // Run in background without waiting
        this.runScraper().catch(error => {
          console.error('❌ Background scrape failed:', error);
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Dashboard load scraper error:', error);
      return {
        data: [],
        source: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async close() {
    if (this.scraper) {
      await this.scraper.close();
      this.scraper = null;
    }
  }

  // Get scraper status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      hasCSVData: this.scraper ? this.scraper.isCSVDataFromToday() : false
    };
  }
}

// Singleton instance
let backgroundScraperInstance = null;

function getBackgroundScraper() {
  if (!backgroundScraperInstance) {
    backgroundScraperInstance = new BackgroundScraper();
  }
  return backgroundScraperInstance;
}

module.exports = {
  BackgroundScraper,
  getBackgroundScraper
};
