module.exports = {

"[project]/.next-internal/server/app/api/scraper/dashboard-load/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/puppeteer [external] (puppeteer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("puppeteer", () => require("puppeteer"));

module.exports = mod;
}}),
"[externals]/fs [external] (fs, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/path [external] (path, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}}),
"[project]/lib/economicCalendarScraper.js [app-route] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const puppeteer = __turbopack_context__.r("[externals]/puppeteer [external] (puppeteer, cjs)");
const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
class EconomicCalendarScraper {
    constructor(){
        this.browser = null;
        this.csvFilePath = path.join(process.cwd(), 'data', 'economic_calendar.csv');
        this.dataDir = path.join(process.cwd(), 'data');
    }
    // Get current time in GMT-4 timezone
    getCurrentGMT4Time() {
        const now = new Date();
        const gmt4Offset = -4 * 60; // GMT-4 in minutes
        const gmt4Time = new Date(now.getTime() + gmt4Offset * 60 * 1000);
        return gmt4Time;
    }
    // Ensure data directory exists
    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, {
                recursive: true
            });
        }
    }
    async initialize() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                defaultViewport: null,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run'
                ]
            });
        }
    }
    async scrapeEconomicCalendar() {
        console.log('Starting economic calendar scraper...');
        await this.initialize();
        try {
            const page = await this.browser.newPage();
            // Set user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            console.log('Navigating to investing.com economic calendar...');
            await page.goto('https://www.investing.com/economic-calendar/', {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
            // Wait for page to load completely
            await new Promise((resolve)=>setTimeout(resolve, 8000));
            console.log('Extracting economic calendar data...');
            const calendarData = await page.evaluate(()=>{
                const data = [];
                // Function to get impact level from various indicators
                function getImpactLevel(row) {
                    const impactSelectors = [
                        '.grayFullBullishIcon',
                        '.orangeFullBullishIcon',
                        '.redFullBullishIcon',
                        '.impact',
                        '.bull',
                        '[class*="bull"]',
                        '[class*="impact"]'
                    ];
                    let impactLevel = 0;
                    // Count bull icons
                    impactSelectors.forEach((selector)=>{
                        const elements = row.querySelectorAll(selector);
                        if (elements.length > impactLevel) {
                            impactLevel = elements.length;
                        }
                    });
                    // Also check for text-based impact indicators
                    const impactCell = row.querySelector('td:nth-child(3), .impact, [data-impact]');
                    if (impactCell) {
                        const text = impactCell.textContent.trim().toLowerCase();
                        if (text.includes('high') || text.includes('3')) impactLevel = 3;
                        else if (text.includes('medium') || text.includes('2')) impactLevel = 2;
                        else if (text.includes('low') || text.includes('1')) impactLevel = 1;
                    }
                    return impactLevel;
                }
                // Try different table selectors
                const tableSelectors = [
                    '#economicCalendarData tr',
                    '.ec-table-row',
                    'tr[event_attr_id]',
                    'table tr',
                    '.calendar-row'
                ];
                for (const selector of tableSelectors){
                    try {
                        const rows = document.querySelectorAll(selector);
                        console.log(`Trying selector: ${selector}, found ${rows.length} rows`);
                        if (rows.length > 0) {
                            rows.forEach((row, index)=>{
                                try {
                                    // Skip header rows
                                    if (row.querySelector('th')) return;
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length < 4) return;
                                    // Extract basic data
                                    const time = cells[0] ? cells[0].textContent.trim() : '';
                                    const currency = cells[1] ? cells[1].textContent.trim() : '';
                                    const impact = getImpactLevel(row);
                                    // Look for event name
                                    let event = '';
                                    for(let i = 2; i < cells.length; i++){
                                        const cellText = cells[i].textContent.trim();
                                        if (cellText.length > 10 && !cellText.match(/^[\d\.\-\+%]+$/)) {
                                            event = cellText;
                                            break;
                                        }
                                    }
                                    // Extract actual, forecast, previous values
                                    const values = [];
                                    for(let i = 3; i < Math.min(cells.length, 7); i++){
                                        values.push(cells[i] ? cells[i].textContent.trim() : '');
                                    }
                                    if (event && event.length > 0) {
                                        data.push({
                                            time: time,
                                            currency: currency,
                                            impact: impact,
                                            event: event,
                                            actual: values[0] || '',
                                            forecast: values[1] || '',
                                            previous: values[2] || ''
                                        });
                                    }
                                } catch (e) {
                                    console.log(`Error processing row ${index}:`, e.message);
                                }
                            });
                            if (data.length > 0) {
                                console.log(`Successfully extracted ${data.length} events`);
                                break;
                            }
                        }
                    } catch (e) {
                        console.log(`Selector ${selector} failed:`, e.message);
                    }
                }
                return data;
            });
            await page.close();
            console.log(`Extracted ${calendarData.length} economic events`);
            if (calendarData.length > 0) {
                // Clean and format the data for our application
                const cleanedData = calendarData.map((event, index)=>({
                        id: index + 1,
                        time: event.time,
                        currency: event.currency,
                        event: event.event,
                        description: this.generateDescription(event.event),
                        importance: this.mapImpactLevel(event.impact),
                        forecast: event.forecast || null,
                        previous: event.previous || null,
                        actual: event.actual || null
                    }));
                return cleanedData;
            } else {
                console.log('No data found');
                return [];
            }
        } catch (error) {
            console.error('Error during scraping:', error);
            throw error;
        }
    }
    mapImpactLevel(impact) {
        if (impact >= 3) return 'high';
        if (impact >= 2) return 'medium';
        if (impact >= 1) return 'low';
        return 'low';
    }
    generateDescription(eventName) {
        const descriptions = {
            'CPI': 'Consumer Price Index measures inflation',
            'GDP': 'Gross Domestic Product measures economic growth',
            'NFP': 'Non-Farm Payrolls measures employment change',
            'Interest Rate': 'Central bank interest rate decision',
            'PMI': 'Purchasing Managers Index measures economic activity',
            'Unemployment': 'Unemployment rate measures job market health',
            'Retail Sales': 'Retail sales measures consumer spending',
            'Industrial Production': 'Industrial production measures manufacturing output'
        };
        for (const [key, desc] of Object.entries(descriptions)){
            if (eventName.toLowerCase().includes(key.toLowerCase())) {
                return desc;
            }
        }
        return `Economic indicator: ${eventName}`;
    }
    // Save data to CSV
    saveToCSV(data) {
        try {
            this.ensureDataDirectory();
            // Create CSV header
            const csvHeader = 'ID,Time,Currency,Event,Description,Importance,Forecast,Previous,Actual,Timestamp\n';
            // Convert data to CSV rows
            const csvRows = data.map((event)=>{
                const timestamp = new Date().toISOString();
                return [
                    event.id,
                    `"${event.time}"`,
                    `"${event.currency}"`,
                    `"${event.event.replace(/"/g, '""')}"`,
                    `"${event.description.replace(/"/g, '""')}"`,
                    `"${event.importance}"`,
                    `"${event.forecast || ''}"`,
                    `"${event.previous || ''}"`,
                    `"${event.actual || ''}"`,
                    `"${timestamp}"`
                ].join(',');
            }).join('\n');
            const csvContent = csvHeader + csvRows;
            fs.writeFileSync(this.csvFilePath, csvContent, 'utf8');
            console.log(`✅ Economic calendar data saved to ${this.csvFilePath}`);
            return true;
        } catch (error) {
            console.error('❌ Error saving to CSV:', error);
            return false;
        }
    }
    // Load data from CSV
    loadFromCSV() {
        try {
            if (!fs.existsSync(this.csvFilePath)) {
                console.log('📄 No CSV file found, will need to scrape fresh data');
                return null;
            }
            const csvContent = fs.readFileSync(this.csvFilePath, 'utf8');
            const lines = csvContent.split('\n');
            if (lines.length < 2) {
                console.log('📄 CSV file is empty or invalid');
                return null;
            }
            // Skip header and parse data
            const data = [];
            for(let i = 1; i < lines.length; i++){
                const line = lines[i].trim();
                if (!line) continue;
                try {
                    // Parse CSV line (handling quoted fields)
                    const fields = this.parseCSVLine(line);
                    if (fields.length >= 9) {
                        data.push({
                            id: parseInt(fields[0]) || data.length + 1,
                            time: fields[1],
                            currency: fields[2],
                            event: fields[3],
                            description: fields[4],
                            importance: fields[5],
                            forecast: fields[6] || null,
                            previous: fields[7] || null,
                            actual: fields[8] || null
                        });
                    }
                } catch (error) {
                    console.log(`⚠️ Error parsing CSV line ${i}: ${error.message}`);
                }
            }
            if (data.length > 0) {
                console.log(`✅ Loaded ${data.length} events from CSV file`);
                return data;
            } else {
                console.log('📄 No valid data found in CSV file');
                return null;
            }
        } catch (error) {
            console.error('❌ Error loading from CSV:', error);
            return null;
        }
    }
    // Parse CSV line handling quoted fields
    parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        while(i < line.length){
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                fields.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        // Add the last field
        fields.push(current);
        return fields;
    }
    // Check if CSV data is from today (GMT-4 timezone)
    isCSVDataFromToday() {
        try {
            if (!fs.existsSync(this.csvFilePath)) {
                console.log('📄 No CSV file exists');
                return false;
            }
            const stats = fs.statSync(this.csvFilePath);
            const fileModifiedTime = new Date(stats.mtime);
            // Get current time in GMT-4 (EDT/EST)
            const now = new Date();
            const gmt4Offset = -4 * 60; // GMT-4 in minutes
            const currentGMT4 = new Date(now.getTime() + gmt4Offset * 60 * 1000);
            // Get file modified time in GMT-4
            const fileGMT4 = new Date(fileModifiedTime.getTime() + gmt4Offset * 60 * 1000);
            // Check if both dates are on the same day in GMT-4
            const currentDay = currentGMT4.toDateString();
            const fileDay = fileGMT4.toDateString();
            const isSameDay = currentDay === fileDay;
            console.log(`📅 Current GMT-4 day: ${currentDay}`);
            console.log(`📅 CSV file day: ${fileDay}`);
            console.log(`📅 Is same day: ${isSameDay}`);
            return isSameDay;
        } catch (error) {
            console.error('❌ Error checking CSV date:', error);
            return false;
        }
    }
    // Check if it's time to run daily scraper (after GMT-4 day ends)
    shouldRunDailyScraper() {
        try {
            // Get current time in GMT-4
            const now = new Date();
            const gmt4Offset = -4 * 60; // GMT-4 in minutes
            const currentGMT4 = new Date(now.getTime() + gmt4Offset * 60 * 1000);
            // Check if we have data from today
            const hasDataFromToday = this.isCSVDataFromToday();
            // If we don't have data from today, we should scrape
            if (!hasDataFromToday) {
                console.log('🕐 No data from today (GMT-4), should scrape');
                return true;
            }
            // If we have data from today, don't scrape again
            console.log('✅ Already have data from today (GMT-4), no need to scrape');
            return false;
        } catch (error) {
            console.error('❌ Error checking if should run daily scraper:', error);
            return false;
        }
    }
    // Main method to get economic calendar data (CSV first, then scrape daily)
    async getEconomicCalendarData(forceRefresh = false) {
        try {
            console.log('🔍 Checking economic calendar data availability...');
            // If force refresh is requested, scrape new data
            if (forceRefresh) {
                console.log('🔄 Force refresh requested, scraping new data...');
                const scrapedData = await this.scrapeEconomicCalendar();
                if (scrapedData && scrapedData.length > 0) {
                    this.saveToCSV(scrapedData);
                    return {
                        data: scrapedData,
                        source: 'scraped_force',
                        timestamp: new Date().toISOString()
                    };
                }
            }
            // Check if we have data from today (GMT-4)
            if (this.isCSVDataFromToday()) {
                const csvData = this.loadFromCSV();
                if (csvData && csvData.length > 0) {
                    console.log('📊 Using existing CSV data from today (GMT-4)');
                    return {
                        data: csvData,
                        source: 'csv_today',
                        timestamp: new Date().toISOString()
                    };
                }
            }
            // Check if we should run daily scraper
            if (this.shouldRunDailyScraper()) {
                console.log('🕷️ Running daily scraper for new GMT-4 day...');
                const scrapedData = await this.scrapeEconomicCalendar();
                if (scrapedData && scrapedData.length > 0) {
                    // Save to CSV for the rest of the day
                    this.saveToCSV(scrapedData);
                    console.log('✅ Daily scraping completed and saved to CSV');
                    return {
                        data: scrapedData,
                        source: 'scraped_daily',
                        timestamp: new Date().toISOString()
                    };
                } else {
                    console.log('⚠️ Daily scraping failed, trying existing CSV data...');
                }
            }
            // Fallback: try to load any existing CSV data
            const csvData = this.loadFromCSV();
            if (csvData && csvData.length > 0) {
                console.log('📄 Using existing CSV data as fallback');
                return {
                    data: csvData,
                    source: 'csv_fallback',
                    timestamp: new Date().toISOString()
                };
            }
            // No data available
            console.log('❌ No economic calendar data available');
            return {
                data: [],
                source: 'none',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error getting economic calendar data:', error);
            // Try CSV fallback on error
            const csvData = this.loadFromCSV();
            if (csvData && csvData.length > 0) {
                console.log('🔧 Using CSV fallback due to error');
                return {
                    data: csvData,
                    source: 'csv_error_fallback',
                    timestamp: new Date().toISOString()
                };
            }
            return {
                data: [],
                source: 'error',
                timestamp: new Date().toISOString()
            };
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
module.exports = EconomicCalendarScraper;
}}),
"[project]/lib/backgroundScraper.js [app-route] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const EconomicCalendarScraper = __turbopack_context__.r("[project]/lib/economicCalendarScraper.js [app-route] (ecmascript)");
class BackgroundScraper {
    constructor(){
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
                    const highImpact = result.data.filter((e)=>e.importance === 'high').length;
                    const mediumImpact = result.data.filter((e)=>e.importance === 'medium').length;
                    const lowImpact = result.data.filter((e)=>e.importance === 'low').length;
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
        } finally{
            this.isRunning = false;
        }
    }
    // Start periodic scraping
    startPeriodicScraping() {
        console.log('⏰ Starting periodic economic calendar scraping...');
        // Run immediately
        this.runScraper();
        // Then run every 30 minutes
        setInterval(()=>{
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
                this.runScraper().catch((error)=>{
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
}}),
"[project]/app/api/scraper/dashboard-load/route.js [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "GET": (()=>GET),
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(request) {
    try {
        console.log('🏠 Dashboard load scraper triggered');
        // Dynamic import to avoid issues
        const { getBackgroundScraper } = __turbopack_context__.r("[project]/lib/backgroundScraper.js [app-route] (ecmascript)");
        const backgroundScraper = getBackgroundScraper();
        // Run scraper on dashboard load
        const result = await backgroundScraper.runOnDashboardLoad();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
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
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Dashboard load scraper failed',
            details: error.message
        }, {
            status: 500
        });
    }
}
async function GET(request) {
    try {
        // Get scraper status
        const { getBackgroundScraper } = __turbopack_context__.r("[project]/lib/backgroundScraper.js [app-route] (ecmascript)");
        const backgroundScraper = getBackgroundScraper();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            status: backgroundScraper.getStatus()
        });
    } catch (error) {
        console.error('❌ Error getting scraper status:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to get scraper status'
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__ef6e8659._.js.map