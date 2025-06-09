'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Sidebar from '../../components/Sidebar';

export default function Journal() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [statusTrade, setStatusTrade] = useState(null);
  const [userStrategies, setUserStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);

  // Sidebar states
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);

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
      // Don't fetch trades here - wait for account to be set
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Fetch accounts and trades when user is set
  useEffect(() => {
    if (user?.id || user?._id) {
      console.log('User loaded, fetching accounts and trades...');
      fetchAccountsAndTrades();
    }
  }, [user]);

  // Fetch trades when current account changes (but not on initial load)
  useEffect(() => {
    if (user && currentAccountId && accounts.length > 0) {
      console.log('Account changed, fetching trades for account:', currentAccountId);
      setLoading(true);
      fetchTrades(user.id || user._id, currentAccountId);
    }
  }, [currentAccountId]);

  useEffect(() => {
    filterAndSortTrades();
  }, [trades, filter, searchTerm, sortBy]);

  // Combined function to fetch accounts and trades
  const fetchAccountsAndTrades = async () => {
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const userId = user?.id || user?._id;

      console.log('Fetching accounts for userId:', userId);
      // First, try to fetch accounts
      const accountsResponse = await fetch(`/api/accounts?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        console.log('Accounts response:', accountsData);

        if (accountsData.accounts && accountsData.accounts.length > 0) {
          setAccounts(accountsData.accounts);
          const firstAccountId = accountsData.accounts[0].id || accountsData.accounts[0]._id;
          setCurrentAccountId(firstAccountId);
          console.log('Setting default account:', firstAccountId);

          // Fetch trades for the first account
          await fetchTrades(userId, firstAccountId);
        } else {
          console.log('No accounts found in response, creating default account and fetching all trades');
          // Create a default account if none exist
          await createDefaultAccount();
          // Fetch all trades without account filter for now
          await fetchTrades(userId, null);
        }
      } else {
        console.log('Failed to fetch accounts (status:', accountsResponse.status, '), creating default and fetching all trades');
        // If accounts API fails, create default account and fetch all trades
        await createDefaultAccount();
        await fetchTrades(userId, null);
      }
    } catch (error) {
      console.error('Error in fetchAccountsAndTrades:', error);
      // Fallback: fetch all trades without account filter
      const userId = user?.id || user?._id;
      await fetchTrades(userId, null);
    }
  };

  // Create default account if none exist
  const createDefaultAccount = async () => {
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const userId = user?.id || user?._id;
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          name: 'Main Trading Account',
          balance: 10000,
          tag: 'personal'
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const newAccount = result.account;
        setAccounts([newAccount]);
        setCurrentAccountId(newAccount.id || newAccount._id);
        console.log('Created default account:', newAccount);
      } else {
        console.error('Failed to create default account:', result.message);
      }
    } catch (error) {
      console.error('Error creating default account:', error);
    }
  };

  const fetchTrades = async (userId, accountId = null) => {
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      let url = `/api/trades?userId=${userId}`;
      if (accountId) {
        url += `&accountId=${accountId}`;
      }

      console.log('Fetching trades from:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Trades response:', data);

      if (data.trades) {
        setTrades(data.trades);
        console.log('Set trades:', data.trades.length, 'trades');
      } else {
        console.log('No trades in response');
        setTrades([]);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTrades = () => {
    let filtered = trades;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(trade => trade.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.tradingPair?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.analysis?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'profit':
          return (b.calculations?.potentialProfit || 0) - (a.calculations?.potentialProfit || 0);
        case 'risk':
          return (b.calculations?.riskAmount || 0) - (a.calculations?.riskAmount || 0);
        default:
          return 0;
      }
    });

    setFilteredTrades(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionColor = (direction) => {
    return direction === 'LONG' ? 'text-green-600' : 'text-red-600';
  };

  const getTradeStats = () => {
    // Debug logging
    console.log('=== TRADE STATS DEBUG ===');
    console.log('Current Account ID:', currentAccountId);
    console.log('Total trades in state:', trades.length);
    console.log('All trades:', trades.map(t => ({ id: t._id, pair: t.tradingPair, accountId: t.accountId, status: t.status })));

    // Filter trades by current account
    const accountTrades = trades.filter(trade => {
      const matches = trade.accountId === currentAccountId ||
                     trade.accountId === currentAccountId?.toString();
      console.log(`Trade ${trade._id} (${trade.tradingPair}): accountId=${trade.accountId}, currentAccountId=${currentAccountId}, matches=${matches}`);
      return matches;
    });

    console.log('Filtered account trades:', accountTrades.length);
    console.log('Account trades:', accountTrades.map(t => ({ id: t._id, pair: t.tradingPair, status: t.status, actualProfit: t.actualProfit })));

    // Basic counts
    const total = accountTrades.length;
    const planning = accountTrades.filter(t => t.status === 'planning').length;
    const active = accountTrades.filter(t => t.status === 'active').length;
    const wins = accountTrades.filter(t => t.status === 'win').length;
    const losses = accountTrades.filter(t => t.status === 'loss').length;
    const closed = wins + losses;

    // Financial calculations
    const totalRisk = accountTrades.reduce((sum, trade) => sum + (trade.calculations?.riskAmount || 0), 0);
    const totalPotentialProfit = accountTrades.reduce((sum, trade) => sum + (trade.calculations?.potentialProfit || 0), 0);

    // Actual P&L from closed trades
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
    console.log('Current account found:', currentAccount);
    console.log('All accounts:', accounts.map(a => ({ id: a.id || a._id, name: a.name, balance: a.balance })));

    const accountBalance = currentAccount?.balance || 0;
    const initialBalance = currentAccount?.initialBalance || currentAccount?.balance || 10000;

    console.log('Account balance:', accountBalance);
    console.log('Initial balance:', initialBalance);

    // Account growth
    const accountGrowth = initialBalance > 0 ? ((accountBalance - initialBalance) / initialBalance) * 100 : 0;

    console.log('Calculated stats:', {
      total, planning, active, wins, losses, closed,
      actualPL, winRate: winRate.toFixed(1),
      profitFactor: profitFactor === 999 ? '∞' : profitFactor.toFixed(2),
      accountBalance, accountGrowth: accountGrowth.toFixed(2)
    });
    console.log('=== END TRADE STATS DEBUG ===');

    return {
      total,
      planning,
      active,
      wins,
      losses,
      closed,
      totalRisk,
      totalPotentialProfit,
      actualPL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      accountBalance,
      accountGrowth,
      accountName: currentAccount?.name || 'Unknown Account'
    };
  };

  // Sidebar functions
  const handleAccountSwitch = (accountId) => {
    console.log('Switching to account:', accountId);
    setCurrentAccountId(accountId);
  };

  const handleShowAddAccount = () => {
    setShowAddAccountModal(true);
  };

  const handleEditAccount = (accountId, updates) => {
    setAccounts(prev => prev.map(acc =>
      (acc.id || acc._id) === accountId ? { ...acc, ...updates } : acc
    ));
  };

  const handleDeleteAccount = async (accountId) => {
    if (accounts.length <= 1) {
      alert('Cannot delete the last account');
      return;
    }

    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const response = await fetch(`/api/accounts?id=${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAccounts(prev => prev.filter(acc => (acc.id || acc._id) !== accountId));

        // If we deleted the current account, switch to the first remaining account
        if (currentAccountId === accountId) {
          const remainingAccounts = accounts.filter(acc => (acc.id || acc._id) !== accountId);
          if (remainingAccounts.length > 0) {
            setCurrentAccountId(remainingAccounts[0].id || remainingAccounts[0]._id);
          }
        }
      } else {
        alert('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
    }
  };

  const handleLogout = () => {
    Cookies.remove('auth-token');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // View trade details
  const viewTradeDetails = (trade) => {
    setSelectedTrade(trade);
    setShowTradeModal(true);
  };

  // Delete trade
  const deleteTrade = async (tradeId) => {
    if (!confirm('Are you sure you want to delete this trade?')) {
      return;
    }

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const response = await fetch(`/api/trades?id=${tradeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // Remove trade from local state
        setTrades(prev => prev.filter(trade => trade._id !== tradeId));
        console.log('Trade deleted successfully');
      } else {
        console.error('Failed to delete trade:', result.message);
        alert('Failed to delete trade: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Error deleting trade: ' + error.message);
    }
  };

  // Edit trade
  const editTrade = (trade) => {
    setEditingTrade(trade);
    setShowEditModal(true);
  };

  // Update trade status
  const updateTradeStatus = (trade) => {
    setStatusTrade(trade);
    setShowStatusModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trades...</p>
        </div>
      </div>
    );
  }

  const stats = getTradeStats();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Shared Sidebar */}
      <Sidebar
        user={user}
        currentAccountId={currentAccountId}
        accounts={accounts}
        onAccountSwitch={handleAccountSwitch}
        onAddAccount={handleShowAddAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
        onUpdateUser={(updatedUser) => setUser(updatedUser)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Modern Professional Header */}
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-b border-white/20 backdrop-blur-sm px-8 py-8 sticky top-0 z-40">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Trading Journal
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <p className="text-gray-600 text-base font-medium">
                    Track and analyze your trading performance
                  </p>
                  {currentAccountId && accounts.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                        <span className="text-sm text-green-700 font-semibold">
                          {accounts.find(acc => (acc.id || acc._id) === currentAccountId)?.name || 'Unknown Account'}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                        <span className="text-sm text-gray-700 font-semibold">
                          ${accounts.find(acc => (acc.id || acc._id) === currentAccountId)?.balance?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Modern View Mode Toggle */}
              <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-2xl p-1 border border-white/20 shadow-sm">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    viewMode === 'cards'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>List</span>
                </button>
              </div>

              {/* Enhanced Add Trade Button */}
              <button
                onClick={() => router.push('/add-trade')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Trade</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Modern Stats Overview */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-blue-500/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"></div>
              <div className="relative p-8 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Performance Overview
                    </h3>
                    <p className="text-gray-600 font-medium">Your trading statistics and analytics at a glance</p>
                  </div>
                </div>
              </div>

              <div className="relative p-8">
                {/* Enhanced Account Summary */}
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 rounded-2xl border border-blue-200/30 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{stats.accountName}</h4>
                        <p className="text-sm text-gray-600 font-medium">
                          Current Balance: <span className="font-bold text-gray-900">${stats.accountBalance.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${stats.accountGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.accountGrowth >= 0 ? '+' : ''}{stats.accountGrowth.toFixed(2)}%
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Account Growth</p>
                    </div>
                  </div>
                </div>

                {/* Modern Trading Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 text-center border border-blue-200/30 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Total Trades</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl p-5 text-center border border-yellow-200/30 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3m0 2v2" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Planning</h3>
                    <p className="text-2xl font-bold text-yellow-600">{stats.planning}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 text-center border border-indigo-200/30 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Active</h3>
                    <p className="text-2xl font-bold text-indigo-600">{stats.active}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 text-center border border-green-200/30 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Wins</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-5 text-center border border-red-200/30 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Losses</h3>
                    <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 text-center border border-gray-200/30 shadow-sm hover:shadow-md transition-all duration-200 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Closed</h3>
                    <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                  </div>
                </div>

                {/* Enhanced Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Actual P&L</h3>
                        <p className={`text-3xl font-bold ${stats.actualPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${stats.actualPL >= 0 ? '+' : ''}{stats.actualPL.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Realized profit/loss</p>
                      </div>
                      <div className={`w-14 h-14 bg-gradient-to-br from-${stats.actualPL >= 0 ? 'green' : 'red'}-500 to-${stats.actualPL >= 0 ? 'emerald' : 'rose'}-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Win Rate</h3>
                        <p className="text-3xl font-bold text-blue-600">{stats.winRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">Success percentage</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Profit Factor</h3>
                        <p className="text-3xl font-bold text-purple-600">
                          {stats.profitFactor === 999 ? '∞' : stats.profitFactor.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Profit/loss ratio</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Risk</h3>
                        <p className="text-3xl font-bold text-orange-600">${stats.totalRisk.toFixed(0)}</p>
                        <p className="text-xs text-gray-500 mt-1">Risk exposure</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                {stats.closed > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Average Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Avg Win:</span>
                          <span className="text-sm font-semibold text-green-600">${stats.avgWin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Avg Loss:</span>
                          <span className="text-sm font-semibold text-red-600">${stats.avgLoss.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Risk Management</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Potential Profit:</span>
                          <span className="text-sm font-semibold text-green-600">${stats.totalPotentialProfit.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Risk/Reward:</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {stats.totalRisk > 0 ? (stats.totalPotentialProfit / stats.totalRisk).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modern Filters and Search */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-blue-500/5 overflow-hidden p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-6">

                {/* Enhanced Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search trades by pair, strategy, or notes..."
                      className="w-full pl-12 pr-4 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm shadow-sm placeholder-gray-400 text-gray-900 font-medium"
                    />
                  </div>
                </div>

                {/* Enhanced Filters */}
                <div className="flex space-x-3">
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-5 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200 shadow-sm font-medium text-gray-900 appearance-none pr-10"
                    >
                      <option value="all">All Status</option>
                      <option value="planning">Planning</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-5 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200 shadow-sm font-medium text-gray-900 appearance-none pr-10"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="profit">Highest Profit</option>
                      <option value="risk">Highest Risk</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* Trades Display */}
            {filteredTrades.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No trades found</h3>
                <p className="text-gray-600 mb-6">
                  {trades.length === 0
                    ? "Start building your trading journal by adding your first trade."
                    : `${trades.length} trades available, but none match your current filters.`
                  }
                </p>
                <button
                  onClick={() => router.push('/add-trade')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm font-medium"
                >
                  Add Your First Trade
                </button>
              </div>
            ) : viewMode === 'cards' ? (
              // Modern Cards View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrades.map((trade) => (
                  <div key={trade._id} className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-blue-500/5 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>

                    {/* Enhanced Trade Header */}
                    <div className="relative p-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/20 border-b border-gray-100/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full shadow-lg ${trade.direction === 'long' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}></div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{trade.tradingPair}</h3>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm ${getStatusColor(trade.status)}`}>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              trade.status === 'planning' ? 'bg-yellow-400' :
                              trade.status === 'open' ? 'bg-blue-400' : 'bg-green-400'
                            }`}></div>
                            <span>{trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}</span>
                          </div>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                            trade.direction === 'long' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
                          }`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                trade.direction === 'long' ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                              } />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Direction</p>
                            <p className={`font-bold text-lg ${getDirectionColor(trade.direction)}`}>
                              {trade.direction?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 font-medium">Entry Price</p>
                          <p className="font-bold text-lg text-gray-900 font-mono">{parseFloat(trade.entryPrice).toFixed(5)}</p>
                        </div>
                      </div>
                    </div>

                {/* Trade Details */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Take Profit</p>
                      <p className="font-semibold text-green-600">{parseFloat(trade.takeProfit).toFixed(5)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Stop Loss</p>
                      <p className="font-semibold text-red-600">{parseFloat(trade.stopLoss).toFixed(5)}</p>
                    </div>
                  </div>

                  {/* Calculations */}
                  {trade.calculations && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Risk Amount</p>
                          <p className="font-bold text-red-600">${trade.calculations.riskAmount?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Potential Profit</p>
                          <p className="font-bold text-green-600">${trade.calculations.potentialProfit?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Lot Size</p>
                          <p className="font-bold text-blue-600">{trade.calculations.lotSize?.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Risk:Reward</p>
                          <p className="font-bold text-purple-600">1:{trade.calculations.riskRewardRatio?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {trade.tags && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {trade.tags.split(',').slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {tag.trim()}
                          </span>
                        ))}
                        {trade.tags.split(',').length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{trade.tags.split(',').length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Analysis Preview */}
                  {trade.analysis && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Analysis</p>
                      <p className="text-sm text-gray-800 line-clamp-3">
                        {trade.analysis.length > 100 ? trade.analysis.substring(0, 100) + '...' : trade.analysis}
                      </p>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Created: {new Date(trade.createdAt).toLocaleDateString()}</span>
                    <span>{new Date(trade.createdAt).toLocaleTimeString()}</span>
                  </div>

                    {/* Actions */}
                    <div className="flex justify-center space-x-3">
                      {/* View Icon */}
                      <button
                        onClick={() => viewTradeDetails(trade)}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Edit Icon */}
                      <button
                        onClick={() => editTrade(trade)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit Trade"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Update Status Icon */}
                      <button
                        onClick={() => updateTradeStatus(trade)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Update Status"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => deleteTrade(trade._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Trade"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pair</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Entry</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">TP/SL</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTrades.map((trade) => (
                    <tr key={trade._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${trade.direction === 'long' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-semibold text-gray-900">{trade.tradingPair}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${getDirectionColor(trade.direction)}`}>
                          {trade.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {parseFloat(trade.entryPrice).toFixed(5)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="space-y-1">
                          <div className="text-green-600 font-mono">{parseFloat(trade.takeProfit).toFixed(5)}</div>
                          <div className="text-red-600 font-mono">{parseFloat(trade.stopLoss).toFixed(5)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        ${trade.calculations?.riskAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${trade.calculations?.potentialProfit?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                          {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {/* View Icon */}
                          <button
                            onClick={() => viewTradeDetails(trade)}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Edit Icon */}
                          <button
                            onClick={() => editTrade(trade)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Trade"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Update Status Icon */}
                          <button
                            onClick={() => updateTradeStatus(trade)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Update Status"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </button>

                          {/* Delete Icon */}
                          <button
                            onClick={() => deleteTrade(trade._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Trade"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  </div>

  {/* Trade Details Modal */}
  {showTradeModal && selectedTrade && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Trade Details</h2>
                <p className="text-gray-600">{selectedTrade.tradingPair} - {selectedTrade.direction?.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={() => setShowTradeModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Trade Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Trade Setup</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trading Pair</p>
                    <p className="font-semibold text-gray-900">{selectedTrade.tradingPair}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Direction</p>
                    <p className={`font-semibold ${getDirectionColor(selectedTrade.direction)}`}>
                      {selectedTrade.direction?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Entry Price</p>
                    <p className="font-semibold text-gray-900 font-mono">{parseFloat(selectedTrade.entryPrice).toFixed(5)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTrade.status)}`}>
                      {selectedTrade.status.charAt(0).toUpperCase() + selectedTrade.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Take Profit</p>
                    <p className="font-semibold text-green-600 font-mono">{parseFloat(selectedTrade.takeProfit).toFixed(5)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Stop Loss</p>
                    <p className="font-semibold text-red-600 font-mono">{parseFloat(selectedTrade.stopLoss).toFixed(5)}</p>
                  </div>
                  {selectedTrade.strategy && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Strategy</p>
                      <p className="font-semibold text-gray-900">{selectedTrade.strategy}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Management */}
              {selectedTrade.calculations && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Management</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Risk Amount</p>
                      <p className="font-semibold text-red-600">${selectedTrade.calculations.riskAmount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Potential Profit</p>
                      <p className="font-semibold text-green-600">${selectedTrade.calculations.potentialProfit?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Lot Size</p>
                      <p className="font-semibold text-blue-600">{selectedTrade.calculations.lotSize?.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Risk:Reward</p>
                      <p className="font-semibold text-purple-600">1:{selectedTrade.calculations.riskRewardRatio?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Profit Pips</p>
                      <p className="font-semibold text-green-600">{selectedTrade.calculations.profitPips?.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Loss Pips</p>
                      <p className="font-semibold text-red-600">{selectedTrade.calculations.lossPips?.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis and Notes */}
            <div className="space-y-6">
              {selectedTrade.analysis && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Analysis</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTrade.analysis}</p>
                </div>
              )}

              {selectedTrade.notes && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTrade.notes}</p>
                </div>
              )}

              {selectedTrade.riskManagementLessons && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Management Lessons</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTrade.riskManagementLessons}</p>
                </div>
              )}

              {selectedTrade.tags && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrade.tags.split(',').map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Trade Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-semibold">{new Date(selectedTrade.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-semibold">{new Date(selectedTrade.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Edit Trade Modal */}
  {showEditModal && editingTrade && (
    <EditTradeModal
      trade={editingTrade}
      accounts={accounts}
      onClose={() => {
        setShowEditModal(false);
        setEditingTrade(null);
      }}
      onTradeUpdated={(updatedTrade) => {
        setTrades(prev => prev.map(trade =>
          trade._id === updatedTrade._id ? updatedTrade : trade
        ));
        setShowEditModal(false);
        setEditingTrade(null);
      }}
    />
  )}

  {/* Status Update Modal */}
  {showStatusModal && statusTrade && (
    <StatusUpdateModal
      trade={statusTrade}
      accounts={accounts}
      onClose={() => {
        setShowStatusModal(false);
        setStatusTrade(null);
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
        setShowStatusModal(false);
        setStatusTrade(null);
      }}
    />
  )}

  {/* Add Account Modal */}
  {showAddAccountModal && (
    <AddAccountModal
      onClose={() => setShowAddAccountModal(false)}
      onAccountAdded={(newAccount) => {
        setAccounts(prev => [...prev, newAccount]);
        setShowAddAccountModal(false);
      }}
    />
  )}
</div>
);
}

// Edit Trade Modal Component
function EditTradeModal({ trade, accounts, onClose, onTradeUpdated }) {
  // Debug: Log the trade data to verify strategy is present
  console.log('EditTradeModal - Trade data:', trade);
  console.log('EditTradeModal - Strategy from trade:', trade.strategy);

  const [formData, setFormData] = useState({
    tradingPair: trade.tradingPair || '',
    entryPrice: trade.entryPrice || '',
    takeProfit: trade.takeProfit || '',
    stopLoss: trade.stopLoss || '',
    direction: trade.direction || 'long',
    strategy: trade.strategy || '',
    analysis: trade.analysis || '',
    notes: trade.notes || '',
    riskManagementLessons: trade.riskManagementLessons || '',
    tags: trade.tags || '',
    riskPerTrade: trade.riskPerTrade || 2,
    accountSize: trade.accountSize || 0,
    status: trade.status || 'planning',
    actualEntry: trade.actualEntry || '',
    actualExit: trade.actualExit || '',
    exitReason: trade.exitReason || '',
    actualProfit: trade.actualProfit || '',
    screenshot: null,
    closingImage: null
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [closingImagePreview, setClosingImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [userStrategies, setUserStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [calculatedResults, setCalculatedResults] = useState({
    riskAmount: 0,
    lotSize: 0,
    potentialProfit: 0,
    potentialLoss: 0,
    profitPips: 0,
    lossPips: 0,
    riskRewardRatio: 0
  });

  // Suggested tags
  const suggestedTags = [
    'scalping', 'swing-trade', 'day-trade', 'breakout', 'trend-following',
    'support-resistance', 'news-trade', 'technical-analysis', 'momentum',
    'reversal', 'continuation', 'pullback', 'bounce', 'channel'
  ];

  // Trading pairs data (simplified version)
  const tradingPairs = {
    forex: [
      { pair: 'EUR/USD', name: 'Euro/US Dollar' },
      { pair: 'GBP/USD', name: 'British Pound/US Dollar' },
      { pair: 'USD/JPY', name: 'US Dollar/Japanese Yen' },
      { pair: 'USD/CHF', name: 'US Dollar/Swiss Franc' },
      { pair: 'AUD/USD', name: 'Australian Dollar/US Dollar' },
      { pair: 'USD/CAD', name: 'US Dollar/Canadian Dollar' },
      { pair: 'NZD/USD', name: 'New Zealand Dollar/US Dollar' }
    ],
    crypto: [
      { pair: 'BTC/USD', name: 'Bitcoin/US Dollar' },
      { pair: 'ETH/USD', name: 'Ethereum/US Dollar' },
      { pair: 'LTC/USD', name: 'Litecoin/US Dollar' },
      { pair: 'XRP/USD', name: 'Ripple/US Dollar' }
    ],
    commodities: [
      { pair: 'XAUUSD', name: 'Gold/US Dollar' },
      { pair: 'XAGUSD', name: 'Silver/US Dollar' },
      { pair: 'XTIUSD', name: 'Oil/US Dollar' }
    ]
  };

  // Image upload handlers
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, screenshot: file }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleClosingImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, closingImage: file }));
      const reader = new FileReader();
      reader.onload = (e) => setClosingImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addTag = (tag) => {
    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData(prev => ({ ...prev, tags: newTags }));
    }
  };

  // Fetch user strategies from database
  const fetchUserStrategiesFromDB = async () => {
    setLoadingStrategies(true);
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        console.log('No auth token or user data found');
        setUserStrategies([]);
        return;
      }

      const user = JSON.parse(userData);
      const userId = user?.id || user?._id;

      if (!userId) {
        console.log('No user ID found');
        setUserStrategies([]);
        return;
      }

      console.log('Fetching strategies for user:', userId);

      const response = await fetch(`/api/strategies?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Strategies API response:', result);

      if (response.ok && result.success) {
        setUserStrategies(result.strategies || []);
        console.log('Strategies loaded successfully:', result.strategies?.length || 0);
      } else {
        console.error('Failed to fetch strategies:', result.message);
        setUserStrategies([]);
      }
    } catch (error) {
      console.error('Error fetching strategies:', error);
      setUserStrategies([]);
    } finally {
      setLoadingStrategies(false);
    }
  };

  // Select strategy function
  const selectStrategy = (strategy) => {
    const strategyName = typeof strategy === 'string' ? strategy : strategy.name;
    setFormData(prev => ({ ...prev, strategy: strategyName }));
    setShowStrategyModal(false);
  };

  // Load strategies when modal opens
  useEffect(() => {
    if (showStrategyModal) {
      fetchUserStrategiesFromDB();
    }
  }, [showStrategyModal]);

  // Simple calculation function (simplified version from add-trade)
  const calculateResults = (data) => {
    const entryPrice = parseFloat(data.entryPrice) || 0;
    const takeProfit = parseFloat(data.takeProfit) || 0;
    const stopLoss = parseFloat(data.stopLoss) || 0;
    const accountSize = parseFloat(data.accountSize) || 0;
    const riskPercent = parseFloat(data.riskPerTrade) || 2;

    if (!accountSize || !entryPrice || !stopLoss) {
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
    const pipValue = 10; // Simplified
    const stopLossPips = Math.abs(entryPrice - stopLoss) * 10000;
    const profitPips = takeProfit ? Math.abs(takeProfit - entryPrice) * 10000 : 0;
    const lotSize = stopLossPips > 0 ? riskAmount / (stopLossPips * pipValue) : 0;
    const potentialProfit = profitPips * pipValue * lotSize;
    const potentialLoss = riskAmount;
    const riskRewardRatio = potentialProfit > 0 ? potentialProfit / potentialLoss : 0;

    return {
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      lotSize: parseFloat(Math.max(0, lotSize).toFixed(4)),
      potentialProfit: parseFloat(Math.max(0, potentialProfit).toFixed(2)),
      potentialLoss: parseFloat(potentialLoss.toFixed(2)),
      profitPips: parseFloat(profitPips.toFixed(1)),
      lossPips: parseFloat(stopLossPips.toFixed(1)),
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2))
    };
  };

  // Auto-calculate actual P&L based on actual entry and exit prices
  const calculateActualPL = (actualEntry, actualExit, direction, lotSize) => {
    if (!actualEntry || !actualExit || !lotSize) return 0;

    const entryPrice = parseFloat(actualEntry);
    const exitPrice = parseFloat(actualExit);
    const size = parseFloat(lotSize);

    if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(size)) return 0;

    let priceDifference;
    if (direction === 'long') {
      priceDifference = exitPrice - entryPrice;
    } else {
      priceDifference = entryPrice - exitPrice;
    }

    // For forex pairs, calculate pip value and P&L
    const pipValue = 10; // Simplified pip value
    const pips = priceDifference * 10000; // Convert to pips
    const actualPL = pips * pipValue * size;

    return parseFloat(actualPL.toFixed(2));
  };

  // Update calculations when form data changes
  useEffect(() => {
    const results = calculateResults(formData);
    setCalculatedResults(results);

    // Auto-calculate actual P&L when actual entry/exit prices change
    if (formData.actualEntry && formData.actualExit) {
      const autoCalculatedPL = calculateActualPL(
        formData.actualEntry,
        formData.actualExit,
        formData.direction,
        results.lotSize
      );

      // Only update if the calculated value is different from current
      if (autoCalculatedPL !== parseFloat(formData.actualProfit || 0)) {
        setFormData(prev => ({
          ...prev,
          actualProfit: autoCalculatedPL.toString()
        }));
      }
    }
  }, [formData.actualEntry, formData.actualExit, formData.direction, formData.entryPrice, formData.takeProfit, formData.stopLoss, formData.accountSize, formData.riskPerTrade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const userId = user?.id || user?._id;

      // Prepare images array
      const images = [];
      if (formData.screenshot) {
        images.push(formData.screenshot);
      } else if (trade.images && trade.images.length > 0) {
        images.push(...trade.images);
      }

      // Add closing image if provided
      const closingImages = [];
      if (formData.closingImage) {
        closingImages.push(formData.closingImage);
      }

      const updateData = {
        tradingPair: formData.tradingPair,
        entryPrice: parseFloat(formData.entryPrice) || 0,
        takeProfit: parseFloat(formData.takeProfit) || 0,
        stopLoss: parseFloat(formData.stopLoss) || 0,
        direction: formData.direction,
        strategy: formData.strategy,
        analysis: formData.analysis,
        notes: formData.notes,
        riskManagementLessons: formData.riskManagementLessons,
        tags: formData.tags,
        riskPerTrade: parseFloat(formData.riskPerTrade) || 2,
        accountSize: parseFloat(formData.accountSize) || 0,
        status: formData.status,
        actualEntry: formData.actualEntry ? parseFloat(formData.actualEntry) : null,
        actualExit: formData.actualExit ? parseFloat(formData.actualExit) : null,
        exitReason: formData.exitReason,
        actualProfit: formData.actualProfit ? parseFloat(formData.actualProfit) : null,
        calculations: calculatedResults,
        images: images,
        closingImages: closingImages
      };

      const response = await fetch('/api/trades', {
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
        onTradeUpdated({ ...trade, ...updateData, updatedAt: new Date() });
      } else {
        alert('Failed to update trade: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('Error updating trade: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl border border-gray-100">
        {/* Modern Header */}
        <div className="relative p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Edit Trade</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-600">{trade.tradingPair}</span>
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
                    {trade.status === 'win' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {trade.status === 'loss' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {trade.status === 'active' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {trade.status === 'planning' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                    <span>{trade.status?.charAt(0).toUpperCase() + trade.status?.slice(1)}</span>
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
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="px-8 pt-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              {
                id: 'setup',
                name: 'Trade Setup',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                id: 'execution',
                name: 'Execution',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                id: 'analysis',
                name: 'Analysis',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )
              },
              {
                id: 'media',
                name: 'Media',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">

              {/* Tab Content */}
              {activeTab === 'setup' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trading Pair</label>
                            <select
                              value={formData.tradingPair}
                              onChange={(e) => setFormData(prev => ({ ...prev, tradingPair: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              required
                            >
                              <option value="">Select Trading Pair</option>
                              <optgroup label="Forex">
                                {tradingPairs.forex.map(pair => (
                                  <option key={pair.pair} value={pair.pair}>{pair.pair} - {pair.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Crypto">
                                {tradingPairs.crypto.map(pair => (
                                  <option key={pair.pair} value={pair.pair}>{pair.pair} - {pair.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Commodities">
                                {tradingPairs.commodities.map(pair => (
                                  <option key={pair.pair} value={pair.pair}>{pair.pair} - {pair.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, direction: 'long' }))}
                                  className={`px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                                    formData.direction === 'long'
                                      ? 'border-green-500 bg-green-50 text-green-700'
                                      : 'border-gray-300 text-gray-600 hover:border-green-300'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  <span>Long</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, direction: 'short' }))}
                                  className={`px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                                    formData.direction === 'short'
                                      ? 'border-red-500 bg-red-50 text-red-700'
                                      : 'border-gray-300 text-gray-600 hover:border-red-300'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                  </svg>
                                  <span>Short</span>
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                              <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-2">
                                Use the status update button in the trade list to mark trades as win/loss
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
                            <button
                              type="button"
                              onClick={() => setShowStrategyModal(true)}
                              className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 hover:border-purple-300 rounded-xl text-left transition-all duration-200 group"
                            >
                              {formData.strategy ? (
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{formData.strategy}</p>
                                    <p className="text-sm text-gray-500">Selected Strategy (Auto-populated)</p>
                                  </div>
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-700">Select Strategy</p>
                                    <p className="text-sm text-gray-500">Choose from your saved strategies</p>
                                  </div>
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price Levels */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Price Levels</h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.entryPrice}
                              onChange={(e) => setFormData(prev => ({ ...prev, entryPrice: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono"
                              required
                              placeholder="1.23456"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center space-x-2">
                                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                  <span>Take Profit</span>
                                </span>
                              </label>
                              <input
                                type="number"
                                step="0.00001"
                                value={formData.takeProfit}
                                onChange={(e) => setFormData(prev => ({ ...prev, takeProfit: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-mono"
                                required
                                placeholder="1.25000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center space-x-2">
                                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                  <span>Stop Loss</span>
                                </span>
                              </label>
                              <input
                                type="number"
                                step="0.00001"
                                value={formData.stopLoss}
                                onChange={(e) => setFormData(prev => ({ ...prev, stopLoss: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono"
                                required
                                placeholder="1.22000"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Management & Calculations */}
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Risk Management</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Account Size</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.accountSize}
                                  onChange={(e) => setFormData(prev => ({ ...prev, accountSize: e.target.value }))}
                                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                  required
                                  placeholder="10000"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Percentage</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={formData.riskPerTrade}
                                  onChange={(e) => setFormData(prev => ({ ...prev, riskPerTrade: e.target.value }))}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                  required
                                  placeholder="2"
                                />
                                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Calculations */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Live Calculations</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Risk Amount</p>
                            <p className="text-xl font-bold text-red-600">${calculatedResults.riskAmount}</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Potential Profit</p>
                            <p className="text-xl font-bold text-green-600">${calculatedResults.potentialProfit}</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Position Size</p>
                            <p className="text-xl font-bold text-blue-600">{calculatedResults.lotSize}</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Risk:Reward</p>
                            <p className="text-xl font-bold text-purple-600">1:{calculatedResults.riskRewardRatio}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Tab */}
              {activeTab === 'execution' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Actual Execution */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Actual Execution</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Actual Entry</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.actualEntry}
                              onChange={(e) => setFormData(prev => ({ ...prev, actualEntry: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-mono"
                              placeholder="Actual entry price"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Actual Exit</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.actualExit}
                              onChange={(e) => setFormData(prev => ({ ...prev, actualExit: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-mono"
                              placeholder="Actual exit price"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <span className="flex items-center space-x-2">
                                <span>Final P&L</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Auto-calculated</span>
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.actualProfit}
                                readOnly
                                className={`w-full pl-8 pr-12 py-3 border rounded-xl transition-all duration-200 font-semibold ${
                                  parseFloat(formData.actualProfit || 0) >= 0
                                    ? 'border-green-300 bg-green-50 text-green-700'
                                    : 'border-red-300 bg-red-50 text-red-700'
                                }`}
                                placeholder="Auto-calculated from actual prices"
                              />
                              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                            {formData.actualEntry && formData.actualExit && (
                              <p className="text-xs text-gray-500 mt-1">
                                Calculated from: {formData.actualEntry} → {formData.actualExit} ({formData.direction})
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Exit Reason</label>
                            <select
                              value={formData.exitReason}
                              onChange={(e) => setFormData(prev => ({ ...prev, exitReason: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                            >
                              <option value="">Select reason</option>
                              <option value="take-profit">Take Profit Hit</option>
                              <option value="stop-loss">Stop Loss Hit</option>
                              <option value="manual-close">Manual Close</option>
                              <option value="trailing-stop">Trailing Stop</option>
                              <option value="news-event">News Event</option>
                              <option value="time-based">Time Based</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 border border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Planned vs Actual</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Comparison</span>
                          </div>
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Entry:</span>
                              <span className="text-sm font-mono">
                                {formData.entryPrice} → {formData.actualEntry || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Exit:</span>
                              <span className="text-sm font-mono">
                                {formData.takeProfit} → {formData.actualExit || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                              <span className="text-sm font-medium">P&L:</span>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Planned: ${calculatedResults.potentialProfit}</div>
                                <div className={`text-sm font-bold ${
                                  parseFloat(formData.actualProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  Actual: ${formData.actualProfit || '0.00'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-8">
                    {/* Analysis Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Trade Analysis</h3>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Market Analysis</label>
                          <textarea
                            value={formData.analysis}
                            onChange={(e) => setFormData(prev => ({ ...prev, analysis: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 resize-none"
                            rows={5}
                            placeholder="Describe your market analysis, setup reasoning, confluence factors, technical indicators used..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Trade Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 resize-none"
                            rows={4}
                            placeholder="Additional observations, market conditions, emotions, execution notes..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Risk Management Lessons</label>
                          <textarea
                            value={formData.riskManagementLessons}
                            onChange={(e) => setFormData(prev => ({ ...prev, riskManagementLessons: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 resize-none"
                            rows={3}
                            placeholder="What did you learn about risk management from this trade? What would you do differently?"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Trade Tags</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Custom Tags</label>
                          <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            placeholder="Enter comma-separated tags (e.g., breakout, trend-following, scalping)"
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-3">Quick Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="px-3 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-xl hover:bg-indigo-100 transition-all duration-200 border border-indigo-200 flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span>{tag}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Entry Screenshot */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Entry Screenshot</h3>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-400 hover:bg-green-25 transition-all duration-300 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="entry-screenshot-upload"
                        />
                        <label htmlFor="entry-screenshot-upload" className="cursor-pointer">
                          {imagePreview ? (
                            <div className="space-y-4">
                              <img src={imagePreview} alt="Entry screenshot" className="max-w-full h-64 object-cover rounded-2xl mx-auto shadow-lg" />
                              <div className="flex items-center justify-center space-x-2 text-green-600 font-semibold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>Change Entry Image</span>
                              </div>
                            </div>
                          ) : trade.images && trade.images.length > 0 ? (
                            <div className="space-y-4">
                              <div className="text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm font-medium">Existing entry image</p>
                              </div>
                              <div className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Replace Entry Image
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-gray-400 mb-6">
                                <svg className="w-16 h-16 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-xl font-bold text-gray-900 mb-2">Upload Entry Screenshot</p>
                              <p className="text-sm text-gray-500 mb-6">PNG, JPG, GIF up to 10MB</p>
                              <div className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Choose File
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Closing Screenshot */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Closing Screenshot</h3>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-red-400 hover:bg-red-25 transition-all duration-300 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleClosingImageUpload}
                          className="hidden"
                          id="closing-screenshot-upload"
                        />
                        <label htmlFor="closing-screenshot-upload" className="cursor-pointer">
                          {closingImagePreview ? (
                            <div className="space-y-4">
                              <img src={closingImagePreview} alt="Closing screenshot" className="max-w-full h-64 object-cover rounded-2xl mx-auto shadow-lg" />
                              <div className="flex items-center justify-center space-x-2 text-red-600 font-semibold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>Change Closing Image</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-gray-400 mb-6">
                                <svg className="w-16 h-16 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-xl font-bold text-gray-900 mb-2">Upload Closing Screenshot</p>
                              <p className="text-sm text-gray-500 mb-6">PNG, JPG, GIF up to 10MB</p>
                              <div className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Choose File
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modern Footer */}
          <div className="bg-white border-t border-gray-200 p-6 mt-8">
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
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update Trade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Strategy Selection Modal */}
        {showStrategyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Select Strategy</h3>
                    <p className="text-sm text-gray-500 mt-1">Choose from your saved trading strategies</p>
                  </div>
                  <button
                    onClick={() => setShowStrategyModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingStrategies ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading strategies...</span>
                  </div>
                ) : userStrategies.length > 0 ? (
                  <div className="space-y-2">
                    {userStrategies.map((strategy) => (
                      <button
                        key={strategy._id || strategy.id}
                        onClick={() => selectStrategy(strategy)}
                        className="w-full p-4 text-left border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{strategy.name}</p>
                              <p className="text-sm text-gray-500">{strategy.description || 'No description'}</p>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">No strategies found</p>
                    <p className="text-sm text-gray-400">Create strategies in the add-trade page to see them here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Status Update Modal Component
function StatusUpdateModal({ trade, accounts, onClose, onStatusUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState(trade.status === 'win' || trade.status === 'loss' ? trade.status : 'win');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

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
    const lotSize = trade.calculations?.lotSize || 0.1;
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

  // Calculate preview metrics based on status selection (win/loss)
  const calculatePreviewMetrics = () => {
    if (!selectedStatus || (selectedStatus !== 'win' && selectedStatus !== 'loss')) {
      return {
        previewPL: 0,
        previewPips: 0,
        previewRiskReward: 0,
        previewAccountImpact: 0
      };
    }

    const entryPrice = parseFloat(trade.entryPrice) || 0;
    const takeProfit = parseFloat(trade.takeProfit) || 0;
    const stopLoss = parseFloat(trade.stopLoss) || 0;
    const lotSize = trade.calculations?.lotSize || 0.1;
    const pipValue = 10;
    const accountBalance = currentAccount?.balance || 10000;

    if (!entryPrice || !takeProfit || !stopLoss) {
      return {
        previewPL: 0,
        previewPips: 0,
        previewRiskReward: 0,
        previewAccountImpact: 0
      };
    }

    let exitPrice, pips, priceDifference;

    if (selectedStatus === 'win') {
      exitPrice = takeProfit;
      pips = Math.abs(takeProfit - entryPrice) * 10000;
      if (trade.direction === 'long') {
        priceDifference = takeProfit - entryPrice;
      } else {
        priceDifference = entryPrice - takeProfit;
      }
    } else { // loss
      exitPrice = stopLoss;
      pips = Math.abs(stopLoss - entryPrice) * 10000;
      if (trade.direction === 'long') {
        priceDifference = stopLoss - entryPrice;
      } else {
        priceDifference = entryPrice - stopLoss;
      }
    }

    const previewPL = (priceDifference * 10000) * pipValue * lotSize;
    const previewAccountImpact = (previewPL / accountBalance) * 100;

    // Calculate risk/reward ratio
    const riskPips = Math.abs(entryPrice - stopLoss) * 10000;
    const rewardPips = Math.abs(takeProfit - entryPrice) * 10000;
    const previewRiskReward = rewardPips / riskPips;

    return {
      previewPL: parseFloat(previewPL.toFixed(2)),
      previewPips: parseFloat(pips.toFixed(1)),
      previewRiskReward: parseFloat(previewRiskReward.toFixed(2)),
      previewAccountImpact: parseFloat(previewAccountImpact.toFixed(2))
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

  // Update preview metrics when status changes
  useEffect(() => {
    const preview = calculatePreviewMetrics();
    setPreviewMetrics(preview);
  }, [selectedStatus, trade.entryPrice, trade.takeProfit, trade.stopLoss, trade.direction, trade.calculations, currentAccount]);

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
        calculations: {
          ...trade.calculations,
          actualPL: calculatedResults.actualPL,
          pips: calculatedResults.pips,
          riskRewardRatio: calculatedResults.riskRewardRatio,
          accountImpact: calculatedResults.accountImpact
        }
      };

      // Update trade
      const response = await fetch('/api/trades', {
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
          }
        }

        onStatusUpdated({ ...trade, ...updateData }, updatedAccount);
      } else {
        alert('Failed to update trade status: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating trade status:', error);
      alert('Error updating trade status: ' + error.message);
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
                <h2 className="text-3xl font-bold text-gray-900">Update Trade Status</h2>
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
                    <span>Current: {trade.status?.charAt(0).toUpperCase() + trade.status?.slice(1)}</span>
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
        <div className="px-8 pt-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              {
                id: 'status',
                name: 'Status & Outcome',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                id: 'execution',
                name: 'Execution Details',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                id: 'analysis',
                name: 'Analysis & Notes',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )
              }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">

              {/* Status & Outcome Tab */}
              {activeTab === 'status' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Status Selection */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Trade Outcome</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('win');
                              updateExecutionPricesFromStatus('win');
                            }}
                            className={`p-6 rounded-2xl border-2 font-medium transition-all duration-200 flex flex-col items-center space-y-3 ${
                              selectedStatus === 'win'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-300 text-gray-600 hover:border-green-300 hover:bg-green-50'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              selectedStatus === 'win' ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-lg font-semibold">Win</span>
                            <span className="text-sm text-center">Trade was profitable</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('loss');
                              updateExecutionPricesFromStatus('loss');
                            }}
                            className={`p-6 rounded-2xl border-2 font-medium transition-all duration-200 flex flex-col items-center space-y-3 ${
                              selectedStatus === 'loss'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-300 text-gray-600 hover:border-red-300 hover:bg-red-50'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              selectedStatus === 'loss' ? 'bg-red-500' : 'bg-gray-300'
                            }`}>
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            <span className="text-lg font-semibold">Loss</span>
                            <span className="text-sm text-center">Trade was not profitable</span>
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Exit Reason</label>
                          <select
                            value={formData.exitReason}
                            onChange={(e) => setFormData(prev => ({ ...prev, exitReason: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          >
                            <option value="">Select exit reason</option>
                            <option value="take-profit-hit">Take Profit Hit</option>
                            <option value="stop-loss-hit">Stop Loss Hit</option>
                            <option value="manual-close">Manual Close</option>
                            <option value="trailing-stop">Trailing Stop</option>
                            <option value="market-close">Market Close</option>
                            <option value="risk-management">Risk Management</option>
                            <option value="strategy-signal">Strategy Signal</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Calculated Metrics */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            P&L
                            {calculatedResults.actualPL === 0 && previewMetrics.previewPL !== 0 && (
                              <span className="ml-1 text-xs text-blue-600">(Preview)</span>
                            )}
                          </div>
                          <div className={`text-2xl font-bold ${
                            (calculatedResults.actualPL !== 0 ? calculatedResults.actualPL : previewMetrics.previewPL) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(calculatedResults.actualPL !== 0 ? calculatedResults.actualPL : previewMetrics.previewPL) >= 0 ? '+' : ''}${calculatedResults.actualPL !== 0 ? calculatedResults.actualPL : previewMetrics.previewPL}
                          </div>
                          {calculatedResults.actualPL === 0 && previewMetrics.previewPL !== 0 && (
                            <div className="text-xs text-blue-500 mt-1">
                              Based on {selectedStatus === 'win' ? 'take profit' : 'stop loss'}
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            Pips
                            {calculatedResults.pips === 0 && previewMetrics.previewPips !== 0 && (
                              <span className="ml-1 text-xs text-blue-600">(Preview)</span>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formData.exitType === 'price' ? calculatedResults.pips :
                             (calculatedResults.pips === 0 && previewMetrics.previewPips !== 0 ? previewMetrics.previewPips : 'N/A')}
                          </div>
                          {formData.exitType === 'other' && calculatedResults.pips === 0 && previewMetrics.previewPips === 0 && (
                            <div className="text-xs text-gray-500 mt-1">Requires exit price</div>
                          )}
                          {calculatedResults.pips === 0 && previewMetrics.previewPips !== 0 && formData.exitType !== 'other' && (
                            <div className="text-xs text-blue-500 mt-1">
                              Based on {selectedStatus === 'win' ? 'TP' : 'SL'}
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            R:R Ratio
                            {calculatedResults.riskRewardRatio === 0 && previewMetrics.previewRiskReward !== 0 && (
                              <span className="ml-1 text-xs text-blue-600">(Preview)</span>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formData.exitType === 'price' && calculatedResults.riskRewardRatio > 0
                              ? `1:${calculatedResults.riskRewardRatio}`
                              : (calculatedResults.riskRewardRatio === 0 && previewMetrics.previewRiskReward > 0
                                  ? `1:${previewMetrics.previewRiskReward}`
                                  : 'N/A')
                            }
                          </div>
                          {formData.exitType === 'other' && calculatedResults.riskRewardRatio === 0 && previewMetrics.previewRiskReward === 0 && (
                            <div className="text-xs text-gray-500 mt-1">Requires exit price</div>
                          )}
                          {calculatedResults.riskRewardRatio === 0 && previewMetrics.previewRiskReward !== 0 && formData.exitType !== 'other' && (
                            <div className="text-xs text-blue-500 mt-1">Based on planned levels</div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            Account Impact
                            {calculatedResults.accountImpact === 0 && previewMetrics.previewAccountImpact !== 0 && (
                              <span className="ml-1 text-xs text-blue-600">(Preview)</span>
                            )}
                          </div>
                          <div className={`text-2xl font-bold ${
                            (calculatedResults.accountImpact !== 0 ? calculatedResults.accountImpact : previewMetrics.previewAccountImpact) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(calculatedResults.accountImpact !== 0 ? calculatedResults.accountImpact : previewMetrics.previewAccountImpact) >= 0 ? '+' : ''}{calculatedResults.accountImpact !== 0 ? calculatedResults.accountImpact : previewMetrics.previewAccountImpact}%
                          </div>
                          {calculatedResults.accountImpact === 0 && previewMetrics.previewAccountImpact !== 0 && (
                            <div className="text-xs text-blue-500 mt-1">
                              Based on {selectedStatus === 'win' ? 'take profit' : 'stop loss'}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentAccount && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                          <div className="text-sm text-blue-700 mb-1">
                            Account: {currentAccount.name}
                            {calculatedResults.actualPL === 0 && previewMetrics.previewPL !== 0 && (
                              <span className="ml-1 text-xs">(Preview)</span>
                            )}
                          </div>
                          <div className="text-lg font-semibold text-blue-900">
                            New Balance: ${(currentAccount.balance + (calculatedResults.actualPL !== 0 ? calculatedResults.actualPL : previewMetrics.previewPL)).toFixed(2)}
                          </div>
                          {calculatedResults.actualPL === 0 && previewMetrics.previewPL !== 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              Expected if {selectedStatus === 'win' ? 'take profit hits' : 'stop loss hits'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Details Tab */}
              {activeTab === 'execution' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Price Levels */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Execution Prices</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Exit Type Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Exit Information Type</label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, exitType: 'price' }))}
                              className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                                formData.exitType === 'price'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              </svg>
                              <span className="text-sm font-semibold">Use Exit Price</span>
                              <span className="text-xs text-center">Enter actual exit price for automatic P&L calculation</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, exitType: 'other' }))}
                              className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 flex flex-col items-center space-y-2 ${
                                formData.exitType === 'other'
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : 'border-gray-300 text-gray-600 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                              </svg>
                              <span className="text-sm font-semibold">Manual P&L</span>
                              <span className="text-xs text-center">Enter P&L manually without exit price</span>
                            </button>
                          </div>
                        </div>

                        {/* Entry Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center space-x-2">
                              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                              <span>Actual Entry</span>
                              {formData.actualEntry === trade.entryPrice && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Auto-filled</span>
                              )}
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.00001"
                            value={formData.actualEntry}
                            onChange={(e) => setFormData(prev => ({ ...prev, actualEntry: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono"
                            placeholder={trade.entryPrice || "1.23456"}
                          />
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">Planned: {trade.entryPrice}</p>
                            {formData.actualEntry !== trade.entryPrice && trade.entryPrice && (
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, actualEntry: trade.entryPrice }))}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Use planned price
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Conditional Fields Based on Exit Type */}
                        {formData.exitType === 'price' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <span className="flex items-center space-x-2">
                                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                <span>Actual Exit Price</span>
                                {((selectedStatus === 'win' && formData.actualExit === trade.takeProfit) ||
                                  (selectedStatus === 'loss' && formData.actualExit === trade.stopLoss)) && (
                                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                    Auto-filled from {selectedStatus === 'win' ? 'TP' : 'SL'}
                                  </span>
                                )}
                              </span>
                            </label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.actualExit}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, actualExit: e.target.value }));
                                // Reset auto-fill tracking when user manually changes the value
                                if (e.target.value !== trade.takeProfit && e.target.value !== trade.stopLoss) {
                                  setLastAutoFilledStatus(null);
                                }
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-mono"
                              placeholder="1.25000"
                            />
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex space-x-4 text-xs text-gray-500">
                                <span>TP: {trade.takeProfit}</span>
                                <span>SL: {trade.stopLoss}</span>
                              </div>
                              <div className="flex space-x-2">
                                {trade.takeProfit && formData.actualExit !== trade.takeProfit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, actualExit: trade.takeProfit }));
                                      setLastAutoFilledStatus('win');
                                    }}
                                    className="text-xs text-green-600 hover:text-green-800 underline"
                                  >
                                    Use TP
                                  </button>
                                )}
                                {trade.stopLoss && formData.actualExit !== trade.stopLoss && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, actualExit: trade.stopLoss }));
                                      setLastAutoFilledStatus('loss');
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                  >
                                    Use SL
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center space-x-2">
                                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                                  <span>Manual P&L Amount</span>
                                </span>
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.manualPL}
                                onChange={(e) => setFormData(prev => ({ ...prev, manualPL: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-mono"
                                placeholder="Enter profit/loss amount (e.g., 150.00 or -75.50)"
                              />
                              <p className="text-xs text-gray-500 mt-1">Enter positive for profit, negative for loss</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Exit Description</label>
                              <textarea
                                value={formData.exitDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, exitDescription: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
                                placeholder="Describe how the trade was closed (e.g., partial close, trailing stop, manual close due to news, etc.)"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <span className="flex items-center space-x-2">
                                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                <span>Stop Loss</span>
                                {formData.stopLoss === trade.stopLoss && (
                                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">Original</span>
                                )}
                              </span>
                            </label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.stopLoss}
                              onChange={(e) => setFormData(prev => ({ ...prev, stopLoss: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono"
                              placeholder={trade.stopLoss || "1.22000"}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">Original: {trade.stopLoss}</p>
                              {formData.stopLoss !== trade.stopLoss && trade.stopLoss && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, stopLoss: trade.stopLoss }))}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                >
                                  Reset to original
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <span className="flex items-center space-x-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span>Take Profit</span>
                                {formData.takeProfit === trade.takeProfit && (
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Original</span>
                                )}
                              </span>
                            </label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.takeProfit}
                              onChange={(e) => setFormData(prev => ({ ...prev, takeProfit: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-mono"
                              placeholder={trade.takeProfit || "1.25000"}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">Original: {trade.takeProfit}</p>
                              {formData.takeProfit !== trade.takeProfit && trade.takeProfit && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, takeProfit: trade.takeProfit }))}
                                  className="text-xs text-green-600 hover:text-green-800 underline"
                                >
                                  Reset to original
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.exitType === 'price' ? 'Actual P&L (Auto-calculated)' : 'Actual P&L (Manual Entry)'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={formData.actualProfit}
                              readOnly
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 font-mono text-lg font-semibold"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <span className={`text-sm font-medium ${
                                parseFloat(formData.actualProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {parseFloat(formData.actualProfit || 0) >= 0 ? '↗' : '↘'}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.exitType === 'price'
                              ? 'Automatically calculated based on entry/exit prices'
                              : 'Based on your manual P&L entry'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trade Information */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Original Trade Setup</h3>
                      </div>

                      {/* Quick Fill Buttons */}
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="text-sm font-medium text-gray-700 mb-3">Quick Fill Options:</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                actualEntry: trade.entryPrice,
                                actualExit: trade.takeProfit,
                                exitType: 'price'
                              }));
                              setLastAutoFilledStatus('win');
                            }}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                          >
                            Fill Win Scenario (TP Hit)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                actualEntry: trade.entryPrice,
                                actualExit: trade.stopLoss,
                                exitType: 'price'
                              }));
                              setLastAutoFilledStatus('loss');
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                          >
                            Fill Loss Scenario (SL Hit)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                actualEntry: trade.entryPrice,
                                stopLoss: trade.stopLoss,
                                takeProfit: trade.takeProfit
                              }));
                              setLastAutoFilledStatus(null);
                            }}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            Reset All to Original
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="text-sm text-gray-600 mb-1">Trading Pair</div>
                            <div className="text-lg font-semibold text-gray-900">{trade.tradingPair}</div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="text-sm text-gray-600 mb-1">Direction</div>
                            <div className="flex items-center space-x-2">
                              {trade.direction === 'long' ? (
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                              )}
                              <span className="text-lg font-semibold text-gray-900">{trade.direction?.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="text-sm text-gray-600 mb-1">Lot Size</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {trade.calculations?.lotSize || 'N/A'}
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="text-sm text-gray-600 mb-1">Risk Amount</div>
                            <div className="text-lg font-semibold text-gray-900">
                              ${trade.calculations?.riskAmount || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="text-sm text-blue-700 mb-1">Strategy</div>
                          <div className="text-lg font-semibold text-blue-900">
                            {trade.strategy || 'No strategy specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis & Notes Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Notes Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Trade Notes</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-none"
                            placeholder="Add any additional notes about the trade execution, market conditions, or lessons learned..."
                          />
                        </div>

                        {/* Trade Tags */}
                        {trade.tags && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Trade Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {trade.tags.split(',').map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Closing Chart Image */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Closing Chart</h3>
                      </div>

                      <div className="space-y-4">
                        {!formData.closingImage ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="mt-4">
                              <label htmlFor="closing-image-upload" className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  Upload closing chart image
                                </span>
                                <span className="mt-1 block text-sm text-gray-500">
                                  PNG, JPG, GIF up to 5MB
                                </span>
                              </label>
                              <input
                                id="closing-image-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleClosingImageUpload}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => document.getElementById('closing-image-upload').click()}
                              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              Choose Image
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={formData.closingImage}
                              alt="Closing chart"
                              className="w-full h-64 object-cover rounded-xl border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={removeClosingImage}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Upload a screenshot of your chart at the time of closing the trade for future reference and analysis.
                        </p>

                        {/* Show existing closing images if any */}
                        {trade.closingImages && trade.closingImages.length > 0 && !formData.closingImage && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Closing Images</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {trade.closingImages.map((image, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={image}
                                    alt={`Existing closing chart ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, closingImage: image }))}
                                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center"
                                  >
                                    <span className="text-white text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
                                      Use This Image
                                    </span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Original Trade Information */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Original Trade Analysis</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Original Analysis</h4>
                        <div className="text-sm text-gray-600">
                          {trade.analysis || 'No original analysis provided'}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Management Lessons</h4>
                        <div className="text-sm text-gray-600">
                          {trade.riskManagementLessons || 'No risk management lessons recorded'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Account:</span> {currentAccount?.name || 'Unknown Account'}
                {calculatedResults.actualPL !== 0 && (
                  <span className="ml-4">
                    <span className="font-medium">Balance Change:</span>
                    <span className={`ml-1 font-semibold ${
                      calculatedResults.actualPL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculatedResults.actualPL >= 0 ? '+' : ''}${calculatedResults.actualPL}
                    </span>
                  </span>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.actualEntry ||
                    (formData.exitType === 'price' && !formData.actualExit) ||
                    (formData.exitType === 'other' && !formData.manualPL)}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                      <span>Update Trade Status</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}



// Add Account Modal Component
function AddAccountModal({ onClose, onAccountAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    tag: 'personal'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const userId = user?.id || user?._id;

      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          name: formData.name,
          balance: parseFloat(formData.balance) || 0,
          tag: formData.tag
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        onAccountAdded(result.account);
      } else {
        alert('Failed to create account: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add New Account</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Main Trading Account"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance</label>
            <input
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="10000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <select
              value={formData.tag}
              onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="personal">Personal</option>
              <option value="funded">Funded</option>
              <option value="demo">Demo</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}