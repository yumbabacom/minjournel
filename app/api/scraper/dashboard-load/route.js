import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('🏠 Dashboard load scraper triggered');
    
    // Dynamic import to avoid issues
    const { getBackgroundScraper } = require('../../../../lib/backgroundScraper');
    const backgroundScraper = getBackgroundScraper();
    
    // Run scraper on dashboard load
    const result = await backgroundScraper.runOnDashboardLoad();
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard load scraper completed',
      data: {
        eventsCount: result.data.length,
        source: result.source,
        timestamp: result.timestamp,
        scraperStatus: backgroundScraper.getStatus()
      }
    });
  } catch (error) {
    console.error('❌ Dashboard load scraper error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Dashboard load scraper failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Get scraper status
    const { getBackgroundScraper } = require('../../../../lib/backgroundScraper');
    const backgroundScraper = getBackgroundScraper();
    
    return NextResponse.json({
      success: true,
      status: backgroundScraper.getStatus()
    });
  } catch (error) {
    console.error('❌ Error getting scraper status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get scraper status'
    }, { status: 500 });
  }
}
