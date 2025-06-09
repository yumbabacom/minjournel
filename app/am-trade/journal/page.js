'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import SidebarWrapper from '../../../components/SidebarWrapper';
import MobileHeader from '../../../components/MobileHeader';

export default function AMTradeJournal() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Edit form state
  const [editFormData, setEditFormData] = useState({});
  const [editCalculatedResults, setEditCalculatedResults] = useState({});

  // Update form state
  const [updateFormData, setUpdateFormData] = useState({});

  // Account management states
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', balance: '', tag: 'personal' });

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

  // Fetch accounts and trades when user is set
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchAccounts(user);
      fetchTrades();
    }
  }, [user]);

  useEffect(() => {
    if (currentAccountId && trades.length > 0) {
      filterAndSortTrades();
    }
  }, [currentAccountId, trades, searchTerm, filterStatus, sortBy]);

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

  const fetchTrades = async () => {
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        console.error('Authentication token is missing');
        return;
      }

      if (!user?.id && !user?._id) {
        console.error('User ID not found');
        return;
      }

      const userId = user?.id || user?._id;
      const response = await fetch(`/api/am-trades?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.trades && Array.isArray(data.trades)) {
          setTrades(data.trades);
        }
      } else {
        console.error('Failed to fetch AM trades');
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTrades = () => {
    let filtered = trades.filter(trade => {
      // Filter by current account
      const tradeAccountId = String(trade.accountId || trade.account);
      if (tradeAccountId !== currentAccountId) return false;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          trade.tradingPair?.toLowerCase().includes(searchLower) ||
          trade.setup?.toLowerCase().includes(searchLower) ||
          trade.strategy?.toLowerCase().includes(searchLower) ||
          trade.notes?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filter by status
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending' && trade.status) return false;
        if (filterStatus === 'win' && trade.status !== 'win') return false;
        if (filterStatus === 'loss' && trade.status !== 'loss') return false;
      }

      return true;
    });

    // Sort trades
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.dateTime || b.createdAt) - new Date(a.dateTime || a.createdAt);
        case 'oldest':
          return new Date(a.dateTime || a.createdAt) - new Date(b.dateTime || b.createdAt);
        case 'profit':
          return (b.actualProfit || 0) - (a.actualProfit || 0);
        case 'loss':
          return (a.actualProfit || 0) - (b.actualProfit || 0);
        case 'pair':
          return (a.tradingPair || '').localeCompare(b.tradingPair || '');
        default:
          return 0;
      }
    });

    setFilteredTrades(filtered);
  };

  const handleAccountSwitch = (accountId) => {
    setCurrentAccountId(accountId);
    localStorage.setItem('currentAccountId', accountId);
  };

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.balance) return;

    try {
      const token = Cookies.get('auth-token');
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAccount.name,
          balance: parseFloat(newAccount.balance),
          tag: newAccount.tag
        })
      });

      if (response.ok) {
        const account = await response.json();
        setAccounts(prev => [...prev, account]);
        setShowAddAccountModal(false);
        setNewAccount({ name: '', balance: '', tag: 'personal' });

        // Switch to new account
        const newAccountId = String(account.id || account._id);
        setCurrentAccountId(newAccountId);
        localStorage.setItem('currentAccountId', newAccountId);
      }
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleEditAccount = (account) => {
    // Implementation for editing account
    console.log('Edit account:', account);
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      const token = Cookies.get('auth-token');
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setAccounts(prev => prev.filter(acc => (acc.id || acc._id) !== accountId));

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
    Cookies.remove('auth-token');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAMTradeMode');
    router.push('/login');
  };

  // Trade action handlers
  const handleViewTrade = (trade) => {
    setSelectedTrade(trade);
    setShowViewModal(true);
  };

  const handleEditTrade = (trade) => {
    setSelectedTrade(trade);
    // Initialize edit form with ALL current trade data
    setEditFormData({
      // Date & Time Information
      dateTime: trade.dateTime || new Date().toISOString(),
      manualDateTime: trade.manualDateTime || false,
      weekday: trade.weekday || '',
      month: trade.month || '',
      quarter: trade.quarter || '',

      // Basic Trade Information
      accountSize: trade.accountSize || 0,
      direction: trade.direction || '',
      tradingPair: trade.tradingPair || '',
      entryPrice: trade.entryPrice || '',
      takeProfit: trade.takeProfit || '',
      stopLoss: trade.stopLoss || '',
      riskPercent: trade.riskPercent || '2',

      // AM Trade Methodology Fields
      setup: trade.setup || '',
      htfFramework: trade.htfFramework || '',
      strategy: trade.strategy || '',
      dailyProfile: trade.dailyProfile || '',
      entryCandle: trade.entryCandle || '',
      entryTime: trade.entryTime || '',
      entryTimeFrame: trade.entryTimeFrame || '',
      entryConfluence: trade.entryConfluence || '',
      duration: trade.duration || '',
      plannedRR: trade.plannedRR || '',

      // Analysis & Notes
      analysis: trade.analysis || '',
      notes: trade.notes || '',
      riskManagementLessons: trade.riskManagementLessons || '',
      tags: trade.tags || '',

      // Additional fields that might exist
      screenshot: trade.screenshot || null,

      // Status fields (for reference, not editable in edit modal)
      status: trade.status || null,
      actualEntry: trade.actualEntry || null,
      actualExit: trade.actualExit || null,
      actualProfit: trade.actualProfit || null,
      exitReason: trade.exitReason || null,
      exitNotes: trade.exitNotes || ''
    });

    // Calculate initial results based on current trade data
    const initialResults = calculateEditResults({
      accountSize: trade.accountSize || 0,
      direction: trade.direction || '',
      tradingPair: trade.tradingPair || '',
      entryPrice: trade.entryPrice || '',
      takeProfit: trade.takeProfit || '',
      stopLoss: trade.stopLoss || '',
      riskPercent: trade.riskPercent || '2'
    });

    setEditCalculatedResults(trade.calculatedResults || initialResults);
    setErrors({});
    setShowEditModal(true);
  };

  const handleUpdateTrade = (trade) => {
    setSelectedTrade(trade);
    // Initialize update form with current trade data
    setUpdateFormData({
      status: trade.status || '',
      actualEntry: trade.actualEntry || '',
      actualExit: trade.actualExit || '',
      actualProfit: trade.actualProfit || '',
      exitReason: trade.exitReason || '',
      exitNotes: trade.exitNotes || ''
    });
    setErrors({});
    setShowUpdateModal(true);
  };

  const handleDeleteTrade = (trade) => {
    setSelectedTrade(trade);
    setShowDeleteModal(true);
  };

  const confirmDeleteTrade = async () => {
    if (!selectedTrade) return;

    setIsSubmitting(true);
    try {
      const token = Cookies.get('auth-token');
      const response = await fetch(`/api/am-trades?tradeId=${selectedTrade._id}&userId=${user?.id || user?._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setTrades(prev => prev.filter(trade => trade._id !== selectedTrade._id));
        setShowDeleteModal(false);
        setSelectedTrade(null);
        alert('Trade deleted successfully!');
      } else {
        alert('Failed to delete trade. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Error deleting trade. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!selectedTrade) return;

    // Validate required fields
    const newErrors = {};
    if (!editFormData.tradingPair) newErrors.tradingPair = 'Trading pair is required';
    if (!editFormData.entryPrice) newErrors.entryPrice = 'Entry price is required';
    if (!editFormData.takeProfit) newErrors.takeProfit = 'Take profit is required';
    if (!editFormData.stopLoss) newErrors.stopLoss = 'Stop loss is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get('auth-token');
      const response = await fetch('/api/am-trades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tradeId: selectedTrade._id,
          userId: user?.id || user?._id,
          ...editFormData,
          calculatedResults: editCalculatedResults
        })
      });

      if (response.ok) {
        // Update the trade in local state
        setTrades(prev => prev.map(trade =>
          trade._id === selectedTrade._id
            ? { ...trade, ...editFormData, calculatedResults: editCalculatedResults }
            : trade
        ));
        setShowEditModal(false);
        setSelectedTrade(null);
        setEditFormData({});
        setEditCalculatedResults({});
        alert('Trade updated successfully!');
      } else {
        alert('Failed to update trade. Please try again.');
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('Error updating trade. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update form submission
  const handleUpdateSubmit = async () => {
    if (!selectedTrade) return;

    // Validate required fields for update
    const newErrors = {};
    if (!updateFormData.status) newErrors.status = 'Status is required';
    if (updateFormData.status !== 'pending' && !updateFormData.actualProfit) {
      newErrors.actualProfit = 'Actual profit/loss is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get('auth-token');
      const response = await fetch('/api/am-trades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tradeId: selectedTrade._id,
          userId: user?.id || user?._id,
          ...updateFormData,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Update the trade in local state
        setTrades(prev => prev.map(trade =>
          trade._id === selectedTrade._id
            ? { ...trade, ...updateFormData }
            : trade
        ));
        setShowUpdateModal(false);
        setSelectedTrade(null);
        setUpdateFormData({});
        alert('Trade status updated successfully!');
      } else {
        alert('Failed to update trade status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating trade status:', error);
      alert('Error updating trade status. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'win':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'loss':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDirectionColor = (direction) => {
    return direction === 'long'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // Auto-populate date fields when date changes (for edit modal)
  const handleEditDateChange = (dateTimeValue) => {
    if (!dateTimeValue) return;

    const date = new Date(dateTimeValue);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];
    const quarter = `Q${Math.floor(date.getMonth() / 3) + 1}`;

    setEditFormData(prev => ({
      ...prev,
      dateTime: dateTimeValue,
      weekday: weekday,
      month: month,
      quarter: quarter
    }));
  };

  // Trading pairs data for edit modal (same as add-trade page)
  const tradingPairs = {
    forex: [
      { pair: 'EUR/USD', name: 'Euro/US Dollar' },
      { pair: 'GBP/USD', name: 'British Pound/US Dollar' },
      { pair: 'USD/JPY', name: 'US Dollar/Japanese Yen' },
      { pair: 'USD/CHF', name: 'US Dollar/Swiss Franc' },
      { pair: 'AUD/USD', name: 'Australian Dollar/US Dollar' },
      { pair: 'USD/CAD', name: 'US Dollar/Canadian Dollar' },
      { pair: 'NZD/USD', name: 'New Zealand Dollar/US Dollar' },
      { pair: 'EUR/GBP', name: 'Euro/British Pound' },
      { pair: 'EUR/JPY', name: 'Euro/Japanese Yen' },
      { pair: 'GBP/JPY', name: 'British Pound/Japanese Yen' },
      { pair: 'AUD/JPY', name: 'Australian Dollar/Japanese Yen' },
      { pair: 'CAD/JPY', name: 'Canadian Dollar/Japanese Yen' },
      { pair: 'CHF/JPY', name: 'Swiss Franc/Japanese Yen' },
      { pair: 'NZD/JPY', name: 'New Zealand Dollar/Japanese Yen' },
      { pair: 'EUR/CHF', name: 'Euro/Swiss Franc' },
      { pair: 'GBP/CHF', name: 'British Pound/Swiss Franc' },
      { pair: 'AUD/CHF', name: 'Australian Dollar/Swiss Franc' },
      { pair: 'CAD/CHF', name: 'Canadian Dollar/Swiss Franc' },
      { pair: 'NZD/CHF', name: 'New Zealand Dollar/Swiss Franc' },
      { pair: 'EUR/AUD', name: 'Euro/Australian Dollar' },
      { pair: 'GBP/AUD', name: 'British Pound/Australian Dollar' },
      { pair: 'EUR/CAD', name: 'Euro/Canadian Dollar' },
      { pair: 'GBP/CAD', name: 'British Pound/Canadian Dollar' },
      { pair: 'AUD/CAD', name: 'Australian Dollar/Canadian Dollar' },
      { pair: 'EUR/NZD', name: 'Euro/New Zealand Dollar' },
      { pair: 'GBP/NZD', name: 'British Pound/New Zealand Dollar' },
      { pair: 'AUD/NZD', name: 'Australian Dollar/New Zealand Dollar' },
      { pair: 'CAD/NZD', name: 'Canadian Dollar/New Zealand Dollar' }
    ],
    commodities: [
      { pair: 'XAUUSD', name: 'Gold/US Dollar' },
      { pair: 'XAGUSD', name: 'Silver/US Dollar' },
      { pair: 'XBRUSD', name: 'Brent Oil/US Dollar' },
      { pair: 'XTIUSD', name: 'WTI Oil/US Dollar' },
      { pair: 'XAUEUR', name: 'Gold/Euro' },
      { pair: 'XAUJPY', name: 'Gold/Japanese Yen' },
      { pair: 'XAUGBP', name: 'Gold/British Pound' },
      { pair: 'XAUAUD', name: 'Gold/Australian Dollar' },
      { pair: 'XAUCAD', name: 'Gold/Canadian Dollar' },
      { pair: 'XAUCHF', name: 'Gold/Swiss Franc' }
    ],
    crypto: [
      { pair: 'BTC/USD', name: 'Bitcoin/US Dollar' },
      { pair: 'ETH/USD', name: 'Ethereum/US Dollar' },
      { pair: 'LTC/USD', name: 'Litecoin/US Dollar' },
      { pair: 'XRP/USD', name: 'Ripple/US Dollar' },
      { pair: 'ADA/USD', name: 'Cardano/US Dollar' },
      { pair: 'DOT/USD', name: 'Polkadot/US Dollar' },
      { pair: 'LINK/USD', name: 'Chainlink/US Dollar' },
      { pair: 'BCH/USD', name: 'Bitcoin Cash/US Dollar' },
      { pair: 'XLM/USD', name: 'Stellar/US Dollar' },
      { pair: 'UNI/USD', name: 'Uniswap/US Dollar' }
    ]
  };

  // Get trading pair details
  const getTradingPairDetails = (pairSymbol) => {
    for (const [category, pairs] of Object.entries(tradingPairs)) {
      const pair = pairs.find(p => p.pair === pairSymbol);
      if (pair) {
        return { ...pair, category };
      }
    }
    return null;
  };

  // Calculate pip value based on pair type
  const calculatePipValue = (pairDetails) => {
    if (!pairDetails) return 0;
    const { category, pair } = pairDetails;

    switch (category) {
      case 'forex':
        if (pair.includes('JPY')) {
          return 1000; // JPY pairs: 1 pip = 0.01
        } else {
          return 10; // Most forex pairs: 1 pip = 0.0001
        }
      case 'crypto':
        return 1; // Crypto: varies by exchange
      case 'commodities':
        if (pair.includes('XAU')) return 100; // Gold
        if (pair.includes('XAG')) return 50; // Silver
        if (pair.includes('XTI') || pair.includes('XBR')) return 100; // Oil
        return 10; // Default
      default:
        return 10; // Default
    }
  };

  // Calculate pips based on pair type
  const calculatePips = (pairDetails, price1, price2) => {
    if (!pairDetails || !price1 || !price2) return 0;
    const { category, pair } = pairDetails;
    const priceDiff = Math.abs(price1 - price2);

    switch (category) {
      case 'forex':
        if (pair.includes('JPY')) {
          return priceDiff * 100; // JPY pairs
        } else {
          return priceDiff * 10000; // Most forex
        }
      case 'crypto':
        return priceDiff; // Crypto
      case 'commodities':
        if (pair.includes('XAU')) return priceDiff * 10; // Gold
        if (pair.includes('XAG')) return priceDiff * 100; // Silver
        if (pair.includes('XTI') || pair.includes('XBR')) return priceDiff * 100; // Oil
        return priceDiff * 100; // Others
      default:
        return priceDiff * 10000; // Default
    }
  };

  // Main calculation function for edit modal
  const calculateEditResults = (data) => {
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
    const lossPips = calculatePips(pairDetails, entryPrice, stopLoss);
    const profitPips = calculatePips(pairDetails, entryPrice, takeProfit);
    const pipValuePerLot = calculatePipValue(pairDetails);
    const lotSize = lossPips > 0 ? riskAmount / (lossPips * pipValuePerLot) : 0;
    const potentialLoss = riskAmount;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
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
        <div className="max-w-8xl mx-auto">
          {/* Mobile Header */}
          <MobileHeader
            title="AM Trade Journal"
            subtitle="Track and analyze your Asian Market trading performance"
            onMenuToggle={toggleMobileSidebar}
            rightContent={
              <button
                onClick={() => router.push('/am-trade/add-am-trade')}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Trade</span>
              </button>
            }
          />

          {/* Filters and Search */}
          <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl sm:rounded-3xl border border-gray-200/60 p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base min-w-[140px]"
                    >
                      <option value="all">All Trades</option>
                      <option value="pending">Pending</option>
                      <option value="win">Wins</option>
                      <option value="loss">Losses</option>
                    </select>
                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base min-w-[140px]"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="profit">Highest Profit</option>
                      <option value="loss">Highest Loss</option>
                      <option value="pair">Trading Pair</option>
                    </select>
                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 lg:max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Trades</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by pair, strategy, setup..."
                    className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
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
            </div>

            {/* Trade Statistics */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{filteredTrades.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Trades</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {filteredTrades.filter(t => t.status === 'win').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    {filteredTrades.filter(t => t.status === 'loss').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Losses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {filteredTrades.length > 0
                      ? Math.round((filteredTrades.filter(t => t.status === 'win').length / filteredTrades.filter(t => t.status).length) * 100) || 0
                      : 0}%
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Win Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trades List */}
          {filteredTrades.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredTrades.map((trade) => (
                <div
                  key={trade._id || trade.id}
                  className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl sm:rounded-3xl border border-gray-200/60 p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {/* Trade Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm sm:text-base font-bold">
                          {trade.tradingPair?.split('/')[0] || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{trade.tradingPair}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{formatDate(trade.dateTime || trade.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getDirectionColor(trade.direction)}`}>
                        {trade.direction?.toUpperCase() || 'N/A'}
                      </span>
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(trade.status)}`}>
                        {trade.status ? trade.status.charAt(0).toUpperCase() + trade.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/50 rounded-xl p-3 border border-gray-200/50">
                        <p className="text-xs text-gray-600 mb-1">Entry Price</p>
                        <p className="text-sm font-semibold text-gray-900">{trade.entryPrice || 'N/A'}</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-3 border border-gray-200/50">
                        <p className="text-xs text-gray-600 mb-1">Take Profit</p>
                        <p className="text-sm font-semibold text-green-600">{trade.takeProfit || 'N/A'}</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-3 border border-gray-200/50">
                        <p className="text-xs text-gray-600 mb-1">Stop Loss</p>
                        <p className="text-sm font-semibold text-red-600">{trade.stopLoss || 'N/A'}</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-3 border border-gray-200/50">
                        <p className="text-xs text-gray-600 mb-1">P&L</p>
                        <p className={`text-sm font-semibold ${
                          (trade.actualProfit || 0) > 0 ? 'text-green-600' :
                          (trade.actualProfit || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(trade.actualProfit || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Strategy & Setup */}
                    {(trade.strategy || trade.setup) && (
                      <div className="bg-white/50 rounded-xl p-3 border border-gray-200/50">
                        <p className="text-xs text-gray-600 mb-1">Strategy & Setup</p>
                        <p className="text-sm font-medium text-gray-900">
                          {trade.strategy || trade.setup || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewTrade(trade)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditTrade(trade)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Edit Trade"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleUpdateTrade(trade)}
                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Update Status"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTrade(trade)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Delete Trade"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {trade.weekday || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl sm:rounded-3xl border border-gray-200/60 p-8 sm:p-12 shadow-lg text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No AM Trades Found</h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {searchTerm || filterStatus !== 'all'
                  ? 'No trades match your current filters. Try adjusting your search or filter criteria.'
                  : 'Start building your AM trading journal by adding your first morning session trade.'
                }
              </p>
              <button
                onClick={() => router.push('/am-trade/add-am-trade')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center space-x-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First AM Trade</span>
              </button>
            </div>
          )}
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

      {/* View Trade Modal */}
      {showViewModal && selectedTrade && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Trade Details</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedTrade.tradingPair} • {formatDate(selectedTrade.dateTime || selectedTrade.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200 self-end sm:self-auto transform hover:scale-110"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
              <div className="space-y-6">
                {/* Date & Time Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date & Time Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Date & Time</p>
                      <p className="text-sm font-semibold">{formatDate(selectedTrade.dateTime || selectedTrade.createdAt)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Weekday</p>
                      <p className="text-sm font-semibold">{selectedTrade.weekday || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Month</p>
                      <p className="text-sm font-semibold">{selectedTrade.month || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Quarter</p>
                      <p className="text-sm font-semibold">{selectedTrade.quarter || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Basic Trade Information */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Trade Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Trading Pair</p>
                      <p className="text-sm font-semibold text-blue-600">{selectedTrade.tradingPair || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Direction</p>
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getDirectionColor(selectedTrade.direction)}`}>
                        {selectedTrade.direction?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Account Size</p>
                      <p className="text-sm font-semibold">{formatCurrency(selectedTrade.accountSize)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Entry Price</p>
                      <p className="text-sm font-semibold text-blue-600">{selectedTrade.entryPrice || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Take Profit</p>
                      <p className="text-sm font-semibold text-green-600">{selectedTrade.takeProfit || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Stop Loss</p>
                      <p className="text-sm font-semibold text-red-600">{selectedTrade.stopLoss || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Risk Percent</p>
                      <p className="text-sm font-semibold">{selectedTrade.riskPercent || '2'}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(selectedTrade.status)}`}>
                        {selectedTrade.status ? selectedTrade.status.charAt(0).toUpperCase() + selectedTrade.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Actual P&L</p>
                      <p className={`text-sm font-semibold ${
                        (selectedTrade.actualProfit || 0) > 0 ? 'text-green-600' :
                        (selectedTrade.actualProfit || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(selectedTrade.actualProfit || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AM Trade Methodology */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    AM Trade Methodology
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Setup</p>
                      <p className="text-sm font-semibold">{selectedTrade.setup || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">HTF Framework</p>
                      <p className="text-sm font-semibold">{selectedTrade.htfFramework || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Strategy</p>
                      <p className="text-sm font-semibold">{selectedTrade.strategy || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Daily Profile</p>
                      <p className="text-sm font-semibold">{selectedTrade.dailyProfile || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Entry Candle</p>
                      <p className="text-sm font-semibold">{selectedTrade.entryCandle || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Entry Time</p>
                      <p className="text-sm font-semibold">{selectedTrade.entryTime || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Entry Timeframe</p>
                      <p className="text-sm font-semibold">{selectedTrade.entryTimeFrame || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Entry Confluence</p>
                      <p className="text-sm font-semibold">{selectedTrade.entryConfluence || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="text-sm font-semibold">{selectedTrade.duration || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Planned R:R</p>
                      <p className="text-sm font-semibold">{selectedTrade.plannedRR || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Calculated Results */}
                {selectedTrade.calculatedResults && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                    <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Calculated Results
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Risk Amount</p>
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(selectedTrade.calculatedResults.riskAmount || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Lot Size</p>
                        <p className="text-sm font-semibold">{selectedTrade.calculatedResults.lotSize || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Potential Profit</p>
                        <p className="text-sm font-semibold text-green-600">{formatCurrency(selectedTrade.calculatedResults.potentialProfit || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Potential Loss</p>
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(selectedTrade.calculatedResults.potentialLoss || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Profit Pips</p>
                        <p className="text-sm font-semibold text-green-600">{selectedTrade.calculatedResults.profitPips || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Loss Pips</p>
                        <p className="text-sm font-semibold text-red-600">{selectedTrade.calculatedResults.lossPips || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Risk:Reward</p>
                        <p className="text-sm font-semibold text-blue-600">1:{selectedTrade.calculatedResults.riskRewardRatio || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes and Analysis */}
                {(selectedTrade.notes || selectedTrade.analysis || selectedTrade.riskManagementLessons) && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Notes & Analysis
                    </h4>
                    <div className="space-y-4">
                      {selectedTrade.analysis && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm font-medium text-gray-700 mb-2">Trade Analysis</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTrade.analysis}</p>
                        </div>
                      )}
                      {selectedTrade.notes && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm font-medium text-gray-700 mb-2">Trade Notes</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTrade.notes}</p>
                        </div>
                      )}
                      {selectedTrade.riskManagementLessons && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm font-medium text-gray-700 mb-2">Risk Management Lessons</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTrade.riskManagementLessons}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedTrade.tags && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200">
                    <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tags
                    </h4>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-600">{selectedTrade.tags}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditTrade(selectedTrade);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Trade</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      {showEditModal && selectedTrade && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Edit Trade</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedTrade.tradingPair} • {formatDate(selectedTrade.dateTime || selectedTrade.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200 self-end sm:self-auto transform hover:scale-110"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
              <div className="space-y-6">
                {/* Basic Trade Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Trade Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Trading Pair */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trading Pair *</label>
                      <div className="relative">
                        <select
                          value={editFormData.tradingPair || ''}
                          onChange={(e) => {
                            const newData = { ...editFormData, tradingPair: e.target.value };
                            setEditFormData(newData);
                            // Recalculate when trading pair changes
                            const results = calculateEditResults(newData);
                            setEditCalculatedResults(results);
                          }}
                          className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.tradingPair ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Trading Pair</option>
                          {Object.entries(tradingPairs).map(([category, pairs]) => (
                            <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                              {pairs.map((pair) => (
                                <option key={pair.pair} value={pair.pair}>
                                  {pair.pair} - {pair.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        {errors.tradingPair && (
                          <p className="text-red-600 text-xs mt-1">{errors.tradingPair}</p>
                        )}
                      </div>
                    </div>

                    {/* Direction */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                      <div className="relative">
                        <select
                          value={editFormData.direction || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, direction: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Auto-detect</option>
                          <option value="long">Long (Buy)</option>
                          <option value="short">Short (Sell)</option>
                        </select>
                      </div>
                    </div>

                    {/* Account Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Size</label>
                      <input
                        type="number"
                        value={editFormData.accountSize || ''}
                        onChange={(e) => {
                          const newData = { ...editFormData, accountSize: e.target.value };
                          setEditFormData(newData);
                          // Recalculate when account size changes
                          const results = calculateEditResults(newData);
                          setEditCalculatedResults(results);
                        }}
                        placeholder="Enter account size"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Entry Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price *</label>
                      <input
                        type="number"
                        step="any"
                        value={editFormData.entryPrice || ''}
                        onChange={(e) => {
                          const newData = { ...editFormData, entryPrice: e.target.value };
                          setEditFormData(newData);
                          // Auto-detect direction and recalculate
                          if (newData.entryPrice && newData.takeProfit) {
                            const entry = parseFloat(newData.entryPrice);
                            const takeProfit = parseFloat(newData.takeProfit);
                            if (entry && takeProfit) {
                              newData.direction = takeProfit > entry ? 'long' : 'short';
                              setEditFormData(newData);
                            }
                          }
                          const results = calculateEditResults(newData);
                          setEditCalculatedResults(results);
                        }}
                        placeholder="Enter entry price"
                        className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.entryPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.entryPrice && (
                        <p className="text-red-600 text-xs mt-1">{errors.entryPrice}</p>
                      )}
                    </div>

                    {/* Take Profit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit *</label>
                      <input
                        type="number"
                        step="any"
                        value={editFormData.takeProfit || ''}
                        onChange={(e) => {
                          const newData = { ...editFormData, takeProfit: e.target.value };
                          setEditFormData(newData);
                          // Auto-detect direction and recalculate
                          if (newData.entryPrice && newData.takeProfit) {
                            const entry = parseFloat(newData.entryPrice);
                            const takeProfit = parseFloat(newData.takeProfit);
                            if (entry && takeProfit) {
                              newData.direction = takeProfit > entry ? 'long' : 'short';
                              setEditFormData(newData);
                            }
                          }
                          const results = calculateEditResults(newData);
                          setEditCalculatedResults(results);
                        }}
                        placeholder="Enter take profit"
                        className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.takeProfit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.takeProfit && (
                        <p className="text-red-600 text-xs mt-1">{errors.takeProfit}</p>
                      )}
                    </div>

                    {/* Stop Loss */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss *</label>
                      <input
                        type="number"
                        step="any"
                        value={editFormData.stopLoss || ''}
                        onChange={(e) => {
                          const newData = { ...editFormData, stopLoss: e.target.value };
                          setEditFormData(newData);
                          // Recalculate when stop loss changes
                          const results = calculateEditResults(newData);
                          setEditCalculatedResults(results);
                        }}
                        placeholder="Enter stop loss"
                        className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.stopLoss ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.stopLoss && (
                        <p className="text-red-600 text-xs mt-1">{errors.stopLoss}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date & Time Information */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date & Time Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date & Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={editFormData.dateTime ? new Date(editFormData.dateTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleEditDateChange(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Weekday */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weekday</label>
                      <select
                        value={editFormData.weekday || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, weekday: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select Weekday</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                      </select>
                    </div>

                    {/* Month */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <select
                        value={editFormData.month || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, month: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select Month</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                      </select>
                    </div>

                    {/* Quarter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
                      <select
                        value={editFormData.quarter || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, quarter: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select Quarter</option>
                        <option value="Q1">Q1 (Jan-Mar)</option>
                        <option value="Q2">Q2 (Apr-Jun)</option>
                        <option value="Q3">Q3 (Jul-Sep)</option>
                        <option value="Q4">Q4 (Oct-Dec)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* AM Trade Methodology Fields */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    AM Trade Methodology
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Setup */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Setup</label>
                      <select
                        value={editFormData.setup || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, setup: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select setup</option>
                        <option value="Continuation Day">Continuation Day</option>
                        <option value="Reversal Day">Reversal Day</option>
                      </select>
                    </div>

                    {/* HTF Framework */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">HTF Framework</label>
                      <select
                        value={editFormData.htfFramework || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, htfFramework: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select HTF framework</option>
                        <option value="Manipulation">Manipulation</option>
                        <option value="Divergence">Divergence</option>
                        <option value="Opposing Candle">Opposing Candle</option>
                      </select>
                    </div>

                    {/* Strategy */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trading Strategy</label>
                      <input
                        type="text"
                        value={editFormData.strategy || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, strategy: e.target.value })}
                        placeholder="e.g., Breakout, Support/Resistance, Trend Following"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Daily Profile */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Daily Profile</label>
                      <select
                        value={editFormData.dailyProfile || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, dailyProfile: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select daily profile</option>
                        <option value="18:00 Reversal">18:00 Reversal</option>
                        <option value="01:00 Reversal">01:00 Reversal</option>
                        <option value="08:00 Reversal">08:00 Reversal</option>
                      </select>
                    </div>

                    {/* Entry Candle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Candle</label>
                      <select
                        value={editFormData.entryCandle || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, entryCandle: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select entry candle</option>
                        <option value="08:00 Candle">08:00 Candle</option>
                        <option value="01:00 Candle">01:00 Candle</option>
                      </select>
                    </div>

                    {/* Entry Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Time</label>
                      <select
                        value={editFormData.entryTime || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, entryTime: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    </div>

                    {/* Entry Timeframe */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Timeframe</label>
                      <select
                        value={editFormData.entryTimeFrame || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, entryTimeFrame: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select time frame</option>
                        <option value="1 minute">1 minute</option>
                        <option value="< 5 minutes">&lt; 5 minutes</option>
                        <option value="5 minutes">5 minutes</option>
                        <option value="15 minutes">15 minutes</option>
                        <option value="1 hour">1 hour</option>
                      </select>
                    </div>

                    {/* Entry Confluence */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Confluence</label>
                      <select
                        value={editFormData.entryConfluence || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, entryConfluence: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select confluence</option>
                        <option value="Short-term Swing">Short-term Swing</option>
                        <option value="Opposing Candle">Opposing Candle</option>
                        <option value="Volatility Driver">Volatility Driver</option>
                        <option value="Divergence">Divergence</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                      <input
                        type="text"
                        value={editFormData.duration || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                        placeholder="e.g. 45 minutes"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Risk Percent */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Risk Percent</label>
                      <select
                        value={editFormData.riskPercent || '2%'}
                        onChange={(e) => {
                          const newData = { ...editFormData, riskPercent: e.target.value };
                          setEditFormData(newData);
                          // Recalculate when risk percent changes
                          const results = calculateEditResults(newData);
                          setEditCalculatedResults(results);
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select risk %</option>
                        <option value="0.25%">0.25% - Conservative</option>
                        <option value="0.5%">0.5% - Moderate</option>
                        <option value="1%">1% - Standard</option>
                        <option value="2%">2% - Aggressive</option>
                      </select>
                    </div>

                    {/* Planned R:R */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Planned R:R</label>
                      <select
                        value={editFormData.plannedRR || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, plannedRR: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select RR</option>
                        <option value="2R">2R - Conservative</option>
                        <option value="3R">3R - Balanced</option>
                        <option value="4R">4R - Aggressive</option>
                        <option value="5R">5R - High Risk</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Analysis and Notes */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Analysis & Notes
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Analysis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trade Analysis</label>
                      <textarea
                        value={editFormData.analysis || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, analysis: e.target.value })}
                        placeholder="Detailed analysis of the trade setup, market conditions, technical analysis..."
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trade Notes</label>
                      <textarea
                        value={editFormData.notes || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        placeholder="General notes, observations, feelings during the trade..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* Risk Management Lessons */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Risk Management Lessons</label>
                      <textarea
                        value={editFormData.riskManagementLessons || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, riskManagementLessons: e.target.value })}
                        placeholder="What did you learn about risk management from this trade?"
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      <input
                        type="text"
                        value={editFormData.tags || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                        placeholder="e.g., breakout, news, high-probability, mistake"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculated Results Display */}
                {editCalculatedResults && Object.keys(editCalculatedResults).length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                    <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Live Calculated Results
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Risk Amount</p>
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(editCalculatedResults.riskAmount || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Lot Size</p>
                        <p className="text-sm font-semibold">{editCalculatedResults.lotSize || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Potential Profit</p>
                        <p className="text-sm font-semibold text-green-600">{formatCurrency(editCalculatedResults.potentialProfit || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Potential Loss</p>
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(editCalculatedResults.potentialLoss || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Profit Pips</p>
                        <p className="text-sm font-semibold text-green-600">{editCalculatedResults.profitPips || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Loss Pips</p>
                        <p className="text-sm font-semibold text-red-600">{editCalculatedResults.lossPips || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Risk:Reward</p>
                        <p className="text-sm font-semibold text-blue-600">1:{editCalculatedResults.riskRewardRatio || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Trade Modal - Full Featured like Main Journal */}
      {showUpdateModal && selectedTrade && (
        <AMTradeStatusUpdateModal
          trade={selectedTrade}
          accounts={accounts}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedTrade(null);
            setUpdateFormData({});
          }}
          onStatusUpdated={(updatedTrade, updatedAccount) => {
            setTrades(prev => prev.map(trade =>
              trade._id === updatedTrade._id ? updatedTrade : trade
            ));
            if (updatedAccount) {
              setAccounts(prev => prev.map(acc =>
                acc.id === updatedAccount.id || acc._id === updatedAccount._id
                  ? updatedAccount : acc
              ));
            }
            setShowUpdateModal(false);
            setSelectedTrade(null);
            setUpdateFormData({});
          }}
        />
      )}

      {/* Old Update Modal - Remove this section */}
      {false && showUpdateModal && selectedTrade && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Update Trade Status</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedTrade.tradingPair} • {formatDate(selectedTrade.dateTime || selectedTrade.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200 self-end sm:self-auto transform hover:scale-110"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
              <div className="space-y-6">
                {/* Current Trade Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Current Trade Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Trading Pair</p>
                      <p className="text-sm font-semibold text-blue-600">{selectedTrade.tradingPair}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Direction</p>
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getDirectionColor(selectedTrade.direction)}`}>
                        {selectedTrade.direction?.toUpperCase()}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Entry Price</p>
                      <p className="text-sm font-semibold">{selectedTrade.entryPrice}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Current Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(selectedTrade.status)}`}>
                        {selectedTrade.status ? selectedTrade.status.charAt(0).toUpperCase() + selectedTrade.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Update Form */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Trade Results
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Trade Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trade Status *</label>
                      <div className="relative">
                        <select
                          value={updateFormData.status || ''}
                          onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
                          className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                            errors.status ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Status</option>
                          <option value="pending">Pending</option>
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                        </select>
                        {errors.status && (
                          <p className="text-red-600 text-xs mt-1">{errors.status}</p>
                        )}
                      </div>
                    </div>

                    {/* Actual Entry Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actual Entry Price</label>
                      <input
                        type="number"
                        step="any"
                        value={updateFormData.actualEntry || ''}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, actualEntry: e.target.value })}
                        placeholder="Enter actual entry price"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Actual Exit Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actual Exit Price</label>
                      <input
                        type="number"
                        step="any"
                        value={updateFormData.actualExit || ''}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, actualExit: e.target.value })}
                        placeholder="Enter actual exit price"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Actual Profit/Loss */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actual Profit/Loss *</label>
                      <input
                        type="number"
                        step="any"
                        value={updateFormData.actualProfit || ''}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, actualProfit: e.target.value })}
                        placeholder="Enter actual P&L (positive for profit, negative for loss)"
                        className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                          errors.actualProfit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.actualProfit && (
                        <p className="text-red-600 text-xs mt-1">{errors.actualProfit}</p>
                      )}
                    </div>

                    {/* Exit Reason */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exit Reason</label>
                      <div className="relative">
                        <select
                          value={updateFormData.exitReason || ''}
                          onChange={(e) => setUpdateFormData({ ...updateFormData, exitReason: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Exit Reason</option>
                          <option value="take-profit-hit">Take Profit Hit</option>
                          <option value="stop-loss-hit">Stop Loss Hit</option>
                          <option value="manual-close-profit">Manual Close (Profit)</option>
                          <option value="manual-close-loss">Manual Close (Loss)</option>
                          <option value="break-even">Break Even</option>
                          <option value="partial-close">Partial Close</option>
                          <option value="news-event">News Event</option>
                          <option value="time-based">Time-Based Exit</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Exit Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exit Notes</label>
                      <textarea
                        value={updateFormData.exitNotes || ''}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, exitNotes: e.target.value })}
                        placeholder="Add notes about the trade exit, lessons learned, what went well or wrong..."
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Planned vs Actual Comparison */}
                {selectedTrade.calculatedResults && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                    <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Planned vs Actual Comparison
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-2">Planned Profit</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(selectedTrade.calculatedResults.potentialProfit || 0)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-2">Actual P&L</p>
                      <p className={`text-sm font-semibold ${
                        (updateFormData.actualProfit || 0) > 0 ? 'text-green-600' :
                        (updateFormData.actualProfit || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(updateFormData.actualProfit || 0)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-2">Difference</p>
                      <p className={`text-sm font-semibold ${
                        ((updateFormData.actualProfit || 0) - (selectedTrade.calculatedResults.potentialProfit || 0)) > 0 ? 'text-green-600' :
                        ((updateFormData.actualProfit || 0) - (selectedTrade.calculatedResults.potentialProfit || 0)) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency((updateFormData.actualProfit || 0) - (selectedTrade.calculatedResults.potentialProfit || 0))}
                      </p>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Update Trade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTrade && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Trade</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this trade? This will permanently remove:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trading Pair:</span>
                  <span className="text-sm font-medium">{selectedTrade.tradingPair}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium">{formatDate(selectedTrade.dateTime || selectedTrade.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">P&L:</span>
                  <span className={`text-sm font-medium ${
                    (selectedTrade.actualProfit || 0) > 0 ? 'text-green-600' :
                    (selectedTrade.actualProfit || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formatCurrency(selectedTrade.actualProfit || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTrade}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Trade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      )}
    </SidebarWrapper>
  );
}

// Enhanced AM Trade Status Update Modal Component (same as main journal)
function AMTradeStatusUpdateModal({ trade, accounts, onClose, onStatusUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState(trade.status === 'win' || trade.status === 'loss' ? trade.status : 'win');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  // Helper function to format currency (local to modal)
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Form data for trade modifications
  const [formData, setFormData] = useState({
    actualEntry: trade.actualEntry || trade.entryPrice || '',
    actualExit: trade.actualExit || '',
    stopLoss: trade.stopLoss || '',
    takeProfit: trade.takeProfit || '',
    exitReason: trade.exitReason || '',
    notes: trade.notes || '',
    actualProfit: trade.actualProfit || '',
    exitType: trade.actualExit ? 'price' : 'other', // 'price' or 'other'
    manualPL: trade.actualProfit || '',
    exitDescription: trade.exitDescription || '',
    closingImage: null
  });

  // Auto-populate execution prices based on status selection and existing data
  const updateExecutionPricesFromStatus = (status) => {
    // Check if current exit price matches either TP or SL (indicating it was auto-filled)
    const isAutoFilled = formData.actualExit === trade.takeProfit || formData.actualExit === trade.stopLoss;

    // Auto-populate if:
    // 1. No exit data entered yet, OR
    // 2. Current exit price was auto-filled from previous status selection, OR
    // 3. User is switching between win/loss and we have a previous auto-fill
    if ((!formData.actualExit && !formData.manualPL) || isAutoFilled || lastAutoFilledStatus) {
      if (status === 'win' && trade.takeProfit) {
        setFormData(prev => ({
          ...prev,
          actualExit: trade.takeProfit,
          exitType: 'price'
        }));
        setLastAutoFilledStatus('win');
      } else if (status === 'loss' && trade.stopLoss) {
        setFormData(prev => ({
          ...prev,
          actualExit: trade.stopLoss,
          exitType: 'price'
        }));
        setLastAutoFilledStatus('loss');
      }
    }
  };

  // Calculated results
  const [calculatedResults, setCalculatedResults] = useState({
    actualPL: 0,
    pips: 0,
    riskRewardRatio: 0,
    accountImpact: 0
  });

  // Preview metrics based on status selection
  const [previewMetrics, setPreviewMetrics] = useState({
    previewPL: 0,
    previewPips: 0,
    previewRiskReward: 0,
    previewAccountImpact: 0
  });

  // Track the last auto-filled status to help with visual indicators
  const [lastAutoFilledStatus, setLastAutoFilledStatus] = useState(null);

  // Handle closing image upload
  const handleClosingImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          closingImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove closing image
  const removeClosingImage = () => {
    setFormData(prev => ({
      ...prev,
      closingImage: null
    }));
  };

  // Get current account
  const currentAccount = accounts.find(acc => acc.id === trade.accountId || acc._id === trade.accountId);

  // Debug logging for account finding
  console.log('Account finding debug:', {
    tradeAccountId: trade.accountId,
    availableAccounts: accounts.map(acc => ({ id: acc.id || acc._id, name: acc.name })),
    foundAccount: currentAccount ? { id: currentAccount.id || currentAccount._id, name: currentAccount.name, balance: currentAccount.balance } : null
  });

  // Auto-calculate P&L and metrics
  const calculateMetrics = (data) => {
    const actualEntry = parseFloat(data.actualEntry) || 0;
    const actualExit = parseFloat(data.actualExit) || 0;
    const stopLoss = parseFloat(data.stopLoss) || 0;
    const takeProfit = parseFloat(data.takeProfit) || 0;
    const manualPL = parseFloat(data.manualPL) || 0;

    // If using manual P&L entry (exitType is 'other')
    if (data.exitType === 'other') {
      const accountBalance = currentAccount?.balance || 10000;
      const accountImpact = manualPL ? (manualPL / accountBalance) * 100 : 0;

      return {
        actualPL: manualPL,
        pips: 0, // Can't calculate pips without exit price
        riskRewardRatio: 0, // Can't calculate R:R without exit price
        accountImpact: parseFloat(accountImpact.toFixed(2))
      };
    }

    // Price-based calculation
    if (!actualEntry || !actualExit) {
      return {
        actualPL: 0,
        pips: 0,
        riskRewardRatio: 0,
        accountImpact: 0
      };
    }

    // Calculate pips
    const pips = Math.abs(actualExit - actualEntry) * 10000;

    // Calculate P&L based on direction
    let priceDifference;
    if (trade.direction === 'long') {
      priceDifference = actualExit - actualEntry;
    } else {
      priceDifference = actualEntry - actualExit;
    }

    // Use lot size from trade calculations or default
    const lotSize = trade.calculatedResults?.lotSize || 0.1;
    const pipValue = 10; // Simplified pip value
    const actualPL = (priceDifference * 10000) * pipValue * lotSize;

    // Calculate risk/reward ratio
    let riskRewardRatio = 0;
    if (stopLoss && takeProfit && actualEntry) {
      const riskPips = Math.abs(actualEntry - stopLoss) * 10000;
      const rewardPips = Math.abs(takeProfit - actualEntry) * 10000;
      riskRewardRatio = rewardPips / riskPips;
    }

    // Calculate account impact percentage
    const accountBalance = currentAccount?.balance || 10000;
    const accountImpact = (actualPL / accountBalance) * 100;

    return {
      actualPL: parseFloat(actualPL.toFixed(2)),
      pips: parseFloat(pips.toFixed(1)),
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
      accountImpact: parseFloat(accountImpact.toFixed(2))
    };
  };

  // Update calculations when form data changes
  useEffect(() => {
    const results = calculateMetrics(formData);
    setCalculatedResults(results);

    // Auto-update actual profit field only for price-based calculations
    if (formData.exitType === 'price' && results.actualPL !== parseFloat(formData.actualProfit || 0)) {
      setFormData(prev => ({
        ...prev,
        actualProfit: results.actualPL.toString()
      }));
    } else if (formData.exitType === 'other' && formData.manualPL !== formData.actualProfit) {
      setFormData(prev => ({
        ...prev,
        actualProfit: formData.manualPL
      }));
    }
  }, [formData.actualEntry, formData.actualExit, formData.stopLoss, formData.takeProfit, formData.exitType, formData.manualPL]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const userId = user?.id || user?._id;

      // Prepare closing images array
      const closingImages = [];
      if (formData.closingImage) {
        closingImages.push(formData.closingImage);
      } else if (trade.closingImages && trade.closingImages.length > 0) {
        closingImages.push(...trade.closingImages);
      }

      // Prepare update data
      const updateData = {
        status: selectedStatus,
        actualEntry: formData.actualEntry ? parseFloat(formData.actualEntry) : null,
        actualExit: formData.exitType === 'price' && formData.actualExit ? parseFloat(formData.actualExit) : null,
        stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : trade.stopLoss,
        takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : trade.takeProfit,
        exitReason: formData.exitReason,
        notes: formData.notes,
        actualProfit: calculatedResults.actualPL,
        exitType: formData.exitType,
        exitDescription: formData.exitType === 'other' ? formData.exitDescription : null,
        closingImages: closingImages,
        whatWentWell: formData.whatWentWell,
        improvements: formData.improvements,
        lessons: formData.lessons,
        calculatedResults: {
          ...trade.calculatedResults,
          actualPL: calculatedResults.actualPL,
          pips: calculatedResults.pips,
          riskRewardRatio: calculatedResults.riskRewardRatio,
          accountImpact: calculatedResults.accountImpact
        }
      };

      // Update trade
      const response = await fetch('/api/am-trades', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tradeId: trade._id,
          userId: userId,
          ...updateData
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // Update account balance if there's a P&L impact
        let updatedAccount = null;
        if (calculatedResults.actualPL !== 0 && currentAccount) {
          const newBalance = currentAccount.balance + calculatedResults.actualPL;

          console.log('Updating account balance:', {
            currentBalance: currentAccount.balance,
            actualPL: calculatedResults.actualPL,
            newBalance: newBalance,
            accountId: currentAccount.id || currentAccount._id
          });

          const accountResponse = await fetch('/api/accounts', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              accountId: currentAccount.id || currentAccount._id,
              userId: userId,
              updates: { balance: newBalance }
            })
          });

          if (accountResponse.ok) {
            updatedAccount = { ...currentAccount, balance: newBalance };
            console.log('Account balance updated successfully:', updatedAccount);
          } else {
            const errorData = await accountResponse.json();
            console.error('Failed to update account balance:', errorData);
          }
        } else {
          console.log('No balance update needed:', {
            actualPL: calculatedResults.actualPL,
            hasCurrentAccount: !!currentAccount
          });
        }

        onStatusUpdated({ ...trade, ...updateData }, updatedAccount);
      } else {
        alert('Failed to update AM trade status: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating AM trade status:', error);
      alert('Error updating AM trade status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-gray-100">
        {/* Modern Header */}
        <div className="relative p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Update AM Trade Status</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-600 font-semibold">{trade.tradingPair}</span>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center space-x-1">
                    {trade.direction === 'long' ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    <span className="text-gray-600 font-medium">{trade.direction?.toUpperCase()}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                    trade.status === 'win' ? 'bg-green-100 text-green-700' :
                    trade.status === 'loss' ? 'bg-red-100 text-red-700' :
                    trade.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    <span>Current: {trade.status?.charAt(0).toUpperCase() + trade.status?.slice(1) || 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-2xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { id: 'status', label: 'Trade Status', icon: '📊' },
              { id: 'execution', label: 'Execution Details', icon: '⚡' },
              { id: 'analysis', label: 'Post-Trade Analysis', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'status' && (
            <div className="space-y-8">
              {/* Status Selection */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select Trade Outcome
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Win Option */}
                  <div
                    onClick={() => {
                      setSelectedStatus('win');
                      updateExecutionPricesFromStatus('win');
                    }}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedStatus === 'win'
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedStatus === 'win' ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Winning Trade</h4>
                          <p className="text-sm text-gray-600">Trade closed in profit</p>
                        </div>
                      </div>
                      {selectedStatus === 'win' && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {trade.takeProfit && (
                      <div className="bg-white/70 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Target Price</p>
                        <p className="text-lg font-bold text-green-600">{trade.takeProfit}</p>
                      </div>
                    )}
                  </div>

                  {/* Loss Option */}
                  <div
                    onClick={() => {
                      setSelectedStatus('loss');
                      updateExecutionPricesFromStatus('loss');
                    }}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedStatus === 'loss'
                        ? 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedStatus === 'loss' ? 'bg-red-500' : 'bg-gray-300'
                        }`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Losing Trade</h4>
                          <p className="text-sm text-gray-600">Trade closed in loss</p>
                        </div>
                      </div>
                      {selectedStatus === 'loss' && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {trade.stopLoss && (
                      <div className="bg-white/70 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-gray-600 mb-1">Stop Loss</p>
                        <p className="text-lg font-bold text-red-600">{trade.stopLoss}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Preview Metrics */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Expected Results Preview
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-blue-200 text-center">
                    <p className="text-xs text-gray-600 mb-2">Expected P&L</p>
                    <p className={`text-xl font-bold ${
                      selectedStatus === 'win' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedStatus === 'win'
                        ? formatCurrency(trade.calculatedResults?.potentialProfit || 0)
                        : formatCurrency(-(trade.calculatedResults?.potentialLoss || 0))
                      }
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-blue-200 text-center">
                    <p className="text-xs text-gray-600 mb-2">Expected Pips</p>
                    <p className={`text-xl font-bold ${
                      selectedStatus === 'win' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedStatus === 'win'
                        ? `+${trade.calculatedResults?.profitPips || 0}`
                        : `-${trade.calculatedResults?.lossPips || 0}`
                      }
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-blue-200 text-center">
                    <p className="text-xs text-gray-600 mb-2">Risk:Reward</p>
                    <p className="text-xl font-bold text-blue-600">
                      1:{trade.calculatedResults?.riskRewardRatio || 0}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-blue-200 text-center">
                    <p className="text-xs text-gray-600 mb-2">Account Impact</p>
                    <p className={`text-xl font-bold ${
                      selectedStatus === 'win' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedStatus === 'win' ? '+' : '-'}
                      {((trade.calculatedResults?.potentialProfit || trade.calculatedResults?.potentialLoss || 0) / (currentAccount?.balance || 10000) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'execution' && (
            <div className="space-y-8">
              {/* Execution Method Selection */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  How was the trade executed?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price-based execution */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, exitType: 'price' }))}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      formData.exitType === 'price'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        formData.exitType === 'price' ? 'bg-purple-500' : 'bg-gray-300'
                      }`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Price-based Exit</h4>
                        <p className="text-sm text-gray-600">Specify exact exit price</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Use this when you know the exact price at which the trade was closed.</p>
                  </div>

                  {/* Manual P&L entry */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, exitType: 'other' }))}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      formData.exitType === 'other'
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        formData.exitType === 'other' ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Manual P&L Entry</h4>
                        <p className="text-sm text-gray-600">Enter profit/loss directly</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Use this for complex exits, partial closes, or when you only know the final P&L.</p>
                  </div>
                </div>
              </div>

              {/* Execution Details Form */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Execution Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Actual Entry Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actual Entry Price
                      <span className="text-gray-500 ml-1">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.actualEntry}
                      onChange={(e) => {
                        const newFormData = { ...formData, actualEntry: e.target.value };
                        setFormData(newFormData);
                        setCalculatedResults(calculateMetrics(newFormData));
                      }}
                      placeholder={`Planned: ${trade.entryPrice || 'N/A'}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use planned entry price</p>
                  </div>

                  {formData.exitType === 'price' ? (
                    /* Exit Price Input */
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Actual Exit Price *
                        {lastAutoFilledStatus && (
                          <span className="text-blue-600 text-xs ml-2">
                            (Auto-filled from {lastAutoFilledStatus === 'win' ? 'Take Profit' : 'Stop Loss'})
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.actualExit}
                        onChange={(e) => {
                          const newFormData = { ...formData, actualExit: e.target.value };
                          setFormData(newFormData);
                          setCalculatedResults(calculateMetrics(newFormData));
                          setLastAutoFilledStatus(null); // Clear auto-fill indicator when manually changed
                        }}
                        placeholder={selectedStatus === 'win' ? `Target: ${trade.takeProfit || 'N/A'}` : `Stop: ${trade.stopLoss || 'N/A'}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  ) : (
                    /* Manual P&L Input */
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Actual Profit/Loss *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.manualPL}
                        onChange={(e) => {
                          const newFormData = { ...formData, manualPL: e.target.value };
                          setFormData(newFormData);
                          setCalculatedResults(calculateMetrics(newFormData));
                        }}
                        placeholder="Enter final P&L amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Positive for profit, negative for loss</p>
                    </div>
                  )}

                  {/* Exit Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exit Reason</label>
                    <select
                      value={formData.exitReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, exitReason: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select reason...</option>
                      <option value="take-profit-hit">Take Profit Hit</option>
                      <option value="stop-loss-hit">Stop Loss Hit</option>
                      <option value="manual-close-profit">Manual Close (Profit)</option>
                      <option value="manual-close-loss">Manual Close (Loss)</option>
                      <option value="break-even">Break Even Close</option>
                      <option value="partial-close">Partial Close</option>
                      <option value="news-event">News Event</option>
                      <option value="time-based">Time-Based Exit</option>
                      <option value="technical-signal">Technical Signal</option>
                      <option value="risk-management">Risk Management</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Exit Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exit Description</label>
                    <textarea
                      value={formData.exitDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, exitDescription: e.target.value }))}
                      placeholder="Describe what happened during the exit..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                {/* Live Calculation Results */}
                <div className="mt-8 p-6 bg-white rounded-xl border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Live Calculation Results
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Actual P&L</p>
                      <p className={`text-xl font-bold ${
                        calculatedResults.actualPL > 0 ? 'text-green-600' :
                        calculatedResults.actualPL < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(calculatedResults.actualPL)}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Pips</p>
                      <p className={`text-xl font-bold ${
                        calculatedResults.actualPL > 0 ? 'text-green-600' :
                        calculatedResults.actualPL < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {calculatedResults.actualPL > 0 ? '+' : ''}
                        {calculatedResults.pips}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Risk:Reward</p>
                      <p className="text-xl font-bold text-blue-600">
                        1:{calculatedResults.riskRewardRatio}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Account Impact</p>
                      <p className={`text-xl font-bold ${
                        calculatedResults.accountImpact > 0 ? 'text-green-600' :
                        calculatedResults.accountImpact < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {calculatedResults.accountImpact > 0 ? '+' : ''}
                        {calculatedResults.accountImpact}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Closing Screenshot Upload */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Closing Screenshot
                  <span className="text-sm font-normal text-gray-600 ml-2">(Optional)</span>
                </h3>

                {!formData.closingImage ? (
                  <div className="border-2 border-dashed border-green-300 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 mb-4">Upload a screenshot of your trade closure</p>
                    <label className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl cursor-pointer hover:bg-green-700 transition-colors duration-200">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleClosingImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.closingImage}
                      alt="Closing screenshot"
                      className="w-full max-w-md mx-auto rounded-xl border border-green-200"
                    />
                    <button
                      onClick={removeClosingImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-8">
              {/* Post-Trade Analysis */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Post-Trade Analysis & Notes
                </h3>

                <div className="space-y-6">
                  {/* Trade Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trade Notes & Observations
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="What happened during this trade? Market conditions, emotions, key observations..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* What Went Well */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What Went Well?
                      <span className="text-green-600 ml-1">✓</span>
                    </label>
                    <textarea
                      value={formData.whatWentWell || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatWentWell: e.target.value }))}
                      placeholder="What aspects of this trade were executed well? Good decisions, proper risk management, etc."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* What Could Be Improved */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What Could Be Improved?
                      <span className="text-orange-600 ml-1">⚠</span>
                    </label>
                    <textarea
                      value={formData.improvements || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                      placeholder="What could have been done better? Entry timing, exit strategy, risk management, etc."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Key Lessons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Lessons Learned
                      <span className="text-blue-600 ml-1">💡</span>
                    </label>
                    <textarea
                      value={formData.lessons || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, lessons: e.target.value }))}
                      placeholder="What are the key takeaways from this trade? How will this influence future trades?"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Final Performance Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Planned vs Actual */}
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Planned vs Actual</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Planned P&L:</span>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(trade.calculatedResults?.potentialProfit || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Actual P&L:</span>
                        <span className={`text-sm font-medium ${
                          calculatedResults.actualPL > 0 ? 'text-green-600' :
                          calculatedResults.actualPL < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(calculatedResults.actualPL)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-gray-600">Difference:</span>
                        <span className={`text-sm font-bold ${
                          (calculatedResults.actualPL - (trade.calculatedResults?.potentialProfit || 0)) > 0 ? 'text-green-600' :
                          (calculatedResults.actualPL - (trade.calculatedResults?.potentialProfit || 0)) < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(calculatedResults.actualPL - (trade.calculatedResults?.potentialProfit || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Impact */}
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Account Impact</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Previous Balance:</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(currentAccount?.balance || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">P&L Impact:</span>
                        <span className={`text-sm font-medium ${
                          calculatedResults.actualPL > 0 ? 'text-green-600' :
                          calculatedResults.actualPL < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {calculatedResults.actualPL > 0 ? '+' : ''}
                          {formatCurrency(calculatedResults.actualPL)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-gray-600">New Balance:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {formatCurrency((currentAccount?.balance || 0) + calculatedResults.actualPL)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Submit Button */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last updated: {new Date(trade.updatedAt || trade.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedStatus}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update AM Trade Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
