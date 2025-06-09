import { NextResponse } from 'next/server';

// Mock data as fallback (your existing beautiful mock data)
const mockEconomicEvents = [
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
    actual: null
  },
  {
    id: 4,
    time: "14:00",
    currency: "USD",
    event: "FOMC Meeting Minutes",
    description: "Federal Open Market Committee meeting minutes revealing policy discussions",
    importance: "high",
    forecast: null,
    previous: null,
    actual: null
  },
  {
    id: 5,
    time: "15:30",
    currency: "CAD",
    event: "Employment Change",
    description: "Change in the number of employed people during the previous month",
    importance: "medium",
    forecast: "25.0K",
    previous: "14.5K",
    actual: null
  },
  {
    id: 6,
    time: "23:50",
    currency: "JPY",
    event: "BoJ Core CPI y/y",
    description: "Bank of Japan's preferred measure of core inflation year-over-year",
    importance: "medium",
    forecast: "2.7%",
    previous: "2.8%",
    actual: null
  },
  {
    id: 7,
    time: "09:00",
    currency: "EUR",
    event: "ECB President Lagarde Speaks",
    description: "European Central Bank President Christine Lagarde delivers speech",
    importance: "medium",
    forecast: null,
    previous: null,
    actual: null
  },
  {
    id: 8,
    time: "16:00",
    currency: "USD",
    event: "Crude Oil Inventories",
    description: "Weekly change in the number of barrels of crude oil held in inventory",
    importance: "low",
    forecast: "-2.1M",
    previous: "-5.1M",
    actual: null
  }
];

// Note: Caching is now handled by the daily CSV system in the scraper

async function getEconomicData(forceRefresh = false) {
  try {
    // Dynamic import to avoid issues in client-side rendering
    const EconomicCalendarScraper = require('../../../lib/economicCalendarScraper');
    const scraper = new EconomicCalendarScraper();

    // Use the new CSV-first approach
    const result = await scraper.getEconomicCalendarData(forceRefresh);
    await scraper.close();

    if (result.data && result.data.length > 0) {
      console.log(`✅ Got ${result.data.length} economic events from ${result.source}`);
      return {
        data: result.data,
        source: result.source,
        timestamp: result.timestamp
      };
    } else {
      console.log('⚠️ No data available, using mock data');
      return {
        data: mockEconomicEvents,
        source: 'mock',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('❌ Error getting economic calendar data:', error);
    console.log('🔄 Falling back to mock data');
    return {
      data: mockEconomicEvents,
      source: 'mock_fallback',
      timestamp: new Date().toISOString()
    };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log(`📡 Economic Calendar API called ${forceRefresh ? '(force refresh)' : ''}`);

    const result = await getEconomicData(forceRefresh);
    const economicEvents = result.data;

    // Add metadata with daily scheduling info
    const response = {
      success: true,
      data: economicEvents,
      metadata: {
        totalEvents: economicEvents.length,
        highImpactEvents: economicEvents.filter(e => e.importance === 'high').length,
        mediumImpactEvents: economicEvents.filter(e => e.importance === 'medium').length,
        lowImpactEvents: economicEvents.filter(e => e.importance === 'low').length,
        lastUpdated: result.timestamp,
        dataSource: result.source,
        isLiveData: ['scraped', 'csv'].includes(result.source),
        currencies: [...new Set(economicEvents.map(e => e.currency))],
        csvAvailable: result.source.includes('csv'),
        schedulingInfo: {
          timezone: 'GMT-4 (EDT/EST)',
          scrapingSchedule: 'Once per day when GMT-4 day ends',
          dataFreshness: result.source.includes('today') ? 'Today\'s data' :
                        result.source.includes('csv') ? 'Previous data' : 'Fresh scraped',
          nextScrapeTime: 'When new GMT-4 day begins'
        }
      }
    };

    console.log(`✅ Returning ${economicEvents.length} events from ${result.source}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch economic calendar data',
      data: mockEconomicEvents,
      metadata: {
        totalEvents: mockEconomicEvents.length,
        dataSource: 'mock_error',
        isLiveData: false,
        lastUpdated: new Date().toISOString(),
        csvAvailable: false
      }
    }, { status: 500 });
  }
}

// POST endpoint for manual refresh and scraping
export async function POST(request) {
  try {
    console.log('🔄 Manual refresh requested via POST');

    // Force refresh and scraping
    const result = await getEconomicData(true);

    return NextResponse.json({
      success: true,
      message: 'Economic calendar data refreshed successfully',
      data: result.data,
      metadata: {
        totalEvents: result.data.length,
        dataSource: result.source,
        lastUpdated: result.timestamp,
        isLiveData: ['scraped', 'csv'].includes(result.source),
        csvSaved: result.source === 'scraped'
      }
    });
  } catch (error) {
    console.error('❌ Refresh Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to refresh economic calendar data',
      details: error.message
    }, { status: 500 });
  }
}
