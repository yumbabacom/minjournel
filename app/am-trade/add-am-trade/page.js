'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import SidebarWrapper from '../../../components/SidebarWrapper';
import MobileHeader from '../../../components/MobileHeader';

export default function AddAMTrade() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    balance: '',
    tag: 'personal'
  });

  const [tradeData, setTradeData] = useState({
    // Date & Time
    dateTime: new Date().toISOString().slice(0, 16),
    manualDateTime: false,

    // Basic Trade Info
    accountSize: 0, // Will be auto-populated from selected account
    direction: '', // Will be auto-detected: 'long' or 'short'
    tradingPair: '', // Selected trading pair
    strategy: '', // Trading strategy
    entryPrice: '',
    takeProfit: '', // Take profit level
    stopLoss: '',

    // Time & Market Info
    weekday: '',
    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,

    // Setup & Framework (AM Trade specific)
    setup: '',
    htfFramework: '',
    dailyProfile: '',
    entryCandle: '',
    entryTime: '',
    entryTimeFrame: '',
    entryConfluence: '',

    // Trade Metrics
    duration: '',
    riskPercent: '2', // Default 2%
    plannedRR: '',

    // Additional fields from main add-trade page
    analysis: '', // Trade analysis
    notes: '', // Trade notes
    riskManagementLessons: '', // Risk management lessons
    tags: '', // Trade tags
    screenshot: null // Opening trade image
  });

  // Calculated results state
  const [calculatedResults, setCalculatedResults] = useState({
    riskAmount: 0,
    lotSize: 0,
    potentialProfit: 0,
    potentialLoss: 0,
    profitPips: 0,
    lossPips: 0,
    riskRewardRatio: 0
  });

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First check if user is already in localStorage
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

        // Fetch user with token using the same endpoint as dashboard
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Store user data in localStorage for future use
          localStorage.setItem('user', JSON.stringify(userData));

          // Fetch accounts for this user
          await fetchAccounts(userData);
        } else {
          // Invalid token, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [router]);

  // Fetch accounts when user is set (similar to dashboard)
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchAccounts(user);
    }
  }, [user]);

  // Update account size when current account changes
  useEffect(() => {
    const currentAccount = accounts.find(acc =>
      (acc.id === currentAccountId) || (acc._id === currentAccountId)
    );
    if (currentAccount) {
      setTradeData(prev => ({
        ...prev,
        accountSize: currentAccount.balance || 0
      }));
    }
  }, [currentAccountId, accounts]);

  // Trading pairs data with comprehensive selection (same as main add-trade page)
  const tradingPairs = {
    forex: [
      {
        pair: 'EUR/USD',
        name: 'Euro/US Dollar',
        flag1: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#003399"/><circle cx="15" cy="10" r="6" fill="none" stroke="#FFCC00" strokeWidth="1"/><g fill="#FFCC00">{[...Array(12)].map((_, i) => <circle key={i} cx={15 + 4.5 * Math.cos(i * Math.PI / 6)} cy={10 + 4.5 * Math.sin(i * Math.PI / 6)} r="0.5"/>)}</g></svg>,
        flag2: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#B22234"/>{[...Array(7)].map((_, i) => <rect key={i} y={i*20/13} width="30" height="20/13" fill={i % 2 ? "#B22234" : "white"}/>)}<rect width="12" height="20*7/13" fill="#3C3B6E"/></svg>,
        volume: 'Very High',
        spread: '0.8 pips'
      },
      {
        pair: 'GBP/USD',
        name: 'British Pound/US Dollar',
        flag1: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#012169"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="white" strokeWidth="2"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1"/><path d="M15,0 L15,20 M0,10 L30,10" stroke="white" strokeWidth="3"/><path d="M15,0 L15,20 M0,10 L30,10" stroke="#C8102E" strokeWidth="2"/></svg>,
        flag2: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#B22234"/>{[...Array(7)].map((_, i) => <rect key={i} y={i*20/13} width="30" height="20/13" fill={i % 2 ? "#B22234" : "white"}/>)}<rect width="12" height="20*7/13" fill="#3C3B6E"/></svg>,
        volume: 'Very High',
        spread: '1.2 pips'
      },
      {
        pair: 'USD/JPY',
        name: 'US Dollar/Japanese Yen',
        flag1: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#B22234"/>{[...Array(7)].map((_, i) => <rect key={i} y={i*20/13} width="30" height="20/13" fill={i % 2 ? "#B22234" : "white"}/>)}<rect width="12" height="20*7/13" fill="#3C3B6E"/></svg>,
        flag2: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="white"/><circle cx="15" cy="10" r="6" fill="#BC002D"/></svg>,
        volume: 'Very High',
        spread: '0.9 pips'
      },
      {
        pair: 'USD/CHF',
        name: 'US Dollar/Swiss Franc',
        flag1: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#B22234"/>{[...Array(7)].map((_, i) => <rect key={i} y={i*20/13} width="30" height="20/13" fill={i % 2 ? "#B22234" : "white"}/>)}<rect width="12" height="20*7/13" fill="#3C3B6E"/></svg>,
        flag2: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#FF0000"/><path d="M12,6 L18,6 L18,8 L22,8 L22,12 L18,12 L18,14 L12,14 L12,12 L8,12 L8,8 L12,8 Z" fill="white"/></svg>,
        volume: 'High',
        spread: '1.4 pips'
      },
      {
        pair: 'AUD/USD',
        name: 'Australian Dollar/US Dollar',
        flag1: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#012169"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="white" strokeWidth="1"/><rect width="15" height="10" fill="#012169"/><path d="M0,0 L15,10 M15,0 L0,10" stroke="white" strokeWidth="1"/><g fill="white">{[...Array(6)].map((_, i) => <circle key={i} cx={20 + 2*Math.cos(i*Math.PI/3)} cy={4 + 2*Math.sin(i*Math.PI/3)} r="0.3"/>)}</g></svg>,
        flag2: <svg className="w-5 h-3" viewBox="0 0 30 20"><rect width="30" height="20" fill="#B22234"/>{[...Array(7)].map((_, i) => <rect key={i} y={i*20/13} width="30" height="20/13" fill={i % 2 ? "#B22234" : "white"}/>)}<rect width="12" height="20*7/13" fill="#3C3B6E"/></svg>,
        volume: 'High',
        spread: '1.1 pips'
      }
    ],
    commodities: [
      {
        pair: 'XAUUSD',
        name: 'Gold/US Dollar',
        icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>,
        volume: 'Very High',
        spread: '$0.5'
      },
      {
        pair: 'XBRUSD',
        name: 'Brent Oil/US Dollar',
        icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#2C3E50"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v1h20V8c0-1.11-.89-2-2-2zM2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2v-8H2v8z"/></svg>,
        volume: 'Very High',
        spread: '$0.08'
      }
    ],
    crypto: [
      {
        pair: 'BTC/USD',
        name: 'Bitcoin/US Dollar',
        icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#F7931A"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.868 8.914c.264-1.76-.922-2.706-2.494-3.339l.51-2.042-1.245-.31-.496 1.988c-.327-.082-.663-.158-1.001-.234l.5-2.003-1.245-.31-.51 2.042c-.271-.061-.537-.123-.796-.187l.002-.006-1.717-.428-.331 1.326s.922.211.902.225c.503.126.594.458.579.722l-.58 2.325c.035.009.08.022.13.042l-.132-.033-.812 3.258c-.062.153-.218.383-.57.296.013.018-.902-.225-.902-.225l-.618 1.421 1.62.404c.302.076.597.154.887.229l-.515 2.067 1.245.31.51-2.043c.338.091.666.175.987.254l-.509 2.035 1.245.31.515-2.066c2.123.402 3.716.24 4.386-1.683.54-1.548-.027-2.44-1.144-3.022.814-.188 1.427-.722 1.59-1.826z"/></svg>,
        volume: 'Very High',
        spread: '$45'
      }
    ]
  };

  // Modal states
  const [showTradingPairModal, setShowTradingPairModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-population functions
  const getWeekdayFromDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[date.getDay()];
  };

  const getMonthFromDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getQuarterFromDate = (dateString) => {
    const date = new Date(dateString);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${date.getFullYear()}`;
  };

  // Auto-populate date-related fields when dateTime changes
  useEffect(() => {
    if (tradeData.dateTime) {
      const weekday = getWeekdayFromDate(tradeData.dateTime);
      const month = getMonthFromDate(tradeData.dateTime);
      const quarter = getQuarterFromDate(tradeData.dateTime);

      setTradeData(prev => ({
        ...prev,
        weekday,
        month,
        quarter
      }));
    }
  }, [tradeData.dateTime]);

  // Get trading pair details and type (from main add-trade page)
  const getTradingPairDetails = (pairSymbol) => {
    for (const [category, pairs] of Object.entries(tradingPairs)) {
      const pair = pairs.find(p => p.pair === pairSymbol);
      if (pair) {
        return { ...pair, category };
      }
    }
    return null;
  };

  // Calculate pip value based on pair type (from main add-trade page)
  const calculatePipValue = (pairDetails) => {
    if (!pairDetails) return 0;

    const { category, pair } = pairDetails;

    switch (category) {
      case 'forex':
        if (pair.includes('JPY')) {
          return 1000; // JPY pairs: 1 pip = 0.01, so 100,000 * 0.01 = $1000 per lot
        } else {
          return 10; // Most forex pairs: 1 pip = 0.0001, so 100,000 * 0.0001 = $10 per lot
        }

      case 'crypto':
        return 1; // Crypto: varies by exchange, but typically $1 per pip per unit

      case 'stocks':
        return 1; // Stocks: $1 per share per pip (1 cent movement)

      case 'commodities':
        if (pair.includes('XAU')) return 100; // Gold: 100 oz contract, $1 per oz per pip
        if (pair.includes('XAG')) return 50; // Silver: 5000 oz contract, $0.01 per oz per pip = $50
        if (pair.includes('XTI') || pair.includes('XBR')) return 100; // Oil: 1000 barrels, $0.01 per barrel = $10
        if (pair.includes('XPT')) return 50; // Platinum: 50 oz contract
        if (pair.includes('XPD')) return 100; // Palladium: 100 oz contract
        return 10; // Default

      default:
        return 10; // Default forex-like calculation
    }
  };

  // Calculate pips based on pair type (from main add-trade page)
  const calculatePips = (pairDetails, price1, price2) => {
    if (!pairDetails || !price1 || !price2) return 0;

    const { category, pair } = pairDetails;
    const priceDiff = Math.abs(price1 - price2);

    switch (category) {
      case 'forex':
        if (pair.includes('JPY')) {
          return priceDiff * 100; // JPY pairs: 1 pip = 0.01, so multiply by 100
        } else {
          return priceDiff * 10000; // Most forex: 1 pip = 0.0001, so multiply by 10000
        }

      case 'crypto':
        return priceDiff; // Crypto: typically 1 pip = $1 price movement for major coins

      case 'stocks':
        return priceDiff * 100; // Stocks: 1 pip = $0.01, so multiply by 100

      case 'commodities':
        if (pair.includes('XAU')) return priceDiff * 10; // Gold: 1 pip = $0.10
        if (pair.includes('XAG')) return priceDiff * 100; // Silver: 1 pip = $0.01
        if (pair.includes('XTI') || pair.includes('XBR')) return priceDiff * 100; // Oil: 1 pip = $0.01
        return priceDiff * 100; // Others: 1 pip = $0.01

      default:
        return priceDiff * 10000; // Default
    }
  };

  // Main calculation function (updated for entry, take profit, stop loss)
  const calculateResults = (data) => {
    const entryPrice = parseFloat(data.entryPrice) || 0;
    const takeProfit = parseFloat(data.takeProfit) || 0;
    const stopLoss = parseFloat(data.stopLoss) || 0;
    const accountSize = parseFloat(data.accountSize) || 0;
    const riskPercent = parseFloat(data.riskPercent) || 2;

    if (!accountSize || !entryPrice || !stopLoss || !takeProfit || !data.tradingPair) {
      return {
        riskAmount: 0,
        lotSize: 0,
        potentialProfit: 0,
        potentialLoss: 0,
        profitPips: 0,
        lossPips: 0,
        riskRewardRatio: 0
      };
    }

    // Get trading pair details
    const pairDetails = getTradingPairDetails(data.tradingPair);
    if (!pairDetails) {
      return {
        riskAmount: 0,
        lotSize: 0,
        potentialProfit: 0,
        potentialLoss: 0,
        profitPips: 0,
        lossPips: 0,
        riskRewardRatio: 0
      };
    }

    const riskAmount = (accountSize * riskPercent) / 100;

    // Calculate pips
    const lossPips = calculatePips(pairDetails, entryPrice, stopLoss);
    const profitPips = takeProfit ? calculatePips(pairDetails, entryPrice, takeProfit) : 0;

    // Get pip value per standard lot/contract
    const pipValuePerLot = calculatePipValue(pairDetails);

    // Calculate lot size: Risk Amount ÷ (Stop Loss Pips × Pip Value per Lot)
    const lotSize = lossPips > 0 ? riskAmount / (lossPips * pipValuePerLot) : 0;

    // Calculate potential profit/loss
    const potentialLoss = riskAmount; // This should equal our risk amount
    const potentialProfit = profitPips * pipValuePerLot * lotSize;

    const riskRewardRatio = potentialProfit > 0 ? potentialProfit / potentialLoss : 0;

    return {
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      lotSize: parseFloat(Math.max(0, lotSize).toFixed(4)),
      potentialProfit: parseFloat(Math.max(0, potentialProfit).toFixed(2)),
      potentialLoss: parseFloat(potentialLoss.toFixed(2)),
      profitPips: parseFloat(profitPips.toFixed(1)),
      lossPips: parseFloat(lossPips.toFixed(1)),
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2))
    };
  };

  // Helper functions for generating options
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Start from January 2024
    for (let year = 2024; year <= currentYear; year++) {
      const endMonth = year === currentYear ? currentMonth : 11;
      for (let month = 0; month <= endMonth; month++) {
        const date = new Date(year, month);
        months.push(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      }
    }
    return months;
  };

  const generateQuarterOptions = () => {
    const quarters = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);

    for (let year = 2024; year <= currentYear; year++) {
      const endQuarter = year === currentYear ? currentQuarter : 4;
      for (let quarter = 1; quarter <= endQuarter; quarter++) {
        quarters.push(`Q${quarter} ${year}`);
      }
    }
    return quarters;
  };

  // Helper functions for account tags
  const getTagColor = (tag) => {
    const colors = {
      personal: 'bg-blue-600',
      business: 'bg-green-600',
      demo: 'bg-purple-600',
      forex: 'bg-orange-600',
      crypto: 'bg-indigo-600'
    };
    return colors[tag] || 'bg-gray-600';
  };

  const getTagDisplayName = (tag) => {
    const names = {
      personal: 'Personal',
      business: 'Business',
      demo: 'Demo',
      forex: 'Forex',
      crypto: 'Crypto'
    };
    return names[tag] || 'Personal';
  };

  const fetchAccounts = async (userData) => {
    try {
      const userId = userData?.id || userData?._id;
      if (!userId) {
        console.error('User ID not found');
        return;
      }

      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        console.error('Authentication token is missing');
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
          setAccounts(data.accounts);

          // Set current account from localStorage or use first account
          const savedAccountId = localStorage.getItem('currentAccountId');
          if (savedAccountId && data.accounts.find(acc => String(acc.id || acc._id) === savedAccountId)) {
            setCurrentAccountId(savedAccountId);
          } else if (data.accounts.length > 0) {
            const firstAccountId = data.accounts[0].id || data.accounts[0]._id;
            setCurrentAccountId(firstAccountId);
            localStorage.setItem('currentAccountId', String(firstAccountId));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Form validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'entryPrice':
      case 'stopLoss':
      case 'takeProfit':
        if (!value) {
          newErrors[name] = 'This field is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          newErrors[name] = 'Must be a positive number';
        } else {
          delete newErrors[name];
        }
        break;
      case 'tradingPair':
        if (!value) {
          newErrors[name] = 'Trading pair is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'setup':
      case 'htfFramework':
        if (!value) {
          newErrors[name] = 'This field is required';
        } else {
          delete newErrors[name];
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setTradeData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Validate field
      validateField(name, value);

      setTradeData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };

        // Auto-detect trading direction based on entry and take profit prices
        if ((name === 'entryPrice' || name === 'takeProfit') && newData.entryPrice && newData.takeProfit) {
          const entry = parseFloat(newData.entryPrice);
          const takeProfit = parseFloat(newData.takeProfit);

          if (entry && takeProfit) {
            newData.direction = takeProfit > entry ? 'long' : 'short';
          }
        }

        // Recalculate results when relevant fields change
        const results = calculateResults(newData);
        setCalculatedResults(results);

        return newData;
      });
    }
  };

  // Function to select trading pair
  const selectTradingPair = (pair) => {
    const updatedData = { ...tradeData, tradingPair: pair };
    setTradeData(updatedData);
    setShowTradingPairModal(false);

    // Recalculate results when trading pair changes
    const results = calculateResults(updatedData);
    setCalculatedResults(results);
  };

  const handleManualDateTimeToggle = (checked) => {
    setTradeData(prev => ({
      ...prev,
      manualDateTime: checked,
      dateTime: checked ? prev.dateTime : new Date().toISOString().slice(0, 16)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');

      // Prepare trade data with calculated metrics for AM trades API
      const tradePayload = {
        userId: user?.id || user?._id,
        accountId: currentAccountId,
        // Date & Time
        dateTime: tradeData.dateTime,
        manualDateTime: tradeData.manualDateTime,
        weekday: tradeData.weekday,
        month: tradeData.month,
        quarter: tradeData.quarter,
        // Basic Trade Info
        accountSize: tradeData.accountSize,
        direction: tradeData.direction,
        tradingPair: tradeData.tradingPair,
        strategy: tradeData.strategy,
        entryPrice: tradeData.entryPrice,
        takeProfit: tradeData.takeProfit,
        stopLoss: tradeData.stopLoss,
        // AM Trade Specific Fields
        setup: tradeData.setup,
        htfFramework: tradeData.htfFramework,
        dailyProfile: tradeData.dailyProfile,
        entryCandle: tradeData.entryCandle,
        entryTime: tradeData.entryTime,
        entryTimeFrame: tradeData.entryTimeFrame,
        entryConfluence: tradeData.entryConfluence,
        duration: tradeData.duration,
        riskPercent: tradeData.riskPercent,
        plannedRR: tradeData.plannedRR,
        // Additional fields
        analysis: tradeData.analysis,
        notes: tradeData.notes,
        riskManagementLessons: tradeData.riskManagementLessons,
        tags: tradeData.tags,
        screenshot: tradeData.screenshot,
        // Calculated results
        calculatedResults: calculatedResults
      };

      const response = await fetch('/api/am-trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tradePayload)
      });

      if (response.ok) {
        // Show success message
        alert('AM Trade saved successfully!');
        router.push('/am-trade/journal');
      } else {
        const errorData = await response.json();
        console.error('Failed to create trade:', errorData);
        alert('Failed to save trade. Please try again.');
      }
    } catch (error) {
      console.error('Error creating trade:', error);
      alert('Error saving trade. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountSwitch = (accountId) => {
    setCurrentAccountId(accountId);
    localStorage.setItem('currentAccountId', String(accountId));
  };

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.balance) return;

    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        alert('Authentication token is missing. Please login again.');
        return;
      }

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
          isActive: accounts.length === 0
        };

        setAccounts([...accounts, accountData]);

        if (accounts.length === 0) {
          setCurrentAccountId(accountData.id);
          localStorage.setItem('currentAccountId', accountData.id);
        }

        setNewAccount({ name: '', balance: '', tag: 'personal' });
        setShowAddAccountModal(false);

        await fetchAccounts(user);
      } else {
        const errorData = await response.json();
        console.error('Failed to create account:', errorData);
        alert('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Error adding account. Please try again.');
    }
  };

  const handleEditAccount = async (accountId, updates) => {
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedAccount = await response.json();
        setAccounts(prev => prev.map(acc =>
          (acc.id === accountId || acc._id === accountId) ? updatedAccount : acc
        ));
      }
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId && acc._id !== accountId));

        // If deleted account was current, switch to first available
        if (String(currentAccountId) === String(accountId)) {
          const remainingAccounts = accounts.filter(acc => acc.id !== accountId && acc._id !== accountId);
          if (remainingAccounts.length > 0) {
            const newCurrentId = remainingAccounts[0].id || remainingAccounts[0]._id;
            setCurrentAccountId(newCurrentId);
            localStorage.setItem('currentAccountId', String(newCurrentId));
          }
        }
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleLogout = () => {
    // Clear all authentication data (same as dashboard)
    Cookies.remove('auth-token');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAMTradeMode');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <SidebarWrapper
      user={user}
      currentAccountId={currentAccountId}
      accounts={accounts}
      onAccountSwitch={handleAccountSwitch}
      onAddAccount={() => setShowAddAccountModal(true)}
      onEditAccount={handleEditAccount}
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout}
      onUpdateUser={(updatedUser) => setUser(updatedUser)}
    >
      {({ toggleMobileSidebar }) => (
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header */}
          <MobileHeader
            title="Add AM Trade"
            subtitle="Record your morning trading session"
            onMenuToggle={toggleMobileSidebar}
            rightContent={
              <button
                onClick={() => router.push('/am-trade/overview')}
                className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/50 transition-all duration-200"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm sm:text-base">Back to Overview</span>
              </button>
            }
          />

          {/* Trade Form */}
          <div className="space-y-6 sm:space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

              {/* Date & Time Section */}
              <div className="bg-gradient-to-br from-white via-blue-50/50 to-blue-100/30 rounded-2xl sm:rounded-3xl border border-blue-200/60 p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
                  <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Date & Time</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Configure your trading session timing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date & Time
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm text-gray-500">Auto-populate</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tradeData.manualDateTime}
                            onChange={(e) => handleManualDateTimeToggle(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-xs sm:text-sm text-gray-500">Manual</span>
                      </div>
                    </div>
                    <input
                      type="datetime-local"
                      name="dateTime"
                      value={tradeData.dateTime}
                      onChange={handleInputChange}
                      disabled={!tradeData.manualDateTime}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                    />
                    {!tradeData.manualDateTime && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Auto-populates weekday, month, and quarter
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Weekday
                    </label>
                    <div className="relative">
                      <select
                        name="weekday"
                        value={tradeData.weekday}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                      >
                        <option value="">Select weekday</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                      </select>
                      <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {tradeData.weekday && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tradeData.manualDateTime ? 'Manually selected' : 'Auto-populated from date'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account & Trade Info Section */}
              <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-100/30 rounded-2xl sm:rounded-3xl border border-green-200/60 p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
                  <div className="p-2.5 sm:p-3 bg-gradient-to-br from-green-500 via-emerald-600 to-green-600 rounded-xl sm:rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Account & Trade Info</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Set your trade parameters and pricing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Size
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 font-semibold">$</span>
                      <input
                        type="number"
                        name="accountSize"
                        value={tradeData.accountSize}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50 transition-all duration-200 shadow-sm"
                        readOnly
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Auto-populated from selected account
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Direction
                    </label>
                    <div className="relative">
                      <div className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 shadow-sm ${
                        tradeData.direction === 'long'
                          ? 'border-green-400 bg-green-50'
                          : tradeData.direction === 'short'
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-center space-x-2">
                          {tradeData.direction === 'long' && (
                            <>
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              </svg>
                              <span className="font-semibold text-green-700">LONG</span>
                            </>
                          )}
                          {tradeData.direction === 'short' && (
                            <>
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                              </svg>
                              <span className="font-semibold text-red-700">SHORT</span>
                            </>
                          )}
                          {!tradeData.direction && (
                            <>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-500">Auto-detected</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Based on entry vs take profit price
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Entry Price *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.00001"
                        name="entryPrice"
                        value={tradeData.entryPrice}
                        onChange={handleInputChange}
                        placeholder="0.00000"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-300"
                        required
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                    {errors.entryPrice && (
                      <p className="text-xs text-red-600 mt-1">{errors.entryPrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Take Profit *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.00001"
                        name="takeProfit"
                        value={tradeData.takeProfit}
                        onChange={handleInputChange}
                        placeholder="0.00000"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-green-300"
                        required
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    {errors.takeProfit && (
                      <p className="text-xs text-red-600 mt-1">{errors.takeProfit}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Stop Loss *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.00001"
                        name="stopLoss"
                        value={tradeData.stopLoss}
                        onChange={handleInputChange}
                        placeholder="0.00000"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-red-300"
                        required
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    {errors.stopLoss && (
                      <p className="text-xs text-red-600 mt-1">{errors.stopLoss}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Market & Time Info Section */}
              <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Market & Time Info</h3>
                    <p className="text-sm text-gray-600">Select your trading market and timeframe</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Month
                    </label>
                    <div className="relative">
                      <select
                        name="month"
                        value={tradeData.month}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-300"
                      >
                        {generateMonthOptions().map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Quarter
                    </label>
                    <div className="relative">
                      <select
                        name="quarter"
                        value={tradeData.quarter}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-300"
                      >
                        {generateQuarterOptions().map(quarter => (
                          <option key={quarter} value={quarter}>{quarter}</option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trading Pair *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTradingPairModal(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-left"
                    >
                      {tradeData.tradingPair ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {(() => {
                              const pairDetails = getTradingPairDetails(tradeData.tradingPair);
                              if (pairDetails) {
                                if (pairDetails.flag1 && pairDetails.flag2) {
                                  return (
                                    <div className="flex items-center space-x-1">
                                      {pairDetails.flag1}
                                      {pairDetails.flag2}
                                    </div>
                                  );
                                } else if (pairDetails.icon) {
                                  return pairDetails.icon;
                                }
                              }
                              return (
                                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              );
                            })()}
                            <div>
                              <p className="font-semibold text-gray-900">{tradeData.tradingPair}</p>
                              <p className="text-sm text-gray-600">
                                {getTradingPairDetails(tradeData.tradingPair)?.name || 'Trading Pair'}
                              </p>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="text-gray-500">Select trading pair</span>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Trading Setup & Framework Section */}
              <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl border border-orange-100 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Trading Setup & Framework</h3>
                    <p className="text-sm text-gray-600">Define your trading strategy and entry criteria</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Setup *
                    </label>
                    <div className="relative">
                      <select
                        name="setup"
                        value={tradeData.setup}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-300"
                        required
                      >
                        <option value="">Select setup</option>
                        <option value="Continuation Day">Continuation Day</option>
                        <option value="Reversal Day">Reversal Day</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      HTF Framework *
                    </label>
                    <div className="relative">
                      <select
                        name="htfFramework"
                        value={tradeData.htfFramework}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-300"
                        required
                      >
                        <option value="">Select HTF framework</option>
                        <option value="Manipulation">Manipulation</option>
                        <option value="Divergence">Divergence</option>
                        <option value="Opposing Candle">Opposing Candle</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Daily Profile *
                    </label>
                    <div className="relative">
                      <select
                        name="dailyProfile"
                        value={tradeData.dailyProfile}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-300"
                        required
                      >
                        <option value="">Select daily profile</option>
                        <option value="18:00 Reversal">18:00 Reversal</option>
                        <option value="01:00 Reversal">01:00 Reversal</option>
                        <option value="08:00 Reversal">08:00 Reversal</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Entry Candle *
                    </label>
                    <div className="relative">
                      <select
                        name="entryCandle"
                        value={tradeData.entryCandle}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-300"
                        required
                      >
                        <option value="">Select entry candle</option>
                        <option value="08:00 Candle">08:00 Candle</option>
                        <option value="01:00 Candle">01:00 Candle</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Entry Time *
                    </label>
                    <div className="relative">
                      <select
                        name="entryTime"
                        value={tradeData.entryTime}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-300"
                        required
                      >
                        <option value="">Select entry time</option>
                        <option value="9:30-9:59">9:30-9:59</option>
                        <option value="7:00-7:59">7:00-7:59</option>
                        <option value="4:00-4:59">4:00-4:59</option>
                        <option value="2:00-2:59">2:00-2:59</option>
                        <option value="8:00-8:29">8:00-8:29</option>
                        <option value="12:00-12:59">12:00-12:59</option>
                        <option value="3:00-3:59">3:00-3:59</option>
                        <option value="6:00-6:59">6:00-6:59</option>
                        <option value="11:00-11:59">11:00-11:59</option>
                        <option value="10:00-10:59">10:00-10:59</option>
                        <option value="5:00-5:59">5:00-5:59</option>
                        <option value="9:00-9:29">9:00-9:29</option>
                        <option value="1:00-1:59">1:00-1:59</option>
                        <option value="14:00-14:59">14:00-14:59</option>
                        <option value="13:00-13:59">13:00-13:59</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Entry Time Frame *
                    </label>
                    <div className="relative">
                      <select
                        name="entryTimeFrame"
                        value={tradeData.entryTimeFrame}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-300"
                        required
                      >
                        <option value="">Select time frame</option>
                        <option value="1 minute">1 minute</option>
                        <option value="< 5 minutes">&lt; 5 minutes</option>
                        <option value="5 minutes">5 minutes</option>
                        <option value="15 minutes">15 minutes</option>
                        <option value="1 hour">1 hour</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Entry Confluence *
                    </label>
                    <div className="relative">
                      <select
                        name="entryConfluence"
                        value={tradeData.entryConfluence}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-300"
                        required
                      >
                        <option value="">Select confluence</option>
                        <option value="Short-term Swing">Short-term Swing</option>
                        <option value="Opposing Candle">Opposing Candle</option>
                        <option value="Volatility Driver">Volatility Driver</option>
                        <option value="Divergence">Divergence</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Metrics Section */}
              <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-100 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Trade Metrics</h3>
                    <p className="text-sm text-gray-600">Configure risk parameters and targets</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Duration
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="duration"
                        value={tradeData.duration}
                        onChange={handleInputChange}
                        placeholder="e.g. 45 minutes"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-red-300"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Risk % *
                    </label>
                    <div className="relative">
                      <select
                        name="riskPercent"
                        value={tradeData.riskPercent}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-red-300"
                        required
                      >
                        <option value="">Select risk %</option>
                        <option value="0.25%">0.25% - Conservative</option>
                        <option value="0.5%">0.5% - Moderate</option>
                        <option value="1%">1% - Standard</option>
                        <option value="2%">2% - Aggressive</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Planned RR *
                    </label>
                    <div className="relative">
                      <select
                        name="plannedRR"
                        value={tradeData.plannedRR}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:border-red-300"
                        required
                      >
                        <option value="">Select RR</option>
                        <option value="2R">2R - Conservative</option>
                        <option value="3R">3R - Balanced</option>
                        <option value="4R">4R - Aggressive</option>
                        <option value="5R">5R - High Risk</option>
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy & Analysis Section */}
              <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl border border-indigo-100 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Strategy & Analysis</h3>
                    <p className="text-sm text-gray-600">Document your trading strategy and analysis</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trading Strategy
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="strategy"
                        value={tradeData.strategy}
                        onChange={handleInputChange}
                        placeholder="e.g., Breakout, Support/Resistance, Trend Following"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-indigo-300"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trade Tags
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="tags"
                        value={tradeData.tags}
                        onChange={handleInputChange}
                        placeholder="e.g., scalp, swing, news, breakout"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-indigo-300"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trade Analysis
                    </label>
                    <div className="relative">
                      <textarea
                        name="analysis"
                        value={tradeData.analysis}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe your market analysis, key levels, and reasoning for this trade..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-indigo-300 resize-none"
                      />
                      <div className="absolute left-3 top-4 text-indigo-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Calculated Fields */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-2xl sm:rounded-3xl border border-blue-200/30 p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.01]">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
                  <div className="p-2.5 sm:p-3 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl sm:rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01m3 0h.01M9 11h.01m3 0h.01m3 0h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Auto-Calculated Results</h3>
                    <p className="text-xs sm:text-sm text-blue-200">Real-time calculations based on your inputs</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <p className="text-xs font-medium text-red-200 uppercase tracking-wide mb-1 sm:mb-2">Risk Amount</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">${calculatedResults.riskAmount}</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <p className="text-xs font-medium text-blue-200 uppercase tracking-wide mb-1 sm:mb-2">Lot Size</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{calculatedResults.lotSize}</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <p className="text-xs font-medium text-green-200 uppercase tracking-wide mb-1 sm:mb-2">Potential Profit</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">${calculatedResults.potentialProfit}</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <p className="text-xs font-medium text-red-200 uppercase tracking-wide mb-1 sm:mb-2">Potential Loss</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">${calculatedResults.potentialLoss}</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <p className="text-xs font-medium text-green-200 uppercase tracking-wide mb-1 sm:mb-2">Profit Pips</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{calculatedResults.profitPips}</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <p className="text-xs font-medium text-red-200 uppercase tracking-wide mb-1 sm:mb-2">Loss Pips</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">{calculatedResults.lossPips}</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <p className="text-xs font-medium text-yellow-200 uppercase tracking-wide mb-1 sm:mb-2">Risk:Reward</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">1:{calculatedResults.riskRewardRatio}</p>
                  </div>
                </div>
              </div>

              {/* Notes & Screenshot Section */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Notes & Screenshot</h3>
                    <p className="text-sm text-gray-600">Add trade notes and upload opening trade image</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trade Notes
                    </label>
                    <div className="relative">
                      <textarea
                        name="notes"
                        value={tradeData.notes}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="Add any additional notes about this trade, market conditions, emotions, or lessons learned..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-400 resize-none"
                      />
                      <div className="absolute left-3 top-4 text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Risk Management Lessons
                    </label>
                    <div className="relative">
                      <textarea
                        name="riskManagementLessons"
                        value={tradeData.riskManagementLessons}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="What did you learn about risk management from this trade? Any improvements for next time?"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-400 resize-none"
                      />
                      <div className="absolute left-3 top-4 text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Opening Trade Image
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name="screenshot"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setTradeData(prev => ({ ...prev, screenshot: file }));
                        }}
                        accept="image/*"
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="w-full flex flex-col items-center justify-center px-6 py-8 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> opening trade screenshot
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          {tradeData.screenshot && (
                            <p className="mt-2 text-sm text-green-600 font-medium">
                              ✓ {tradeData.screenshot.name}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 sm:pt-8">
                <button
                  type="button"
                  onClick={() => router.push('/am-trade/overview')}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-sm sm:text-base transform hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || Object.keys(errors).length > 0}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving Trade...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save AM Trade</span>
                    </>
                  )}
                </button>
                {Object.keys(errors).length > 0 && (
                  <div className="text-xs sm:text-sm text-red-600 mt-2 sm:mt-0 sm:ml-4">
                    Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} before saving
                  </div>
                )}
              </div>
            </form>
          </div>
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
            <div className="px-6 py-4 space-y-4">
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="e.g., My AM Trading Account"
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

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'personal', label: 'Personal', color: 'bg-blue-600' },
                    { value: 'business', label: 'Business', color: 'bg-green-600' },
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

      {/* Trading Pair Selection Modal */}
      {showTradingPairModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Select Trading Pair</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Choose from forex, commodities, or crypto pairs</p>
                </div>
                <button
                  onClick={() => setShowTradingPairModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200 self-end sm:self-auto transform hover:scale-110"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search trading pairs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
              {Object.entries(tradingPairs).map(([category, pairs]) => {
                const filteredPairs = pairs.filter(pair =>
                  pair.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  pair.name.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (filteredPairs.length === 0) return null;

                return (
                  <div key={category} className="mb-6 sm:mb-8">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 capitalize flex items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mr-2 sm:mr-3"></div>
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {filteredPairs.map((pair) => (
                        <button
                          key={pair.pair}
                          onClick={() => selectTradingPair(pair.pair)}
                          className="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-left group transform hover:scale-105 active:scale-95"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {pair.flag1 && pair.flag2 ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-lg sm:text-xl">{pair.flag1}</span>
                                <span className="text-lg sm:text-xl">{pair.flag2}</span>
                              </div>
                            ) : pair.icon ? (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                                {pair.icon}
                              </div>
                            ) : (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-purple-700 truncate">
                                {pair.pair}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{pair.name}</p>
                              {pair.volume && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  Volume: {pair.volume}
                                  {pair.spread && ` • Spread: ${pair.spread}`}
                                </p>
                              )}
                            </div>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      )}
    </SidebarWrapper>
  );
}
