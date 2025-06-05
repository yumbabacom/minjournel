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

  // Form data
  const [formData, setFormData] = useState({
    tradeType: 'buy',
    symbol: '',
    entryPrice: '',
    quantity: '',
    stopLoss: '',
    takeProfit: '',
    strategy: '',
    notes: '',
    tags: '',
  });

  // Additional form state
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [customStrategy, setCustomStrategy] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  // Trading symbols array
  const tradingSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    { symbol: 'INTC', name: 'Intel Corporation' },
    { symbol: 'EURUSD', name: 'Euro/US Dollar' },
    { symbol: 'GBPUSD', name: 'British Pound/US Dollar' },
    { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen' },
    { symbol: 'BTCUSD', name: 'Bitcoin/US Dollar' },
    { symbol: 'ETHUSD', name: 'Ethereum/US Dollar' },
  ];

  // Filter symbols based on search
  const filteredSymbols = tradingSymbols.filter(symbol =>
    symbol.symbol.toLowerCase().includes(formData.symbol.toLowerCase()) ||
    symbol.name.toLowerCase().includes(formData.symbol.toLowerCase())
  ).slice(0, 10);

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

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
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
      setFormData({
        tradeType: 'buy',
        symbol: '',
        entryPrice: '',
        quantity: '',
        stopLoss: '',
        takeProfit: '',
        strategy: '',
        notes: '',
        tags: '',
      });
      setImagePreview(null);
      
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
          <form id="trade-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Trade Type & Symbol */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tradeType"
                        value="buy"
                        checked={formData.tradeType === 'buy'}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Buy</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tradeType"
                        value="sell"
                        checked={formData.tradeType === 'sell'}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Sell</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <div className="relative symbol-dropdown">
                    <input
                      type="text"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleChange}
                      onFocus={() => setShowSymbolDropdown(true)}
                      placeholder="Search symbol..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    
                    {showSymbolDropdown && filteredSymbols.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredSymbols.map((symbol, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectSymbol(symbol.symbol)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{symbol.symbol}</div>
                            <div className="text-sm text-gray-500">{symbol.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price & Quantity</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                  <input
                    type="number"
                    name="entryPrice"
                    value={formData.entryPrice}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    step="0.001"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Value</label>
                  <input
                    type="text"
                    value={`$${(parseFloat(formData.entryPrice) * parseFloat(formData.quantity) || 0).toFixed(2)}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {strategies.map((strategy) => (
                  <button
                    key={strategy}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, strategy }))}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                      formData.strategy === strategy
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {strategy}
                  </button>
                ))}
              </div>
              
              <button
                type="button"
                onClick={() => setShowStrategyModal(true)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Add Custom Strategy
              </button>
            </div>

            {/* Risk Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    name="stopLoss"
                    value={formData.stopLoss}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {formData.stopLoss && formData.entryPrice && (
                    <p className="mt-1 text-xs text-gray-500">
                      Risk: ${Math.abs((parseFloat(formData.entryPrice) - parseFloat(formData.stopLoss)) * parseFloat(formData.quantity) || 0).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                  <input
                    type="number"
                    name="takeProfit"
                    value={formData.takeProfit}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {formData.takeProfit && formData.entryPrice && (
                    <p className="mt-1 text-xs text-gray-500">
                      Reward: ${Math.abs((parseFloat(formData.takeProfit) - parseFloat(formData.entryPrice)) * parseFloat(formData.quantity) || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {formData.stopLoss && formData.takeProfit && formData.entryPrice && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Risk/Reward Ratio: 1:{(
                      Math.abs((parseFloat(formData.takeProfit) - parseFloat(formData.entryPrice)) * parseFloat(formData.quantity)) /
                      Math.abs((parseFloat(formData.entryPrice) - parseFloat(formData.stopLoss)) * parseFloat(formData.quantity)) || 0
                    ).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Notes & Tags */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Add any additional notes about this trade..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., swing trade, earnings play, technical analysis"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trade Screenshot</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">Click to upload trade screenshot</span>
                    </label>
                    {imagePreview && (
                      <div className="mt-4">
                        <img src={imagePreview} alt="Trade screenshot" className="max-w-full h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
    </div>
  );
} 