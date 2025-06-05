'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isAMTrader, setIsAMTrader] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingBalance, setEditingBalance] = useState('');
  const [currentAccountId, setCurrentAccountId] = useState(1);
  const [showCreateStrategyModal, setShowCreateStrategyModal] = useState(false);
  const [showManageAllModal, setShowManageAllModal] = useState(false);
  const [showViewStrategyModal, setShowViewStrategyModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [viewingStrategy, setViewingStrategy] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);
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

  // Initialize activeMenu based on URL parameter
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['dashboard', 'analytics', 'strategy'].includes(section)) {
      setActiveMenu(section);
    } else {
      setActiveMenu('dashboard');
    }
  }, [searchParams]);

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
          isActive: accounts.length === 0 // Make first account active
        };

        setAccounts([...accounts, accountData]);
        
        // If this is the first account, make it active
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

  // Switch account function
  const handleSwitchAccount = (accountId) => {
    setCurrentAccountId(accountId);
    setAccounts(accounts.map(acc => ({
      ...acc,
      isActive: acc.id === accountId
    })));
    setShowAccountDropdown(false);
    
    // Update localStorage to sync with Add Trade page
    localStorage.setItem('currentAccountId', accountId);
  };

  // Edit balance function
  const handleEditBalance = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    setEditingAccountId(accountId);
    setEditingBalance(account.balance.toString());
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
    if (accounts.length <= 1) {
      alert("You can't delete your only account.");
      return;
    }

    const userId = user?.id || user?._id;
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/accounts?accountId=${accountId}&userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
        setAccounts(updatedAccounts);
        
        // If deleted account was active, switch to first available
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
      const url = `/api/strategies?userId=${userId}`;
      const response = await fetch(url);
      
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

  // Calculate strategy statistics
  const getStrategyStats = () => {
    const activeStrategies = strategies.filter(s => s.status === 'active').length;
    const testingStrategies = strategies.filter(s => s.status === 'testing').length;
    const totalStrategies = strategies.length;
    
    // Mock performance data for now - you can enhance this with real trade data later
    const mockPerformance = strategies.map(strategy => ({
      ...strategy,
      profit: Math.floor(Math.random() * 5000) + 1000,
      trades: Math.floor(Math.random() * 50) + 10,
      winRate: Math.floor(Math.random() * 40) + 60,
      sharpe: (Math.random() * 2 + 1).toFixed(1)
    }));

    return {
      active: activeStrategies,
      testing: testingStrategies,
      total: totalStrategies,
      performance: mockPerformance
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
      const response = await fetch(`/api/strategies?strategyId=${strategyId}&userId=${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
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

  const handleDuplicateStrategy = async (strategy) => {
    const duplicateStrategy = {
      ...strategy,
      name: `${strategy.name} (Copy)`,
      _id: undefined, // Remove the ID so it creates a new one
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const userId = user?.id || user?._id || 'demo-user';
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Sample trading data
  const [trades] = useState([
    { id: 1, pair: 'EUR/USD', type: 'Buy', entry: 1.0850, exit: 1.0920, profit: 245.50, status: 'Closed', date: '2024-01-15', time: '14:30', riskReward: '1:2.5', session: 'European', psychology: 'Confident' },
    { id: 2, pair: 'GBP/JPY', type: 'Sell', entry: 185.20, exit: 184.50, profit: 180.30, status: 'Closed', date: '2024-01-15', time: '11:15', riskReward: '1:1.8', session: 'European', psychology: 'Neutral' },
    { id: 3, pair: 'USD/CHF', type: 'Buy', entry: 0.8920, exit: null, profit: -45.20, status: 'Open', date: '2024-01-16', time: '09:45', riskReward: '1:2.0', session: 'European', psychology: 'Anxious' },
    { id: 4, pair: 'AUD/USD', type: 'Sell', entry: 0.6750, exit: 0.6720, profit: 320.80, status: 'Closed', date: '2024-01-14', time: '16:20', riskReward: '1:3.2', session: 'American', psychology: 'Confident' },
  ]);

  const [stats] = useState({
    totalBalance: 12345.67,
    monthlyProfit: 1234.56,
    totalTrades: 47,
    winRate: 73.4,
    avgWin: 285.40,
    avgLoss: -120.30,
    maxDrawdown: -450.20,
    profitFactor: 2.85,
    sharpeRatio: 1.42,
    dailyGain: 2.3
  });

  const [alerts] = useState([
    { id: 1, pair: 'EUR/USD', type: 'Price Alert', message: 'Price reached 1.0950', time: '5 min ago', status: 'new' },
    { id: 2, pair: 'GBP/JPY', type: 'Risk Alert', message: 'Position risk exceeds 3%', time: '12 min ago', status: 'warning' },
    { id: 3, pair: 'USD/CHF', type: 'News Alert', message: 'Fed announcement at 2PM EST', time: '1 hour ago', status: 'info' }
  ]);

  const [watchlist] = useState([
    { pair: 'EUR/USD', price: '1.0920', change: '+0.0025', changePercent: '+0.23%', trend: 'up' },
    { pair: 'GBP/JPY', price: '184.50', change: '-1.20', changePercent: '-0.65%', trend: 'down' },
    { pair: 'USD/CHF', price: '0.8920', change: '+0.0015', changePercent: '+0.17%', trend: 'up' },
    { pair: 'AUD/USD', price: '0.6720', change: '+0.0008', changePercent: '+0.12%', trend: 'up' }
  ]);

  // Fetch user accounts function
  const fetchAccounts = async () => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      const response = await fetch(`/api/accounts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const userAccounts = (data.accounts || []).map(account => ({
          ...account,
          id: account._id, // Use MongoDB _id as id
          color: getTagColor(account.tag)
        }));
        setAccounts(userAccounts);
        
        // Set the first account as active if none is set
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

  useEffect(() => {
    // Check if user is logged in
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

    setLoading(false);
  }, [router]);

  // Fetch accounts when user is set
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchAccounts();
    }
  }, [user]);

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
      ),
      badge: alerts.filter(alert => alert.status === 'new').length
    }
  ];

  // Mock analytics data (for sections that still need it)
  const analyticsData = {
    strategyPerformance: [
      { strategy: 'Trend Following', trades: 28, winRate: 78.6, profit: 2450.30, sharpe: 1.8 },
      { strategy: 'Mean Reversion', trades: 15, winRate: 66.7, profit: 890.20, sharpe: 1.2 },
      { strategy: 'Breakout', trades: 12, winRate: 75.0, profit: 1120.80, sharpe: 1.6 },
      { strategy: 'Scalping', trades: 8, winRate: 62.5, profit: 340.50, sharpe: 0.9 }
    ],
    performanceMetrics: {
      totalReturn: 24.8,
      annualizedReturn: 18.4,
      sharpeRatio: 1.65,
      sortinoRatio: 2.1,
      maxDrawdown: -8.2,
      calmarRatio: 2.24,
      sqn: 3.8,
      profitFactor: 1.85,
      winRate: 68.5,
      avgWin: 285.40,
      avgLoss: -165.20,
      expectancy: 124.80
    },
    monthlyReturns: [
      { month: 'Jan', return: 4.2 },
      { month: 'Feb', return: -1.8 },
      { month: 'Mar', return: 6.5 },
      { month: 'Apr', return: 2.1 },
      { month: 'May', return: -2.3 },
      { month: 'Jun', return: 5.8 },
      { month: 'Jul', return: 3.2 },
      { month: 'Aug', return: 1.9 },
      { month: 'Sep', return: 4.6 },
      { month: 'Oct', return: -1.2 },
      { month: 'Nov', return: 3.8 },
      { month: 'Dec', return: 2.9 }
    ],
    pairAnalysis: [
      { pair: 'EUR/USD', trades: 24, winRate: 75, profit: 1250.30, avgHold: '2h 15m', bestTime: 'London Open' },
      { pair: 'GBP/JPY', trades: 18, winRate: 67, profit: 890.50, avgHold: '1h 45m', bestTime: 'Overlap' },
      { pair: 'USD/CHF', trades: 16, winRate: 63, profit: 567.20, avgHold: '3h 20m', bestTime: 'NY Session' },
      { pair: 'AUD/USD', trades: 12, winRate: 58, profit: 423.80, avgHold: '1h 30m', bestTime: 'Asian Close' }
    ],
    drawdownAnalysis: [
      { period: 'Max Historical', amount: -8.2, duration: '12 days', recovery: '6 days' },
      { period: 'Last 30 Days', amount: -3.1, duration: '4 days', recovery: '2 days' },
      { period: 'Last 7 Days', amount: -1.8, duration: '2 days', recovery: '1 day' },
      { period: 'Current', amount: 0, duration: '0 days', recovery: 'N/A' }
    ],
    correlationMatrix: [
      { metric: 'EUR/USD vs GBP/USD', correlation: 0.75 },
      { metric: 'USD/JPY vs USD/CHF', correlation: 0.68 },
      { metric: 'AUD/USD vs NZD/USD', correlation: 0.82 },
      { metric: 'Gold vs USD/CHF', correlation: -0.65 }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Minimal Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-screen">
        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          {/* Account Balance with Dropdown */}
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
                  <p className="font-bold text-gray-900 text-base">${currentAccount.balance.toLocaleString()}</p>
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

            {/* Account Dropdown */}
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
                                  <span className="text-sm font-bold text-gray-900">${account.balance.toLocaleString()}</span>
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

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'add-trade') {
                    router.push('/add-trade');
                  } else if (item.id === 'journal') {
                    router.push('/journal');
                  } else {
                    setActiveMenu(item.id);
                  }
                }}
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content - Add left margin to account for fixed sidebar */}
      <div className="flex-1 flex flex-col ml-64">
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
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Daily P&L</p>
                      <p className="text-2xl font-semibold text-green-600">+${stats.monthlyProfit.toLocaleString()}</p>
                      <p className="text-xs text-green-600">+{stats.dailyGain}%</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Win Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.winRate}%</p>
                      <p className="text-xs text-gray-500">{stats.totalTrades} trades</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Sharpe Ratio</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.sharpeRatio}</p>
                      <p className="text-xs text-gray-500">Risk adjusted</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Profit Factor</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.profitFactor}</p>
                      <p className="text-xs text-gray-500">Good ratio</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Account Performance</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Profit</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">Loss</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between space-x-1">
                    {[320, 280, 150, 420, 260, 380, 340, 290, 450, 310, 280, 520, 480, 350].map((height, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t ${height > 300 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300 hover:opacity-70`} 
                          style={{height: `${height/8}px`}}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Watchlist */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Watchlist</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Manage
                    </button>
                  </div>
                  <div className="space-y-3">
                    {watchlist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.pair}</p>
                          <p className="text-xs text-gray-500">{item.price}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.changePercent}
                          </p>
                          <div className="flex items-center">
                            <svg className={`w-4 h-4 ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.trend === 'up' ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    <span className="text-sm text-gray-500">Last 50 trades</span>
                  </div>
                  <div className="flex items-center justify-center h-48">
                    <div className="relative w-32 h-32">
                      {/* Donut Chart */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
                        {/* Win percentage (73.4%) */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="35" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="10"
                          strokeDasharray="162 220"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">73.4%</div>
                          <div className="text-xs text-gray-500">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Wins (37)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-600">Losses (13)</span>
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
                    {[
                      { month: 'Jan', value: 2.3, positive: true },
                      { month: 'Feb', value: -1.2, positive: false },
                      { month: 'Mar', value: 4.1, positive: true },
                      { month: 'Apr', value: 1.8, positive: true },
                      { month: 'May', value: 3.5, positive: true },
                      { month: 'Jun', value: 2.7, positive: true },
                      { month: 'Jul', value: 1.9, positive: true },
                      { month: 'Aug', value: 0.3, positive: true },
                    ].map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t ${item.positive ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300 hover:opacity-70`} 
                          style={{height: `${Math.abs(item.value) * 20 + 20}px`}}
                        ></div>
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500">{item.month}</span>
                          <p className="text-xs font-medium">{item.value > 0 ? '+' : ''}{item.value}%</p>
                        </div>
                      </div>
                    ))}
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
                    {[
                      { pair: 'EUR/USD', profit: 1245.80, winRate: 77.8, trades: 18 },
                      { pair: 'GBP/JPY', profit: 890.30, winRate: 66.7, trades: 12 },
                      { pair: 'USD/CHF', profit: 780.20, winRate: 80.0, trades: 10 },
                      { pair: 'AUD/USD', profit: 520.40, winRate: 71.4, trades: 7 },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">{item.pair.split('/')[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.pair}</p>
                            <p className="text-xs text-gray-500">{item.trades} trades • {item.winRate}% win</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">${item.profit}</p>
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-green-500 h-1 rounded-full"
                              style={{width: `${item.winRate}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                        <tr key={trade.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-xs font-medium">{trade.pair.split('/')[0]}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{trade.pair}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                              trade.type === 'Buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${trade.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.profit > 0 ? '+' : ''}${trade.profit}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{trade.riskReward}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                              trade.status === 'Closed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {trade.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{trade.date}</td>
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

          {/* Sessions Analysis Page */}
          {activeMenu === 'sessions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Asian Session */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Asian Session</h3>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trades</span>
                      <span className="font-medium">{sessionData.asian.trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">P&L</span>
                      <span className="font-medium text-green-600">${sessionData.asian.profit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Win Rate</span>
                      <span className="font-medium">{sessionData.asian.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Volume</span>
                      <span className="font-medium">{sessionData.asian.volume}</span>
                    </div>
                  </div>
                </div>

                {/* European Session */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">European Session</h3>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trades</span>
                      <span className="font-medium">{sessionData.european.trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">P&L</span>
                      <span className="font-medium text-green-600">${sessionData.european.profit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Win Rate</span>
                      <span className="font-medium">{sessionData.european.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Volume</span>
                      <span className="font-medium">{sessionData.european.volume}</span>
                    </div>
                  </div>
                </div>

                {/* American Session */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">American Session</h3>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trades</span>
                      <span className="font-medium">{sessionData.american.trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">P&L</span>
                      <span className="font-medium text-green-600">${sessionData.american.profit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Win Rate</span>
                      <span className="font-medium">{sessionData.american.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Volume</span>
                      <span className="font-medium">{sessionData.american.volume}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Performance Chart */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Session Performance Comparison</h3>
                <div className="h-64 flex items-end justify-center space-x-8">
                  <div className="text-center">
                    <div className="w-16 bg-orange-500 rounded-t" style={{height: `${sessionData.asian.profit/5}px`}}></div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Asian</p>
                    <p className="text-xs text-gray-500">${sessionData.asian.profit}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 bg-blue-500 rounded-t" style={{height: `${sessionData.european.profit/5}px`}}></div>
                    <p className="text-sm font-medium text-gray-700 mt-2">European</p>
                    <p className="text-xs text-gray-500">${sessionData.european.profit}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 bg-green-500 rounded-t" style={{height: `${sessionData.american.profit/5}px`}}></div>
                    <p className="text-sm font-medium text-gray-700 mt-2">American</p>
                    <p className="text-xs text-gray-500">${sessionData.american.profit}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Analysis Page */}
          {activeMenu === 'risk-analysis' && (
            <div className="space-y-6">
              {/* Risk Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Portfolio Risk</p>
                      <p className="text-2xl font-semibold text-orange-600">{riskMetrics.portfolioRisk}%</p>
                      <p className="text-xs text-gray-500">Current exposure</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.132 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Max Risk/Trade</p>
                      <p className="text-2xl font-semibold text-red-600">{riskMetrics.maxRiskPerTrade}%</p>
                      <p className="text-xs text-gray-500">Per position</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Drawdown</p>
                      <p className="text-2xl font-semibold text-red-600">{riskMetrics.currentDrawdown}%</p>
                      <p className="text-xs text-gray-500">From peak</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Sharpe Ratio</p>
                      <p className="text-2xl font-semibold text-green-600">{riskMetrics.riskAdjustedReturn}</p>
                      <p className="text-xs text-gray-500">Risk adjusted</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Breakdown */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Value at Risk (VaR)</span>
                      <span className="font-medium text-red-600">${riskMetrics.varDaily}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Beta to Market</span>
                      <span className="font-medium">{riskMetrics.betaToMarket}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Correlation Risk</span>
                      <span className="font-medium">{riskMetrics.correlationRisk}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Leverage Ratio</span>
                      <span className="font-medium">{riskMetrics.leverageRatio}:1</span>
                    </div>
                  </div>
                </div>

                {/* Risk Distribution Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
                  <div className="space-y-3">
                    {positionData.map((position, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{position.pair}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: `${position.risk * 20}%`}}></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{position.risk}%</span>
                      </div>
                    ))}
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
                                <span className="text-blue-600 text-xs font-medium">{position.pair.split('/')[0]}</span>
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

          {/* Advanced Analytics Page */}
          {activeMenu === 'analytics' && (
            <div className="space-y-6">
              {/* Analytics Header with Export Options */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Advanced Analytics & Reporting</h3>
                    <p className="text-sm text-gray-500">Comprehensive performance analysis and detailed reports</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Last 6 Months</option>
                      <option>Year to Date</option>
                      <option>All Time</option>
                      <option>Custom Range</option>
                    </select>
                    <button className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Performance Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Return</p>
                      <p className="text-2xl font-semibold text-green-600">{analyticsData.performanceMetrics.totalReturn}%</p>
                      <p className="text-xs text-gray-500">Annualized: {analyticsData.performanceMetrics.annualizedReturn}%</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Sharpe Ratio</p>
                      <p className="text-2xl font-semibold text-blue-600">{analyticsData.performanceMetrics.sharpeRatio}</p>
                      <p className="text-xs text-gray-500">Sortino: {analyticsData.performanceMetrics.sortinoRatio}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Max Drawdown</p>
                      <p className="text-2xl font-semibold text-red-600">{analyticsData.performanceMetrics.maxDrawdown}%</p>
                      <p className="text-xs text-gray-500">Calmar: {analyticsData.performanceMetrics.calmarRatio}</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">System Quality</p>
                      <p className="text-2xl font-semibold text-purple-600">{analyticsData.performanceMetrics.sqn}</p>
                      <p className="text-xs text-gray-500">SQN Rating</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
                    {analyticsData.monthlyReturns.map((month, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t ${month.return > 0 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300 hover:opacity-70`} 
                          style={{height: `${Math.abs(month.return) * 20 + 20}px`}}
                        ></div>
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500">{month.month}</span>
                          <p className="text-xs font-medium">{month.return}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategy Performance */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Strategy Analysis</h4>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                  <div className="space-y-3">
                    {getStrategyStats().performance.length > 0 
                      ? getStrategyStats().performance.map((strategy, index) => (
                        <div key={strategy._id || index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-green-500' : 
                                index === 1 ? 'bg-blue-500' : 
                                index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                              }`}></div>
                              <span className="font-medium text-gray-900">{strategy.name}</span>
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                                strategy.status === 'active' ? 'bg-green-100 text-green-800' :
                                strategy.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                                strategy.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {strategy.status}
                              </span>
                            </div>
                            <span className="text-green-600 font-medium">${strategy.profit}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-gray-600">Trades</p>
                              <p className="font-semibold">{strategy.trades}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Win Rate</p>
                              <p className="font-semibold">{strategy.winRate}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Sharpe</p>
                              <p className="font-semibold">{strategy.sharpe}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  index === 0 ? 'bg-green-500' : 
                                  index === 1 ? 'bg-blue-500' : 
                                  index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                                }`}
                                style={{width: `${strategy.winRate}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                      : (
                        <div className="text-center py-6">
                          <p className="text-gray-500">No strategy performance data available yet.</p>
                          <p className="text-sm text-gray-400 mt-1">Create strategies and start trading to see performance metrics.</p>
                        </div>
                      )
                    }
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
                    {analyticsData.pairAnalysis.map((pair, index) => (
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
                          <p className="font-medium text-green-600">${pair.profit}</p>
                          <p className="text-xs text-gray-500">{pair.bestTime}</p>
                        </div>
                      </div>
                    ))}
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
                    {analyticsData.drawdownAnalysis.map((dd, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-600">{dd.drawdown}%</p>
                          <p className="text-xs text-gray-600">{dd.date}</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>Duration: {dd.duration} days</p>
                          <p>Recovery: {dd.recovery} days</p>
                        </div>
                      </div>
                    ))}
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
                        <span className="font-medium">{analyticsData.performanceMetrics.totalReturn}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annualized Return</span>
                        <span className="font-medium">{analyticsData.performanceMetrics.annualizedReturn}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Drawdown</span>
                        <span className="font-medium text-red-600">{analyticsData.performanceMetrics.maxDrawdown}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calmar Ratio</span>
                        <span className="font-medium">{analyticsData.performanceMetrics.calmarRatio}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Risk Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sharpe Ratio</span>
                        <span className="font-medium">{analyticsData.performanceMetrics.sharpeRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sortino Ratio</span>
                        <span className="font-medium">{analyticsData.performanceMetrics.sortinoRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">System Quality</span>
                        <span className="font-medium">{analyticsData.performanceMetrics.sqn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Factor</span>
                        <span className="font-medium">{analyticsData.performanceMetrics.profitFactor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Trade Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Win Rate</span>
                        <span className="font-medium">{analyticsData.performanceMetrics.winRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Win</span>
                        <span className="font-medium text-green-600">${analyticsData.performanceMetrics.avgWin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Loss</span>
                        <span className="font-medium text-red-600">${analyticsData.performanceMetrics.avgLoss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expectancy</span>
                        <span className="font-medium">${analyticsData.performanceMetrics.expectancy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Correlation Matrix */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Correlation Analysis</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Full Matrix
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyticsData.correlationMatrix.map((corr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{corr.pair1} vs {corr.pair2}</p>
                        <p className="text-sm text-gray-600">Correlation coefficient</p>
                      </div>
                      <div className={`text-lg font-bold ${
                        corr.correlation > 0.5 ? 'text-red-600' : 
                        corr.correlation < -0.5 ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {corr.correlation.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Strategy Page */}
          {activeMenu === 'strategy' && (
            <div className="space-y-6">
              {/* Strategy Overview Header */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Trading Strategies</h3>
                    <p className="text-sm text-gray-500">Manage and analyze your trading strategies and setups</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateStrategyModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Strategy</span>
                  </button>
                </div>
              </div>

              {/* Strategy Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Strategies</p>
                      <p className="text-2xl font-semibold text-blue-600">{getStrategyStats().active}</p>
                      <p className="text-xs text-gray-500">Currently trading</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Testing Strategies</p>
                      <p className="text-2xl font-semibold text-orange-600">{getStrategyStats().testing}</p>
                      <p className="text-xs text-gray-500">In development</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Strategies</p>
                      <p className="text-2xl font-semibold text-purple-600">{getStrategyStats().total}</p>
                      <p className="text-xs text-gray-500">Created</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Best Win Rate</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {getStrategyStats().performance.length > 0 
                          ? Math.max(...getStrategyStats().performance.map(s => s.winRate)) + '%'
                          : 'N/A'
                        }
                      </p>
                      <p className="text-xs text-gray-500">Highest performer</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Performance Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Strategy Performance</h4>
                    <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                      <option>Last 3 Months</option>
                      <option>Last 6 Months</option>
                      <option>Year to Date</option>
                      <option>All Time</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    {analyticsData.strategyPerformance.map((strategy, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-green-500' : 
                              index === 1 ? 'bg-blue-500' : 
                              index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                            }`}></div>
                            <span className="font-medium text-gray-900">{strategy.strategy}</span>
                          </div>
                          <span className="text-green-600 font-medium">${strategy.profit}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600">Trades</p>
                            <p className="font-semibold">{strategy.trades}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Win Rate</p>
                            <p className="font-semibold">{strategy.winRate}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Sharpe</p>
                            <p className="font-semibold">{strategy.sharpe}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-green-500' : 
                                index === 1 ? 'bg-blue-500' : 
                                index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                              }`}
                              style={{width: `${strategy.winRate}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategy Rules & Setups */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Your Strategies</h4>
                    <button 
                      onClick={() => setShowManageAllModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      <span>Manage All</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {strategies.length > 0 
                      ? strategies.map((strategy, index) => (
                        <div key={strategy._id || index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{strategy.name}</p>
                              <p className="text-sm text-gray-600">{strategy.tradingStyle} • {strategy.marketType?.join(', ')}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                                strategy.status === 'active' ? 'bg-green-100 text-green-800' :
                                strategy.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                                strategy.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {strategy.status}
                              </span>
                            </div>
                          </div>
                          {strategy.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{strategy.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Created: {new Date(strategy.createdAt).toLocaleDateString()}</span>
                            <span>v{strategy.version}</span>
                          </div>
                        </div>
                      ))
                      : (
                        <div className="text-center py-6">
                          <p className="text-gray-500">No strategies created yet.</p>
                          <p className="text-sm text-gray-400 mt-1">Start by creating your first trading strategy.</p>
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>

              {/* Strategy Rules Documentation */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Strategy Rules & Guidelines</h4>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Edit Rules
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 text-green-600">Entry Rules</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">Wait for clear trend confirmation</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">Check volume confirmation</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">Risk no more than 1% per trade</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">Enter during high volatility sessions</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 text-red-600">Exit Rules</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-gray-700">Always use stop loss orders</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-gray-700">Target minimum 1:2 risk-reward ratio</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-gray-700">Close positions before major news</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-gray-700">No revenge trading after losses</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Strategy Signals */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Recent Strategy Signals</h4>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View All Signals
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strategy</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pair</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[
                        { strategy: 'Trend Following', pair: 'EUR/USD', signal: 'Buy', confidence: 85, time: '2 min ago', status: 'new' },
                        { strategy: 'Breakout', pair: 'GBP/JPY', signal: 'Sell', confidence: 78, time: '5 min ago', status: 'active' },
                        { strategy: 'Mean Reversion', pair: 'USD/CHF', signal: 'Buy', confidence: 72, time: '12 min ago', status: 'executed' },
                        { strategy: 'Scalping', pair: 'AUD/USD', signal: 'Sell', confidence: 65, time: '18 min ago', status: 'expired' }
                      ].map((signal, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{signal.strategy}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{signal.pair}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                              signal.signal === 'Buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {signal.signal}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    signal.confidence >= 80 ? 'bg-green-500' : 
                                    signal.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{width: `${signal.confidence}%`}}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{signal.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{signal.time}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className={`px-3 py-1 text-xs rounded-md font-medium ${
                              signal.status === 'new' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                              signal.status === 'active' ? 'bg-green-600 text-white hover:bg-green-700' :
                              signal.status === 'executed' ? 'bg-gray-600 text-white' :
                              'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}>
                              {signal.status === 'new' ? 'Execute' :
                               signal.status === 'active' ? 'Active' :
                               signal.status === 'executed' ? 'Done' : 'Expired'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Other Menu Items - Coming Soon */}
          {!['dashboard', 'analytics', 'strategy', 'sessions', 'risk-analysis', 'psychology', 'positions', 'watchlist', 'calendar', 'alerts'].includes(activeMenu) && (
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

      {/* Create Strategy Modal */}
      {showCreateStrategyModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {editingStrategy ? 'Edit Trading Strategy' : 'Create Trading Strategy'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {editingStrategy ? 'Update your trading strategy' : 'Build your comprehensive trading strategy'}
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
                  className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/80 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  {[
                    { step: 1, icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Basics" },
                    { step: 2, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", label: "Logic" },
                    { step: 3, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Risk" },
                    { step: 4, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Tools" },
                    { step: 5, icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", label: "Settings" },
                    { step: 6, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Review" }
                  ].map((item, index) => (
                    <div key={item.step} className="flex flex-col items-center relative">
                      {/* Step Circle */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        item.step <= currentStep 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      
                      {/* Step Label */}
                      <span className={`text-xs font-medium mt-2 transition-colors ${
                        item.step <= currentStep ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </span>
                      
                      {/* Progress Line */}
                      {index < 5 && (
                        <div className={`absolute top-6 left-full w-16 h-0.5 transition-colors ${
                          item.step < currentStep ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="px-8 py-8">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Strategy Foundation</h4>
                      <p className="text-gray-600 text-lg">Let's establish the core details of your trading strategy</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Strategy Name */}
                      <div className="lg:col-span-2">
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Strategy Name <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={strategyForm.name}
                          onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
                          placeholder="e.g., London Breakout Scalping, MACD Divergence Reversal"
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      {/* Market Type */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
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
                              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                                strategyForm.marketType.includes(market.name)
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 transform scale-105'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={market.icon} />
                              </svg>
                              <span className="text-sm font-medium">{market.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Trading Style */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Trading Style <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={strategyForm.tradingStyle}
                          onChange={(e) => setStrategyForm({ ...strategyForm, tradingStyle: e.target.value })}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                        >
                          <option value="">Select Trading Style</option>
                          <option value="scalping">⚡ Scalping</option>
                          <option value="day-trading">☀️ Day Trading</option>
                          <option value="swing-trading">📈 Swing Trading</option>
                          <option value="position-trading">🎯 Position Trading</option>
                          <option value="algorithmic">🤖 Algorithmic</option>
                          <option value="news-based">📰 News-Based</option>
                        </select>
                      </div>

                      {/* Strategy Description */}
                      <div className="lg:col-span-2">
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Strategy Description
                        </label>
                        <textarea
                          value={strategyForm.description}
                          onChange={(e) => setStrategyForm({ ...strategyForm, description: e.target.value })}
                          placeholder="Provide a comprehensive overview of your strategy including market behavior, core logic, expected edge, and any historical performance..."
                          rows={5}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Entry & Exit Logic */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Trading Logic</h4>
                      <p className="text-gray-600 text-lg">Define your precise entry and exit conditions</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Entry Conditions */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Entry Conditions
                        </label>
                        <textarea
                          value={strategyForm.entryConditions}
                          onChange={(e) => setStrategyForm({ ...strategyForm, entryConditions: e.target.value })}
                          placeholder="Example: IF RSI < 30 on 1H AND Bullish Engulfing Candle forms on Support Zone → Enter Long Position"
                          rows={6}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      {/* Exit Conditions */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3m13 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Exit Conditions
                        </label>
                        <textarea
                          value={strategyForm.exitConditions}
                          onChange={(e) => setStrategyForm({ ...strategyForm, exitConditions: e.target.value })}
                          placeholder="Example: Exit when RSI > 70, MACD bearish crossover, or maximum 4-hour time limit reached..."
                          rows={6}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      {/* Stop Loss Logic */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                          </svg>
                          Stop Loss Logic
                        </label>
                        <textarea
                          value={strategyForm.stopLossLogic}
                          onChange={(e) => setStrategyForm({ ...strategyForm, stopLossLogic: e.target.value })}
                          placeholder="Example: Fixed 20 pips, 2x ATR-based, or previous swing low/high structure-based stop loss..."
                          rows={4}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      {/* Take Profit Logic */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Take Profit Logic
                        </label>
                        <textarea
                          value={strategyForm.takeProfitLogic}
                          onChange={(e) => setStrategyForm({ ...strategyForm, takeProfitLogic: e.target.value })}
                          placeholder="Example: 1:2 risk-reward ratio, key resistance levels, or trailing stop at 50% profit..."
                          rows={4}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Risk Management */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">Risk Management</h4>
                      <p className="text-gray-600 text-lg">Set your risk parameters and position sizing rules</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Risk Per Trade */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Risk Per Trade
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={strategyForm.riskPerTrade}
                            onChange={(e) => setStrategyForm({ ...strategyForm, riskPerTrade: e.target.value })}
                            placeholder="1.5% or $100"
                            className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* Max Daily Risk */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Max Daily Risk
                        </label>
                        <input
                          type="text"
                          value={strategyForm.maxDailyRisk}
                          onChange={(e) => setStrategyForm({ ...strategyForm, maxDailyRisk: e.target.value })}
                          placeholder="5% or $500"
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      {/* Max Open Trades */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          Max Open Trades
                        </label>
                        <input
                          type="number"
                          value={strategyForm.maxOpenTrades}
                          onChange={(e) => setStrategyForm({ ...strategyForm, maxOpenTrades: e.target.value })}
                          placeholder="3"
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      {/* Position Sizing Method */}
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
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
                            { name: 'Market Structure', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
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
                            {strategy.tags.split(',').map((tag, tagIndex) => (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
                        {viewingStrategy.tags.split(',').map((tag, tagIndex) => (
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