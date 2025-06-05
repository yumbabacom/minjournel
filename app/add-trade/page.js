'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AddTrade() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('add-trade');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingBalance, setEditingBalance] = useState('');
  const [currentAccountId, setCurrentAccountId] = useState(1);
  
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

  // Helper functions
  const getTagColor = (tag) => {
    const colors = {
      'personal': 'bg-blue-600',
      'funded': 'bg-green-600',
      'demo': 'bg-purple-600',
      'forex': 'bg-orange-600',
      'crypto': 'bg-indigo-600'
    };
    return colors[tag] || 'bg-gray-600';
  };

  const getTagDisplayName = (tag) => {
    const names = {
      'personal': 'Personal',
      'funded': 'Funded',
      'demo': 'Demo',
      'forex': 'Forex',
      'crypto': 'Crypto'
    };
    return names[tag] || tag;
  };

  // Form data - updated with all new fields
  const [formData, setFormData] = useState({
    tradeType: 'long',
    accountId: null,
    accountSize: 0,
    riskPerTrade: '2',
    tradingPair: '',
    strategy: '',
    entryPrice: '',
    takeProfit: '',
    stopLoss: '',
    tradeDirection: 'long', // auto-detected
    tradeStatus: 'planning',
    quantity: '',
    notes: '',
    analysis: '',
    riskManagementLessons: '',
    tags: '',
    screenshot: null
  });

  // Additional form state
  const [showTradingPairModal, setShowTradingPairModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [calculatedResults, setCalculatedResults] = useState({
    riskAmount: 0,
    lotSize: 0,
    potentialProfit: 0,
    potentialLoss: 0,
    profitPips: 0,
    lossPips: 0,
    riskRewardRatio: 0
  });

  // Trading pairs data with SVG flags
  const tradingPairs = {
    forex: [
      { pair: 'EUR/USD', name: 'Euro/US Dollar', flag1: 'EU', flag2: 'US' },
      { pair: 'GBP/USD', name: 'British Pound/US Dollar', flag1: 'GB', flag2: 'US' },
      { pair: 'USD/JPY', name: 'US Dollar/Japanese Yen', flag1: 'US', flag2: 'JP' },
      { pair: 'USD/CHF', name: 'US Dollar/Swiss Franc', flag1: 'US', flag2: 'CH' },
      { pair: 'AUD/USD', name: 'Australian Dollar/US Dollar', flag1: 'AU', flag2: 'US' },
      { pair: 'USD/CAD', name: 'US Dollar/Canadian Dollar', flag1: 'US', flag2: 'CA' },
      { pair: 'NZD/USD', name: 'New Zealand Dollar/US Dollar', flag1: 'NZ', flag2: 'US' },
      { pair: 'EUR/GBP', name: 'Euro/British Pound', flag1: 'EU', flag2: 'GB' },
      { pair: 'EUR/JPY', name: 'Euro/Japanese Yen', flag1: 'EU', flag2: 'JP' },
      { pair: 'GBP/JPY', name: 'British Pound/Japanese Yen', flag1: 'GB', flag2: 'JP' }
    ],
    crypto: [
      { pair: 'BTC/USD', name: 'Bitcoin/US Dollar', symbol: '₿' },
      { pair: 'ETH/USD', name: 'Ethereum/US Dollar', symbol: 'Ξ' },
      { pair: 'ADA/USD', name: 'Cardano/US Dollar', symbol: '₳' },
      { pair: 'DOT/USD', name: 'Polkadot/US Dollar', symbol: '●' },
      { pair: 'LINK/USD', name: 'Chainlink/US Dollar', symbol: '⬡' },
      { pair: 'LTC/USD', name: 'Litecoin/US Dollar', symbol: 'Ł' }
    ],
    stocks: [
      { pair: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
      { pair: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
      { pair: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
      { pair: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
      { pair: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
      { pair: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' }
    ],
    commodities: [
      { pair: 'XAU/USD', name: 'Gold/US Dollar', symbol: '🥇' },
      { pair: 'XAG/USD', name: 'Silver/US Dollar', symbol: '🥈' },
      { pair: 'WTI', name: 'West Texas Intermediate Oil', symbol: '🛢️' },
      { pair: 'BRENT', name: 'Brent Crude Oil', symbol: '🛢️' }
    ]
  };

  // Suggested tags
  const suggestedTags = [
    'scalping', 'swing-trade', 'day-trade', 'breakout', 'trend-following',
    'support-resistance', 'news-trade', 'technical-analysis', 'momentum',
    'reversal', 'continuation', 'pullback', 'bounce', 'channel'
  ];

  // Strategies array
  const [strategies, setStrategies] = useState([
    'Breakout',
    'Trend Following',
    'Mean Reversion',
    'Scalping',
    'Swing Trading',
    'Day Trading',
    'Position Trading',
    'Momentum',
    'Support/Resistance',
    'Moving Average',
    'RSI Divergence',
    'MACD Signal'
  ]);

  // Auto-detect trade direction based on price levels
  const autoDetectTradeDirection = (entry, takeProfit, stopLoss) => {
    if (!entry || !takeProfit || !stopLoss) return 'long';
    
    const entryPrice = parseFloat(entry);
    const tpPrice = parseFloat(takeProfit);
    const slPrice = parseFloat(stopLoss);
    
    if (tpPrice > entryPrice && slPrice < entryPrice) {
      return 'long';
    } else if (tpPrice < entryPrice && slPrice > entryPrice) {
      return 'short';
    }
    return 'long';
  };

  // Calculate trading results
  const calculateResults = (data) => {
    const accountSize = parseFloat(data.accountSize) || 0;
    const riskPercent = parseFloat(data.riskPerTrade) || 0;
    const entryPrice = parseFloat(data.entryPrice) || 0;
    const takeProfit = parseFloat(data.takeProfit) || 0;
    const stopLoss = parseFloat(data.stopLoss) || 0;
    
    if (!accountSize || !riskPercent || !entryPrice || !takeProfit || !stopLoss) {
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
    
    // Calculate pips (simplified for forex)
    const profitPips = Math.abs(takeProfit - entryPrice) * 10000;
    const lossPips = Math.abs(entryPrice - stopLoss) * 10000;
    
    // Calculate lot size based on risk (simplified)
    const pipValue = 10; // $10 per pip for standard lot
    const lotSize = riskAmount / (lossPips * pipValue);
    
    // Calculate potential profit/loss
    const potentialProfit = profitPips * pipValue * lotSize;
    const potentialLoss = lossPips * pipValue * lotSize;
    
    // Risk-reward ratio
    const riskRewardRatio = potentialProfit / potentialLoss || 0;

    return {
      riskAmount: riskAmount.toFixed(2),
      lotSize: lotSize.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      potentialLoss: potentialLoss.toFixed(2),
      profitPips: profitPips.toFixed(1),
      lossPips: lossPips.toFixed(1),
      riskRewardRatio: riskRewardRatio.toFixed(2)
    };
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // Auto-detect trade direction when price levels change
    if (['entryPrice', 'takeProfit', 'stopLoss'].includes(name)) {
      const direction = autoDetectTradeDirection(
        name === 'entryPrice' ? value : newFormData.entryPrice,
        name === 'takeProfit' ? value : newFormData.takeProfit,
        name === 'stopLoss' ? value : newFormData.stopLoss
      );
      newFormData.tradeDirection = direction;
    }
    
    // Update account size when account changes
    if (name === 'accountId') {
      const selectedAccount = accounts.find(acc => acc.id === parseInt(value));
      if (selectedAccount) {
        newFormData.accountSize = selectedAccount.balance;
      }
    }
    
    setFormData(newFormData);
    
    // Recalculate results
    const results = calculateResults(newFormData);
    setCalculatedResults(results);
  };

  const selectSymbol = (symbol) => {
    setFormData(prev => ({ ...prev, symbol }));
    setShowSymbolDropdown(false);
  };

  const handleAddStrategy = () => {
    if (customStrategy.trim() && !strategies.includes(customStrategy.trim())) {
      setStrategies(prev => [...prev, customStrategy.trim()]);
      setFormData(prev => ({ ...prev, strategy: customStrategy.trim() }));
    }
    setCustomStrategy('');
    setShowStrategyModal(false);
  };

  const selectTradingPair = (pair) => {
    setFormData(prev => ({ ...prev, tradingPair: pair }));
    setShowTradingPairModal(false);
  };

  const selectStrategy = (strategy) => {
    setFormData(prev => ({ ...prev, strategy: strategy.name }));
    setShowStrategyModal(false);
  };

  const addTag = (tag) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData(prev => ({ ...prev, tags: newTags }));
    }
  };

  const clearForm = () => {
    setFormData({
      tradeType: 'long',
      accountId: null,
      accountSize: 0,
      riskPerTrade: '2',
      tradingPair: '',
      strategy: '',
      entryPrice: '',
      takeProfit: '',
      stopLoss: '',
      tradeDirection: 'long',
      tradeStatus: 'planning',
      quantity: '',
      notes: '',
      analysis: '',
      riskManagementLessons: '',
      tags: '',
      screenshot: null
    });
    setImagePreview(null);
    setCalculatedResults({
      riskAmount: 0,
      lotSize: 0,
      potentialProfit: 0,
      potentialLoss: 0,
      profitPips: 0,
      lossPips: 0,
      riskRewardRatio: 0
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData(prev => ({ ...prev, screenshot: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.symbol-dropdown')) {
        setShowSymbolDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Trade data:', formData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Trade added successfully!');
      
      // Reset form
      clearForm();
      
    } catch (error) {
      console.error('Error submitting trade:', error);
      alert('Failed to add trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Account management functions
  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.balance) return;

    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          ...newAccount
        })
      });

      if (response.ok) {
        const data = await response.json();
        const accountData = {
          id: data.accountId || Date.now(),
          ...newAccount,
          balance: parseFloat(newAccount.balance),
          color: getTagColor(newAccount.tag),
          isActive: accounts.length === 0
        };

        setAccounts([...accounts, accountData]);
        
        if (accounts.length === 0) {
          setCurrentAccountId(accountData.id);
        }
        
        setNewAccount({ name: '', balance: '', tag: 'personal' });
        setShowAddAccountModal(false);
        alert('Account created successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to create account:', errorData);
        alert('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Error creating account. Please try again.');
    }
  };

  const handleSwitchAccount = (accountId) => {
    setCurrentAccountId(accountId);
    setAccounts(accounts.map(acc => ({
      ...acc,
      isActive: acc.id === accountId
    })));
    setShowAccountDropdown(false);
    
    localStorage.setItem('currentAccountId', accountId);
  };

  const handleEditBalance = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    setEditingAccountId(accountId);
    setEditingBalance(account.balance.toString());
  };

  const handleSaveBalance = async (accountId) => {
    if (!editingBalance) return;

    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    try {
      const response = await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accountId,
          userId: userId,
          updates: { balance: parseFloat(editingBalance) }
        })
      });

      if (response.ok) {
        const newBalance = parseFloat(editingBalance);
        
        setAccounts(accounts.map(acc => 
          acc.id === accountId 
            ? { ...acc, balance: newBalance }
            : acc
        ));
        
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

  const handleDeleteAccount = async (accountId) => {
    if (accounts.length <= 1) {
      alert("You can't delete your only account.");
      return;
    }

    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accountId,
          userId: userId
        })
      });

      if (response.ok) {
        const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
        setAccounts(updatedAccounts);
        
        if (currentAccountId === accountId && updatedAccounts.length > 0) {
          setCurrentAccountId(updatedAccounts[0].id);
        }
        
        alert('Account deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete account:', errorData);
        alert('Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    }
  };

  const fetchAccounts = async () => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      const response = await fetch(`/api/accounts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const userAccounts = (data.accounts || []).map(account => ({
          ...account,
          id: account._id,
          color: getTagColor(account.tag)
        }));
        setAccounts(userAccounts);
        
        if (userAccounts.length > 0 && !currentAccountId) {
          setCurrentAccountId(userAccounts[0].id);
        }
      } else {
        console.error('Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Authentication and data fetching
  useEffect(() => {
    const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user?.id || user?._id) {
      fetchAccounts();
    }
  }, [user]);

  const handleLogout = () => {
    Cookies.remove('auth-token');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleNavigation = (itemId) => {
    if (itemId === 'dashboard' || itemId === 'analytics' || itemId === 'strategy') {
      // These are sections within the dashboard - navigate with section parameter
      router.push(`/dashboard?section=${itemId}`);
    } else if (itemId === 'add-trade') {
      // Already on add-trade page
    } else {
      // For other future pages
      router.push(`/${itemId}`);
    }
  };

  // Dashboard menu items - using the exact same menu as dashboard
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
    },
    {
      id: 'alerts',
      name: 'Alerts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5-5-5h5v-12" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed position to prevent scrolling */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-screen">
        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{user?.fullName || user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          {/* Account Balance with Dropdown - Same design as dashboard */}
          <div className="mt-4 relative">
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${currentAccount.color} shadow-sm`}></div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</p>
                    </div>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                      currentAccount.tag === 'funded' ? 'bg-green-100 text-green-700' :
                      currentAccount.tag === 'demo' ? 'bg-purple-100 text-purple-700' :
                      currentAccount.tag === 'forex' ? 'bg-orange-100 text-orange-700' :
                      currentAccount.tag === 'crypto' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {getTagDisplayName(currentAccount.tag)}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">${Number(currentAccount.balance || 0).toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-600 truncate">{currentAccount.name}</p>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showAccountDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Account Dropdown - Same sophisticated design as dashboard */}
            {showAccountDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto backdrop-blur-sm">
                <div className="p-3">
                  {/* Add New Account Button */}
                  <button
                    onClick={() => {
                      setShowAddAccountModal(true);
                      setShowAccountDropdown(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-blue-200 bg-blue-25 hover:border-blue-300 group"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-blue-700 text-sm">Add New Account</span>
                      <p className="text-xs text-blue-500">Create a new trading account</p>
                    </div>
                  </button>

                  <div className="border-t border-gray-200 my-3"></div>

                  {/* Existing Accounts */}
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 border ${
                          account.id === currentAccountId 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'hover:bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}
                      >
                        <div 
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                          onClick={() => handleSwitchAccount(account.id)}
                        >
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${account.color} shadow-sm`}></div>
                            {account.id === currentAccountId && (
                              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{account.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {editingAccountId === account.id ? (
                                <div className="flex items-center space-x-1">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                                    <input
                                      type="number"
                                      value={editingBalance}
                                      onChange={(e) => setEditingBalance(e.target.value)}
                                      className="w-24 pl-5 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                      autoFocus
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleSaveBalance(account.id)}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAccountId(null);
                                      setEditingBalance('');
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm font-bold text-gray-900">${Number(account.balance || 0).toLocaleString()}</span>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                    account.tag === 'funded' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    account.tag === 'demo' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                    account.tag === 'forex' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                    account.tag === 'crypto' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                    'bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}>
                                    {getTagDisplayName(account.tag)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleEditBalance(account.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit Balance"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {accounts.length > 1 && (
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Delete Account"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Info */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} • Click to switch
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Same design as dashboard */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeMenu === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : item.highlight
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Logout - Same design as dashboard */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content - Add left margin to account for fixed sidebar */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Trade</h1>
              <p className="text-gray-600 mt-1">Record your trading activities</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="trade-form"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Trade'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Form Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <form id="trade-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">
            
            {/* Trading Parameters Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Trading Parameters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Account Selection */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trading Account</label>
                  <select
                    name="accountId"
                    value={formData.accountId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - ${Number(account.balance || 0).toLocaleString()} ({getTagDisplayName(account.tag)})
                      </option>
                    ))}
                  </select>
                  {formData.accountSize > 0 && (
                    <p className="mt-1 text-sm text-gray-600">
                      Account Size: <span className="font-semibold">${Number(formData.accountSize).toLocaleString()}</span>
                    </p>
                  )}
                </div>

                {/* Risk Per Trade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Per Trade</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="riskPerTrade"
                      value={formData.riskPerTrade}
                      onChange={handleChange}
                      step="0.1"
                      min="0.1"
                      max="10"
                      placeholder="2"
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                </div>

                {/* Trading Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trade Status</label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tradeStatus: 'planning' }))}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
                        formData.tradeStatus === 'planning'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Planning
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tradeStatus: 'open' }))}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
                        formData.tradeStatus === 'open'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Open
                    </button>
                  </div>
                </div>
              </div>

              {/* Trading Pair and Strategy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Trading Pair */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trading Pair</label>
                  <button
                    type="button"
                    onClick={() => setShowTradingPairModal(true)}
                    className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-gray-400 hover:shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {formData.tradingPair ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">{formData.tradingPair.split('/')[0] || formData.tradingPair.substring(0, 3)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formData.tradingPair}</p>
                          <p className="text-sm text-gray-500">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Select Trading Pair</p>
                          <p className="text-sm text-gray-400">Choose from Forex, Crypto, Stocks, Commodities</p>
                        </div>
                      </div>
                    )}
                  </button>
                </div>

                {/* Trading Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trading Strategy</label>
                  <button
                    type="button"
                    onClick={() => setShowStrategyModal(true)}
                    className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-gray-400 hover:shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {formData.strategy ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formData.strategy}</p>
                          <p className="text-sm text-gray-500">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Select Strategy</p>
                          <p className="text-sm text-gray-400">Choose from your saved strategies</p>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Price Levels Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Price Levels
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Entry Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                  <input
                    type="number"
                    name="entryPrice"
                    value={formData.entryPrice}
                    onChange={handleChange}
                    step="0.00001"
                    placeholder="1.2500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                  <input
                    type="number"
                    name="takeProfit"
                    value={formData.takeProfit}
                    onChange={handleChange}
                    step="0.00001"
                    placeholder="1.2600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    name="stopLoss"
                    value={formData.stopLoss}
                    onChange={handleChange}
                    step="0.00001"
                    placeholder="1.2400"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Trade Direction - Auto-detected */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trade Direction</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tradeDirection: 'long' }))}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
                        formData.tradeDirection === 'long'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Long
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tradeDirection: 'short' }))}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
                        formData.tradeDirection === 'short'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Short
                    </button>
                  </div>
                  {formData.entryPrice && formData.takeProfit && formData.stopLoss && (
                    <p className="mt-1 text-xs text-blue-600">
                      Auto-detected: {autoDetectTradeDirection(formData.entryPrice, formData.takeProfit, formData.stopLoss).toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-calculated Results */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 16h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Auto-calculated Results
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Risk Amount</p>
                  <p className="text-lg font-bold text-gray-900">${calculatedResults.riskAmount}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Lot Size</p>
                  <p className="text-lg font-bold text-gray-900">{calculatedResults.lotSize}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Potential Profit</p>
                  <p className="text-lg font-bold text-green-600">${calculatedResults.potentialProfit}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-red-100">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Potential Loss</p>
                  <p className="text-lg font-bold text-red-600">${calculatedResults.potentialLoss}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Profit Pips</p>
                  <p className="text-lg font-bold text-gray-900">{calculatedResults.profitPips}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Loss Pips</p>
                  <p className="text-lg font-bold text-gray-900">{calculatedResults.lossPips}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Risk:Reward</p>
                  <p className="text-lg font-bold text-purple-600">1:{calculatedResults.riskRewardRatio}</p>
                </div>
              </div>
            </div>

            {/* Trade Screenshot Upload */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Trade Screenshot
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Trade screenshot" className="max-w-full h-48 object-cover rounded-lg mx-auto" />
                      <p className="text-sm text-blue-600 font-medium">Click to change screenshot</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-lg font-medium text-gray-900">Upload Trade Screenshot</p>
                        <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Trade Analysis and Notes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Trade Analysis & Notes
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comprehensive Trade Analysis</label>
                  <textarea
                    name="analysis"
                    value={formData.analysis}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Enter your comprehensive trade analysis here...

Suggested points:
• Market conditions and setup
• Technical indicators used
• Fundamental analysis (if applicable)
• Entry plan and reasoning
• Exit strategy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Management & Lessons Learned</label>
                  <textarea
                    name="riskManagementLessons"
                    value={formData.riskManagementLessons}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Document risk management decisions and lessons learned...

• Position sizing rationale
• Risk management rules applied
• What worked well?
• What could be improved?
• Key takeaways for future trades"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., scalping, breakout, trend-following"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Suggested Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                {formData.tags && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.split(',').map((tag, index) => (
                        tag.trim() && (
                          <span
                            key={index}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full border border-blue-200"
                          >
                            {tag.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel & Exit
              </button>
              
              <button
                type="button"
                onClick={clearForm}
                className="flex-1 px-6 py-3 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Form
              </button>
              
              <button
                type="submit"
                disabled={loading || !formData.tradingPair || !formData.entryPrice}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Trade...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Trade to Journal
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Account</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Main Trading Account"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Starting Balance</label>
                <input
                  type="number"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <select
                  value={newAccount.tag}
                  onChange={(e) => setNewAccount({ ...newAccount, tag: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="personal">Personal</option>
                  <option value="funded">Funded</option>
                  <option value="demo">Demo</option>
                  <option value="forex">Forex</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newAccount.name || !newAccount.balance}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Balance Modal */}
      {editingAccountId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Account Balance</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Balance</label>
              <input
                type="number"
                value={editingBalance}
                onChange={(e) => setEditingBalance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new balance"
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingAccountId(null);
                  setEditingBalance('');
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveBalance(editingAccountId)}
                disabled={!editingBalance}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Strategy</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Strategy Name</label>
              <input
                type="text"
                value={customStrategy}
                onChange={(e) => setCustomStrategy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter strategy name"
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStrategyModal(false);
                  setCustomStrategy('');
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStrategy}
                disabled={!customStrategy.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trading Pairs Modal */}
      {showTradingPairModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Select Trading Pair</h3>
                <button
                  onClick={() => setShowTradingPairModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Forex Pairs */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Forex Pairs
                  </h4>
                  <div className="space-y-2">
                    {tradingPairs.forex.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-6 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{pair.flag1}</span>
                            </div>
                            <div className="w-6 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{pair.flag2}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-blue-700">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crypto Pairs */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    Cryptocurrency
                  </h4>
                  <div className="space-y-2">
                    {tradingPairs.crypto.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{pair.symbol}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-orange-700">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Pairs */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </span>
                    Stocks
                  </h4>
                  <div className="space-y-2">
                    {tradingPairs.stocks.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{pair.pair.substring(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-green-700">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                            <p className="text-xs text-gray-400">{pair.sector}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commodities */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </span>
                    Commodities
                  </h4>
                  <div className="space-y-2">
                    {tradingPairs.commodities.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                            <span className="text-sm">{pair.symbol}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-yellow-700">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Selection Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Select Trading Strategy</h3>
                <button
                  onClick={() => setShowStrategyModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {strategies.map((strategy) => (
                  <button
                    key={strategy}
                    onClick={() => selectStrategy({ name: strategy })}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-purple-700">{strategy}</p>
                        <p className="text-sm text-gray-500">Trading strategy</p>
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Add Custom Strategy Button */}
                <button
                  onClick={() => {
                    const customStrategy = prompt('Enter custom strategy name:');
                    if (customStrategy && customStrategy.trim()) {
                      if (!strategies.includes(customStrategy.trim())) {
                        setStrategies(prev => [...prev, customStrategy.trim()]);
                      }
                      selectStrategy({ name: customStrategy.trim() });
                    }
                  }}
                  className="w-full p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-100">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 group-hover:text-purple-700">Add Custom Strategy</p>
                      <p className="text-sm text-gray-500">Create a new trading strategy</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 