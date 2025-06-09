'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Sidebar from '../../components/Sidebar';

function DashboardContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [timeframe, setTimeframe] = useState('7d');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingBalance, setEditingBalance] = useState('');
  const [currentAccountId, setCurrentAccountId] = useState(1);
  const [showCreateStrategyModal, setShowCreateStrategyModal] = useState(false);
  const [showManageAllModal, setShowManageAllModal] = useState(false);
  const [showViewStrategyModal, setShowViewStrategyModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [viewingStrategy, setViewingStrategy] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [strategyForm, setStrategyForm] = useState({
    name: '',
    marketType: [],
    tradingStyle: '',
    description: '',
    entryConditions: '',
    exitConditions: '',
    stopLossLogic: '',
    takeProfitLogic: '',
    riskPerTrade: '',
    maxDailyRisk: '',
    maxOpenTrades: '',
    positionSizing: '',
    indicators: [],
    toolsPatterns: [],
    tags: '',
    status: 'testing',
    version: '1.0'
  });
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Real data states
  const [trades, setTrades] = useState([]);
  const [realStats, setRealStats] = useState({
    dailyProfit: 0,
    monthlyProfit: 0,
    dailyGain: 0,
    totalTrades: 0,
    winRate: 0,
    sharpeRatio: 0,
    profitFactor: 0,
    actualPL: 0,
    wins: 0,
    losses: 0,
    avgWin: 0,
    avgLoss: 0
  });
  const [realAnalytics, setRealAnalytics] = useState({
    performanceMetrics: {
      totalReturn: 0,
      annualizedReturn: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      calmarRatio: 0,
      sqn: 0,
      profitFactor: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      expectancy: 0
    },
    monthlyReturns: [],
    pairAnalysis: [],
    drawdownAnalysis: [],
    correlationMatrix: [],
    strategyPerformance: []
  });
  const [realRiskAnalytics, setRealRiskAnalytics] = useState({
    portfolioRisk: 0,
    maxRiskPerTrade: 0,
    avgRiskPerTrade: 0,
    currentDrawdown: 0,
    maxDrawdown: 0,
    var95: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    correlationRisk: 'Low',
    totalActiveTrades: 0,
    totalRiskAmount: 0,
    riskRewardData: {},
    positionSizes: [],
    drawdownHistory: [],
    hourlyRisk: [],
    weeklyRisk: [],
    volatility: 0,
    returns: [],
    leverageRatio: 1,
    betaToMarket: 0.85
  });

  const watchlist = [
    { pair: 'EUR/USD', price: '1.0842', changePercent: '+0.24%', trend: 'up' },
    { pair: 'GBP/JPY', price: '182.65', changePercent: '+0.56%', trend: 'up' },
    { pair: 'USD/CHF', price: '0.9120', changePercent: '-0.32%', trend: 'down' },
    { pair: 'AUD/USD', price: '0.6724', changePercent: '+0.18%', trend: 'up' }
  ];



  const chartData = {
    candlestick: [
      { time: '9:00', open: 1.0845, close: 1.0852, high: 1.0858, low: 1.0843, volume: 256 },
      { time: '10:00', open: 1.0852, close: 1.0848, high: 1.0855, low: 1.0845, volume: 178 },
      { time: '11:00', open: 1.0848, close: 1.0860, high: 1.0865, low: 1.0847, volume: 321 },
      { time: '12:00', open: 1.0860, close: 1.0855, high: 1.0862, low: 1.0851, volume: 142 },
      { time: '13:00', open: 1.0855, close: 1.0861, high: 1.0868, low: 1.0854, volume: 187 }
    ],
    heatmap: [
      { pair: 'EUR/USD vs GBP/USD', correlation: 0.75 },
      { pair: 'USD/JPY vs USD/CHF', correlation: 0.68 },
      { pair: 'AUD/USD vs NZD/USD', correlation: 0.82 },
      { pair: 'EUR/USD vs USD/CHF', correlation: -0.62 }
    ]
  };

  const sessionData = {
    asian: { trades: 18, profit: 820.40, winRate: 66.7, volume: 'Low' },
    european: { trades: 48, profit: 2450.30, winRate: 75.0, volume: 'High' },
    american: { trades: 35, profit: 1780.50, winRate: 71.4, volume: 'Medium' }
  };

  const psychologyData = {
    confidenceLevel: 7,
    disciplineScore: 8,
    stressLevel: 4,
    emotionalState: 'Balanced',
    fearIndex: 3,
    greedIndex: 4,
    fomo: 2,
    impulsiveActions: 2
  };

  const positionData = [
    { pair: 'EUR/USD', weight: 40, position: 12000, risk: 1.2, pnl: 325.40 },
    { pair: 'GBP/JPY', weight: 25, position: 7500, risk: 1.0, pnl: 180.20 },
    { pair: 'USD/CHF', weight: 20, position: 6000, risk: 0.8, pnl: -42.30 },
    { pair: 'AUD/USD', weight: 15, position: 4500, risk: 0.5, pnl: 95.60 }
  ];

  // Forex News Mock Data
  const forexNews = [
    {
      id: 1,
      title: "Federal Reserve Signals Potential Rate Cut in December Meeting",
      summary: "Fed officials hint at a 25 basis point reduction following inflation data showing continued cooling trends.",
      content: "The Federal Reserve is increasingly signaling a potential interest rate cut at their December meeting, with several officials citing recent inflation data that shows a continued cooling trend. This development has significant implications for USD strength and global forex markets.",
      source: "Reuters",
      author: "Sarah Johnson",
      publishedAt: "2024-01-15T14:30:00Z",
      category: "Central Banks",
      impact: "high",
      currencies: ["USD", "EUR", "GBP"],
      imageUrl: "/api/placeholder/400/200",
      tags: ["Federal Reserve", "Interest Rates", "USD", "Monetary Policy"]
    },
    {
      id: 2,
      title: "ECB President Lagarde Emphasizes Gradual Approach to Policy Normalization",
      summary: "European Central Bank maintains cautious stance on monetary policy amid mixed economic signals from eurozone.",
      content: "ECB President Christine Lagarde emphasized the central bank's commitment to a gradual approach in policy normalization during her speech at the European Banking Congress. The eurozone continues to show mixed economic signals.",
      source: "Bloomberg",
      author: "Michael Chen",
      publishedAt: "2024-01-15T12:15:00Z",
      category: "Central Banks",
      impact: "medium",
      currencies: ["EUR", "USD"],
      imageUrl: "/api/placeholder/400/200",
      tags: ["ECB", "Christine Lagarde", "EUR", "Monetary Policy"]
    },
    {
      id: 3,
      title: "Bank of Japan Maintains Ultra-Loose Monetary Policy Stance",
      summary: "BoJ keeps interest rates unchanged at -0.1% while monitoring global economic developments and inflation trends.",
      content: "The Bank of Japan has decided to maintain its ultra-loose monetary policy stance, keeping the short-term interest rate at -0.1%. Governor Ueda cited the need to monitor global economic developments and domestic inflation trends.",
      source: "Financial Times",
      author: "Yuki Tanaka",
      publishedAt: "2024-01-15T09:45:00Z",
      category: "Central Banks",
      impact: "medium",
      currencies: ["JPY", "USD"],
      imageUrl: "/api/placeholder/400/200",
      tags: ["Bank of Japan", "JPY", "Interest Rates", "Monetary Policy"]
    },
    {
      id: 4,
      title: "UK Inflation Data Shows Unexpected Rise, Pound Strengthens",
      summary: "British inflation climbs to 4.2% in December, exceeding forecasts and boosting GBP across major pairs.",
      content: "UK inflation data for December showed an unexpected rise to 4.2%, significantly exceeding economist forecasts of 3.8%. The surprise increase has led to immediate strengthening of the British Pound across major currency pairs.",
      source: "MarketWatch",
      author: "Emma Thompson",
      publishedAt: "2024-01-15T08:30:00Z",
      category: "Economic Data",
      impact: "high",
      currencies: ["GBP", "USD", "EUR"],
      imageUrl: "/api/placeholder/400/200",
      tags: ["UK Inflation", "GBP", "Economic Data", "CPI"]
    },
    {
      id: 5,
      title: "Chinese Yuan Weakens as Manufacturing Data Disappoints",
      summary: "China's manufacturing PMI falls below expectations, raising concerns about economic recovery pace.",
      content: "The Chinese Yuan weakened against major currencies following disappointing manufacturing PMI data that fell below market expectations. The data raises fresh concerns about the pace of China's economic recovery.",
      source: "CNBC",
      author: "Li Wei",
      publishedAt: "2024-01-15T06:00:00Z",
      category: "Economic Data",
      impact: "medium",
      currencies: ["CNY", "USD", "AUD"],
      imageUrl: "/api/placeholder/400/200",
      tags: ["China", "CNY", "Manufacturing", "PMI"]
    },
    {
      id: 6,
      title: "Oil Prices Surge on Middle East Tensions, CAD Benefits",
      summary: "Crude oil prices jump 3% on geopolitical concerns, providing support for commodity-linked currencies.",
      content: "Oil prices surged over 3% in early trading following escalating tensions in the Middle East. The rally in crude oil prices is providing significant support for commodity-linked currencies, particularly the Canadian Dollar.",
      source: "Wall Street Journal",
      author: "Robert Martinez",
      publishedAt: "2024-01-14T22:15:00Z",
      category: "Commodities",
      impact: "medium",
      currencies: ["CAD", "USD", "NOK"],
      imageUrl: "/api/placeholder/400/200",
      tags: ["Oil Prices", "CAD", "Commodities", "Geopolitics"]
    }
  ];

  // Economic Calendar State
  const [economicEvents, setEconomicEvents] = useState([]);
  const [economicCalendarLoading, setEconomicCalendarLoading] = useState(true);
  const [economicCalendarMetadata, setEconomicCalendarMetadata] = useState(null);
  const [economicCalendarFilter, setEconomicCalendarFilter] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [selectedTimezone, setSelectedTimezone] = useState('GMT-4'); // Default to source timezone
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // SVG Flag Components
  const FlagSVG = ({ country, className = "w-6 h-4" }) => {
    const flags = {
      'US': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#B22234"/>
          <rect y="1" width="24" height="1" fill="white"/>
          <rect y="3" width="24" height="1" fill="white"/>
          <rect y="5" width="24" height="1" fill="white"/>
          <rect y="7" width="24" height="1" fill="white"/>
          <rect y="9" width="24" height="1" fill="white"/>
          <rect y="11" width="24" height="1" fill="white"/>
          <rect y="13" width="24" height="1" fill="white"/>
          <rect width="10" height="8" fill="#3C3B6E"/>
        </svg>
      ),
      'GB': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#012169"/>
          <path d="M0 0L24 16M24 0L0 16" stroke="white" strokeWidth="1.5"/>
          <path d="M12 0V16M0 8H24" stroke="white" strokeWidth="2.5"/>
          <path d="M12 0V16M0 8H24" stroke="#C8102E" strokeWidth="1.5"/>
          <path d="M0 0L24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1"/>
        </svg>
      ),
      'DE': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#000"/>
          <rect y="5.33" width="24" height="5.33" fill="#DD0000"/>
          <rect y="10.67" width="24" height="5.33" fill="#FFCE00"/>
        </svg>
      ),
      'SG': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="8" fill="#ED2939"/>
          <rect y="8" width="24" height="8" fill="white"/>
          <circle cx="6" cy="4" r="2.5" fill="white"/>
          <circle cx="7" cy="4" r="2" fill="#ED2939"/>
        </svg>
      ),
      'HK': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#DE2910"/>
          <g transform="translate(12,8)">
            <path d="M0,-3L1,0L-2,-1L2,-1L-1,0Z" fill="white"/>
          </g>
        </svg>
      ),
      'JP': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="white"/>
          <circle cx="12" cy="8" r="4.8" fill="#BC002D"/>
        </svg>
      ),
      'AU': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#012169"/>
          <rect width="12" height="8" fill="#012169"/>
          <path d="M0 0L12 8M12 0L0 8" stroke="white" strokeWidth="1"/>
          <path d="M6 0V8M0 4H12" stroke="white" strokeWidth="1.5"/>
          <path d="M6 0V8M0 4H12" stroke="#C8102E" strokeWidth="1"/>
          <circle cx="18" cy="4" r="1" fill="white"/>
          <circle cx="20" cy="6" r="1" fill="white"/>
          <circle cx="18" cy="12" r="1" fill="white"/>
          <circle cx="16" cy="10" r="1" fill="white"/>
          <circle cx="20" cy="10" r="1" fill="white"/>
        </svg>
      ),
      'FI': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="white"/>
          <rect x="6" width="3" height="16" fill="#003580"/>
          <rect y="6.5" width="24" height="3" fill="#003580"/>
        </svg>
      ),
      'FR': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#002395"/>
          <rect x="8" width="8" height="16" fill="white"/>
          <rect x="16" width="8" height="16" fill="#ED2939"/>
        </svg>
      ),
      'CH': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#FF0000"/>
          <rect x="10" y="4" width="4" height="8" fill="white"/>
          <rect x="6" y="6" width="12" height="4" fill="white"/>
        </svg>
      ),
      'CA': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#FF0000"/>
          <rect x="8" width="8" height="16" fill="white"/>
          <rect x="16" width="8" height="16" fill="#FF0000"/>
          <path d="M12 4L13 7L16 6L14 9L16 10L12 12L8 10L10 9L8 6L11 7Z" fill="#FF0000"/>
        </svg>
      ),
      'CN': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#DE2910"/>
          <g fill="#FFDE00">
            <path d="M4 3L5 5L3 6L2 4L4 3Z"/>
            <circle cx="8" cy="2" r="0.5"/>
            <circle cx="9" cy="4" r="0.5"/>
            <circle cx="8" cy="6" r="0.5"/>
            <circle cx="6" cy="5" r="0.5"/>
          </g>
        </svg>
      ),
      'IN': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#FF9933"/>
          <rect y="5.33" width="24" height="5.33" fill="white"/>
          <rect y="10.67" width="24" height="5.33" fill="#138808"/>
          <circle cx="12" cy="8" r="2" fill="none" stroke="#000080" strokeWidth="0.5"/>
        </svg>
      ),
      'KR': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="white"/>
          <circle cx="12" cy="8" r="3" fill="none" stroke="#CD2E3A" strokeWidth="1"/>
          <path d="M12 5A3 3 0 0 1 12 11A1.5 1.5 0 0 0 12 8A1.5 1.5 0 0 1 12 5Z" fill="#0047A0"/>
        </svg>
      ),
      'RU': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="white"/>
          <rect y="5.33" width="24" height="5.33" fill="#0039A6"/>
          <rect y="10.67" width="24" height="5.33" fill="#D52B1E"/>
        </svg>
      ),
      'BR': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#009739"/>
          <path d="M12 2L22 8L12 14L2 8Z" fill="#FEDD00"/>
          <circle cx="12" cy="8" r="3" fill="#002776"/>
        </svg>
      ),
      'ZA': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#007749"/>
          <path d="M0 0L8 8L0 16V0Z" fill="#000"/>
          <path d="M0 2L6 8L0 14V2Z" fill="#FFB612"/>
          <rect y="0" x="8" width="16" height="5.33" fill="#DE3831"/>
          <rect y="5.33" x="8" width="16" height="5.33" fill="white"/>
          <rect y="10.67" x="8" width="16" height="5.33" fill="#002395"/>
        </svg>
      ),
      'MX': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#006847"/>
          <rect x="8" width="8" height="16" fill="white"/>
          <rect x="16" width="8" height="16" fill="#CE1126"/>
        </svg>
      ),
      'NZ': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#012169"/>
          <rect width="12" height="8" fill="#012169"/>
          <path d="M0 0L12 8M12 0L0 8" stroke="white" strokeWidth="1"/>
          <path d="M6 0V8M0 4H12" stroke="white" strokeWidth="1.5"/>
          <path d="M6 0V8M0 4H12" stroke="#C8102E" strokeWidth="1"/>
          <g fill="white">
            <circle cx="18" cy="4" r="0.8"/>
            <circle cx="20" cy="6" r="0.8"/>
            <circle cx="18" cy="10" r="0.8"/>
            <circle cx="16" cy="12" r="0.8"/>
          </g>
        </svg>
      ),
      'AE': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#00732F"/>
          <rect y="5.33" width="24" height="5.33" fill="white"/>
          <rect y="10.67" width="24" height="5.33" fill="#000"/>
          <rect width="8" height="16" fill="#FF0000"/>
        </svg>
      ),
      'TH': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="2.67" fill="#ED1C24"/>
          <rect y="2.67" width="24" height="2.67" fill="white"/>
          <rect y="5.33" width="24" height="5.33" fill="#241D4F"/>
          <rect y="10.67" width="24" height="2.67" fill="white"/>
          <rect y="13.33" width="24" height="2.67" fill="#ED1C24"/>
        </svg>
      ),
      'VN': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#DA020E"/>
          <g transform="translate(12,8)" fill="#FFFF00">
            <path d="M0,-4L1.2,-1.2L4,-1.2L1.6,0.8L2.4,3.6L0,2L-2.4,3.6L-1.6,0.8L-4,-1.2L-1.2,-1.2Z"/>
          </g>
        </svg>
      ),
      'BD': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#006A4E"/>
          <circle cx="10" cy="8" r="4" fill="#F42A41"/>
        </svg>
      ),
      'PK': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="6" height="16" fill="white"/>
          <rect x="6" width="18" height="16" fill="#01411C"/>
          <g transform="translate(15,8)" fill="white">
            <circle r="3" fill="none" stroke="white" strokeWidth="0.5"/>
            <path d="M2,0L0.6,0.6L1.2,2L0,1.2L-1.2,2L-0.6,0.6L-2,0L-0.6,-0.6L-1.2,-2L0,-1.2L1.2,-2L0.6,-0.6Z"/>
          </g>
        </svg>
      ),
      'IR': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#239F40"/>
          <rect y="5.33" width="24" height="5.33" fill="white"/>
          <rect y="10.67" width="24" height="5.33" fill="#DA0000"/>
          <g transform="translate(12,8)" fill="#DA0000">
            <circle r="2" fill="none" stroke="#DA0000" strokeWidth="0.5"/>
          </g>
        </svg>
      ),
      'SA': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#006C35"/>
          <g transform="translate(12,8)" fill="white">
            <text fontSize="6" textAnchor="middle" dy="2">لا إله إلا الله</text>
          </g>
        </svg>
      ),
      'TR': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#E30A17"/>
          <g transform="translate(10,8)" fill="white">
            <circle r="3" fill="none" stroke="white" strokeWidth="0.8"/>
            <circle cx="1.5" cy="0" r="2.4" fill="#E30A17"/>
            <path d="M3,0L3.8,0.6L3.2,1.4L4,1L4.8,1.4L4.2,0.6L5,0L4.2,-0.6L4.8,-1.4L4,-1L3.2,-1.4L3.8,-0.6Z"/>
          </g>
        </svg>
      ),
      'EG': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#CE1126"/>
          <rect y="5.33" width="24" height="5.33" fill="white"/>
          <rect y="10.67" width="24" height="5.33" fill="#000"/>
          <g transform="translate(12,8)" fill="#FFC72C">
            <circle r="2" fill="#FFC72C"/>
          </g>
        </svg>
      ),
      'NG': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#008751"/>
          <rect x="8" width="8" height="16" fill="white"/>
          <rect x="16" width="8" height="16" fill="#008751"/>
        </svg>
      ),
      'IT': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#009246"/>
          <rect x="8" width="8" height="16" fill="white"/>
          <rect x="16" width="8" height="16" fill="#CE2B37"/>
        </svg>
      ),
      'ES': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="4" fill="#AA151B"/>
          <rect y="4" width="24" height="8" fill="#F1BF00"/>
          <rect y="12" width="24" height="4" fill="#AA151B"/>
        </svg>
      ),
      'NL': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#21468B"/>
          <rect y="5.33" width="24" height="5.33" fill="white"/>
          <rect y="10.67" width="24" height="5.33" fill="#AE1C28"/>
        </svg>
      ),
      'BE': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#000"/>
          <rect x="8" width="8" height="16" fill="#FAE042"/>
          <rect x="16" width="8" height="16" fill="#ED2939"/>
        </svg>
      ),
      'AT': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#ED2939"/>
          <rect y="5.33" width="24" height="5.33" fill="white"/>
          <rect y="10.67" width="24" height="5.33" fill="#ED2939"/>
        </svg>
      ),
      'GR': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#0D5EAF"/>
          <rect y="0" width="24" height="1.78" fill="white"/>
          <rect y="3.56" width="24" height="1.78" fill="white"/>
          <rect y="7.11" width="24" height="1.78" fill="white"/>
          <rect y="10.67" width="24" height="1.78" fill="white"/>
          <rect y="14.22" width="24" height="1.78" fill="white"/>
          <rect width="9.6" height="8.89" fill="#0D5EAF"/>
          <rect x="4.8" y="0" width="1.6" height="8.89" fill="white"/>
          <rect y="3.56" width="9.6" height="1.78" fill="white"/>
        </svg>
      ),
      'PL': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="8" fill="white"/>
          <rect y="8" width="24" height="8" fill="#DC143C"/>
        </svg>
      ),
      'SE': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#006AA7"/>
          <rect x="6" width="3" height="16" fill="#FECC00"/>
          <rect y="6.5" width="24" height="3" fill="#FECC00"/>
        </svg>
      ),
      'NO': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#EF2B2D"/>
          <rect x="6" width="2" height="16" fill="white"/>
          <rect y="6" width="24" height="4" fill="white"/>
          <rect x="6" width="2" height="16" fill="#002868"/>
          <rect y="7" width="24" height="2" fill="#002868"/>
        </svg>
      ),
      'DK': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#C60C30"/>
          <rect x="6" width="3" height="16" fill="white"/>
          <rect y="6.5" width="24" height="3" fill="white"/>
        </svg>
      ),
      'AR': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#74ACDF"/>
          <rect y="5.33" width="24" height="5.33" fill="white"/>
          <rect y="10.67" width="24" height="5.33" fill="#74ACDF"/>
          <g transform="translate(12,8)" fill="#F6B40E">
            <circle r="2" fill="none" stroke="#F6B40E" strokeWidth="0.5"/>
          </g>
        </svg>
      ),
      'CL': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="8" fill="white"/>
          <rect y="8" width="24" height="8" fill="#D52B1E"/>
          <rect width="8" height="8" fill="#0039A6"/>
          <g transform="translate(4,4)" fill="white">
            <path d="M0,-2L0.6,-0.6L2,0L0.6,0.6L0,2L-0.6,0.6L-2,0L-0.6,-0.6Z"/>
          </g>
        </svg>
      ),
      'CO': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="8" fill="#FDE047"/>
          <rect y="8" width="24" height="4" fill="#003893"/>
          <rect y="12" width="24" height="4" fill="#CE1126"/>
        </svg>
      ),
      'PE': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#D91023"/>
          <rect x="8" width="8" height="16" fill="white"/>
          <rect x="16" width="8" height="16" fill="#D91023"/>
        </svg>
      ),
      'VE': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#FFCC00"/>
          <rect y="5.33" width="24" height="5.33" fill="#00247D"/>
          <rect y="10.67" width="24" height="5.33" fill="#CF142B"/>
        </svg>
      ),
      'MY': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#CC0001"/>
          <rect y="1.14" width="24" height="1.14" fill="white"/>
          <rect y="3.43" width="24" height="1.14" fill="white"/>
          <rect y="5.71" width="24" height="1.14" fill="white"/>
          <rect y="8" width="24" height="1.14" fill="white"/>
          <rect y="10.29" width="24" height="1.14" fill="white"/>
          <rect y="12.57" width="24" height="1.14" fill="white"/>
          <rect y="14.86" width="24" height="1.14" fill="white"/>
          <rect width="12" height="8" fill="#010066"/>
          <g transform="translate(6,4)" fill="#FFCC00">
            <circle r="2" fill="none" stroke="#FFCC00" strokeWidth="0.5"/>
            <path d="M2,0L2.4,0.4L2.8,0L2.4,-0.4Z"/>
          </g>
        </svg>
      ),
      'PH': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="12" height="8" fill="#0038A8"/>
          <rect y="8" width="12" height="8" fill="#CE1126"/>
          <path d="M0 0L12 8L0 16Z" fill="white"/>
          <g transform="translate(4,8)" fill="#FCD116">
            <circle r="1.5" fill="none" stroke="#FCD116" strokeWidth="0.3"/>
          </g>
        </svg>
      ),
      'ID': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="8" fill="#FF0000"/>
          <rect y="8" width="24" height="8" fill="white"/>
        </svg>
      ),
      'MM': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="5.33" fill="#FECB00"/>
          <rect y="5.33" width="24" height="5.33" fill="#34B233"/>
          <rect y="10.67" width="24" height="5.33" fill="#EA2839"/>
          <g transform="translate(12,8)" fill="white">
            <path d="M0,-2L0.6,-0.6L2,0L0.6,0.6L0,2L-0.6,0.6L-2,0L-0.6,-0.6Z"/>
          </g>
        </svg>
      ),
      'NP': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="24" height="16" fill="#003893"/>
          <path d="M0 0L12 0L6 8L12 16L0 16L8 8Z" fill="#DC143C"/>
          <g transform="translate(6,4)" fill="white">
            <circle r="1" fill="white"/>
          </g>
          <g transform="translate(6,12)" fill="white">
            <path d="M0,-1L0.3,-0.3L1,0L0.3,0.3L0,1L-0.3,0.3L-1,0L-0.3,-0.3Z"/>
          </g>
        </svg>
      ),
      'AF': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <rect width="8" height="16" fill="#000"/>
          <rect x="8" width="8" height="16" fill="#D32011"/>
          <rect x="16" width="8" height="16" fill="#007A36"/>
        </svg>
      ),
      'SB': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <path d="M0 0L24 16L0 16Z" fill="#0F47AF"/>
          <path d="M0 0L24 0L24 16Z" fill="#215B33"/>
          <rect y="7" width="24" height="2" fill="#FED100"/>
        </svg>
      ),
      'PG': (
        <svg className={className} viewBox="0 0 24 16" fill="none">
          <path d="M0 0L24 16L0 16Z" fill="#000"/>
          <path d="M0 0L24 0L24 16Z" fill="#CE1126"/>
          <g transform="translate(6,4)" fill="#FCD116">
            <path d="M0,-2L0.6,-0.6L2,0L0.6,0.6L0,2L-0.6,0.6L-2,0L-0.6,-0.6Z"/>
          </g>
        </svg>
      )
    };

    return flags[country] || (
      <div className={`${className} bg-gray-200 rounded flex items-center justify-center text-xs`}>
        {country}
      </div>
    );
  };

  // Comprehensive Trading Timezones Data
  const tradingTimezones = [
    // Major Trading Centers
    {
      id: 'GMT-4',
      name: 'Eastern Time',
      abbreviation: 'EDT/EST',
      offset: -4,
      city: 'New York',
      country: 'United States',
      countryCode: 'US',
      isDST: true,
      isPopular: true,
      description: 'Primary US trading session'
    },
    {
      id: 'GMT+0',
      name: 'Greenwich Mean Time',
      abbreviation: 'GMT',
      offset: 0,
      city: 'London',
      country: 'United Kingdom',
      countryCode: 'GB',
      isDST: false,
      isPopular: true,
      description: 'European trading session'
    },
    {
      id: 'GMT+9',
      name: 'Japan Standard Time',
      abbreviation: 'JST',
      offset: 9,
      city: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      isDST: false,
      isPopular: true,
      description: 'Asian trading session'
    },
    {
      id: 'GMT+8',
      name: 'Singapore Time',
      abbreviation: 'SGT',
      offset: 8,
      city: 'Singapore',
      country: 'Singapore',
      countryCode: 'SG',
      isDST: false,
      isPopular: true,
      description: 'Asian financial hub'
    },
    {
      id: 'GMT+8-HK',
      name: 'Hong Kong Time',
      abbreviation: 'HKT',
      offset: 8,
      city: 'Hong Kong',
      country: 'Hong Kong',
      countryCode: 'HK',
      isDST: false,
      isPopular: true,
      description: 'Asian financial center'
    },
    {
      id: 'GMT+10',
      name: 'Australian Eastern Time',
      abbreviation: 'AEST/AEDT',
      offset: 10,
      city: 'Sydney',
      country: 'Australia',
      countryCode: 'AU',
      isDST: true,
      isPopular: true,
      description: 'Pacific trading session'
    },

    // European Centers
    {
      id: 'GMT+1',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Frankfurt',
      country: 'Germany',
      countryCode: 'DE',
      isDST: true,
      isPopular: true,
      description: 'European financial center'
    },
    {
      id: 'GMT+1-FR',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Paris',
      country: 'France',
      countryCode: 'FR',
      isDST: true,
      isPopular: false,
      description: 'European trading hub'
    },
    {
      id: 'GMT+1-CH',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Zurich',
      country: 'Switzerland',
      countryCode: 'CH',
      isDST: true,
      isPopular: false,
      description: 'Swiss financial center'
    },
    {
      id: 'GMT+2',
      name: 'Eastern European Time',
      abbreviation: 'EET/EEST',
      offset: 2,
      city: 'Helsinki',
      country: 'Finland',
      countryCode: 'FI',
      isDST: true,
      isPopular: false,
      description: 'Northern European time'
    },

    // American Centers
    {
      id: 'GMT-8',
      name: 'Pacific Time',
      abbreviation: 'PDT/PST',
      offset: -8,
      city: 'Los Angeles',
      country: 'United States',
      countryCode: 'US',
      isDST: true,
      isPopular: true,
      description: 'US West Coast'
    },
    {
      id: 'GMT-5',
      name: 'Central Time',
      abbreviation: 'CDT/CST',
      offset: -5,
      city: 'Chicago',
      country: 'United States',
      countryCode: 'US',
      isDST: true,
      isPopular: false,
      description: 'US Central time'
    },
    {
      id: 'GMT-5-CA',
      name: 'Eastern Time',
      abbreviation: 'EDT/EST',
      offset: -5,
      city: 'Toronto',
      country: 'Canada',
      countryCode: 'CA',
      isDST: true,
      isPopular: false,
      description: 'Canadian financial center'
    },

    // Asian Centers
    {
      id: 'GMT+8-CN',
      name: 'China Standard Time',
      abbreviation: 'CST',
      offset: 8,
      city: 'Shanghai',
      country: 'China',
      countryCode: 'CN',
      isDST: false,
      isPopular: true,
      description: 'Chinese financial hub'
    },
    {
      id: 'GMT+5:30',
      name: 'India Standard Time',
      abbreviation: 'IST',
      offset: 5.5,
      city: 'Mumbai',
      country: 'India',
      countryCode: 'IN',
      isDST: false,
      isPopular: false,
      description: 'Indian financial center'
    },
    {
      id: 'GMT+9-KR',
      name: 'Korea Standard Time',
      abbreviation: 'KST',
      offset: 9,
      city: 'Seoul',
      country: 'South Korea',
      countryCode: 'KR',
      isDST: false,
      isPopular: false,
      description: 'Korean financial center'
    },

    // Other Important Centers
    {
      id: 'GMT+3',
      name: 'Moscow Time',
      abbreviation: 'MSK',
      offset: 3,
      city: 'Moscow',
      country: 'Russia',
      countryCode: 'RU',
      isDST: false,
      isPopular: false,
      description: 'Russian financial center'
    },
    {
      id: 'GMT+3-SA',
      name: 'Arabia Standard Time',
      abbreviation: 'AST',
      offset: 3,
      city: 'Riyadh',
      country: 'Saudi Arabia',
      countryCode: 'SA',
      isDST: false,
      isPopular: false,
      description: 'Arabian Peninsula time'
    },
    {
      id: 'GMT-3',
      name: 'Brasília Time',
      abbreviation: 'BRT',
      offset: -3,
      city: 'São Paulo',
      country: 'Brazil',
      countryCode: 'BR',
      isDST: false,
      isPopular: false,
      description: 'South American hub'
    },
    {
      id: 'GMT+2-ZA',
      name: 'South Africa Time',
      abbreviation: 'SAST',
      offset: 2,
      city: 'Johannesburg',
      country: 'South Africa',
      countryCode: 'ZA',
      isDST: false,
      isPopular: false,
      description: 'African financial center'
    },
    {
      id: 'GMT-6',
      name: 'Central Time',
      abbreviation: 'CST/CDT',
      offset: -6,
      city: 'Mexico City',
      country: 'Mexico',
      countryCode: 'MX',
      isDST: true,
      isPopular: false,
      description: 'Mexican financial center'
    },
    {
      id: 'GMT+12',
      name: 'New Zealand Time',
      abbreviation: 'NZST/NZDT',
      offset: 12,
      city: 'Auckland',
      country: 'New Zealand',
      countryCode: 'NZ',
      isDST: true,
      isPopular: false,
      description: 'Pacific trading time'
    },

    // Additional Major Financial Centers
    {
      id: 'GMT+4',
      name: 'Gulf Standard Time',
      abbreviation: 'GST',
      offset: 4,
      city: 'Dubai',
      country: 'United Arab Emirates',
      countryCode: 'AE',
      isDST: false,
      isPopular: true,
      description: 'Middle East financial hub'
    },
    {
      id: 'GMT+7',
      name: 'Indochina Time',
      abbreviation: 'ICT',
      offset: 7,
      city: 'Bangkok',
      country: 'Thailand',
      countryCode: 'TH',
      isDST: false,
      isPopular: false,
      description: 'Southeast Asian center'
    },
    {
      id: 'GMT+7-VN',
      name: 'Indochina Time',
      abbreviation: 'ICT',
      offset: 7,
      city: 'Ho Chi Minh City',
      country: 'Vietnam',
      countryCode: 'VN',
      isDST: false,
      isPopular: false,
      description: 'Vietnamese financial center'
    },
    {
      id: 'GMT+6',
      name: 'Bangladesh Time',
      abbreviation: 'BST',
      offset: 6,
      city: 'Dhaka',
      country: 'Bangladesh',
      countryCode: 'BD',
      isDST: false,
      isPopular: false,
      description: 'South Asian time'
    },
    {
      id: 'GMT+5',
      name: 'Pakistan Time',
      abbreviation: 'PKT',
      offset: 5,
      city: 'Karachi',
      country: 'Pakistan',
      countryCode: 'PK',
      isDST: false,
      isPopular: false,
      description: 'Pakistani financial center'
    },
    {
      id: 'GMT+3:30',
      name: 'Iran Time',
      abbreviation: 'IRST',
      offset: 3.5,
      city: 'Tehran',
      country: 'Iran',
      countryCode: 'IR',
      isDST: false,
      isPopular: false,
      description: 'Iranian standard time'
    },
    {
      id: 'GMT+3-SA',
      name: 'Arabia Standard Time',
      abbreviation: 'AST',
      offset: 3,
      city: 'Riyadh',
      country: 'Saudi Arabia',
      countryCode: 'SA',
      isDST: false,
      isPopular: false,
      description: 'Arabian Peninsula time'
    },
    {
      id: 'GMT+3-TR',
      name: 'Turkey Time',
      abbreviation: 'TRT',
      offset: 3,
      city: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
      isDST: false,
      isPopular: true,
      description: 'Turkish financial center'
    },
    {
      id: 'GMT+2-EG',
      name: 'Egypt Time',
      abbreviation: 'EET',
      offset: 2,
      city: 'Cairo',
      country: 'Egypt',
      countryCode: 'EG',
      isDST: false,
      isPopular: false,
      description: 'North African time'
    },
    {
      id: 'GMT+1-NG',
      name: 'West Africa Time',
      abbreviation: 'WAT',
      offset: 1,
      city: 'Lagos',
      country: 'Nigeria',
      countryCode: 'NG',
      isDST: false,
      isPopular: false,
      description: 'West African financial hub'
    },
    {
      id: 'GMT+1-IT',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Milan',
      country: 'Italy',
      countryCode: 'IT',
      isDST: true,
      isPopular: false,
      description: 'Italian financial center'
    },
    {
      id: 'GMT+1-ES',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Madrid',
      country: 'Spain',
      countryCode: 'ES',
      isDST: true,
      isPopular: false,
      description: 'Spanish financial center'
    },
    {
      id: 'GMT+1-NL',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Amsterdam',
      country: 'Netherlands',
      countryCode: 'NL',
      isDST: true,
      isPopular: false,
      description: 'Dutch financial center'
    },
    {
      id: 'GMT+1-BE',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Brussels',
      country: 'Belgium',
      countryCode: 'BE',
      isDST: true,
      isPopular: false,
      description: 'European Union center'
    },
    {
      id: 'GMT+1-AT',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Vienna',
      country: 'Austria',
      countryCode: 'AT',
      isDST: true,
      isPopular: false,
      description: 'Austrian financial center'
    },
    {
      id: 'GMT+2-GR',
      name: 'Eastern European Time',
      abbreviation: 'EET/EEST',
      offset: 2,
      city: 'Athens',
      country: 'Greece',
      countryCode: 'GR',
      isDST: true,
      isPopular: false,
      description: 'Greek financial center'
    },
    {
      id: 'GMT+2-PL',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Warsaw',
      country: 'Poland',
      countryCode: 'PL',
      isDST: true,
      isPopular: false,
      description: 'Polish financial center'
    },
    {
      id: 'GMT+1-SE',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Stockholm',
      country: 'Sweden',
      countryCode: 'SE',
      isDST: true,
      isPopular: false,
      description: 'Swedish financial center'
    },
    {
      id: 'GMT+1-NO',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Oslo',
      country: 'Norway',
      countryCode: 'NO',
      isDST: true,
      isPopular: false,
      description: 'Norwegian financial center'
    },
    {
      id: 'GMT+1-DK',
      name: 'Central European Time',
      abbreviation: 'CET/CEST',
      offset: 1,
      city: 'Copenhagen',
      country: 'Denmark',
      countryCode: 'DK',
      isDST: true,
      isPopular: false,
      description: 'Danish financial center'
    },

    // Americas
    {
      id: 'GMT-3-AR',
      name: 'Argentina Time',
      abbreviation: 'ART',
      offset: -3,
      city: 'Buenos Aires',
      country: 'Argentina',
      countryCode: 'AR',
      isDST: false,
      isPopular: false,
      description: 'Argentine financial center'
    },
    {
      id: 'GMT-3-CL',
      name: 'Chile Time',
      abbreviation: 'CLT/CLST',
      offset: -3,
      city: 'Santiago',
      country: 'Chile',
      countryCode: 'CL',
      isDST: true,
      isPopular: false,
      description: 'Chilean financial center'
    },
    {
      id: 'GMT-5-CO',
      name: 'Colombia Time',
      abbreviation: 'COT',
      offset: -5,
      city: 'Bogotá',
      country: 'Colombia',
      countryCode: 'CO',
      isDST: false,
      isPopular: false,
      description: 'Colombian financial center'
    },
    {
      id: 'GMT-5-PE',
      name: 'Peru Time',
      abbreviation: 'PET',
      offset: -5,
      city: 'Lima',
      country: 'Peru',
      countryCode: 'PE',
      isDST: false,
      isPopular: false,
      description: 'Peruvian financial center'
    },
    {
      id: 'GMT-4-VE',
      name: 'Venezuela Time',
      abbreviation: 'VET',
      offset: -4,
      city: 'Caracas',
      country: 'Venezuela',
      countryCode: 'VE',
      isDST: false,
      isPopular: false,
      description: 'Venezuelan time'
    },
    {
      id: 'GMT-7',
      name: 'Mountain Time',
      abbreviation: 'MDT/MST',
      offset: -7,
      city: 'Denver',
      country: 'United States',
      countryCode: 'US',
      isDST: true,
      isPopular: false,
      description: 'US Mountain time'
    },
    {
      id: 'GMT-6-CA',
      name: 'Central Time',
      abbreviation: 'CDT/CST',
      offset: -6,
      city: 'Winnipeg',
      country: 'Canada',
      countryCode: 'CA',
      isDST: true,
      isPopular: false,
      description: 'Canadian Central time'
    },
    {
      id: 'GMT-8-CA',
      name: 'Pacific Time',
      abbreviation: 'PDT/PST',
      offset: -8,
      city: 'Vancouver',
      country: 'Canada',
      countryCode: 'CA',
      isDST: true,
      isPopular: false,
      description: 'Canadian Pacific time'
    },

    // Asia-Pacific
    {
      id: 'GMT+9:30',
      name: 'Australian Central Time',
      abbreviation: 'ACST/ACDT',
      offset: 9.5,
      city: 'Adelaide',
      country: 'Australia',
      countryCode: 'AU',
      isDST: true,
      isPopular: false,
      description: 'Australian Central time'
    },
    {
      id: 'GMT+8-AU',
      name: 'Australian Western Time',
      abbreviation: 'AWST',
      offset: 8,
      city: 'Perth',
      country: 'Australia',
      countryCode: 'AU',
      isDST: false,
      isPopular: false,
      description: 'Australian Western time'
    },
    {
      id: 'GMT+11',
      name: 'Solomon Islands Time',
      abbreviation: 'SBT',
      offset: 11,
      city: 'Honiara',
      country: 'Solomon Islands',
      countryCode: 'SB',
      isDST: false,
      isPopular: false,
      description: 'Pacific island time'
    },
    {
      id: 'GMT+10-PG',
      name: 'Papua New Guinea Time',
      abbreviation: 'PGT',
      offset: 10,
      city: 'Port Moresby',
      country: 'Papua New Guinea',
      countryCode: 'PG',
      isDST: false,
      isPopular: false,
      description: 'Papua New Guinea time'
    },
    {
      id: 'GMT+8-MY',
      name: 'Malaysia Time',
      abbreviation: 'MYT',
      offset: 8,
      city: 'Kuala Lumpur',
      country: 'Malaysia',
      countryCode: 'MY',
      isDST: false,
      isPopular: true,
      description: 'Malaysian financial center'
    },
    {
      id: 'GMT+8-PH',
      name: 'Philippines Time',
      abbreviation: 'PHT',
      offset: 8,
      city: 'Manila',
      country: 'Philippines',
      countryCode: 'PH',
      isDST: false,
      isPopular: false,
      description: 'Philippine financial center'
    },
    {
      id: 'GMT+7-ID',
      name: 'Western Indonesia Time',
      abbreviation: 'WIB',
      offset: 7,
      city: 'Jakarta',
      country: 'Indonesia',
      countryCode: 'ID',
      isDST: false,
      isPopular: true,
      description: 'Indonesian financial center'
    },
    {
      id: 'GMT+6:30',
      name: 'Myanmar Time',
      abbreviation: 'MMT',
      offset: 6.5,
      city: 'Yangon',
      country: 'Myanmar',
      countryCode: 'MM',
      isDST: false,
      isPopular: false,
      description: 'Myanmar time'
    },
    {
      id: 'GMT+5:45',
      name: 'Nepal Time',
      abbreviation: 'NPT',
      offset: 5.75,
      city: 'Kathmandu',
      country: 'Nepal',
      countryCode: 'NP',
      isDST: false,
      isPopular: false,
      description: 'Nepal time'
    },
    {
      id: 'GMT+4:30',
      name: 'Afghanistan Time',
      abbreviation: 'AFT',
      offset: 4.5,
      city: 'Kabul',
      country: 'Afghanistan',
      countryCode: 'AF',
      isDST: false,
      isPopular: false,
      description: 'Afghanistan time'
    }
  ];

  // Timezone utility functions
  const convertTime = (timeString, fromOffset, toOffset) => {
    try {
      // Parse time string (e.g., "08:30" or "All Day")
      if (timeString === 'All Day' || timeString === 'Tentative' || !timeString.includes(':')) {
        return timeString;
      }

      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return timeString;
      }

      // Create a date object for today with the given time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      // Apply timezone conversion
      const offsetDiff = toOffset - fromOffset;
      date.setHours(date.getHours() + offsetDiff);

      // Format the result
      const newHours = date.getHours().toString().padStart(2, '0');
      const newMinutes = date.getMinutes().toString().padStart(2, '0');

      return `${newHours}:${newMinutes}`;
    } catch (error) {
      console.error('Error converting time:', error);
      return timeString;
    }
  };

  const getSelectedTimezoneInfo = () => {
    return tradingTimezones.find(tz => tz.id === selectedTimezone) || tradingTimezones[0];
  };

  // Get current time in selected timezone
  const getCurrentTimeInTimezone = () => {
    const timezoneInfo = getSelectedTimezoneInfo();
    const now = new Date(currentTime);
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + (timezoneInfo.offset * 3600000));

    return {
      time: targetTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      date: targetTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      timezone: timezoneInfo
    };
  };

  // Currency to Country Code Mapping for Economic Events
  const getCurrencyCountryCode = (currency) => {
    const currencyMap = {
      'USD': 'US',    // US Dollar
      'EUR': 'DE',    // Euro (using Germany as representative)
      'GBP': 'GB',    // British Pound
      'JPY': 'JP',    // Japanese Yen
      'CAD': 'CA',    // Canadian Dollar
      'AUD': 'AU',    // Australian Dollar
      'CHF': 'CH',    // Swiss Franc
      'CNY': 'CN',    // Chinese Yuan
      'SGD': 'SG',    // Singapore Dollar
      'HKD': 'HK',    // Hong Kong Dollar
      'NZD': 'NZ',    // New Zealand Dollar
      'SEK': 'SE',    // Swedish Krona
      'NOK': 'NO',    // Norwegian Krone
      'DKK': 'DK',    // Danish Krone
      'PLN': 'PL',    // Polish Zloty
      'CZK': 'CZ',    // Czech Koruna (need to add flag)
      'HUF': 'HU',    // Hungarian Forint (need to add flag)
      'RUB': 'RU',    // Russian Ruble
      'TRY': 'TR',    // Turkish Lira
      'ZAR': 'ZA',    // South African Rand
      'BRL': 'BR',    // Brazilian Real
      'MXN': 'MX',    // Mexican Peso
      'INR': 'IN',    // Indian Rupee
      'KRW': 'KR',    // South Korean Won
      'THB': 'TH',    // Thai Baht
      'MYR': 'MY',    // Malaysian Ringgit
      'IDR': 'ID',    // Indonesian Rupiah
      'PHP': 'PH',    // Philippine Peso
      'VND': 'VN',    // Vietnamese Dong
      'AED': 'AE',    // UAE Dirham
      'SAR': 'SA',    // Saudi Riyal
      'EGP': 'EG',    // Egyptian Pound
      'NGN': 'NG',    // Nigerian Naira
      'PKR': 'PK',    // Pakistani Rupee
      'BDT': 'BD',    // Bangladeshi Taka
      'LKR': 'LK',    // Sri Lankan Rupee (need to add flag)
      'MMK': 'MM',    // Myanmar Kyat
      'NPR': 'NP',    // Nepalese Rupee
      'AFN': 'AF',    // Afghan Afghani
      'IRR': 'IR',    // Iranian Rial
      'ILS': 'IL',    // Israeli Shekel (need to add flag)
      'JOD': 'JO',    // Jordanian Dinar (need to add flag)
      'KWD': 'KW',    // Kuwaiti Dinar (need to add flag)
      'QAR': 'QA',    // Qatari Riyal (need to add flag)
      'BHD': 'BH',    // Bahraini Dinar (need to add flag)
      'OMR': 'OM',    // Omani Rial (need to add flag)
      'CLP': 'CL',    // Chilean Peso
      'COP': 'CO',    // Colombian Peso
      'PEN': 'PE',    // Peruvian Sol
      'ARS': 'AR',    // Argentine Peso
      'VES': 'VE',    // Venezuelan Bolívar
      'UYU': 'UY',    // Uruguayan Peso (need to add flag)
      'PYG': 'PY',    // Paraguayan Guaraní (need to add flag)
      'BOB': 'BO',    // Bolivian Boliviano (need to add flag)
      'ECU': 'EC',    // Ecuadorian Sucre (need to add flag)
      'GTQ': 'GT',    // Guatemalan Quetzal (need to add flag)
      'HNL': 'HN',    // Honduran Lempira (need to add flag)
      'NIO': 'NI',    // Nicaraguan Córdoba (need to add flag)
      'CRC': 'CR',    // Costa Rican Colón (need to add flag)
      'PAB': 'PA',    // Panamanian Balboa (need to add flag)
      'DOP': 'DO',    // Dominican Peso (need to add flag)
      'JMD': 'JM',    // Jamaican Dollar (need to add flag)
      'TTD': 'TT',    // Trinidad and Tobago Dollar (need to add flag)
      'BBD': 'BB',    // Barbadian Dollar (need to add flag)
      'XCD': 'AG',    // East Caribbean Dollar (using Antigua as representative)
      'BSD': 'BS',    // Bahamian Dollar (need to add flag)
      'BZD': 'BZ',    // Belize Dollar (need to add flag)
      'GYD': 'GY',    // Guyanese Dollar (need to add flag)
      'SRD': 'SR',    // Surinamese Dollar (need to add flag)
      'FKP': 'FK',    // Falkland Islands Pound (need to add flag)
      'GIP': 'GI',    // Gibraltar Pound (need to add flag)
      'SHP': 'SH',    // Saint Helena Pound (need to add flag)
      'JEP': 'JE',    // Jersey Pound (need to add flag)
      'GGP': 'GG',    // Guernsey Pound (need to add flag)
      'IMP': 'IM',    // Isle of Man Pound (need to add flag)
      'ALL': 'AL',    // Albanian Lek (need to add flag)
      'BAM': 'BA',    // Bosnia and Herzegovina Convertible Mark (need to add flag)
      'BGN': 'BG',    // Bulgarian Lev (need to add flag)
      'HRK': 'HR',    // Croatian Kuna (need to add flag)
      'RSD': 'RS',    // Serbian Dinar (need to add flag)
      'MKD': 'MK',    // Macedonian Denar (need to add flag)
      'RON': 'RO',    // Romanian Leu (need to add flag)
      'MDL': 'MD',    // Moldovan Leu (need to add flag)
      'UAH': 'UA',    // Ukrainian Hryvnia (need to add flag)
      'BYN': 'BY',    // Belarusian Ruble (need to add flag)
      'LTL': 'LT',    // Lithuanian Litas (need to add flag)
      'LVL': 'LV',    // Latvian Lats (need to add flag)
      'EEK': 'EE',    // Estonian Kroon (need to add flag)
      'ISK': 'IS',    // Icelandic Króna (need to add flag)
      'GEL': 'GE',    // Georgian Lari (need to add flag)
      'AMD': 'AM',    // Armenian Dram (need to add flag)
      'AZN': 'AZ',    // Azerbaijani Manat (need to add flag)
      'KZT': 'KZ',    // Kazakhstani Tenge (need to add flag)
      'KGS': 'KG',    // Kyrgyzstani Som (need to add flag)
      'TJS': 'TJ',    // Tajikistani Somoni (need to add flag)
      'TMT': 'TM',    // Turkmenistani Manat (need to add flag)
      'UZS': 'UZ',    // Uzbekistani Som (need to add flag)
      'MNT': 'MN',    // Mongolian Tugrik (need to add flag)
      'KPW': 'KP',    // North Korean Won (need to add flag)
      'LAK': 'LA',    // Lao Kip (need to add flag)
      'KHR': 'KH',    // Cambodian Riel (need to add flag)
      'BND': 'BN',    // Brunei Dollar (need to add flag)
      'TWD': 'TW',    // Taiwan Dollar (need to add flag)
      'HKD': 'HK',    // Hong Kong Dollar
      'MOP': 'MO',    // Macanese Pataca (need to add flag)
      'FJD': 'FJ',    // Fijian Dollar (need to add flag)
      'TOP': 'TO',    // Tongan Paʻanga (need to add flag)
      'WST': 'WS',    // Samoan Tala (need to add flag)
      'VUV': 'VU',    // Vanuatu Vatu (need to add flag)
      'SBD': 'SB',    // Solomon Islands Dollar
      'PGK': 'PG',    // Papua New Guinea Kina
      'NCX': 'NC',    // New Caledonian Franc (need to add flag)
      'XPF': 'PF',    // CFP Franc (need to add flag)
      'CDF': 'CD',    // Congolese Franc (need to add flag)
      'AOA': 'AO',    // Angolan Kwanza (need to add flag)
      'ZMW': 'ZM',    // Zambian Kwacha (need to add flag)
      'ZWL': 'ZW',    // Zimbabwean Dollar (need to add flag)
      'BWP': 'BW',    // Botswana Pula (need to add flag)
      'NAD': 'NA',    // Namibian Dollar (need to add flag)
      'SZL': 'SZ',    // Swazi Lilangeni (need to add flag)
      'LSL': 'LS',    // Lesotho Loti (need to add flag)
      'MGA': 'MG',    // Malagasy Ariary (need to add flag)
      'MUR': 'MU',    // Mauritian Rupee (need to add flag)
      'SCR': 'SC',    // Seychellois Rupee (need to add flag)
      'KMF': 'KM',    // Comorian Franc (need to add flag)
      'DJF': 'DJ',    // Djiboutian Franc (need to add flag)
      'ERN': 'ER',    // Eritrean Nakfa (need to add flag)
      'ETB': 'ET',    // Ethiopian Birr (need to add flag)
      'KES': 'KE',    // Kenyan Shilling (need to add flag)
      'UGX': 'UG',    // Ugandan Shilling (need to add flag)
      'TZS': 'TZ',    // Tanzanian Shilling (need to add flag)
      'RWF': 'RW',    // Rwandan Franc (need to add flag)
      'BIF': 'BI',    // Burundian Franc (need to add flag)
      'SOS': 'SO',    // Somali Shilling (need to add flag)
      'SDG': 'SD',    // Sudanese Pound (need to add flag)
      'SSP': 'SS',    // South Sudanese Pound (need to add flag)
      'LYD': 'LY',    // Libyan Dinar (need to add flag)
      'TND': 'TN',    // Tunisian Dinar (need to add flag)
      'DZD': 'DZ',    // Algerian Dinar (need to add flag)
      'MAD': 'MA',    // Moroccan Dirham (need to add flag)
      'MRU': 'MR',    // Mauritanian Ouguiya (need to add flag)
      'SLL': 'SL',    // Sierra Leonean Leone (need to add flag)
      'LRD': 'LR',    // Liberian Dollar (need to add flag)
      'GHS': 'GH',    // Ghanaian Cedi (need to add flag)
      'GMD': 'GM',    // Gambian Dalasi (need to add flag)
      'GNF': 'GN',    // Guinean Franc (need to add flag)
      'XOF': 'SN',    // West African CFA Franc (using Senegal as representative)
      'XAF': 'CM',    // Central African CFA Franc (using Cameroon as representative)
      'CVE': 'CV',    // Cape Verdean Escudo (need to add flag)
      'STN': 'ST'     // São Tomé and Príncipe Dobra (need to add flag)
    };

    return currencyMap[currency] || 'US'; // Default to US flag if currency not found
  };

  const getFilteredTimezones = () => {
    if (!timezoneSearchQuery) return tradingTimezones;

    const query = timezoneSearchQuery.toLowerCase();
    return tradingTimezones.filter(tz =>
      tz.name.toLowerCase().includes(query) ||
      tz.abbreviation.toLowerCase().includes(query) ||
      tz.city.toLowerCase().includes(query) ||
      tz.country.toLowerCase().includes(query)
    );
  };

  // Load timezone preference from localStorage
  useEffect(() => {
    const savedTimezone = localStorage.getItem('selectedTimezone');
    if (savedTimezone && tradingTimezones.find(tz => tz.id === savedTimezone)) {
      setSelectedTimezone(savedTimezone);
    }
  }, []);

  // Save timezone preference to localStorage
  useEffect(() => {
    localStorage.setItem('selectedTimezone', selectedTimezone);
  }, [selectedTimezone]);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close timezone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTimezoneDropdown && !event.target.closest('.timezone-dropdown')) {
        setShowTimezoneDropdown(false);
        setTimezoneSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimezoneDropdown]);

  // Initialize activeMenu based on URL parameter
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['dashboard', 'analytics', 'strategy', 'sessions', 'risk-analysis', 'forex-news', 'calendar'].includes(section)) {
      setActiveMenu(section);
    } else {
      setActiveMenu('dashboard');
    }
  }, [searchParams]);

  // Fetch Economic Calendar Data
  useEffect(() => {
    const fetchEconomicCalendar = async () => {
      if (activeMenu === 'forex-news') {
        setEconomicCalendarLoading(true);
        try {
          const response = await fetch('/api/economic-calendar');
          const data = await response.json();

          if (data.success) {
            setEconomicEvents(data.data);
            setEconomicCalendarMetadata(data.metadata);
          } else {
            console.error('Failed to fetch economic calendar:', data.error);
            // Fallback to empty array if API fails
            setEconomicEvents([]);
          }
        } catch (error) {
          console.error('Error fetching economic calendar:', error);
          // Fallback to empty array if fetch fails
          setEconomicEvents([]);
        } finally {
          setEconomicCalendarLoading(false);
        }
      }
    };

    fetchEconomicCalendar();
  }, [activeMenu]);

  // Filter economic events based on selected filter and convert timezone
  const filteredEconomicEvents = economicEvents.filter(event => {
    if (economicCalendarFilter === 'all') return true;
    return event.importance === economicCalendarFilter;
  }).map(event => {
    // Convert time from GMT-4 (source) to selected timezone
    const sourceTimezone = tradingTimezones.find(tz => tz.id === 'GMT-4');
    const targetTimezone = getSelectedTimezoneInfo();

    const convertedTime = convertTime(
      event.time,
      sourceTimezone.offset,
      targetTimezone.offset
    );

    return {
      ...event,
      time: convertedTime,
      originalTime: event.time,
      timezone: targetTimezone.abbreviation
    };
  });

  // Initialize user from localStorage or cookies on component mount
  useEffect(() => {
    const initializeUser = () => {
      try {
        setLoading(true);
        // Try to get user from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setLoading(false);
          return;
        }
        
        // If no user in localStorage, check for auth token and fetch user
        const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
        if (!token) {
          // No authentication, redirect to login
          router.push('/login');
          return;
        }
        
        // Fetch user with token
        fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Failed to fetch user data');
          }
        })
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            throw new Error('No user data returned');
          }
        })
        .catch(error => {
          console.error('Error initializing user:', error);
          router.push('/login');
        })
        .finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.error('Error in initializeUser:', error);
        setLoading(false);
        router.push('/login');
      }
    };
    
    initializeUser();
  }, []);

  // Trigger background scraper on dashboard load
  useEffect(() => {
    const triggerBackgroundScraper = async () => {
      try {
        console.log('🏠 Dashboard loaded, triggering background scraper...');

        const response = await fetch('/api/scraper/dashboard-load', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          console.log(`✅ Background scraper completed: ${data.data.eventsCount} events from ${data.data.source}`);
        } else {
          console.log('⚠️ Background scraper failed:', data.error);
        }
      } catch (error) {
        console.error('❌ Error triggering background scraper:', error);
      }
    };

    // Trigger scraper after a short delay to not block initial render
    const timer = setTimeout(triggerBackgroundScraper, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Accounts Management State
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({
    name: '',
    balance: '',
    tag: 'personal'
  });

  // Get current active account
  const currentAccount = accounts.find(acc => acc.id === currentAccountId) || accounts[0] || { 
    id: null, 
    name: 'No Account', 
    balance: 0, 
    tag: 'personal',
    color: 'bg-gray-600',
    isActive: false 
  };

  // Add new account function
  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.balance) return;

    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    try {
      setLoading(true);
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          ...newAccount
        })
      });

      if (response.ok) {
        const data = await response.json();
        const accountData = {
          id: data.accountId || data._id || Date.now().toString(),
          ...newAccount,
          balance: parseFloat(newAccount.balance),
          color: getTagColor(newAccount.tag),
          isActive: accounts.length === 0 // Make first account active
        };

        setAccounts([...accounts, accountData]);
        
        // If this is the first account, make it active
        if (accounts.length === 0) {
          setCurrentAccountId(accountData.id);
          localStorage.setItem('currentAccountId', accountData.id);
        }
        
        setNewAccount({ name: '', balance: '', tag: 'personal' });
        setShowAddAccountModal(false);
        
        // Refresh accounts to ensure we have the latest data
        await fetchAccounts();
      } else {
        const errorData = await response.json();
        console.error('Failed to create account:', errorData);
        alert('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Switch account function
  const handleSwitchAccount = (accountId) => {
    console.log('Switching to account:', accountId);
    
    // Ensure accountId is string for consistent comparison
    const accountIdStr = String(accountId);
    setCurrentAccountId(accountIdStr);
    
    // Find the account object
    const selectedAccount = accounts.find(acc => 
      (acc.id && String(acc.id) === accountIdStr) || 
      (acc._id && String(acc._id) === accountIdStr)
    );
    
    if (selectedAccount) {
      console.log('Found account to switch to:', selectedAccount.name);
    } else {
      console.warn('Account not found with ID:', accountIdStr);
    }
    
    setAccounts(accounts.map(acc => ({
      ...acc,
      isActive: (acc.id && String(acc.id) === accountIdStr) || 
                (acc._id && String(acc._id) === accountIdStr)
    })));
    
    setShowAccountDropdown(false);
    
    // Update localStorage to sync with Add Trade page
    localStorage.setItem('currentAccountId', accountIdStr);
  };

  // Save edited balance
  const handleSaveBalance = async (accountId) => {
    if (!editingBalance) return;

    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      
      const response = await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: accountId,
          userId: userId,
          updates: { balance: parseFloat(editingBalance) }
        })
      });

      if (response.ok) {
        const newBalance = parseFloat(editingBalance);
        
        // Make sure we update the account with the correct ID (could be _id or id)
        setAccounts(accounts.map(acc => 
          (acc.id === accountId || acc._id === accountId)
            ? { ...acc, balance: newBalance }
            : acc
        ));
        
        // Dispatch custom event for real-time sync with Add Trade page
        const event = new CustomEvent('accountBalanceUpdated', {
          detail: {
            accountId: accountId,
            newBalance: newBalance
          }
        });
        window.dispatchEvent(event);
        
        setEditingAccountId(null);
        setEditingBalance('');
        alert('Balance updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to update balance:', errorData);
        alert('Failed to update balance. Please try again.');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Error updating balance. Please try again.');
    }
  };

  // Delete account function
  const handleDeleteAccount = async (accountId) => {
    if (!accountId || accounts.length <= 1) {
      alert('Cannot delete the only account. Please create another account first.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/accounts?accountId=${accountId}&userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove from state
        const remainingAccounts = accounts.filter(acc => 
          String(acc.id) !== String(accountId) && 
          String(acc._id || '') !== String(accountId)
        );
        
        setAccounts(remainingAccounts);
        
        // If current account is deleted, switch to another account
        if (String(currentAccountId) === String(accountId)) {
          const newAccountId = remainingAccounts[0]?.id || remainingAccounts[0]?._id;
          setCurrentAccountId(newAccountId);
          localStorage.setItem('currentAccountId', String(newAccountId));
        }
        
        setShowAccountDropdown(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete account:', errorData);
        alert('Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for Sidebar account editing (compatible with Sidebar component)
  const handleEditAccountFromSidebar = async (accountId, updates) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');

      const response = await fetch('/api/accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: accountId,
          userId: userId,
          updates: updates
        })
      });

      if (response.ok) {
        // Make sure we update the account with the correct ID (could be _id or id)
        setAccounts(accounts.map(acc =>
          (acc.id === accountId || acc._id === accountId)
            ? { ...acc, ...updates }
            : acc
        ));

        // Dispatch custom event for real-time sync with Add Trade page
        if (updates.balance !== undefined) {
          const event = new CustomEvent('accountBalanceUpdated', {
            detail: {
              accountId: accountId,
              newBalance: updates.balance
            }
          });
          window.dispatchEvent(event);
        }

        alert('Account updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to update account:', errorData);
        alert('Failed to update account. Please try again.');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      alert('Error updating account. Please try again.');
    }
  };

  // Get tag color helper
  const getTagColor = (tag) => {
    const tagColors = {
      personal: 'bg-blue-600',
      funded: 'bg-green-600',
      demo: 'bg-purple-600',
      forex: 'bg-orange-600',
      crypto: 'bg-indigo-600'
    };
    return tagColors[tag] || 'bg-gray-600';
  };

  // Get tag display name
  const getTagDisplayName = (tag) => {
    const tagNames = {
      personal: 'Personal',
      funded: 'Funded',
      demo: 'Demo',
      forex: 'Forex',
      crypto: 'Crypto'
    };
    return tagNames[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
  };

  // Save strategy function
  const handleSaveStrategy = async () => {
    if (!strategyForm.name || !strategyForm.marketType.length || !strategyForm.tradingStyle) {
      alert('Please fill in all required fields');
      return;
    }

    const userId = user?.id || user?._id || 'demo-user';
    const isEditing = editingStrategy && editingStrategy._id;

    try {
      const url = '/api/strategies';
      const method = isEditing ? 'PUT' : 'POST';
      const requestBody = isEditing 
        ? {
            strategyId: editingStrategy._id,
            userId: userId,
            ...strategyForm,
            updatedAt: new Date().toISOString()
          }
        : {
            userId: userId,
            ...strategyForm,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Strategy ${isEditing ? 'updated' : 'created'} successfully:`, data);
        
        // Reset form and close modal
        setStrategyForm({
          name: '',
          marketType: [],
          tradingStyle: '',
          description: '',
          entryConditions: '',
          exitConditions: '',
          stopLossLogic: '',
          takeProfitLogic: '',
          riskPerTrade: '',
          maxDailyRisk: '',
          maxOpenTrades: '',
          positionSizing: '',
          indicators: [],
          toolsPatterns: [],
          tags: '',
          status: 'testing',
          version: '1.0'
        });
        setCurrentStep(1);
        setEditingStrategy(null);
        setShowCreateStrategyModal(false);
        
        // Refresh strategies list
        fetchStrategies();
        alert(`Strategy ${isEditing ? 'updated' : 'created'} successfully!`);
      } else {
        console.error(`Failed to ${isEditing ? 'update' : 'create'} strategy`);
        alert(`Failed to ${isEditing ? 'update' : 'create'} strategy. Please try again.`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} strategy:`, error);
      alert(`Error ${isEditing ? 'updating' : 'saving'} strategy. Please try again.`);
    }
  };

  // Fetch strategies function
  const fetchStrategies = async () => {
    const userId = user?.id || user?._id; // Try both id and _id fields
    
    if (!userId) {
      return;
    }
    
    setLoadingStrategies(true);
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        console.error('Authentication token is missing');
        return;
      }
      
      const url = `/api/strategies?userId=${userId}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStrategies(data.strategies || []);
      } else {
        console.error('Failed to fetch strategies, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setLoadingStrategies(false);
    }
  };

  // Calculate strategy statistics with real trade data
  const getStrategyStats = () => {
    const activeStrategies = strategies.filter(s => s.status === 'active').length;
    const testingStrategies = strategies.filter(s => s.status === 'testing').length;
    const totalStrategies = strategies.length;

    // Calculate real performance data using actual trades
    const realPerformance = strategies.map(strategy => {
      // Find trades that match this strategy
      const strategyTrades = trades.filter(trade =>
        trade.strategy === strategy.name ||
        trade.notes?.toLowerCase().includes(strategy.name.toLowerCase())
      );

      // Use correct field names: status 'win'/'loss' instead of 'closed', actualProfit instead of actualPL
      const closedTrades = strategyTrades.filter(trade => trade.status === 'win' || trade.status === 'loss');
      const wins = closedTrades.filter(trade => trade.status === 'win');
      const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
      const totalPL = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.actualProfit || trade.calculations?.actualPL || 0), 0);

      // Calculate Sharpe ratio (simplified)
      const returns = closedTrades.map(trade => parseFloat(trade.actualProfit || trade.calculations?.actualPL || 0));
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const variance = returns.length > 0 ? returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length : 0;
      const volatility = Math.sqrt(variance);
      const sharpe = volatility > 0 ? (avgReturn / volatility).toFixed(1) : '0.0';

      return {
        ...strategy,
        profit: totalPL,
        trades: strategyTrades.length,
        winRate: winRate,
        sharpe: sharpe
      };
    });

    return {
      active: activeStrategies,
      testing: testingStrategies,
      total: totalStrategies,
      performance: realPerformance
    };
  };

  // Handle strategy operations
  const handleViewStrategy = (strategy) => {
    setViewingStrategy(strategy);
    setShowViewStrategyModal(true);
  };

  const handleEditStrategy = (strategy) => {
    setEditingStrategy(strategy);
    // Set form with strategy data, ensuring arrays are properly handled
    setStrategyForm({
      ...strategy,
      marketType: Array.isArray(strategy.marketType) ? strategy.marketType : [],
      indicators: Array.isArray(strategy.indicators) ? strategy.indicators : [],
      toolsPatterns: Array.isArray(strategy.toolsPatterns) ? strategy.toolsPatterns : []
    });
    setShowManageAllModal(false);
    setShowCreateStrategyModal(true);
    setCurrentStep(1);
  };

  const handleDeleteStrategy = async (strategyId) => {
    if (!window.confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return;
    }

    try {
      const userId = user?.id || user?._id || 'demo-user';
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        console.error('Authentication token is missing');
        return;
      }
      
      const response = await fetch(`/api/strategies?strategyId=${strategyId}&userId=${userId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchStrategies(); // Refresh the list
        alert('Strategy deleted successfully!');
      } else {
        throw new Error('Failed to delete strategy');
      }
    } catch (error) {
      console.error('Error deleting strategy:', error);
      alert('Error deleting strategy. Please try again.');
    }
  };

  // Handle duplicate strategy function
  const handleDuplicateStrategy = async (strategy) => {
    const duplicateStrategy = {
      ...strategy,
      name: `${strategy.name} (Copy)`,
      _id: undefined // Remove the ID so it creates a new one
    };

    try {
      const userId = user?.id || user?._id || 'demo-user';
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        console.error('Authentication token is missing');
        return;
      }
      
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          ...duplicateStrategy
        })
      });

      if (response.ok) {
        fetchStrategies(); // Refresh the list
        alert('Strategy duplicated successfully!');
      } else {
        throw new Error('Failed to duplicate strategy');
      }
    } catch (error) {
      console.error('Error duplicating strategy:', error);
      alert('Error duplicating strategy. Please try again.');
    }
  };

  // Function to fetch real trades data
  const fetchTrades = async () => {
    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        console.error('Authentication token is missing');
        return;
      }

      const response = await fetch(`/api/trades?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.trades && Array.isArray(data.trades)) {
          setTrades(data.trades);
          calculateRealStats(data.trades);
        } else {
          console.error('Trades data is not in expected format:', data);
          setTrades([]);
        }
      } else {
        console.error('Failed to fetch trades:', await response.text());
        setTrades([]);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
    }
  };

  // Function to calculate comprehensive risk analytics from trades
  const calculateRealRiskAnalytics = (tradesData) => {
    // Filter trades by current account
    const accountTrades = tradesData.filter(trade =>
      trade.accountId === currentAccountId ||
      trade.accountId === currentAccountId?.toString()
    );

    const closedTrades = accountTrades.filter(t => t.status === 'win' || t.status === 'loss');
    const activeTrades = accountTrades.filter(t => t.status === 'active');

    // Current account info
    const currentAccount = accounts.find(acc => (acc.id || acc._id) === currentAccountId);
    const accountBalance = currentAccount?.balance || 10000;
    const initialBalance = currentAccount?.initialBalance || currentAccount?.balance || 10000;

    // Calculate basic risk metrics
    const totalRiskAmount = activeTrades.reduce((sum, trade) =>
      sum + (trade.calculations?.riskAmount || 0), 0);
    const portfolioRisk = accountBalance > 0 ? (totalRiskAmount / accountBalance) * 100 : 0;

    // Calculate maximum risk per trade
    const riskAmounts = accountTrades
      .filter(t => t.calculations?.riskAmount)
      .map(t => (t.calculations.riskAmount / accountBalance) * 100);
    const maxRiskPerTrade = riskAmounts.length > 0 ? Math.max(...riskAmounts) : 0;
    const avgRiskPerTrade = riskAmounts.length > 0 ? riskAmounts.reduce((a, b) => a + b, 0) / riskAmounts.length : 0;

    // Calculate drawdown metrics
    let runningBalance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    const drawdownHistory = [];

    closedTrades.forEach(trade => {
      const profit = trade.actualProfit || trade.calculations?.actualPL || 0;
      runningBalance += profit;

      if (runningBalance > peak) {
        peak = runningBalance;
      }

      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      drawdownHistory.push({
        date: new Date(trade.createdAt || trade.date),
        balance: runningBalance,
        drawdown: drawdown,
        peak: peak
      });
    });

    currentDrawdown = ((peak - accountBalance) / peak) * 100;

    // Calculate Value at Risk (VaR) - simplified 95% confidence
    const returns = closedTrades.map(trade => {
      const profit = trade.actualProfit || trade.calculations?.actualPL || 0;
      return (profit / accountBalance) * 100;
    });

    returns.sort((a, b) => a - b);
    const var95Index = Math.floor(returns.length * 0.05);
    const var95 = returns.length > 0 ? Math.abs(returns[var95Index] || 0) * accountBalance / 100 : 0;

    // Calculate Sharpe and Sortino ratios
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length : 0;
    const volatility = Math.sqrt(variance);
    const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;

    const negativeReturns = returns.filter(r => r < 0);
    const downwardVolatility = negativeReturns.length > 0 ?
      Math.sqrt(negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length) : 0;
    const sortinoRatio = downwardVolatility > 0 ? avgReturn / downwardVolatility : 0;

    // Risk-Reward Analysis
    const riskRewardData = accountTrades
      .filter(t => t.calculations?.riskReward)
      .reduce((acc, trade) => {
        const rr = parseFloat(trade.calculations.riskReward);
        const key = rr >= 3 ? '1:3+' : rr >= 2.5 ? '1:2.5-3' : rr >= 2 ? '1:2-2.5' : rr >= 1.5 ? '1:1.5-2' : '1:1-1.5';
        if (!acc[key]) acc[key] = { count: 0, wins: 0 };
        acc[key].count++;
        if (trade.status === 'win') acc[key].wins++;
        return acc;
      }, {});

    // Position sizing analysis
    const positionSizes = accountTrades
      .filter(t => t.calculations?.positionSize)
      .map(t => ({
        pair: t.tradingPair,
        size: t.calculations.positionSize,
        risk: (t.calculations.riskAmount / accountBalance) * 100,
        outcome: t.status
      }));

    // Correlation risk analysis
    const pairGroups = {};
    accountTrades.forEach(trade => {
      const pair = trade.tradingPair || 'Unknown';
      if (!pairGroups[pair]) {
        pairGroups[pair] = { trades: [], exposure: 0 };
      }
      pairGroups[pair].trades.push(trade);
      if (trade.status === 'active' && trade.calculations?.riskAmount) {
        pairGroups[pair].exposure += trade.calculations.riskAmount;
      }
    });

    const correlationRisk = Object.keys(pairGroups).length > 5 ? 'High' :
                           Object.keys(pairGroups).length > 3 ? 'Medium' : 'Low';

    // Time-based risk analysis
    const hourlyRisk = Array.from({ length: 24 }, (_, hour) => {
      const hourTrades = accountTrades.filter(trade => {
        const tradeHour = new Date(trade.createdAt || trade.date).getHours();
        return tradeHour === hour;
      });

      const hourlyLosses = hourTrades
        .filter(t => t.status === 'loss')
        .reduce((sum, t) => sum + Math.abs(t.actualProfit || 0), 0);

      return {
        hour,
        trades: hourTrades.length,
        losses: hourlyLosses,
        riskLevel: hourlyLosses > avgRiskPerTrade * accountBalance / 100 ? 'High' :
                  hourlyLosses > 0 ? 'Medium' : 'Low'
      };
    });

    // Weekly risk patterns
    const weeklyRisk = Array.from({ length: 7 }, (_, day) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayTrades = accountTrades.filter(trade => {
        const tradeDay = new Date(trade.createdAt || trade.date).getDay();
        return tradeDay === day;
      });

      const dayLosses = dayTrades
        .filter(t => t.status === 'loss')
        .reduce((sum, t) => sum + Math.abs(t.actualProfit || 0), 0);

      return {
        day: dayNames[day],
        trades: dayTrades.length,
        losses: dayLosses,
        winRate: dayTrades.length > 0 ?
          (dayTrades.filter(t => t.status === 'win').length / dayTrades.filter(t => t.status === 'win' || t.status === 'loss').length) * 100 : 0
      };
    });

    return {
      portfolioRisk: parseFloat(portfolioRisk.toFixed(2)),
      maxRiskPerTrade: parseFloat(maxRiskPerTrade.toFixed(2)),
      avgRiskPerTrade: parseFloat(avgRiskPerTrade.toFixed(2)),
      currentDrawdown: parseFloat(currentDrawdown.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      var95: parseFloat(var95.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
      correlationRisk,
      totalActiveTrades: activeTrades.length,
      totalRiskAmount: parseFloat(totalRiskAmount.toFixed(2)),
      riskRewardData,
      positionSizes,
      drawdownHistory,
      hourlyRisk,
      weeklyRisk,
      volatility: parseFloat(volatility.toFixed(2)),
      returns,
      leverageRatio: 1, // Simplified - could be calculated from position sizes
      betaToMarket: 0.85 // Simplified - would need market data for real calculation
    };
  };

  // Function to calculate real analytics data from trades
  const calculateRealAnalytics = (tradesData) => {
    // Filter trades by current account
    const accountTrades = tradesData.filter(trade =>
      trade.accountId === currentAccountId ||
      trade.accountId === currentAccountId?.toString()
    );

    // Basic counts
    const totalTrades = accountTrades.length;
    const wins = accountTrades.filter(t => t.status === 'win').length;
    const losses = accountTrades.filter(t => t.status === 'loss').length;
    const closed = wins + losses;

    // Calculate actual P&L from closed trades
    const actualPL = accountTrades
      .filter(t => t.status === 'win' || t.status === 'loss')
      .reduce((sum, trade) => sum + (trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    // Win rate calculation
    const winRate = closed > 0 ? (wins / closed) * 100 : 0;

    // Average win/loss
    const totalWinAmount = accountTrades
      .filter(t => t.status === 'win')
      .reduce((sum, trade) => sum + (trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    const totalLossAmount = accountTrades
      .filter(t => t.status === 'loss')
      .reduce((sum, trade) => sum + Math.abs(trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    const avgWin = wins > 0 ? totalWinAmount / wins : 0;
    const avgLoss = losses > 0 ? totalLossAmount / losses : 0;

    // Profit factor
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;

    // Current account info
    const currentAccount = accounts.find(acc => (acc.id || acc._id) === currentAccountId);
    const accountBalance = currentAccount?.balance || 10000;
    const initialBalance = currentAccount?.initialBalance || currentAccount?.balance || 10000;

    // Calculate returns
    const totalReturn = initialBalance > 0 ? ((accountBalance - initialBalance) / initialBalance) * 100 : 0;
    const annualizedReturn = totalReturn; // Simplified - could be enhanced with time-based calculation

    // Calculate Sharpe ratio (simplified)
    const sharpeRatio = avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : 0;

    // Calculate max drawdown (simplified)
    const maxDrawdown = totalLossAmount > 0 ? (totalLossAmount / accountBalance) * 100 : 0;

    // Calculate monthly returns from trades
    const monthlyReturns = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    months.forEach((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0);

      const monthTrades = accountTrades.filter(trade => {
        const tradeDate = new Date(trade.createdAt || trade.date);
        return tradeDate >= monthStart && tradeDate <= monthEnd && (trade.status === 'win' || trade.status === 'loss');
      });

      const monthPL = monthTrades.reduce((sum, trade) =>
        sum + (trade.actualProfit || trade.calculations?.actualPL || 0), 0);

      const monthReturn = accountBalance > 0 ? (monthPL / accountBalance) * 100 : 0;
      monthlyReturns.push({ month, return: parseFloat(monthReturn.toFixed(1)) });
    });

    // Calculate pair analysis
    const pairGroups = {};
    accountTrades.forEach(trade => {
      const pair = trade.tradingPair || 'Unknown';
      if (!pairGroups[pair]) {
        pairGroups[pair] = { trades: [], wins: 0, totalPL: 0 };
      }
      pairGroups[pair].trades.push(trade);
      if (trade.status === 'win') pairGroups[pair].wins++;
      if (trade.status === 'win' || trade.status === 'loss') {
        pairGroups[pair].totalPL += (trade.actualProfit || trade.calculations?.actualPL || 0);
      }
    });

    const pairAnalysis = Object.entries(pairGroups)
      .map(([pair, data]) => ({
        pair,
        trades: data.trades.length,
        winRate: data.trades.length > 0 ? Math.round((data.wins / data.trades.filter(t => t.status === 'win' || t.status === 'loss').length) * 100) || 0 : 0,
        profit: data.totalPL.toFixed(2),
        avgHold: '2h 15m', // Placeholder - could be calculated from actual trade duration
        bestTime: 'Market Hours' // Placeholder - could be calculated from trade times
      }))
      .sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit))
      .slice(0, 4);

    // Calculate drawdown analysis (simplified)
    const drawdownAnalysis = [
      { period: 'Max Historical', amount: -maxDrawdown.toFixed(1), duration: '12 days', recovery: '6 days' },
      { period: 'Last 30 Days', amount: (-maxDrawdown * 0.4).toFixed(1), duration: '4 days', recovery: '2 days' },
      { period: 'Last 7 Days', amount: (-maxDrawdown * 0.2).toFixed(1), duration: '2 days', recovery: '1 day' },
      { period: 'Current', amount: 0, duration: '0 days', recovery: 'N/A' }
    ];

    // Calculate correlation matrix (simplified)
    const correlationMatrix = [
      { pair1: 'EUR', pair2: 'GBP', correlation: 0.75 },
      { pair1: 'USD', pair2: 'JPY', correlation: 0.68 },
      { pair1: 'AUD', pair2: 'NZD', correlation: 0.82 },
      { pair1: 'Gold', pair2: 'USD', correlation: -0.65 }
    ];

    return {
      performanceMetrics: {
        totalReturn: parseFloat(totalReturn.toFixed(1)),
        annualizedReturn: parseFloat(annualizedReturn.toFixed(1)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        sortinoRatio: parseFloat((sharpeRatio * 1.2).toFixed(2)), // Simplified
        maxDrawdown: parseFloat(maxDrawdown.toFixed(1)),
        calmarRatio: parseFloat((totalReturn / Math.max(maxDrawdown, 1)).toFixed(2)),
        sqn: parseFloat((Math.sqrt(totalTrades) * (avgWin - avgLoss) / (avgWin + avgLoss || 1)).toFixed(1)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(1)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        expectancy: parseFloat(((winRate/100 * avgWin) - ((100-winRate)/100 * avgLoss)).toFixed(2))
      },
      monthlyReturns,
      pairAnalysis,
      drawdownAnalysis,
      correlationMatrix,
      strategyPerformance: [] // Will be populated from actual strategies if available
    };
  };

  // Function to calculate real statistics from trades data
  const calculateRealStats = (tradesData) => {
    // Filter trades by current account
    const accountTrades = tradesData.filter(trade =>
      trade.accountId === currentAccountId ||
      trade.accountId === currentAccountId?.toString()
    );

    // Basic counts
    const totalTrades = accountTrades.length;
    const wins = accountTrades.filter(t => t.status === 'win').length;
    const losses = accountTrades.filter(t => t.status === 'loss').length;
    const closed = wins + losses;

    // Calculate actual P&L from closed trades
    const actualPL = accountTrades
      .filter(t => t.status === 'win' || t.status === 'loss')
      .reduce((sum, trade) => sum + (trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    // Win rate calculation
    const winRate = closed > 0 ? (wins / closed) * 100 : 0;

    // Average win/loss
    const totalWinAmount = accountTrades
      .filter(t => t.status === 'win')
      .reduce((sum, trade) => sum + (trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    const totalLossAmount = accountTrades
      .filter(t => t.status === 'loss')
      .reduce((sum, trade) => sum + Math.abs(trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    const avgWin = wins > 0 ? totalWinAmount / wins : 0;
    const avgLoss = losses > 0 ? totalLossAmount / losses : 0;

    // Profit factor
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;

    // Calculate daily and monthly P&L
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyTrades = accountTrades.filter(trade => {
      const tradeDate = new Date(trade.createdAt || trade.date);
      return tradeDate >= startOfDay && (trade.status === 'win' || trade.status === 'loss');
    });

    const monthlyTrades = accountTrades.filter(trade => {
      const tradeDate = new Date(trade.createdAt || trade.date);
      return tradeDate >= startOfMonth && (trade.status === 'win' || trade.status === 'loss');
    });

    const dailyProfit = dailyTrades.reduce((sum, trade) =>
      sum + (trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    const monthlyProfit = monthlyTrades.reduce((sum, trade) =>
      sum + (trade.actualProfit || trade.calculations?.actualPL || 0), 0);

    // Calculate daily gain percentage
    const currentAccount = accounts.find(acc => (acc.id || acc._id) === currentAccountId);
    const accountBalance = currentAccount?.balance || 10000;
    const dailyGain = accountBalance > 0 ? (dailyProfit / accountBalance) * 100 : 0;

    // Simple Sharpe ratio calculation (simplified)
    const sharpeRatio = avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : 0;

    setRealStats({
      dailyProfit,
      monthlyProfit,
      dailyGain,
      totalTrades,
      winRate,
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      actualPL,
      wins,
      losses,
      avgWin,
      avgLoss
    });
  };

  // Function to fetch user accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      
      const userId = user?.id || user?._id;
      if (!userId) {
        console.error('User ID not found');
        setLoading(false);
        return;
      }
      
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        console.error('Authentication token is missing');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/accounts?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.accounts && Array.isArray(data.accounts)) {
          const accountsWithColor = data.accounts.map(acc => ({
            ...acc,
            color: getTagColor(acc.tag || 'personal'),
            id: acc._id || acc.id // Ensure we have a consistent id field
          }));
          
          setAccounts(accountsWithColor);
          
          // Set current account from localStorage or use the first account
          const savedAccountId = localStorage.getItem('currentAccountId');
          if (savedAccountId && accountsWithColor.some(acc => String(acc.id) === String(savedAccountId))) {
            setCurrentAccountId(savedAccountId);
          } else if (accountsWithColor.length > 0) {
            setCurrentAccountId(accountsWithColor[0].id);
            localStorage.setItem('currentAccountId', accountsWithColor[0].id);
          }
        } else {
          console.error('Accounts data is not in expected format:', data);
          setAccounts([]);
        }
      } else {
        console.error('Failed to fetch accounts:', await response.text());
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch accounts when user is set
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchAccounts();
    }
  }, [user]);

  // Fetch trades when user is set
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchTrades();
    }
  }, [user]);

  // Recalculate stats when account changes or trades update
  useEffect(() => {
    if (trades.length > 0 && currentAccountId) {
      calculateRealStats(trades);
      setRealAnalytics(calculateRealAnalytics(trades));
      setRealRiskAnalytics(calculateRealRiskAnalytics(trades));
    }
  }, [currentAccountId, trades, accounts]);

  // Fetch strategies when user is set and when viewing strategy page
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId && activeMenu === 'strategy') {
      fetchStrategies();
    }
  }, [user?.id, user?._id, activeMenu]);

  const handleLogout = () => {
    // Clear all authentication data
    Cookies.remove('auth-token');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    
    // Redirect to login
    router.push('/login');
  };

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
        </svg>
      )
    },
    {
      id: 'add-trade',
      name: 'Add Trade',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      highlight: true
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'strategy',
      name: 'Strategy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'sessions',
      name: 'Sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'risk-analysis',
      name: 'Risk',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'psychology',
      name: 'Psychology',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'positions',
      name: 'Positions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 'watchlist',
      name: 'Watchlist',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Use the Sidebar component instead of inline implementation */}
      <Sidebar
        user={user}
        currentAccountId={currentAccountId}
        accounts={accounts}
        onAccountSwitch={handleSwitchAccount}
        onAddAccount={() => setShowAddAccountModal(true)}
        onEditAccount={handleEditAccountFromSidebar}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="ml-64 w-full">
        {/* Clean Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {activeMenu === 'dashboard' ? 'Trading Overview' : activeMenu.replace('-', ' ')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {timeframe === '24h' ? 'Last 24 hours' : timeframe === '7d' ? 'Last 7 days' : timeframe === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeMenu === 'dashboard' && (
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="24h">24H</option>
                  <option value="7d">7D</option>
                  <option value="30d">30D</option>
                  <option value="90d">90D</option>
                </select>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeMenu === 'dashboard' && (
            <div className="space-y-8">
              {/* Enhanced Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Daily P&L</p>
                      <p className={`text-3xl font-bold mt-1 ${realStats.dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {realStats.dailyProfit >= 0 ? '+' : ''}${realStats.dailyProfit.toFixed(2)}
                      </p>
                      <p className={`text-xs mt-1 ${realStats.dailyGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {realStats.dailyGain >= 0 ? '+' : ''}{realStats.dailyGain.toFixed(2)}% today
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl shadow-lg ${realStats.dailyProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={realStats.dailyProfit >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Win Rate</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{realStats.winRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">{realStats.totalTrades} trades</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Monthly P&L</p>
                      <p className={`text-3xl font-bold mt-1 ${realStats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {realStats.monthlyProfit >= 0 ? '+' : ''}${realStats.monthlyProfit.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">This month</p>
                    </div>
                    <div className={`p-3 rounded-xl shadow-lg ${realStats.monthlyProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Profit Factor</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {realStats.profitFactor === 999 ? '∞' : realStats.profitFactor}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {realStats.profitFactor >= 2 ? 'Excellent' : realStats.profitFactor >= 1.5 ? 'Good' : realStats.profitFactor >= 1 ? 'Fair' : 'Poor'}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Performance Chart */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 p-8 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Account Performance</h3>
                      <p className="text-gray-600 mt-1">Cumulative P&L over time</p>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Profit</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Loss</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    {realStats.totalTrades > 0 ? (
                      <div className="flex items-end justify-between space-x-1 h-full">
                        {/* Generate chart data from real trades */}
                        {Array.from({ length: Math.min(14, realStats.totalTrades) }, (_, index) => {
                          // Simple visualization - you can enhance this with actual daily P&L data
                          const height = Math.random() * 400 + 100; // Placeholder - replace with real daily P&L
                          const isProfit = height > 250;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div
                                className={`w-full rounded-t ${isProfit ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300 hover:opacity-70`}
                                style={{height: `${height/8}px`}}
                              ></div>
                              <span className="text-xs text-gray-400 mt-2">{index + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm">No trading data available</p>
                          <p className="text-xs text-gray-400">Start adding trades to see your performance</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Watchlist */}
                <div className="bg-gradient-to-br from-white via-gray-50/50 to-purple-50/30 p-8 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Market Watchlist</h3>
                      <p className="text-gray-600 mt-1">Live market prices</p>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl">
                      Manage
                    </button>
                  </div>
                  <div className="space-y-4">
                    {watchlist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/60 hover:shadow-md transition-all duration-200">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{item.pair}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{item.price}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-bold ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                              {item.changePercent}
                            </p>
                            <div className={`p-1.5 rounded-lg ${item.trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                              <svg className={`w-3 h-3 ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.trend === 'up' ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Recent Trades Section */}
              <div className="bg-gradient-to-br from-white via-gray-50/50 to-indigo-50/30 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
                <div className="p-8 border-b border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Recent Trades</h3>
                      <p className="text-gray-600 mt-1">Latest trading activity</p>
                    </div>
                    <button
                      onClick={() => router.push('/journal')}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  {trades.length > 0 ? (
                    <div className="space-y-4">
                      {trades
                        .filter(trade => trade.accountId === currentAccountId || trade.accountId === currentAccountId?.toString())
                        .slice(0, 5)
                        .map((trade, index) => (
                          <div key={trade._id || index} className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200/60 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center space-x-4">
                              <div className={`w-4 h-4 rounded-full shadow-sm ${
                                trade.status === 'win' ? 'bg-green-500' :
                                trade.status === 'loss' ? 'bg-red-500' :
                                trade.status === 'active' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`}></div>
                              <div>
                                <p className="font-bold text-gray-900 text-base">{trade.tradingPair}</p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    trade.direction === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {trade.direction?.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(trade.createdAt || trade.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-lg ${
                                trade.status === 'win' ? 'text-green-600' :
                                trade.status === 'loss' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {trade.status === 'win' || trade.status === 'loss' ? (
                                  `${trade.actualProfit >= 0 ? '+' : ''}$${(trade.actualProfit || 0).toFixed(2)}`
                                ) : (
                                  trade.status?.charAt(0).toUpperCase() + trade.status?.slice(1) || 'Pending'
                                )}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {trade.calculations?.riskAmount ? `Risk: $${trade.calculations.riskAmount.toFixed(2)}` : 'No risk data'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500 mb-2">No trades found</p>
                      <p className="text-sm text-gray-400 mb-4">Start trading to see your recent activity here</p>
                      <button
                        onClick={() => router.push('/add-trade')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Your First Trade
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* P&L Over Time Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">P&L Over Time</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-green-600 font-medium">+$1,234.56</span>
                      <span className="text-gray-500">YTD</span>
                    </div>
                  </div>
                  <div className="h-48 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* P&L Line */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        points="0,150 40,140 80,120 120,110 160,95 200,85 240,75 280,70 320,60 360,50 400,45"
                      />
                      
                      {/* Data points */}
                      {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400].map((x, index) => (
                        <circle key={index} cx={x} cy={150 - index * 10} r="3" fill="#10b981" />
                      ))}
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>May</span>
                    <span>Jul</span>
                    <span>Sep</span>
                    <span>Nov</span>
                  </div>
                </div>

                {/* Win/Loss Distribution */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Win/Loss Distribution</h3>
                    <span className="text-sm text-gray-500">{realStats.wins + realStats.losses} closed trades</span>
                  </div>
                  <div className="flex items-center justify-center h-48">
                    <div className="relative w-32 h-32">
                      {/* Donut Chart */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
                        {/* Win percentage */}
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="10"
                          strokeDasharray={`${(realStats.winRate / 100) * 220} 220`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{realStats.winRate.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Wins ({realStats.wins})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-600">Losses ({realStats.losses})</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Performance Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Monthly Performance</h3>
                    <span className="text-sm text-gray-500">2024</span>
                  </div>
                  <div className="h-48 flex items-end justify-between space-x-2">
                    {realAnalytics.monthlyReturns.length > 0 ? realAnalytics.monthlyReturns.slice(0, 8).map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full rounded-t ${item.return > 0 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300 hover:opacity-70`}
                          style={{height: `${Math.abs(item.return) * 20 + 20}px`}}
                        ></div>
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500">{item.month}</span>
                          <p className="text-xs font-medium">{item.return > 0 ? '+' : ''}{item.return}%</p>
                        </div>
                      </div>
                    )) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm">No monthly data available</p>
                          <p className="text-xs text-gray-400">Start trading to see monthly performance</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk-Reward Analysis */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Risk-Reward Analysis</h3>
                    <span className="text-sm text-green-600 font-medium">Avg 1:2.5</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { ratio: '1:3.2', count: 8, percentage: 32 },
                      { ratio: '1:2.5', count: 12, percentage: 48 },
                      { ratio: '1:2.0', count: 7, percentage: 28 },
                      { ratio: '1:1.5', count: 5, percentage: 20 },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.ratio}</span>
                          <span className="text-gray-500">{item.count} trades</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{width: `${item.percentage}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trading Session Performance */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Session Performance</h3>
                    <span className="text-sm text-gray-500">Win Rate by Session</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { session: 'European', winRate: 75.0, trades: 20, color: 'bg-blue-500' },
                      { session: 'American', winRate: 73.3, trades: 15, color: 'bg-green-500' },
                      { session: 'Asian', winRate: 66.7, trades: 12, color: 'bg-orange-500' },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">{item.session}</span>
                          <span className="text-gray-600">{item.winRate}% ({item.trades} trades)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`${item.color} h-3 rounded-full transition-all duration-300`}
                            style={{width: `${item.winRate}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Currency Pair Performance */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Top Performing Pairs</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {realAnalytics.pairAnalysis.length > 0 ? realAnalytics.pairAnalysis.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">{item.pair ? item.pair.split('/')[0] : 'N/A'}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.pair}</p>
                            <p className="text-xs text-gray-500">{item.trades} trades • {item.winRate}% win</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${parseFloat(item.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${parseFloat(item.profit) >= 0 ? '+' : ''}${item.profit}
                          </p>
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div
                              className={`h-1 rounded-full ${parseFloat(item.profit) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{width: `${item.winRate}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500">No pair performance data</p>
                        <p className="text-sm text-gray-400 mt-1">Start trading different pairs to see performance</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Trades - Compact */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Recent Trades</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View All
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pair</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">R:R</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {trades.slice(0, 4).map((trade) => (
                        <tr key={trade._id || trade.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-xs font-medium">
                                  {(trade.tradingPair || trade.pair) ? (trade.tradingPair || trade.pair).split('/')[0] : 'N/A'}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{trade.tradingPair || trade.pair || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                              (trade.direction || trade.type) === 'long' || (trade.direction || trade.type) === 'Buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {(trade.direction || trade.type || 'Unknown').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${(trade.actualProfit || trade.profit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(trade.actualProfit || trade.profit || 0) > 0 ? '+' : ''}${(trade.actualProfit || trade.profit || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {trade.calculations?.riskReward || trade.riskReward || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                              trade.status === 'win' || trade.status === 'Closed' ? 'bg-green-100 text-green-800' :
                              trade.status === 'loss' ? 'bg-red-100 text-red-800' :
                              trade.status === 'active' || trade.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {(trade.status || 'Unknown').charAt(0).toUpperCase() + (trade.status || 'Unknown').slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(trade.createdAt || trade.date || Date.now()).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Charts Page */}
          {activeMenu === 'charts' && (
            <div className="space-y-6">
              {/* Chart Controls */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Trading Charts</h3>
                  <div className="flex items-center space-x-3">
                    <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                      <option>EUR/USD</option>
                      <option>GBP/JPY</option>
                      <option>USD/CHF</option>
                    </select>
                    <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                      <option>1H</option>
                      <option>4H</option>
                      <option>1D</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Candlestick Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Price Action</h4>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="h-48 flex items-end justify-between space-x-1">
                    {chartData.candlestick.map((candle, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="relative w-full">
                          <div className="w-1 bg-gray-300 mx-auto" style={{height: '40px'}}></div>
                          <div className={`w-4 border-2 mx-auto ${candle.close > candle.open ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500'}`} style={{height: '20px', marginTop: '-30px'}}></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-2">{candle.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Volume Analysis */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Volume Analysis</h4>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="h-48 flex items-end justify-between space-x-2">
                    {chartData.candlestick.map((candle, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-blue-500 rounded-t" style={{height: `${candle.volume/50}px`}}></div>
                        <span className="text-xs text-gray-500 mt-2">{candle.volume}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correlation Heatmap */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Correlation Matrix</h4>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {chartData.heatmap.map((item, index) => (
                      <div key={index} className={`p-3 rounded-lg text-center ${item.correlation > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <p className="text-sm font-medium">{item.pair}</p>
                        <p className="text-xs">{item.correlation.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Chart Patterns</h4>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Double Top</span>
                      <span className="text-sm font-medium text-red-600">Bearish</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Bull Flag</span>
                      <span className="text-sm font-medium text-green-600">Bullish</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Support Level</span>
                      <span className="text-sm font-medium text-blue-600">1.0850</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Sessions Analysis Page */}
          {activeMenu === 'sessions' && (
            <div className="space-y-8">
              {/* Modern Sessions Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-3xl p-8 border border-white/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Trading Sessions
                      </h3>
                      <p className="text-gray-600 text-base font-medium mt-1">
                        Analyze performance across global trading sessions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-green-500 shadow-sm"></div>
                      <span className="text-gray-700 text-sm font-semibold">Live Markets</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Enhanced Session Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Asian Session */}
                <div className="group relative bg-gradient-to-br from-white via-orange-50/30 to-red-50/20 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">Asian Session</h3>
                          <p className="text-sm text-gray-600">Tokyo: 00:00 - 09:00 GMT</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                        Closed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/70 rounded-xl">
                        <p className="text-lg font-bold text-gray-900">{sessionData.asian.trades}</p>
                        <p className="text-xs text-gray-500">Trades</p>
                      </div>
                      <div className="text-center p-3 bg-white/70 rounded-xl">
                        <p className="text-lg font-bold text-green-600">{sessionData.asian.winRate}%</p>
                        <p className="text-xs text-gray-500">Win Rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">P&L</span>
                        <span className="font-bold text-green-600">${sessionData.asian.profit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Volume</span>
                        <span className="font-semibold text-gray-900">{sessionData.asian.volume}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* European Session */}
                <div className="group relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">European Session</h3>
                          <p className="text-sm text-gray-600">London: 08:00 - 17:00 GMT</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/70 rounded-xl">
                        <p className="text-lg font-bold text-gray-900">{sessionData.european.trades}</p>
                        <p className="text-xs text-gray-500">Trades</p>
                      </div>
                      <div className="text-center p-3 bg-white/70 rounded-xl">
                        <p className="text-lg font-bold text-green-600">{sessionData.european.winRate}%</p>
                        <p className="text-xs text-gray-500">Win Rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">P&L</span>
                        <span className="font-bold text-green-600">${sessionData.european.profit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Volume</span>
                        <span className="font-semibold text-gray-900">{sessionData.european.volume}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* American Session */}
                <div className="group relative bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">American Session</h3>
                          <p className="text-sm text-gray-600">New York: 13:00 - 22:00 GMT</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        Opening
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/70 rounded-xl">
                        <p className="text-lg font-bold text-gray-900">{sessionData.american.trades}</p>
                        <p className="text-xs text-gray-500">Trades</p>
                      </div>
                      <div className="text-center p-3 bg-white/70 rounded-xl">
                        <p className="text-lg font-bold text-green-600">{sessionData.american.winRate}%</p>
                        <p className="text-xs text-gray-500">Win Rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">P&L</span>
                        <span className="font-bold text-green-600">${sessionData.american.profit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Volume</span>
                        <span className="font-semibold text-gray-900">{sessionData.american.volume}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Session Performance Chart */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-blue-500/5 overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 pointer-events-none"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Session Performance Comparison</h3>
                        <p className="text-sm text-gray-600">Profit comparison across trading sessions</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg">
                      View Details
                    </button>
                  </div>

                  <div className="h-64 flex items-end justify-center space-x-12">
                    <div className="text-center group">
                      <div className="relative">
                        <div
                          className="w-20 bg-gradient-to-t from-orange-500 to-red-500 rounded-t-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                          style={{height: `${Math.max(sessionData.asian.profit/5, 20)}px`}}
                        ></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          ${sessionData.asian.profit}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-3">Asian</p>
                      <p className="text-xs text-gray-500">00:00 - 09:00 GMT</p>
                    </div>

                    <div className="text-center group">
                      <div className="relative">
                        <div
                          className="w-20 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                          style={{height: `${Math.max(sessionData.european.profit/5, 20)}px`}}
                        ></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          ${sessionData.european.profit}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-3">European</p>
                      <p className="text-xs text-gray-500">08:00 - 17:00 GMT</p>
                    </div>

                    <div className="text-center group">
                      <div className="relative">
                        <div
                          className="w-20 bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                          style={{height: `${Math.max(sessionData.american.profit/5, 20)}px`}}
                        ></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          ${sessionData.american.profit}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-3">American</p>
                      <p className="text-xs text-gray-500">13:00 - 22:00 GMT</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Risk Analysis Page */}
          {activeMenu === 'risk-analysis' && (
            <div className="space-y-8">
              {/* Modern Risk Analysis Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 rounded-3xl p-8 border border-white/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-orange-600/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.132 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Risk Analysis
                      </h3>
                      <p className="text-gray-600 text-base font-medium mt-1">
                        Comprehensive portfolio risk assessment and monitoring
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                      <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-sm ${
                        realRiskAnalytics.portfolioRisk > 10 ? 'bg-red-500' :
                        realRiskAnalytics.portfolioRisk > 5 ? 'bg-orange-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-gray-700 text-sm font-semibold">
                        {realRiskAnalytics.portfolioRisk > 10 ? 'High Risk' :
                         realRiskAnalytics.portfolioRisk > 5 ? 'Medium Risk' : 'Low Risk'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Risk Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Portfolio Risk</p>
                      <p className={`text-2xl font-semibold ${realRiskAnalytics.portfolioRisk > 10 ? 'text-red-600' : realRiskAnalytics.portfolioRisk > 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {realRiskAnalytics.portfolioRisk}%
                      </p>
                      <p className="text-xs text-gray-500">Current exposure</p>
                    </div>
                    <div className={`p-2 rounded-lg ${realRiskAnalytics.portfolioRisk > 10 ? 'bg-red-50' : realRiskAnalytics.portfolioRisk > 5 ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <svg className={`w-6 h-6 ${realRiskAnalytics.portfolioRisk > 10 ? 'text-red-600' : realRiskAnalytics.portfolioRisk > 5 ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.132 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Max Risk/Trade</p>
                      <p className={`text-2xl font-semibold ${realRiskAnalytics.maxRiskPerTrade > 3 ? 'text-red-600' : realRiskAnalytics.maxRiskPerTrade > 2 ? 'text-orange-600' : 'text-green-600'}`}>
                        {realRiskAnalytics.maxRiskPerTrade}%
                      </p>
                      <p className="text-xs text-gray-500">Per position</p>
                    </div>
                    <div className={`p-2 rounded-lg ${realRiskAnalytics.maxRiskPerTrade > 3 ? 'bg-red-50' : realRiskAnalytics.maxRiskPerTrade > 2 ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <svg className={`w-6 h-6 ${realRiskAnalytics.maxRiskPerTrade > 3 ? 'text-red-600' : realRiskAnalytics.maxRiskPerTrade > 2 ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Drawdown</p>
                      <p className={`text-2xl font-semibold ${realRiskAnalytics.currentDrawdown > 10 ? 'text-red-600' : realRiskAnalytics.currentDrawdown > 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {realRiskAnalytics.currentDrawdown}%
                      </p>
                      <p className="text-xs text-gray-500">From peak</p>
                    </div>
                    <div className={`p-2 rounded-lg ${realRiskAnalytics.currentDrawdown > 10 ? 'bg-red-50' : realRiskAnalytics.currentDrawdown > 5 ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <svg className={`w-6 h-6 ${realRiskAnalytics.currentDrawdown > 10 ? 'text-red-600' : realRiskAnalytics.currentDrawdown > 5 ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Value at Risk (95%)</p>
                      <p className="text-2xl font-semibold text-red-600">${realRiskAnalytics.var95}</p>
                      <p className="text-xs text-gray-500">Daily VaR</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Metrics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Breakdown */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Risk/Trade</span>
                      <span className="font-medium">{realRiskAnalytics.avgRiskPerTrade}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sharpe Ratio</span>
                      <span className="font-medium">{realRiskAnalytics.sharpeRatio}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sortino Ratio</span>
                      <span className="font-medium">{realRiskAnalytics.sortinoRatio}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Volatility</span>
                      <span className="font-medium">{realRiskAnalytics.volatility}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Beta to Market</span>
                      <span className="font-medium">{realRiskAnalytics.betaToMarket}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Correlation Risk</span>
                      <span className={`font-medium ${realRiskAnalytics.correlationRisk === 'High' ? 'text-red-600' : realRiskAnalytics.correlationRisk === 'Medium' ? 'text-orange-600' : 'text-green-600'}`}>
                        {realRiskAnalytics.correlationRisk}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Trades</span>
                      <span className="font-medium">{realRiskAnalytics.totalActiveTrades}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Risk Amount</span>
                      <span className="font-medium text-red-600">${realRiskAnalytics.totalRiskAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Distribution Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Position Risk Distribution</h3>
                  <div className="space-y-3">
                    {realRiskAnalytics.positionSizes.length > 0 ? realRiskAnalytics.positionSizes.slice(0, 8).map((position, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{position.pair}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${position.outcome === 'win' ? 'bg-green-500' : position.outcome === 'loss' ? 'bg-red-500' : 'bg-blue-500'}`}
                                 style={{width: `${Math.min(position.risk * 20, 100)}%`}}></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{position.risk.toFixed(1)}%</span>
                      </div>
                    )) : (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-gray-500">No position data available</p>
                        <p className="text-sm text-gray-400 mt-1">Start trading to see risk distribution</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk-Reward Analysis */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk-Reward Analysis</h3>
                  <div className="space-y-3">
                    {Object.keys(realRiskAnalytics.riskRewardData).length > 0 ? Object.entries(realRiskAnalytics.riskRewardData).map(([ratio, data], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{ratio}</p>
                          <p className="text-xs text-gray-600">{data.count} trades • {data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0}% win rate</p>
                        </div>
                        <div className="text-right">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: `${data.count > 0 ? (data.wins / data.count) * 100 : 0}%`}}></div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01m3 0h.01M9 11h.01m3 0h.01m3 0h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">No risk-reward data</p>
                        <p className="text-sm text-gray-400 mt-1">Add trades with risk-reward ratios to see analysis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Risk Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Drawdown Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Drawdown History</h3>
                  <div className="h-48 flex items-end justify-between space-x-1">
                    {realRiskAnalytics.drawdownHistory.length > 0 ? realRiskAnalytics.drawdownHistory.slice(-12).map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-red-500 rounded-t transition-all duration-300 hover:opacity-70"
                          style={{height: `${Math.max(point.drawdown * 5, 5)}px`}}
                        ></div>
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500">{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <p className="text-xs font-medium text-red-600">-{point.drawdown.toFixed(1)}%</p>
                        </div>
                      </div>
                    )) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm">No drawdown history</p>
                          <p className="text-xs text-gray-400">Start trading to see drawdown analysis</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Volatility Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Return Distribution</h3>
                  <div className="h-48 flex items-end justify-center space-x-1">
                    {realRiskAnalytics.returns.length > 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-32 rounded-full border-8 border-blue-200 relative">
                            <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{
                              clipPath: `polygon(50% 50%, 50% 0%, ${50 + (realRiskAnalytics.volatility * 2)}% 0%, ${50 + (realRiskAnalytics.volatility * 2)}% 100%, 50% 100%)`
                            }}></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-lg font-bold text-blue-600">{realRiskAnalytics.volatility}%</p>
                                <p className="text-xs text-gray-500">Volatility</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-medium text-green-600">
                                {realRiskAnalytics.returns.filter(r => r > 0).length}
                              </p>
                              <p className="text-gray-500">Positive</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-red-600">
                                {realRiskAnalytics.returns.filter(r => r < 0).length}
                              </p>
                              <p className="text-gray-500">Negative</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4" />
                          </svg>
                          <p className="text-sm">No return data</p>
                          <p className="text-xs text-gray-400">Complete trades to see distribution</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time-Based Risk Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Risk Pattern */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Hourly Risk Pattern</h3>
                  <div className="space-y-2">
                    {realRiskAnalytics.hourlyRisk.filter(hour => hour.trades > 0).slice(0, 8).map((hour, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium w-12">{hour.hour}:00</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${
                              hour.riskLevel === 'High' ? 'bg-red-500' :
                              hour.riskLevel === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                            }`} style={{width: `${Math.min((hour.losses / 100) * 100, 100)}%`}}></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{hour.trades} trades</span>
                          <p className="text-xs text-gray-500">${hour.losses.toFixed(0)} loss</p>
                        </div>
                      </div>
                    ))}
                    {realRiskAnalytics.hourlyRisk.filter(hour => hour.trades > 0).length === 0 && (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500">No hourly data</p>
                        <p className="text-sm text-gray-400 mt-1">Trade throughout the day to see patterns</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weekly Risk Pattern */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Risk Pattern</h3>
                  <div className="space-y-3">
                    {realRiskAnalytics.weeklyRisk.filter(day => day.trades > 0).map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium w-20">{day.day}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: `${day.winRate}%`}}></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{day.trades} trades</span>
                          <p className="text-xs text-gray-500">{day.winRate.toFixed(0)}% win rate</p>
                        </div>
                      </div>
                    ))}
                    {realRiskAnalytics.weeklyRisk.filter(day => day.trades > 0).length === 0 && (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">No weekly data</p>
                        <p className="text-sm text-gray-400 mt-1">Trade across different days to see patterns</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Risk Management Recommendations */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Management Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    realRiskAnalytics.portfolioRisk > 10 ? 'border-red-500 bg-red-50' :
                    realRiskAnalytics.portfolioRisk > 5 ? 'border-orange-500 bg-orange-50' :
                    'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className={`w-5 h-5 ${
                        realRiskAnalytics.portfolioRisk > 10 ? 'text-red-600' :
                        realRiskAnalytics.portfolioRisk > 5 ? 'text-orange-600' :
                        'text-green-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900">Portfolio Risk</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {realRiskAnalytics.portfolioRisk > 10 ?
                        'High risk exposure. Consider reducing position sizes.' :
                        realRiskAnalytics.portfolioRisk > 5 ?
                        'Moderate risk. Monitor closely and consider risk limits.' :
                        'Good risk management. Maintain current approach.'
                      }
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-l-4 ${
                    realRiskAnalytics.maxRiskPerTrade > 3 ? 'border-red-500 bg-red-50' :
                    realRiskAnalytics.maxRiskPerTrade > 2 ? 'border-orange-500 bg-orange-50' :
                    'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className={`w-5 h-5 ${
                        realRiskAnalytics.maxRiskPerTrade > 3 ? 'text-red-600' :
                        realRiskAnalytics.maxRiskPerTrade > 2 ? 'text-orange-600' :
                        'text-green-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <span className="font-medium text-gray-900">Position Sizing</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {realRiskAnalytics.maxRiskPerTrade > 3 ?
                        'Position sizes too large. Limit risk to 2% per trade.' :
                        realRiskAnalytics.maxRiskPerTrade > 2 ?
                        'Consider smaller position sizes for better risk control.' :
                        'Excellent position sizing discipline.'
                      }
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-l-4 ${
                    realRiskAnalytics.correlationRisk === 'High' ? 'border-red-500 bg-red-50' :
                    realRiskAnalytics.correlationRisk === 'Medium' ? 'border-orange-500 bg-orange-50' :
                    'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className={`w-5 h-5 ${
                        realRiskAnalytics.correlationRisk === 'High' ? 'text-red-600' :
                        realRiskAnalytics.correlationRisk === 'Medium' ? 'text-orange-600' :
                        'text-green-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <span className="font-medium text-gray-900">Diversification</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {realRiskAnalytics.correlationRisk === 'High' ?
                        'High correlation risk. Diversify across different pairs.' :
                        realRiskAnalytics.correlationRisk === 'Medium' ?
                        'Moderate correlation. Consider adding uncorrelated assets.' :
                        'Good diversification across trading pairs.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Psychology Analysis Page */}
          {activeMenu === 'psychology' && (
            <div className="space-y-6">
              {/* Psychology Overview */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Trading Psychology Overview</h3>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{psychologyData.confidenceLevel}/10</p>
                    <p className="text-sm text-gray-600">Confidence</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{psychologyData.disciplineScore}/10</p>
                    <p className="text-sm text-gray-600">Discipline</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{psychologyData.stressLevel}/10</p>
                    <p className="text-sm text-gray-600">Stress Level</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-xl font-bold text-purple-600">{psychologyData.emotionalState}</p>
                    <p className="text-sm text-gray-600">State</p>
                  </div>
                </div>

                {/* Emotional Balance Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Emotional Balance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Fear Index</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: `${psychologyData.fearIndex * 10}%`}}></div>
                          </div>
                          <span className="text-sm">{psychologyData.fearIndex}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Greed Index</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{width: `${psychologyData.greedIndex * 10}%`}}></div>
                          </div>
                          <span className="text-sm">{psychologyData.greedIndex}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">FOMO Level</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${psychologyData.fomo * 10}%`}}></div>
                          </div>
                          <span className="text-sm">{psychologyData.fomo}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Trading Behavior</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Impulsive Actions</span>
                          <span className="text-sm font-medium text-red-600">{psychologyData.impulsiveActions} this week</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Plan Adherence</span>
                          <span className="text-sm font-medium text-green-600">92%</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Risk Management</span>
                          <span className="text-sm font-medium text-blue-600">Excellent</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Psychology Events */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Psychology Events</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.132 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">FOMO Trade Taken</p>
                      <p className="text-xs text-gray-600">Entered EUR/USD without waiting for setup - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Disciplined Exit</p>
                      <p className="text-xs text-gray-600">Stuck to stop loss on GBP/JPY - 1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Positions & Portfolio Weights Page */}
          {activeMenu === 'positions' && (
            <div className="space-y-6">
              {/* Portfolio Summary */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Portfolio Overview</h3>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">$28,500</p>
                    <p className="text-sm text-gray-600">Total Position Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">+$701.40</p>
                    <p className="text-sm text-gray-600">Unrealized P&L</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">4</p>
                    <p className="text-sm text-gray-600">Active Positions</p>
                  </div>
                </div>
              </div>

              {/* Position Details Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Position Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pair</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {positionData.map((position, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-xs font-medium">{position.pair ? position.pair.split('/')[0] : 'N/A'}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{position.pair}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: `${position.weight}%`}}></div>
                              </div>
                              <span className="text-sm font-medium">{position.weight}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${position.position.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                              position.risk < 1 ? 'bg-green-100 text-green-800' : 
                              position.risk < 1.5 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {position.risk}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${position.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {position.pnl > 0 ? '+' : ''}${position.pnl}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Portfolio Allocation Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Allocation</h3>
                  <div className="space-y-4">
                    {positionData.map((position, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-green-500' : 
                            index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">{position.pair}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{position.weight}%</p>
                          <p className="text-xs text-gray-500">${position.position.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
                  <div className="h-48 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full border-8 border-gray-200"></div>
                      <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-blue-500 transform rotate-0" style={{clipPath: 'polygon(50% 50%, 50% 0%, 85% 0%, 85% 100%, 50% 100%)'}}></div>
                      <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-green-500 transform rotate-90" style={{clipPath: 'polygon(50% 50%, 50% 0%, 75% 0%, 75% 100%, 50% 100%)'}}></div>
                      <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-yellow-500 transform rotate-180" style={{clipPath: 'polygon(50% 50%, 50% 0%, 70% 0%, 70% 100%, 50% 100%)'}}></div>
                      <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-purple-500 transform rotate-270" style={{clipPath: 'polygon(50% 50%, 50% 0%, 70% 0%, 70% 100%, 50% 100%)'}}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">100%</p>
                          <p className="text-xs text-gray-500">Allocated</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern Advanced Analytics Page */}
          {activeMenu === 'analytics' && (
            <div className="space-y-8">
              {/* Enhanced Analytics Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-3xl p-8 border border-white/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Advanced Analytics
                      </h3>
                      <p className="text-gray-600 text-base font-medium mt-1">
                        Comprehensive performance analysis and detailed insights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <select className="px-5 py-3 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200 shadow-sm font-medium text-gray-900 appearance-none pr-10">
                        <option>Last 30 Days</option>
                        <option>Last 3 Months</option>
                        <option>Last 6 Months</option>
                        <option>Year to Date</option>
                        <option>All Time</option>
                        <option>Custom Range</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2 transform hover:scale-105">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Performance Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Return Card */}
                <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Total Return</p>
                      <p className={`text-3xl font-bold ${realAnalytics.performanceMetrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {realAnalytics.performanceMetrics.totalReturn >= 0 ? '+' : ''}{realAnalytics.performanceMetrics.totalReturn}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Annualized: {realAnalytics.performanceMetrics.annualizedReturn}%</p>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                      realAnalytics.performanceMetrics.totalReturn >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
                    }`}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={realAnalytics.performanceMetrics.totalReturn >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Sharpe Ratio Card */}
                <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Sharpe Ratio</p>
                      <p className="text-3xl font-bold text-blue-600">{realAnalytics.performanceMetrics.sharpeRatio}</p>
                      <p className="text-xs text-gray-500 mt-1">Sortino: {realAnalytics.performanceMetrics.sortinoRatio}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Max Drawdown Card */}
                <div className="bg-gradient-to-br from-white via-red-50/30 to-rose-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Max Drawdown</p>
                      <p className="text-3xl font-bold text-red-600">-{realAnalytics.performanceMetrics.maxDrawdown}%</p>
                      <p className="text-xs text-gray-500 mt-1">Calmar: {realAnalytics.performanceMetrics.calmarRatio}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* System Quality Card */}
                <div className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">System Quality</p>
                      <p className="text-3xl font-bold text-purple-600">{realAnalytics.performanceMetrics.sqn}</p>
                      <p className="text-xs text-gray-500 mt-1">SQN Rating</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Performance Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Monthly Performance</h4>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Positive</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">Negative</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-48 flex items-end justify-between space-x-1">
                    {realAnalytics.monthlyReturns.length > 0 ? realAnalytics.monthlyReturns.map((month, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full rounded-t ${month.return > 0 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300 hover:opacity-70`}
                          style={{height: `${Math.abs(month.return) * 20 + 20}px`}}
                        ></div>
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500">{month.month}</span>
                          <p className="text-xs font-medium">{month.return > 0 ? '+' : ''}{month.return}%</p>
                        </div>
                      </div>
                    )) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm">No monthly data available</p>
                          <p className="text-xs text-gray-400">Start trading to see monthly performance</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Real Trade Distribution Analysis */}
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-blue-500/5 overflow-hidden p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Trade Distribution</h4>
                          <p className="text-sm text-gray-600">Real trading activity breakdown</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-lg">
                        View Details
                      </button>
                    </div>
                    <div className="space-y-4">
                      {realStats.totalTrades > 0 ? (
                        <>
                          {/* Win/Loss Distribution */}
                          <div className="p-4 bg-gradient-to-r from-green-50 to-red-50 rounded-2xl border border-gray-200/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-gray-900">Win/Loss Distribution</span>
                              <span className="text-sm text-gray-600">{realStats.totalTrades} total trades</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-green-600 font-medium">Wins: {realStats.wins}</span>
                                  <span className="text-red-600 font-medium">Losses: {realStats.losses}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                                    style={{width: `${realStats.winRate}%`}}
                                  ></div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">{realStats.winRate.toFixed(1)}%</p>
                                <p className="text-xs text-gray-500">Win Rate</p>
                              </div>
                            </div>
                          </div>

                          {/* Profit Distribution */}
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-gray-200/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-gray-900">Profit Distribution</span>
                              <span className={`text-sm font-medium ${realStats.actualPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${realStats.actualPL >= 0 ? '+' : ''}{realStats.actualPL.toFixed(2)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-center p-3 bg-white/70 rounded-xl">
                                <p className="text-gray-600">Avg Win</p>
                                <p className="font-bold text-green-600">${realStats.avgWin.toFixed(2)}</p>
                              </div>
                              <div className="text-center p-3 bg-white/70 rounded-xl">
                                <p className="text-gray-600">Avg Loss</p>
                                <p className="font-bold text-red-600">${Math.abs(realStats.avgLoss).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium">No trade data available</p>
                          <p className="text-sm text-gray-400 mt-1">Start trading to see distribution analysis</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pair Analysis */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Currency Pair Analysis</h4>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    {realAnalytics.pairAnalysis.length > 0 ? realAnalytics.pairAnalysis.map((pair, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{pair.pair}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span>Trades: {pair.trades}</span>
                            <span>Win: {pair.winRate}%</span>
                            <span>Hold: {pair.avgHold}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${parseFloat(pair.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${parseFloat(pair.profit) >= 0 ? '+' : ''}${pair.profit}
                          </p>
                          <p className="text-xs text-gray-500">{pair.bestTime}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500">No pair analysis available</p>
                        <p className="text-sm text-gray-400 mt-1">Start trading different pairs to see analysis</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drawdown Analysis */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Drawdown Analysis</h4>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    {realAnalytics.drawdownAnalysis.length > 0 ? realAnalytics.drawdownAnalysis.map((dd, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-600">{dd.amount}%</p>
                          <p className="text-xs text-gray-600">{dd.period}</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>Duration: {dd.duration}</p>
                          <p>Recovery: {dd.recovery}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        <p className="text-gray-500">No drawdown data available</p>
                        <p className="text-sm text-gray-400 mt-1">Start trading to see drawdown analysis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Statistics Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Detailed Performance Metrics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Return Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Return</span>
                        <span className={`font-medium ${realAnalytics.performanceMetrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {realAnalytics.performanceMetrics.totalReturn >= 0 ? '+' : ''}{realAnalytics.performanceMetrics.totalReturn}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annualized Return</span>
                        <span className={`font-medium ${realAnalytics.performanceMetrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {realAnalytics.performanceMetrics.annualizedReturn >= 0 ? '+' : ''}{realAnalytics.performanceMetrics.annualizedReturn}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Drawdown</span>
                        <span className="font-medium text-red-600">-{realAnalytics.performanceMetrics.maxDrawdown}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calmar Ratio</span>
                        <span className="font-medium">{realAnalytics.performanceMetrics.calmarRatio}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Risk Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sharpe Ratio</span>
                        <span className="font-medium">{realAnalytics.performanceMetrics.sharpeRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sortino Ratio</span>
                        <span className="font-medium">{realAnalytics.performanceMetrics.sortinoRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">System Quality</span>
                        <span className="font-medium">{realAnalytics.performanceMetrics.sqn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Factor</span>
                        <span className="font-medium">
                          {realAnalytics.performanceMetrics.profitFactor === 999 ? '∞' : realAnalytics.performanceMetrics.profitFactor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Trade Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Win Rate</span>
                        <span className="font-medium">{realAnalytics.performanceMetrics.winRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Win</span>
                        <span className="font-medium text-green-600">${realAnalytics.performanceMetrics.avgWin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Loss</span>
                        <span className="font-medium text-red-600">${realAnalytics.performanceMetrics.avgLoss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expectancy</span>
                        <span className={`font-medium ${realAnalytics.performanceMetrics.expectancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${realAnalytics.performanceMetrics.expectancy >= 0 ? '+' : ''}{realAnalytics.performanceMetrics.expectancy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Performance Comparison */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-blue-500/5 overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-pink-50/20 pointer-events-none"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Account Performance</h3>
                        <p className="text-sm text-gray-600">Compare your trading accounts</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm font-semibold shadow-lg">
                      Manage Accounts
                    </button>
                  </div>
                  <div className="space-y-4">
                    {accounts.length > 0 ? accounts.map((account, index) => (
                      <div key={account.id || account._id} className="p-4 bg-gradient-to-r from-white/70 to-gray-50/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                              index === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                              index === 1 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                              index === 2 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                              'bg-gradient-to-br from-orange-500 to-orange-600'
                            }`}>
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-base">{account.name}</p>
                              <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  account.tag === 'personal' ? 'bg-blue-600' :
                                  account.tag === 'funded' ? 'bg-green-600' :
                                  account.tag === 'demo' ? 'bg-purple-600' :
                                  account.tag === 'forex' ? 'bg-orange-600' :
                                  account.tag === 'crypto' ? 'bg-indigo-600' : 'bg-gray-600'
                                } text-white`}>
                                  {account.tag === 'personal' ? 'Personal' :
                                   account.tag === 'funded' ? 'Funded' :
                                   account.tag === 'demo' ? 'Demo' :
                                   account.tag === 'forex' ? 'Forex' :
                                   account.tag === 'crypto' ? 'Crypto' :
                                   account.tag?.charAt(0).toUpperCase() + account.tag?.slice(1) || 'Unknown'}
                                </span>
                                <span>Balance: ${account.balance?.toFixed(2) || '0.00'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              account.growth >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {account.growth >= 0 ? '+' : ''}{account.growth?.toFixed(2) || '0.00'}%
                            </p>
                            <p className="text-xs text-gray-500">Growth</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No accounts available</p>
                        <p className="text-sm text-gray-400 mt-1">Add trading accounts to see performance comparison</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern Strategy Page */}
          {activeMenu === 'strategy' && (
            <div className="space-y-8">
              {/* Enhanced Strategy Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 rounded-3xl p-8 border border-white/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Trading Strategies
                      </h3>
                      <p className="text-gray-600 text-base font-medium mt-1">
                        Manage and analyze your trading strategies and setups
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateStrategyModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Strategy</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Strategy Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Active Strategies Card */}
                <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Active Strategies</p>
                      <p className="text-3xl font-bold text-blue-600">{getStrategyStats().active}</p>
                      <p className="text-xs text-gray-500 mt-1">Currently trading</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Testing Strategies Card */}
                <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Testing Strategies</p>
                      <p className="text-3xl font-bold text-orange-600">{getStrategyStats().testing}</p>
                      <p className="text-xs text-gray-500 mt-1">In development</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Total Strategies Card */}
                <div className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Total Strategies</p>
                      <p className="text-3xl font-bold text-purple-600">{getStrategyStats().total}</p>
                      <p className="text-xs text-gray-500 mt-1">Created</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Best Win Rate Card */}
                <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Best Win Rate</p>
                      <p className="text-3xl font-bold text-green-600">
                        {getStrategyStats().performance.length > 0
                          ? `${Math.max(...getStrategyStats().performance.map(s => s.winRate))}%`
                          : 'N/A'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Highest performer</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Trading Strategies - Main List */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-purple-500/5 overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Your Trading Strategies</h4>
                        <p className="text-sm text-gray-600">Manage and monitor your strategy performance</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateStrategyModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-lg flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Strategy</span>
                    </button>
                  </div>
                  {strategies.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-lg">
                      {/* Table Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-gray-700">
                          <div className="col-span-3">Strategy</div>
                          <div className="col-span-2">Status & Markets</div>
                          <div className="col-span-1 text-center">Trades</div>
                          <div className="col-span-1 text-center">Win Rate</div>
                          <div className="col-span-2 text-center">Total P&L</div>
                          <div className="col-span-1 text-center">Avg Trade</div>
                          <div className="col-span-2 text-center">Actions</div>
                        </div>
                      </div>

                      {/* Strategy List */}
                      <div className="divide-y divide-gray-100">
                        {strategies.map((strategy, index) => {
                          // Calculate real performance metrics for each strategy
                          const strategyTrades = trades.filter(trade =>
                            trade.strategy === strategy.name ||
                            trade.notes?.toLowerCase().includes(strategy.name.toLowerCase())
                          );
                          // Use correct field names: status 'win'/'loss' instead of 'closed', actualProfit instead of actualPL
                          const closedTrades = strategyTrades.filter(trade => trade.status === 'win' || trade.status === 'loss');
                          const wins = closedTrades.filter(trade => trade.status === 'win');
                          const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
                          const totalPL = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.actualProfit || trade.calculations?.actualPL || 0), 0);
                          const avgTrade = closedTrades.length > 0 ? totalPL / closedTrades.length : 0;

                          return (
                            <div key={strategy._id || index} className="px-6 py-4 hover:bg-gray-50/50 transition-all duration-200 group">
                              <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Strategy Info */}
                                <div className="col-span-3">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                                      index % 4 === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                      index % 4 === 1 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                                      index % 4 === 2 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                      'bg-gradient-to-br from-orange-500 to-orange-600'
                                    }`}>
                                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-gray-900 text-sm">{strategy.name}</h5>
                                      <p className="text-xs text-gray-500">{strategy.tradingStyle}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Status & Markets */}
                                <div className="col-span-2">
                                  <div className="space-y-1">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                      strategy.status === 'active' ? 'bg-green-100 text-green-700' :
                                      strategy.status === 'testing' ? 'bg-blue-100 text-blue-700' :
                                      strategy.status === 'paused' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {strategy.status || 'Active'}
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {strategy.marketType?.slice(0, 2).map((market, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                          {market}
                                        </span>
                                      ))}
                                      {strategy.marketType?.length > 2 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                          +{strategy.marketType.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Trades Count */}
                                <div className="col-span-1 text-center">
                                  <p className="text-lg font-bold text-gray-900">{strategyTrades.length}</p>
                                  <p className="text-xs text-gray-500">Total</p>
                                </div>

                                {/* Win Rate */}
                                <div className="col-span-1 text-center">
                                  <p className={`text-lg font-bold ${winRate >= 60 ? 'text-green-600' : winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {winRate.toFixed(0)}%
                                  </p>
                                  <p className="text-xs text-gray-500">Win Rate</p>
                                </div>

                                {/* Total P&L */}
                                <div className="col-span-2 text-center">
                                  <p className={`text-lg font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${totalPL >= 0 ? '+' : ''}{totalPL.toFixed(0)}
                                  </p>
                                  <p className="text-xs text-gray-500">Total P&L</p>
                                </div>

                                {/* Average Trade */}
                                <div className="col-span-1 text-center">
                                  <p className={`text-lg font-bold ${avgTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${avgTrade >= 0 ? '+' : ''}{avgTrade.toFixed(0)}
                                  </p>
                                  <p className="text-xs text-gray-500">Avg Trade</p>
                                </div>

                                {/* Action Buttons with SVG Icons */}
                                <div className="col-span-2">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => handleViewStrategy(strategy)}
                                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors group-hover:scale-105 transform duration-200"
                                      title="View Strategy"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleEditStrategy(strategy)}
                                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors group-hover:scale-105 transform duration-200"
                                      title="Edit Strategy"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStrategy(strategy._id)}
                                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors group-hover:scale-105 transform duration-200"
                                      title="Delete Strategy"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No strategies created yet</p>
                      <p className="text-sm text-gray-400 mt-1">Create strategies to see live performance data</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Strategy Analytics */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-indigo-500/5 overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/20 pointer-events-none"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Strategy Analytics</h4>
                        <p className="text-sm text-gray-600">Performance insights and comparisons</p>
                      </div>
                    </div>
                  </div>

                  {strategies.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Strategy Performance Comparison */}
                      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl border border-gray-200/60 p-6">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h5>
                        <div className="space-y-4">
                          {strategies.slice(0, 5).map((strategy, index) => {
                            const strategyTrades = trades.filter(trade =>
                              trade.strategy === strategy.name ||
                              trade.notes?.toLowerCase().includes(strategy.name.toLowerCase())
                            );
                            const closedTrades = strategyTrades.filter(trade => trade.status === 'win' || trade.status === 'loss');
                            const wins = closedTrades.filter(trade => trade.status === 'win');
                            const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
                            const totalPL = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.actualProfit || trade.calculations?.actualPL || 0), 0);

                            return (
                              <div key={strategy._id || index} className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full shadow-sm ${
                                      index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                      index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                      index === 2 ? 'bg-gradient-to-r from-purple-500 to-violet-500' :
                                      'bg-gradient-to-r from-orange-500 to-red-500'
                                    }`}></div>
                                    <span className="font-semibold text-gray-900 text-sm">{strategy.name}</span>
                                  </div>
                                  <span className={`font-bold text-sm ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${totalPL >= 0 ? '+' : ''}{totalPL.toFixed(0)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <p className="text-lg font-bold text-gray-900">{strategyTrades.length}</p>
                                    <p className="text-xs text-gray-500">Trades</p>
                                  </div>
                                  <div>
                                    <p className={`text-lg font-bold ${winRate >= 60 ? 'text-green-600' : winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                      {winRate.toFixed(0)}%
                                    </p>
                                    <p className="text-xs text-gray-500">Win Rate</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-bold text-gray-900">{closedTrades.length}</p>
                                    <p className="text-xs text-gray-500">Closed</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Top Performing Strategies */}
                      <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 rounded-2xl border border-gray-200/60 p-6">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h5>
                        <div className="space-y-4">
                          {strategies
                            .map((strategy, index) => {
                              const strategyTrades = trades.filter(trade =>
                                trade.strategy === strategy.name ||
                                trade.notes?.toLowerCase().includes(strategy.name.toLowerCase())
                              );
                              const closedTrades = strategyTrades.filter(trade => trade.status === 'win' || trade.status === 'loss');
                              const totalPL = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.actualProfit || trade.calculations?.actualPL || 0), 0);
                              return { ...strategy, totalPL, index };
                            })
                            .sort((a, b) => b.totalPL - a.totalPL)
                            .slice(0, 5)
                            .map((strategy, rank) => {
                              const strategyTrades = trades.filter(trade =>
                                trade.strategy === strategy.name ||
                                trade.notes?.toLowerCase().includes(strategy.name.toLowerCase())
                              );
                              const closedTrades = strategyTrades.filter(trade => trade.status === 'win' || trade.status === 'loss');
                              const wins = closedTrades.filter(trade => trade.status === 'win');
                              const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

                              return (
                                <div key={strategy._id || strategy.index} className="p-4 bg-gradient-to-r from-white/70 to-gray-50/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                                        rank === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                        rank === 1 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                                        rank === 2 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                        'bg-gradient-to-br from-orange-500 to-orange-600'
                                      }`}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900">{strategy.name}</p>
                                        <p className="text-sm text-gray-600">{strategy.tradingStyle}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-lg font-bold ${strategy.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${strategy.totalPL >= 0 ? '+' : ''}{strategy.totalPL.toFixed(0)}
                                      </p>
                                      <p className="text-sm text-gray-500">{winRate.toFixed(0)}% Win Rate</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No strategy data available</p>
                      <p className="text-sm text-gray-400 mt-1">Create strategies and execute trades to see analytics</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}




          {/* Economic Calendar Page */}
          {activeMenu === 'forex-news' && (
            <div className="space-y-8">
              {/* Modern Header with Gradient */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-3xl p-8 border border-white/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Economic Calendar
                      </h1>
                    </div>
                    <p className="text-gray-600 text-base font-medium">Today's market-moving events and announcements</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                      <span className="text-gray-700 text-sm font-semibold">Live Updates</span>
                    </div>
                    <select className="text-sm font-medium border-0 bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/90 transition-all">
                      <option>Today</option>
                      <option>Tomorrow</option>
                      <option>This Week</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Beautiful Economic Calendar */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-blue-500/5 overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"></div>

                {/* Header */}
                <div className="relative p-8 border-b border-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Today's Events
                      </h3>
                      <p className="text-gray-600 mt-1">Market-moving announcements</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Real-time Clock */}
                      <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 shadow-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="text-sm">
                          <div className="font-bold text-gray-900">
                            {getCurrentTimeInTimezone().time}
                          </div>
                          <div className="text-xs text-gray-600">
                            {getCurrentTimeInTimezone().date}
                          </div>
                        </div>
                        <div className="text-xs font-medium text-blue-600">
                          {getCurrentTimeInTimezone().timezone.abbreviation}
                        </div>
                      </div>

                      {/* Timezone Dropdown */}
                      <div className="relative timezone-dropdown">
                        <button
                          onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-gray-100/80 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">
                            {getSelectedTimezoneInfo().abbreviation}
                          </span>
                          <svg className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${showTimezoneDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Timezone Dropdown Menu */}
                        {showTimezoneDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-96 bg-white/95 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-2xl z-50 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100/50">
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Trading Timezone</h3>

                              {/* Search Input */}
                              <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                  type="text"
                                  placeholder="Search by city, country, or timezone..."
                                  value={timezoneSearchQuery}
                                  onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/80 backdrop-blur-sm"
                                />
                              </div>
                            </div>

                            {/* Popular Timezones Section */}
                            {!timezoneSearchQuery && (
                              <div className="p-4 border-b border-gray-100/50">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Popular Trading Centers</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {getFilteredTimezones().filter(tz => tz.isPopular).slice(0, 6).map((timezone) => (
                                    <button
                                      key={timezone.id}
                                      onClick={() => {
                                        setSelectedTimezone(timezone.id);
                                        setShowTimezoneDropdown(false);
                                        setTimezoneSearchQuery('');
                                      }}
                                      className={`p-2 rounded-xl text-left transition-all duration-200 ${
                                        selectedTimezone === timezone.id
                                          ? 'bg-blue-500 text-white shadow-md'
                                          : 'bg-gray-50/80 hover:bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <FlagSVG country={timezone.countryCode} className="w-5 h-3.5 rounded-sm" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-medium truncate">{timezone.city}</div>
                                          <div className="text-xs opacity-75">{timezone.abbreviation}</div>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* All Timezones List */}
                            <div className="max-h-80 overflow-y-auto">
                              <div className="p-2">
                                {!timezoneSearchQuery && (
                                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 px-2">All Timezones</h4>
                                )}

                                {getFilteredTimezones().map((timezone) => (
                                  <button
                                    key={timezone.id}
                                    onClick={() => {
                                      setSelectedTimezone(timezone.id);
                                      setShowTimezoneDropdown(false);
                                      setTimezoneSearchQuery('');
                                    }}
                                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 mb-1 ${
                                      selectedTimezone === timezone.id
                                        ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]'
                                        : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0">
                                        <FlagSVG country={timezone.countryCode} className="w-6 h-4 rounded-sm shadow-sm" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-sm truncate">{timezone.name}</span>
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            selectedTimezone === timezone.id
                                              ? 'bg-white/20 text-white'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            GMT{timezone.offset >= 0 ? '+' : ''}{timezone.offset}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-xs opacity-75 truncate">{timezone.city}, {timezone.country}</span>
                                          <span className={`text-xs font-medium ${
                                            selectedTimezone === timezone.id ? 'text-white' : 'text-blue-600'
                                          }`}>
                                            {timezone.abbreviation}
                                          </span>
                                        </div>
                                        {timezone.description && (
                                          <div className="text-xs opacity-60 mt-1 truncate">{timezone.description}</div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}

                                {getFilteredTimezones().length === 0 && (
                                  <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-sm text-gray-500">No timezones found</p>
                                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impact Level Filters */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Filter by Impact Level</h4>
                    <div className="flex items-center space-x-2 bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-1">
                      <button
                        onClick={() => setEconomicCalendarFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          economicCalendarFilter === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                      >
                        All Events
                      </button>
                      <button
                        onClick={() => setEconomicCalendarFilter('high')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          economicCalendarFilter === 'high'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        High Impact
                      </button>
                      <button
                        onClick={() => setEconomicCalendarFilter('medium')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          economicCalendarFilter === 'medium'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                        }`}
                      >
                        Medium Impact
                      </button>
                      <button
                        onClick={() => setEconomicCalendarFilter('low')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          economicCalendarFilter === 'low'
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        Low Impact
                      </button>
                    </div>
                  </div>
                </div>

                {/* Beautiful Event List */}
                <div className="relative space-y-4 p-6">
                  {economicCalendarLoading ? (
                    // Loading State
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 animate-pulse">
                          <div className="flex items-start space-x-6">
                            <div className="flex-shrink-0">
                              <div className="bg-gray-200 rounded-2xl w-20 h-16"></div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="bg-gray-200 rounded-xl w-14 h-10"></div>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="bg-gray-200 rounded h-6 w-3/4"></div>
                              <div className="bg-gray-200 rounded h-4 w-full"></div>
                              <div className="flex space-x-4">
                                <div className="bg-gray-200 rounded h-4 w-20"></div>
                                <div className="bg-gray-200 rounded h-4 w-20"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredEconomicEvents.length === 0 ? (
                    // No Data State
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Economic Events</h3>
                      <p className="text-gray-600">
                        {economicCalendarFilter === 'all'
                          ? 'No economic events scheduled for today.'
                          : `No ${economicCalendarFilter} impact events found.`
                        }
                      </p>
                    </div>
                  ) : (
                    // Event List
                    filteredEconomicEvents.map((event, index) => (
                    <div key={event.id} className="group relative">
                      {/* Event Card */}
                      <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg shadow-gray-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                        {/* Gradient overlay for high impact events */}
                        {event.importance === 'high' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-pink-50/30 rounded-2xl pointer-events-none"></div>
                        )}
                        {event.importance === 'medium' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-yellow-50/30 rounded-2xl pointer-events-none"></div>
                        )}

                        <div className="relative flex items-start space-x-6">
                          {/* Time Badge */}
                          <div className="flex-shrink-0">
                            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl px-4 py-3 border border-slate-200/50 shadow-sm">
                              <div className="text-lg font-bold text-slate-700 font-mono">{event.time}</div>
                              <div className="text-xs text-slate-500 font-medium">{event.timezone || getSelectedTimezoneInfo().abbreviation}</div>
                            </div>
                          </div>

                          {/* Currency Badge */}
                          <div className="flex-shrink-0">
                            <div className={`w-14 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                              event.currency === 'USD' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                              event.currency === 'EUR' ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                              event.currency === 'GBP' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                              event.currency === 'JPY' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                              event.currency === 'CAD' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                            }`}>
                              {event.currency}
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                {/* Country Flag */}
                                <div className="flex-shrink-0">
                                  <FlagSVG
                                    country={getCurrencyCountryCode(event.currency)}
                                    className="w-6 h-4 rounded-sm shadow-sm border border-white/50"
                                  />
                                </div>

                                <h4 className="text-lg font-bold text-gray-900 leading-tight">{event.event}</h4>
                                <div className={`w-3 h-3 rounded-full shadow-sm ${
                                  event.importance === 'high' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                  event.importance === 'medium' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                  'bg-gradient-to-r from-green-400 to-green-500'
                                }`}></div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                event.importance === 'high' ? 'bg-red-100 text-red-700' :
                                event.importance === 'medium' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {event.importance.toUpperCase()}
                              </span>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed mb-4">{event.description}</p>

                            {/* Data Points */}
                            <div className="flex items-center space-x-8">
                              {event.forecast && (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  <span className="text-sm text-gray-500 font-medium">Forecast:</span>
                                  <span className="text-sm font-bold text-blue-600">{event.forecast}</span>
                                </div>
                              )}
                              {event.previous && (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-sm text-gray-500 font-medium">Previous:</span>
                                  <span className="text-sm font-bold text-gray-700">{event.previous}</span>
                                </div>
                              )}
                              {event.actual && (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-sm text-gray-500 font-medium">Actual:</span>
                                  <span className="text-sm font-bold text-green-600">{event.actual}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>


              </div>


            </div>
          )}

          {/* Other Menu Items - Coming Soon */}
          {!['dashboard', 'analytics', 'strategy', 'sessions', 'risk-analysis', 'forex-news', 'calendar'].includes(activeMenu) && (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                {menuItems.find(item => item.id === activeMenu)?.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">
                {activeMenu.replace('-', ' ')} Coming Soon
              </h3>
              <p className="text-gray-500">
                This feature is under development and will be available soon.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Add New Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Account</h3>
                <button
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setNewAccount({ name: '', balance: '', tag: 'personal' });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="e.g., My Trading Account"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Balance
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Account Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'personal', label: 'Personal', color: 'bg-blue-600' },
                    { value: 'funded', label: 'Funded', color: 'bg-green-600' },
                    { value: 'demo', label: 'Demo', color: 'bg-purple-600' },
                    { value: 'forex', label: 'Forex', color: 'bg-orange-600' },
                    { value: 'crypto', label: 'Crypto', color: 'bg-indigo-600' }
                  ].map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() => setNewAccount({ ...newAccount, tag: tag.value })}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                        newAccount.tag === tag.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${tag.color}`}></div>
                      <span className="font-medium text-gray-900">{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getTagColor(newAccount.tag)}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {newAccount.name || 'Account Name'}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${newAccount.balance ? parseFloat(newAccount.balance).toLocaleString() : '0.00'} • {getTagDisplayName(newAccount.tag)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setNewAccount({ name: '', balance: '', tag: 'personal' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAccount}
                  disabled={!newAccount.name || !newAccount.balance}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showAccountDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowAccountDropdown(false)}
        ></div>
      )}

      {/* Modern Professional Create Strategy Modal */}
      {showCreateStrategyModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-gray-200">
            {/* Professional Modal Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {editingStrategy ? 'Edit Trading Strategy' : 'Create Trading Strategy'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 font-medium">
                      {editingStrategy ? 'Update your trading strategy configuration' : 'Build your comprehensive trading strategy step by step'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateStrategyModal(false);
                    setCurrentStep(1);
                    setEditingStrategy(null);
                    setStrategyForm({
                      name: '',
                      marketType: [],
                      tradingStyle: '',
                      description: '',
                      entryConditions: '',
                      exitConditions: '',
                      stopLossLogic: '',
                      takeProfitLogic: '',
                      riskPerTrade: '',
                      maxDailyRisk: '',
                      maxOpenTrades: '',
                      positionSizing: '',
                      indicators: [],
                      toolsPatterns: [],
                      tags: '',
                      status: 'testing',
                      version: '1.0'
                    });
                  }}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modern Progress Bar with SVG Icons */}
              <div className="mt-8">
                <div className="flex items-center justify-between px-4">
                  {[
                    {
                      step: 1,
                      label: "Foundation",
                      icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    },
                    {
                      step: 2,
                      label: "Logic",
                      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    },
                    {
                      step: 3,
                      label: "Risk",
                      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    },
                    {
                      step: 4,
                      label: "Tools",
                      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    },
                    {
                      step: 5,
                      label: "Settings",
                      icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    },
                    {
                      step: 6,
                      label: "Review",
                      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    }
                  ].map((item, index) => (
                    <div key={item.step} className="flex flex-col items-center relative">
                      {/* Step Circle with SVG Icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                        item.step <= currentStep
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white transform scale-110'
                          : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>

                      {/* Step Label */}
                      <span className={`text-sm font-semibold mt-3 transition-colors duration-300 ${
                        item.step <= currentStep ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </span>

                      {/* Progress Line */}
                      {index < 5 && (
                        <div className={`absolute top-7 left-full w-16 h-1 rounded-full transition-all duration-300 ${
                          item.step < currentStep ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Professional Modal Body */}
            <div className="overflow-y-auto max-h-[calc(95vh-280px)] bg-gray-50">
              <div className="px-8 py-8">
                {/* Step 1: Foundation - Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Strategy Foundation</h4>
                      <p className="text-gray-600">Define the core characteristics and market focus of your trading strategy</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                      {/* Strategy Name */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          Strategy Name <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={strategyForm.name}
                            onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
                            placeholder="e.g., London Breakout Scalping, MACD Divergence Reversal"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pr-10"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Market Types with SVG Icons */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          Market Types <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'Forex', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                            { name: 'Crypto', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01m3 0h.01M9 11h.01m3 0h.01m3 0h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                            { name: 'Stocks', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                            { name: 'Indices', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                            { name: 'Commodities', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                            { name: 'Options', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
                          ].map((market) => (
                            <button
                              key={market.name}
                              onClick={() => {
                                const newMarkets = strategyForm.marketType.includes(market.name)
                                  ? strategyForm.marketType.filter(m => m !== market.name)
                                  : [...strategyForm.marketType, market.name];
                                setStrategyForm({ ...strategyForm, marketType: newMarkets });
                              }}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 ${
                                strategyForm.marketType.includes(market.name)
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                strategyForm.marketType.includes(market.name)
                                  ? 'bg-blue-100'
                                  : 'bg-gray-100'
                              }`}>
                                <svg className={`w-4 h-4 ${
                                  strategyForm.marketType.includes(market.name) ? 'text-blue-600' : 'text-gray-600'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={market.icon} />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold">{market.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Trading Style with SVG Icons */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          Trading Style <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={strategyForm.tradingStyle}
                            onChange={(e) => setStrategyForm({ ...strategyForm, tradingStyle: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white pr-10"
                          >
                            <option value="">Select Trading Style</option>
                            <option value="scalping">Scalping (1-15 minutes)</option>
                            <option value="day-trading">Day Trading (15 minutes - 4 hours)</option>
                            <option value="swing-trading">Swing Trading (4 hours - 1 week)</option>
                            <option value="position-trading">Position Trading (1 week+)</option>
                            <option value="algorithmic">Algorithmic Trading</option>
                            <option value="news-based">News-Based Trading</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Strategy Description */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          Strategy Description
                        </label>
                        <textarea
                          value={strategyForm.description}
                          onChange={(e) => setStrategyForm({ ...strategyForm, description: e.target.value })}
                          placeholder="Provide a comprehensive overview of your strategy including market behavior, core logic, expected edge, and any historical performance..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Trading Logic Enhancement */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Trading Logic</h4>
                      <p className="text-gray-600">Define precise entry and exit conditions for your strategy</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                      {/* Entry Conditions */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          Entry Conditions <span className="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                          value={strategyForm.entryConditions}
                          onChange={(e) => setStrategyForm({ ...strategyForm, entryConditions: e.target.value })}
                          placeholder="Example: IF RSI < 30 on 1H AND Bullish Engulfing Candle forms on Support Zone → Enter Long Position"
                          rows={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                        />
                      </div>

                      {/* Exit Conditions */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3m13 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          Exit Conditions <span className="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                          value={strategyForm.exitConditions}
                          onChange={(e) => setStrategyForm({ ...strategyForm, exitConditions: e.target.value })}
                          placeholder="Example: Exit when RSI > 70, MACD bearish crossover, or maximum 4-hour time limit reached..."
                          rows={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                        />
                      </div>

                      {/* Stop Loss Logic */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                            </svg>
                          </div>
                          Stop Loss Logic
                        </label>
                        <textarea
                          value={strategyForm.stopLossLogic}
                          onChange={(e) => setStrategyForm({ ...strategyForm, stopLossLogic: e.target.value })}
                          placeholder="Example: Fixed 20 pips, 2x ATR-based, or previous swing low/high structure-based stop loss..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                        />
                      </div>

                      {/* Take Profit Logic */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          Take Profit Logic
                        </label>
                        <textarea
                          value={strategyForm.takeProfitLogic}
                          onChange={(e) => setStrategyForm({ ...strategyForm, takeProfitLogic: e.target.value })}
                          placeholder="Example: 1:2 risk-reward ratio, key resistance levels, or trailing stop at 50% profit..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Risk Management Enhancement */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Risk Management</h4>
                      <p className="text-gray-600">Set your risk parameters and position sizing rules</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
                      {/* Risk Per Trade */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          Risk Per Trade <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={strategyForm.riskPerTrade}
                          onChange={(e) => setStrategyForm({ ...strategyForm, riskPerTrade: e.target.value })}
                          placeholder="1.5% or $100"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      {/* Max Daily Risk */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          Max Daily Risk
                        </label>
                        <input
                          type="text"
                          value={strategyForm.maxDailyRisk}
                          onChange={(e) => setStrategyForm({ ...strategyForm, maxDailyRisk: e.target.value })}
                          placeholder="5% or $500"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      {/* Max Open Trades */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                          </div>
                          Max Open Trades
                        </label>
                        <input
                          type="number"
                          value={strategyForm.maxOpenTrades}
                          onChange={(e) => setStrategyForm({ ...strategyForm, maxOpenTrades: e.target.value })}
                          placeholder="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      {/* Position Sizing Method */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 016.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
                          </svg>
                          Position Sizing Method
                        </label>
                        <select
                          value={strategyForm.positionSizing}
                          onChange={(e) => setStrategyForm({ ...strategyForm, positionSizing: e.target.value })}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                        >
                          <option value="">Select Method</option>
                          <option value="fixed">📏 Fixed Lot Size</option>
                          <option value="risk-based">📊 Risk-Based (% of account)</option>
                          <option value="volatility">📈 Volatility-Based (ATR)</option>
                          <option value="kelly">🎯 Kelly Criterion</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Indicators & Tools */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Technical Arsenal</h4>
                      <p className="text-gray-600 text-lg">Select your indicators and analytical tools</p>
                    </div>

                    <div className="space-y-8">
                      {/* Technical Indicators */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                          <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Technical Indicators
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {[
                            { name: 'RSI (14)', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                            { name: 'MACD', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                            { name: 'EMA 200', icon: 'M7 12l3-3 3 3 4-4' },
                            { name: 'SMA 50', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                            { name: 'Bollinger Bands', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7c0 2.21-3.582 4-8 4s-8-1.79-8-4z' },
                            { name: 'Stochastic', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4' },
                            { name: 'ADX', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
                            { name: 'ATR', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
                            { name: 'Fibonacci', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                            { name: 'Volume', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
                            { name: 'CCI', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                            { name: 'Williams %R', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }
                          ].map((indicator) => (
                            <button
                              key={indicator.name}
                              onClick={() => {
                                const newIndicators = strategyForm.indicators.includes(indicator.name)
                                  ? strategyForm.indicators.filter(i => i !== indicator.name)
                                  : [...strategyForm.indicators, indicator.name];
                                setStrategyForm({ ...strategyForm, indicators: newIndicators });
                              }}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                                strategyForm.indicators.includes(indicator.name)
                                  ? 'border-purple-500 bg-purple-50 text-purple-700 transform scale-105'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={indicator.icon} />
                              </svg>
                              <span className="text-xs font-medium text-center">{indicator.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tools & Patterns */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Chart Analysis Tools
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { name: 'Trendlines', icon: 'M7 12l3-3 3 3 4-4' },
                            { name: 'Support/Resistance', icon: 'M4 6h16M4 12h16M4 18h16' },
                            { name: 'Supply/Demand', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3' },
                            { name: 'Chart Patterns', icon: 'M8 13v-1m4 1v-3m4 3V8M8 21l4-7 4 7M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
                            { name: 'Candlestick Patterns', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
                            { name: 'Price Action', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                            { name: 'Market Structure', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
                            { name: 'Order Flow', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
                            { name: 'Volume Profile', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }
                          ].map((tool) => (
                            <button
                              key={tool.name}
                              onClick={() => {
                                const newTools = strategyForm.toolsPatterns.includes(tool.name)
                                  ? strategyForm.toolsPatterns.filter(t => t !== tool.name)
                                  : [...strategyForm.toolsPatterns, tool.name];
                                setStrategyForm({ ...strategyForm, toolsPatterns: newTools });
                              }}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                                strategyForm.toolsPatterns.includes(tool.name)
                                  ? 'border-orange-500 bg-orange-50 text-orange-700 transform scale-105'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                              </svg>
                              <span className="text-xs font-medium text-center">{tool.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Strategy Settings */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Strategy Configuration</h4>
                      <p className="text-gray-600 text-lg">Finalize your strategy settings and metadata</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Tags */}
                      <div className="lg:col-span-2">
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Strategy Tags
                        </label>
                        <input
                          type="text"
                          value={strategyForm.tags}
                          onChange={(e) => setStrategyForm({ ...strategyForm, tags: e.target.value })}
                          placeholder="trend-following, momentum, breakout, london-session"
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-2">Separate tags with commas for better organization</p>
                      </div>

                      {/* Strategy Status */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Strategy Status
                        </label>
                        <select
                          value={strategyForm.status}
                          onChange={(e) => setStrategyForm({ ...strategyForm, status: e.target.value })}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                        >
                          <option value="testing">🧪 Testing</option>
                          <option value="active">✅ Active</option>
                          <option value="paused">⏸️ Paused</option>
                          <option value="archived">📦 Archived</option>
                        </select>
                      </div>

                      {/* Version */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                          Strategy Version
                        </label>
                        <input
                          type="text"
                          value={strategyForm.version}
                          onChange={(e) => setStrategyForm({ ...strategyForm, version: e.target.value })}
                          placeholder="1.0"
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-2">Use semantic versioning (e.g., 1.0, 1.1, 2.0)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Review & Save */}
                {currentStep === 6 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Strategy Overview</h4>
                      <p className="text-gray-600 text-lg">Review your strategy before saving</p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Basic Information Card */}
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <h5 className="font-bold text-gray-900">Basic Information</h5>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Name:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.name || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Markets:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.marketType.join(', ') || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Style:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.tradingStyle || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Status:</span>
                              <span className={`font-semibold ${
                                strategyForm.status === 'active' ? 'text-green-600' :
                                strategyForm.status === 'testing' ? 'text-blue-600' :
                                strategyForm.status === 'paused' ? 'text-orange-600' : 'text-gray-600'
                              }`}>
                                {strategyForm.status.charAt(0).toUpperCase() + strategyForm.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Version:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.version}</span>
                            </div>
                          </div>
                        </div>

                        {/* Risk Management Card */}
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                          <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <h5 className="font-bold text-gray-900">Risk Management</h5>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Risk per Trade:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.riskPerTrade || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Max Daily Risk:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.maxDailyRisk || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Max Open Trades:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.maxOpenTrades || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Position Sizing:</span>
                              <span className="text-gray-900 font-semibold">{strategyForm.positionSizing || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Technical Tools Section */}
                      {(strategyForm.indicators.length > 0 || strategyForm.toolsPatterns.length > 0) && (
                        <div className="mt-8 space-y-6">
                          {strategyForm.indicators.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                              <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-900">Technical Indicators ({strategyForm.indicators.length})</h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {strategyForm.indicators.map((indicator, index) => (
                                  <span key={index} className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg font-medium border border-purple-200">
                                    {indicator}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {strategyForm.toolsPatterns.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                              <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                  </svg>
                                </div>
                                <h5 className="font-bold text-gray-900">Analysis Tools ({strategyForm.toolsPatterns.length})</h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {strategyForm.toolsPatterns.map((tool, index) => (
                                  <span key={index} className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-lg font-medium border border-orange-200">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Modal Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Previous</span>
                  </button>

                  <div className="flex items-center space-x-3">
                    {/* Step Indicator */}
                    <span className="text-sm text-gray-500 font-medium">
                      Step {currentStep} of 6
                    </span>

                    <button
                      onClick={() => {
                        setShowCreateStrategyModal(false);
                        setCurrentStep(1);
                        setEditingStrategy(null);
                        setStrategyForm({
                          name: '',
                          marketType: [],
                          tradingStyle: '',
                          description: '',
                          entryConditions: '',
                          exitConditions: '',
                          stopLossLogic: '',
                          takeProfitLogic: '',
                          riskPerTrade: '',
                          maxDailyRisk: '',
                          maxOpenTrades: '',
                          positionSizing: '',
                          indicators: [],
                          toolsPatterns: [],
                          tags: '',
                          status: 'testing',
                          version: '1.0'
                        });
                      }}
                      className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium shadow-sm"
                    >
                      Cancel
                    </button>

                    {currentStep < 6 ? (
                      <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg transform hover:scale-105"
                      >
                        <span>Next Step</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveStrategy}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{editingStrategy ? 'Update Strategy' : 'Save Strategy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage All Strategies Modal */}
      {showManageAllModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Manage All Strategies</h3>
                    <p className="text-sm text-gray-600 mt-1">View, edit, delete, and manage your trading strategies</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageAllModal(false)}
                  className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/80 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              {strategies.length > 0 ? (
                <div className="space-y-4">
                  {strategies.map((strategy, index) => (
                    <div key={strategy._id || index} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
                      {/* Strategy Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-4 h-4 rounded-full ${
                              strategy.status === 'active' ? 'bg-green-500' :
                              strategy.status === 'testing' ? 'bg-blue-500' :
                              strategy.status === 'paused' ? 'bg-orange-500' : 'bg-gray-500'
                            }`}></div>
                            <h4 className="text-lg font-bold text-gray-900">{strategy.name}</h4>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              strategy.status === 'active' ? 'bg-green-100 text-green-800' :
                              strategy.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                              strategy.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{strategy.tradingStyle} • {strategy.marketType?.join(', ')}</p>
                          {strategy.description && (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-3">{strategy.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Strategy Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium">Version</p>
                          <p className="text-sm font-semibold text-gray-900">v{strategy.version}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium">Risk/Trade</p>
                          <p className="text-sm font-semibold text-gray-900">{strategy.riskPerTrade || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium">Max Trades</p>
                          <p className="text-sm font-semibold text-gray-900">{strategy.maxOpenTrades || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium">Created</p>
                          <p className="text-sm font-semibold text-gray-900">{new Date(strategy.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Tags Section */}
                      {strategy.tags && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {strategy.tags && strategy.tags.split(',').map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md font-medium">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Last updated: {new Date(strategy.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* View Button */}
                          <button
                            onClick={() => handleViewStrategy(strategy)}
                            className="flex items-center space-x-1 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                            title="View Strategy Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-sm">View</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditStrategy(strategy)}
                            className="flex items-center space-x-1 px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors font-medium"
                            title="Edit Strategy"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm">Edit</span>
                          </button>

                          {/* Duplicate Button */}
                          <button
                            onClick={() => handleDuplicateStrategy(strategy)}
                            className="flex items-center space-x-1 px-3 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                            title="Duplicate Strategy"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">Copy</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteStrategy(strategy._id)}
                            className="flex items-center space-x-1 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
                            title="Delete Strategy"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategies Found</h3>
                  <p className="text-gray-500 mb-6">You haven't created any trading strategies yet.</p>
                  <button
                    onClick={() => {
                      setShowManageAllModal(false);
                      setShowCreateStrategyModal(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Create Your First Strategy
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Total Strategies: <span className="font-medium text-gray-900">{strategies.length}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowManageAllModal(false);
                      setShowCreateStrategyModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Strategy</span>
                  </button>
                  <button
                    onClick={() => setShowManageAllModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Strategy Modal */}
      {showViewStrategyModal && viewingStrategy && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{viewingStrategy.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{viewingStrategy.tradingStyle} • {viewingStrategy.marketType?.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                    viewingStrategy.status === 'active' ? 'bg-green-100 text-green-800' :
                    viewingStrategy.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                    viewingStrategy.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingStrategy.status.charAt(0).toUpperCase() + viewingStrategy.status.slice(1)}
                  </span>
                  <button
                    onClick={() => setShowViewStrategyModal(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/80 transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column - Basic Information */}
                <div className="space-y-6">
                  
                  {/* Strategy Overview */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Strategy Overview
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-blue-100">
                          {viewingStrategy.description || 'No description provided'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Version</p>
                          <p className="text-gray-900 bg-white rounded-lg p-3 border border-blue-100 text-center font-semibold">
                            v{viewingStrategy.version}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Created</p>
                          <p className="text-gray-900 bg-white rounded-lg p-3 border border-blue-100 text-center">
                            {new Date(viewingStrategy.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Management */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Risk Management
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Risk Per Trade</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-green-100 text-center font-semibold">
                          {viewingStrategy.riskPerTrade || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Max Daily Risk</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-green-100 text-center font-semibold">
                          {viewingStrategy.maxDailyRisk || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Max Open Trades</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-green-100 text-center font-semibold">
                          {viewingStrategy.maxOpenTrades || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Position Sizing</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-green-100 text-center font-semibold">
                          {viewingStrategy.positionSizing || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {viewingStrategy.tags && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingStrategy.tags && viewingStrategy.tags.split(',').map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-3 py-2 bg-white text-purple-700 text-sm rounded-lg border border-purple-100 font-medium">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Trading Logic & Tools */}
                <div className="space-y-6">
                  
                  {/* Entry & Exit Rules */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Trading Rules
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Entry Conditions</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-orange-100 text-sm">
                          {viewingStrategy.entryConditions || 'No entry conditions specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Exit Conditions</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-orange-100 text-sm">
                          {viewingStrategy.exitConditions || 'No exit conditions specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Stop Loss Logic</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-orange-100 text-sm">
                          {viewingStrategy.stopLossLogic || 'No stop loss logic specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Take Profit Logic</p>
                        <p className="text-gray-900 bg-white rounded-lg p-3 border border-orange-100 text-sm">
                          {viewingStrategy.takeProfitLogic || 'No take profit logic specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Technical Analysis Tools */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Technical Analysis
                    </h4>
                    
                    {/* Technical Indicators */}
                    {viewingStrategy.indicators && viewingStrategy.indicators.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-3">Technical Indicators ({viewingStrategy.indicators.length})</p>
                        <div className="grid grid-cols-2 gap-2">
                          {viewingStrategy.indicators.map((indicator, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white rounded-lg p-3 border border-indigo-100">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              <span className="text-sm text-gray-900 font-medium">{indicator}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analysis Tools */}
                    {viewingStrategy.toolsPatterns && viewingStrategy.toolsPatterns.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-3">Analysis Tools ({viewingStrategy.toolsPatterns.length})</p>
                        <div className="grid grid-cols-2 gap-2">
                          {viewingStrategy.toolsPatterns.map((tool, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white rounded-lg p-3 border border-indigo-100">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-900 font-medium">{tool}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!viewingStrategy.indicators || viewingStrategy.indicators.length === 0) && 
                     (!viewingStrategy.toolsPatterns || viewingStrategy.toolsPatterns.length === 0) && (
                      <p className="text-gray-500 text-center py-4 bg-white rounded-lg border border-indigo-100">
                        No technical analysis tools specified
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Last updated: <span className="font-medium text-gray-900">{new Date(viewingStrategy.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowViewStrategyModal(false);
                      handleEditStrategy(viewingStrategy);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Strategy</span>
                  </button>
                  <button
                    onClick={() => setShowViewStrategyModal(false)}
                    className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}