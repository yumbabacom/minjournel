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

  // Modal states
  const [showTradingPairModal, setShowTradingPairModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [customStrategy, setCustomStrategy] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  // Form data
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
    tradeDirection: 'long',
    tradeStatus: 'planning',
    quantity: '',
    notes: '',
    analysis: '',
    riskManagementLessons: '',
    tags: '',
    screenshot: null
  });

  // Calculated results
  const [calculatedResults, setCalculatedResults] = useState({
    riskAmount: 0,
    lotSize: 0,
    potentialProfit: 0,
    potentialLoss: 0,
    profitPips: 0,
    lossPips: 0,
    riskRewardRatio: 0
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

  // Trading pairs data
  const tradingPairs = {
    forex: [
      { pair: 'EUR/USD', name: 'Euro/US Dollar', flag1: 'EU', flag2: 'US' },
      { pair: 'GBP/USD', name: 'British Pound/US Dollar', flag1: 'GB', flag2: 'US' },
      { pair: 'USD/JPY', name: 'US Dollar/Japanese Yen', flag1: 'US', flag2: 'JP' },
      { pair: 'USD/CHF', name: 'US Dollar/Swiss Franc', flag1: 'US', flag2: 'CH' },
      { pair: 'AUD/USD', name: 'Australian Dollar/US Dollar', flag1: 'AU', flag2: 'US' },
      { pair: 'USD/CAD', name: 'US Dollar/Canadian Dollar', flag1: 'US', flag2: 'CA' },
    ],
    crypto: [
      { pair: 'BTC/USD', name: 'Bitcoin/US Dollar', symbol: '₿' },
      { pair: 'ETH/USD', name: 'Ethereum/US Dollar', symbol: 'Ξ' },
      { pair: 'ADA/USD', name: 'Cardano/US Dollar', symbol: '₳' },
      { pair: 'DOT/USD', name: 'Polkadot/US Dollar', symbol: '●' },
    ],
    stocks: [
      { pair: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
      { pair: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
      { pair: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
      { pair: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
    ],
    commodities: [
      { pair: 'XAU/USD', name: 'Gold/US Dollar', symbol: '🥇' },
      { pair: 'XAG/USD', name: 'Silver/US Dollar', symbol: '🥈' },
      { pair: 'WTI', name: 'West Texas Intermediate Oil', symbol: '🛢️' },
    ]
  };

  // Strategies array
  const [strategies, setStrategies] = useState([
    'Breakout',
    'Trend Following',
    'Mean Reversion',
    'Scalping',
    'Swing Trading',
    'Day Trading',
    'Momentum',
    'Support/Resistance',
  ]);

  // Suggested tags
  const suggestedTags = [
    'scalping', 'swing-trade', 'day-trade', 'breakout', 'trend-following',
    'support-resistance', 'news-trade', 'technical-analysis', 'momentum',
    'reversal', 'continuation', 'pullback', 'bounce', 'channel'
  ];

  // Auto-detect trade direction
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
    const profitPips = Math.abs(takeProfit - entryPrice) * 10000;
    const lossPips = Math.abs(entryPrice - stopLoss) * 10000;
    const pipValue = 10;
    const lotSize = riskAmount / (lossPips * pipValue);
    const potentialProfit = profitPips * pipValue * lotSize;
    const potentialLoss = lossPips * pipValue * lotSize;
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
    
    if (['entryPrice', 'takeProfit', 'stopLoss'].includes(name)) {
      const direction = autoDetectTradeDirection(
        name === 'entryPrice' ? value : newFormData.entryPrice,
        name === 'takeProfit' ? value : newFormData.takeProfit,
        name === 'stopLoss' ? value : newFormData.stopLoss
      );
      newFormData.tradeDirection = direction;
    }
    
    if (name === 'accountId') {
      const selectedAccount = accounts.find(acc => acc.id === parseInt(value));
      if (selectedAccount) {
        newFormData.accountSize = selectedAccount.balance;
      }
    }
    
    setFormData(newFormData);
    const results = calculateResults(newFormData);
    setCalculatedResults(results);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Trade data:', formData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Trade added successfully!');
      clearForm();
    } catch (error) {
      console.error('Error submitting trade:', error);
      alert('Failed to add trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('auth-token');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleNavigation = (itemId) => {
    if (itemId === 'dashboard' || itemId === 'analytics' || itemId === 'strategy') {
      router.push(`/dashboard?section=${itemId}`);
    } else if (itemId === 'add-trade') {
      // Already on add-trade page
    } else {
      router.push(`/${itemId}`);
    }
  };

  // Menu items
  const menuItems = [
    {
      id: 'dashboard',
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
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
  ];

  // Authentication
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Minimal Design */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 h-screen shadow-sm">
        {/* User Profile */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user?.fullName || user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeMenu === item.id
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : item.highlight
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Trade</h1>
                <p className="text-gray-500 text-sm">Record your trading activity</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm flex items-center space-x-2 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </button>
              <button 
                type="submit"
                form="trade-form"
                disabled={loading || !formData.tradingPair || !formData.entryPrice}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Trade</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Form Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <form id="trade-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">
            
            {/* Trading Setup Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Trading Setup</h3>
                    <p className="text-sm text-gray-600">Configure your trade parameters</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                {/* Trading Pair and Strategy Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Trading Pair */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">Trading Pair</label>
                    <button
                      type="button"
                      onClick={() => setShowTradingPairModal(true)}
                      className="w-full p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-blue-300 rounded-2xl text-left transition-all duration-200 group"
                    >
                      {formData.tradingPair ? (
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm font-bold">{formData.tradingPair.split('/')[0] || formData.tradingPair.substring(0, 3)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-lg">{formData.tradingPair}</p>
                            <p className="text-sm text-gray-500 font-medium">Click to change pair</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-500 text-lg">Select Trading Pair</p>
                            <p className="text-sm text-gray-400 font-medium">Choose from Forex, Crypto, Stocks</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Trading Strategy */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">Strategy</label>
                    <button
                      type="button"
                      onClick={() => setShowStrategyModal(true)}
                      className="w-full p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-purple-300 rounded-2xl text-left transition-all duration-200 group"
                    >
                      {formData.strategy ? (
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-lg">{formData.strategy}</p>
                            <p className="text-sm text-gray-500 font-medium">Click to change strategy</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-500 text-lg">Select Strategy</p>
                            <p className="text-sm text-gray-400 font-medium">Choose your trading strategy</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Account, Risk, Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Account Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Account
                    </label>
                    <div className="relative">
                      <select
                        name="accountId"
                        value={formData.accountId || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none font-semibold text-gray-900"
                      >
                        <option value="">Choose Account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} - ${Number(account.balance || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {formData.accountSize > 0 && (
                      <p className="text-sm text-gray-600 font-semibold bg-green-50 px-3 py-2 rounded-lg">
                        Balance: <span className="text-green-700">${Number(formData.accountSize).toLocaleString()}</span>
                      </p>
                    )}
                  </div>

                  {/* Risk Per Trade */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Risk Per Trade
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="riskPerTrade"
                        value={formData.riskPerTrade}
                        onChange={handleChange}
                        step="0.1"
                        min="0.1"
                        max="10"
                        placeholder="2.0"
                        className="w-full px-4 py-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-gray-900"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">%</span>
                    </div>
                  </div>

                  {/* Trade Status */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status
                    </label>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tradeStatus: 'planning' }))}
                        className={`flex-1 flex items-center justify-center px-4 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                          formData.tradeStatus === 'planning'
                            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-md'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Planning
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tradeStatus: 'open' }))}
                        className={`flex-1 flex items-center justify-center px-4 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                          formData.tradeStatus === 'open'
                            ? 'bg-green-50 border-green-300 text-green-700 shadow-md'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Live
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Levels Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Price Levels</h3>
                    <p className="text-sm text-gray-600">Set your entry, take profit, and stop loss</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Entry Price */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      Entry Price
                    </label>
                    <input
                      type="number"
                      name="entryPrice"
                      value={formData.entryPrice}
                      onChange={handleChange}
                      step="0.00001"
                      placeholder="1.2500"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-gray-900"
                    />
                  </div>

                  {/* Take Profit */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      Take Profit
                    </label>
                    <input
                      type="number"
                      name="takeProfit"
                      value={formData.takeProfit}
                      onChange={handleChange}
                      step="0.00001"
                      placeholder="1.2600"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-semibold text-gray-900"
                    />
                  </div>

                  {/* Stop Loss */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                      Stop Loss
                    </label>
                    <input
                      type="number"
                      name="stopLoss"
                      value={formData.stopLoss}
                      onChange={handleChange}
                      step="0.00001"
                      placeholder="1.2400"
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-semibold text-gray-900"
                    />
                  </div>

                  {/* Trade Direction - Auto-detected */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Direction
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tradeDirection: 'long' }))}
                        className={`flex-1 flex items-center justify-center px-3 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                          formData.tradeDirection === 'long'
                            ? 'bg-green-50 border-green-300 text-green-700 shadow-md'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Long
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tradeDirection: 'short' }))}
                        className={`flex-1 flex items-center justify-center px-3 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                          formData.tradeDirection === 'short'
                            ? 'bg-red-50 border-red-300 text-red-700 shadow-md'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Short
                      </button>
                    </div>
                    {formData.entryPrice && formData.takeProfit && formData.stopLoss && (
                      <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg">
                        Auto-detected: {autoDetectTradeDirection(formData.entryPrice, formData.takeProfit, formData.stopLoss).toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-calculated Results */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-purple-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 16h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Auto-calculated Results</h3>
                    <p className="text-sm text-gray-600">Risk management and profit/loss calculations</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Risk Amount</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">${calculatedResults.riskAmount}</p>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Lot Size</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{calculatedResults.lotSize}</p>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Potential Profit</p>
                    </div>
                    <p className="text-xl font-bold text-green-700">${calculatedResults.potentialProfit}</p>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Potential Loss</p>
                    </div>
                    <p className="text-xl font-bold text-red-700">${calculatedResults.potentialLoss}</p>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Profit Pips</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{calculatedResults.profitPips}</p>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Loss Pips</p>
                    </div>
                    <p className="text-xl font-bold text-orange-700">{calculatedResults.lossPips}</p>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Risk:Reward</p>
                    </div>
                    <p className="text-xl font-bold text-purple-700">1:{calculatedResults.riskRewardRatio}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Screenshot Upload Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Trade Screenshot</h3>
                    <p className="text-sm text-gray-600">Upload your chart analysis or trade setup</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-25 transition-all duration-200 group">
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
                        <img src={imagePreview} alt="Trade screenshot" className="max-w-full h-48 object-cover rounded-xl mx-auto shadow-md" />
                        <div className="flex items-center justify-center space-x-2 text-indigo-600 font-semibold">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Click to change screenshot</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-indigo-200 transition-colors">
                          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900 mb-2">Upload Trade Screenshot</p>
                          <p className="text-sm text-gray-500 mb-4">PNG, JPG, GIF up to 10MB</p>
                          <div className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Choose File
                          </div>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Trade Analysis & Notes Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Trade Analysis & Notes</h3>
                    <p className="text-sm text-gray-600">Document your trade reasoning and lessons learned</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7l2 2 4-4" />
                    </svg>
                    Comprehensive Trade Analysis
                  </label>
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
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none font-medium text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Risk Management & Lessons Learned
                  </label>
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
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none font-medium text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Tags Section Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Tags</h3>
                    <p className="text-sm text-gray-600">Categorize your trade for easy filtering and analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., scalping, breakout, trend-following"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-gray-900"
                  />
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Suggested Tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300 border border-gray-200 transition-all font-medium shadow-sm hover:shadow-md"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                {formData.tags && (
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Current Tags:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.split(',').map((tag, index) => (
                        tag.trim() && (
                          <span
                            key={index}
                            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-xl border border-blue-200 font-medium shadow-sm"
                          >
                            #{tag.trim()}
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
                className="flex-1 px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold text-sm flex items-center justify-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel & Exit
              </button>
              
              <button
                type="button"
                onClick={clearForm}
                className="flex-1 px-8 py-4 border-2 border-orange-200 text-orange-700 rounded-2xl hover:bg-orange-50 transition-all font-bold text-sm flex items-center justify-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Form
              </button>
              
              <button
                type="submit"
                disabled={loading || !formData.tradingPair || !formData.entryPrice}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm flex items-center justify-center shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Trade...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Trading Pairs Modal - Beautiful Design */}
      {showTradingPairModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Select Trading Pair</h3>
                    <p className="text-gray-600">Choose from various markets and instruments</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTradingPairModal(false)}
                  className="p-3 text-gray-400 hover:text-gray-600 rounded-2xl hover:bg-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Forex Pairs */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </span>
                    Forex Pairs
                  </h4>
                  <div className="space-y-3">
                    {tradingPairs.forex.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-4 text-left border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex space-x-1">
                            <div className="w-8 h-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-white text-xs font-bold">{pair.flag1}</span>
                            </div>
                            <div className="w-8 h-6 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-white text-xs font-bold">{pair.flag2}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 group-hover:text-blue-700 text-lg">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crypto Pairs */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    Cryptocurrency
                  </h4>
                  <div className="space-y-3">
                    {tradingPairs.crypto.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-4 text-left border border-gray-200 rounded-2xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white text-lg font-bold">{pair.symbol}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 group-hover:text-orange-700 text-lg">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Pairs */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </span>
                    Stocks
                  </h4>
                  <div className="space-y-3">
                    {tradingPairs.stocks.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-4 text-left border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">{pair.pair.substring(0, 2)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 group-hover:text-green-700 text-lg">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commodities */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </span>
                    Commodities
                  </h4>
                  <div className="space-y-3">
                    {tradingPairs.commodities.map((pair) => (
                      <button
                        key={pair.pair}
                        onClick={() => selectTradingPair(pair.pair)}
                        className="w-full p-4 text-left border border-gray-200 rounded-2xl hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-lg">{pair.symbol}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 group-hover:text-yellow-700 text-lg">{pair.pair}</p>
                            <p className="text-sm text-gray-500">{pair.name}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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

      {/* Strategy Selection Modal - Beautiful Design */}
      {showStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Select Trading Strategy</h3>
                    <p className="text-gray-600">Choose from your saved strategies or create a new one</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStrategyModal(false)}
                  className="p-3 text-gray-400 hover:text-gray-600 rounded-2xl hover:bg-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <button
                    key={strategy}
                    onClick={() => selectStrategy({ name: strategy })}
                    className="w-full p-5 text-left border border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 group-hover:text-purple-700 text-lg">{strategy}</p>
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
                  className="w-full p-5 text-left border-2 border-dashed border-purple-300 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors shadow-sm">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-purple-700 group-hover:text-purple-800 text-lg">Add Custom Strategy</p>
                      <p className="text-sm text-purple-500">Create a new trading strategy</p>
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