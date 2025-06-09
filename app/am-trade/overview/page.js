'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import SidebarWrapper from '../../../components/SidebarWrapper';
import MobileHeader from '../../../components/MobileHeader';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AMTradeOverview() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    balance: '',
    tag: 'personal'
  });

  // Real AM Trade data
  const [amTrades, setAmTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);

  // Filter states
  const [timeFilter, setTimeFilter] = useState('all'); // all, 7d, 30d, 90d
  const [statusFilter, setStatusFilter] = useState('all'); // all, win, loss, pending
  const [pairFilter, setPairFilter] = useState('all'); // all, specific pairs
  const [strategyFilter, setStrategyFilter] = useState('all'); // all, specific strategies

  // Fetch AM Trades data
  const fetchAMTrades = async () => {
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      if (!token || !user?.id && !user?._id) return;

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
          setAmTrades(data.trades);
        }
      }
    } catch (error) {
      console.error('Error fetching AM trades:', error);
    }
  };

  // Filter trades based on current account and filters
  useEffect(() => {
    if (!currentAccountId || !amTrades.length) {
      setFilteredTrades([]);
      return;
    }

    let filtered = amTrades.filter(trade => {
      const tradeAccountId = String(trade.accountId || trade.account);
      return tradeAccountId === String(currentAccountId);
    });

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.dateTime || trade.createdAt);
        return tradeDate >= cutoffDate;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trade => {
        if (statusFilter === 'pending') return !trade.status || trade.status === 'pending';
        return trade.status === statusFilter;
      });
    }

    // Apply pair filter
    if (pairFilter !== 'all') {
      filtered = filtered.filter(trade => trade.tradingPair === pairFilter);
    }

    // Apply strategy filter
    if (strategyFilter !== 'all') {
      filtered = filtered.filter(trade => trade.strategy === strategyFilter);
    }

    setFilteredTrades(filtered);
  }, [amTrades, currentAccountId, timeFilter, statusFilter, pairFilter, strategyFilter]);

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
      fetchAMTrades();
    }
  }, [user]);

  // Fetch trades when account changes
  useEffect(() => {
    if (currentAccountId && user) {
      fetchAMTrades();
    }
  }, [currentAccountId]);



  // Calculate analytics from real data
  const analytics = useMemo(() => {
    if (!filteredTrades.length) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        avgWin: 0,
        avgLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        activePositions: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winStreak: 0,
        lossStreak: 0
      };
    }

    const completedTrades = filteredTrades.filter(trade => trade.status && trade.status !== 'pending');
    const winningTrades = completedTrades.filter(trade => trade.status === 'win');
    const losingTrades = completedTrades.filter(trade => trade.status === 'loss');
    const activeTrades = filteredTrades.filter(trade => !trade.status || trade.status === 'pending');

    const totalProfit = completedTrades.reduce((sum, trade) => sum + (trade.actualProfit || 0), 0);
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.actualProfit || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.actualProfit || 0), 0));

    const winRate = completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    const profits = completedTrades.map(trade => trade.actualProfit || 0);
    const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
    const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;

    // Calculate streaks
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    completedTrades.forEach(trade => {
      if (trade.status === 'win') {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (trade.status === 'loss') {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    return {
      totalTrades: filteredTrades.length,
      winRate: parseFloat(winRate.toFixed(1)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      bestTrade: parseFloat(bestTrade.toFixed(2)),
      worstTrade: parseFloat(worstTrade.toFixed(2)),
      activePositions: activeTrades.length,
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak
    };
  }, [filteredTrades]);

  // Helper function to get week start date (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekStart = getWeekStart(d);
    const weekNumber = Math.ceil(((weekStart - yearStart) / 86400000 + 1) / 7);
    return weekNumber;
  };

  // Calculate weekly results for the last 4 weeks
  const weeklyResults = useMemo(() => {
    if (!filteredTrades.length) {
      // Return empty weeks with 0 values when no data
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay() + 1);
        const weekNumber = getWeekNumber(weekStart);
        weeks.unshift({
          week: `Week ${weekNumber}`,
          trades: 0,
          winRate: 0,
          sumRR: 0,
          sumProfitPercent: 0
        });
      }
      return weeks;
    }

    const now = new Date();
    const weeks = [];

    // Generate last 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay() + 1); // Start of week (Monday)
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Sunday)
      weekEnd.setHours(23, 59, 59, 999);

      const weekNumber = getWeekNumber(weekStart);

      // Filter trades for this week
      const weekTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.dateTime || trade.createdAt);
        return tradeDate >= weekStart && tradeDate <= weekEnd;
      });

      const completedWeekTrades = weekTrades.filter(trade => trade.status && trade.status !== 'pending');
      const winningWeekTrades = completedWeekTrades.filter(trade => trade.status === 'win');

      const weekWinRate = completedWeekTrades.length > 0 ? (winningWeekTrades.length / completedWeekTrades.length) * 100 : 0;
      const weekProfit = completedWeekTrades.reduce((sum, trade) => sum + (trade.actualProfit || 0), 0);

      // Calculate Risk/Reward from planned RR or calculated RR
      const weekRR = completedWeekTrades.reduce((sum, trade) => {
        // Try to get RR from multiple possible sources
        const rr = trade.calculatedResults?.riskRewardRatio ||
                  parseFloat(trade.plannedRR) ||
                  trade.riskReward ||
                  0;
        return sum + rr;
      }, 0);

      // Calculate profit percentage based on account size
      const accountSize = weekTrades.length > 0 ? (weekTrades[0].accountSize || 10000) : 10000;
      const weekProfitPercent = accountSize > 0 ? (weekProfit / accountSize) * 100 : 0;

      weeks.unshift({
        week: `Week ${weekNumber}`,
        trades: weekTrades.length,
        winRate: parseFloat(weekWinRate.toFixed(1)),
        sumRR: parseFloat(weekRR.toFixed(1)),
        sumProfitPercent: parseFloat(weekProfitPercent.toFixed(2))
      });
    }

    return weeks;
  }, [filteredTrades]);

  // Calculate daily results for the last 5 weekdays
  const dailyResults = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const results = [];

    days.forEach(dayName => {
      // Use all AM trades (not just filtered) for daily analysis to get historical patterns
      const allDayTrades = amTrades.filter(trade => {
        // Filter by current account
        const tradeAccountId = String(trade.accountId || trade.account);
        if (tradeAccountId !== String(currentAccountId)) return false;

        // Filter by weekday
        const tradeDate = new Date(trade.dateTime || trade.createdAt);
        const tradeDayName = tradeDate.toLocaleDateString('en-US', { weekday: 'long' });
        return tradeDayName === dayName;
      });

      const completedDayTrades = allDayTrades.filter(trade => trade.status && trade.status !== 'pending');
      const winningDayTrades = completedDayTrades.filter(trade => trade.status === 'win');

      const dayWinRate = completedDayTrades.length > 0 ? (winningDayTrades.length / completedDayTrades.length) * 100 : 0;
      const dayProfit = completedDayTrades.reduce((sum, trade) => sum + (trade.actualProfit || 0), 0);

      // Calculate Risk/Reward from planned RR or calculated RR
      const dayRR = allDayTrades.reduce((sum, trade) => {
        // Try to get RR from multiple possible sources
        const rr = trade.calculatedResults?.riskRewardRatio ||
                  parseFloat(trade.plannedRR) ||
                  trade.riskReward ||
                  0;
        return sum + rr;
      }, 0);

      // Calculate profit percentage based on account size
      const accountSize = allDayTrades.length > 0 ? (allDayTrades[0].accountSize || 10000) : 10000;
      const dayProfitPercent = accountSize > 0 ? (dayProfit / accountSize) * 100 : 0;

      const dayResult = {
        weekday: dayName,
        trades: allDayTrades.length,
        winRate: parseFloat(dayWinRate.toFixed(1)),
        sumRR: parseFloat(dayRR.toFixed(1)),
        sumProfitPercent: parseFloat(dayProfitPercent.toFixed(2))
      };

      results.push(dayResult);
    });
    return results;
  }, [amTrades, currentAccountId]);

  // Get unique values for filters
  const uniquePairs = useMemo(() => {
    const pairs = [...new Set(amTrades.map(trade => trade.tradingPair).filter(Boolean))];
    return pairs.sort();
  }, [amTrades]);

  const uniqueStrategies = useMemo(() => {
    const strategies = [...new Set(amTrades.map(trade => trade.strategy).filter(Boolean))];
    return strategies.sort();
  }, [amTrades]);

  // Helper functions
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          isActive: accounts.length === 0 // Make first account active
        };

        setAccounts([...accounts, accountData]);

        // If this is the first account, make it current
        if (accounts.length === 0) {
          setCurrentAccountId(accountData.id);
          localStorage.setItem('currentAccountId', accountData.id);
        }

        setNewAccount({ name: '', balance: '', tag: 'personal' });
        setShowAddAccountModal(false);

        // Refresh accounts to ensure we have the latest data
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
            title="AM Trade Overview"
            subtitle="Your morning trading session dashboard"
            onMenuToggle={toggleMobileSidebar}
            rightContent={
              <>
                <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  AM Session Active
                </div>
                <button
                  onClick={() => router.push('/am-trade/add-am-trade')}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Add AM Trade</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </>
            }
          />

          {/* Filter Controls */}
          <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl sm:rounded-3xl border border-gray-200/60 p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Time Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base min-w-[140px]"
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="win">Wins</option>
                    <option value="loss">Losses</option>
                  </select>
                </div>

                {/* Pair Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trading Pair</label>
                  <select
                    value={pairFilter}
                    onChange={(e) => setPairFilter(e.target.value)}
                    className="px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base min-w-[140px]"
                  >
                    <option value="all">All Pairs</option>
                    {uniquePairs.map(pair => (
                      <option key={pair} value={pair}>{pair}</option>
                    ))}
                  </select>
                </div>

                {/* Strategy Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
                  <select
                    value={strategyFilter}
                    onChange={(e) => setStrategyFilter(e.target.value)}
                    className="px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base min-w-[140px]"
                  >
                    <option value="all">All Strategies</option>
                    {uniqueStrategies.map(strategy => (
                      <option key={strategy} value={strategy}>{strategy}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setTimeFilter('all');
                  setStatusFilter('all');
                  setPairFilter('all');
                  setStrategyFilter('all');
                }}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total AM Trades</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalTrades}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.activePositions} active
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Win Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.winRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Profit Factor: {analytics.profitFactor}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white via-purple-50/30 to-violet-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total P&L</p>
                  <p className={`text-3xl font-bold mt-1 ${
                    analytics.totalProfit > 0 ? 'text-green-600' :
                    analytics.totalProfit < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(analytics.totalProfit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Best: {formatCurrency(analytics.bestTrade)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl shadow-lg ${
                  analytics.totalProfit > 0
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-red-500 to-rose-600'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Win/Loss</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg font-bold text-green-600">{formatCurrency(analytics.avgWin)}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(analytics.avgLoss)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Win Streak: {analytics.winStreak}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* P&L Performance Chart */}
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">P&L Performance</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Cumulative P&L</span>
                </div>
              </div>
              <div className="h-80">
                {filteredTrades.length > 0 ? (
                  <Line
                    data={{
                      labels: filteredTrades
                        .filter(trade => trade.status && trade.status !== 'pending')
                        .sort((a, b) => new Date(a.dateTime || a.createdAt) - new Date(b.dateTime || b.createdAt))
                        .map((trade, index) => `Trade ${index + 1}`),
                      datasets: [
                        {
                          label: 'Cumulative P&L',
                          data: filteredTrades
                            .filter(trade => trade.status && trade.status !== 'pending')
                            .sort((a, b) => new Date(a.dateTime || a.createdAt) - new Date(b.dateTime || b.createdAt))
                            .reduce((acc, trade, index) => {
                              const cumulative = index === 0 ? (trade.actualProfit || 0) : acc[index - 1] + (trade.actualProfit || 0);
                              acc.push(cumulative);
                              return acc;
                            }, []),
                          borderColor: 'rgb(34, 197, 94)',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          borderWidth: 3,
                          fill: true,
                          tension: 0.4,
                          pointBackgroundColor: 'rgb(34, 197, 94)',
                          pointBorderColor: 'white',
                          pointBorderWidth: 2,
                          pointRadius: 5,
                          pointHoverRadius: 8
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: 'rgba(34, 197, 94, 0.5)',
                          borderWidth: 1,
                          cornerRadius: 8,
                          displayColors: false,
                          callbacks: {
                            label: function(context) {
                              return `P&L: ${formatCurrency(context.parsed.y)}`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: '#6B7280',
                            font: {
                              size: 12
                            }
                          }
                        },
                        y: {
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                          },
                          ticks: {
                            color: '#6B7280',
                            font: {
                              size: 12
                            },
                            callback: function(value) {
                              return formatCurrency(value);
                            }
                          }
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No trade data available</p>
                      <p className="text-gray-400 text-sm">Add some AM trades to see performance charts</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Win/Loss Distribution */}
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-purple-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Win/Loss Distribution</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Wins</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Losses</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                {filteredTrades.length > 0 ? (
                  <Doughnut
                    data={{
                      labels: ['Wins', 'Losses', 'Pending'],
                      datasets: [
                        {
                          data: [
                            filteredTrades.filter(trade => trade.status === 'win').length,
                            filteredTrades.filter(trade => trade.status === 'loss').length,
                            filteredTrades.filter(trade => !trade.status || trade.status === 'pending').length
                          ],
                          backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(156, 163, 175, 0.8)'
                          ],
                          borderColor: [
                            'rgb(34, 197, 94)',
                            'rgb(239, 68, 68)',
                            'rgb(156, 163, 175)'
                          ],
                          borderWidth: 3,
                          hoverBackgroundColor: [
                            'rgba(34, 197, 94, 0.9)',
                            'rgba(239, 68, 68, 0.9)',
                            'rgba(156, 163, 175, 0.9)'
                          ]
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                              size: 14,
                              weight: '500'
                            }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: 'rgba(156, 163, 175, 0.5)',
                          borderWidth: 1,
                          cornerRadius: 8,
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '60%'
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No trade data available</p>
                      <p className="text-gray-400 text-sm">Add some AM trades to see distribution</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent AM Trades */}
          <div className="bg-gradient-to-br from-white via-gray-50/50 to-indigo-50/30 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recent AM Trades</h3>
                <button
                  onClick={() => router.push('/am-trade/journal')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {filteredTrades.length > 0 ? (
                <div className="space-y-4">
                  {filteredTrades
                    .sort((a, b) => new Date(b.dateTime || b.createdAt) - new Date(a.dateTime || a.createdAt))
                    .slice(0, 5)
                    .map((trade) => (
                      <div
                        key={trade._id}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200/60 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            trade.status === 'win' ? 'bg-green-500' :
                            trade.status === 'loss' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}></div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">{trade.tradingPair}</span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                trade.direction === 'long'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {trade.direction?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-600">
                                {formatDate(trade.dateTime || trade.createdAt)}
                              </span>
                              {trade.strategy && (
                                <span className="text-sm text-gray-500">
                                  {trade.strategy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            trade.actualProfit > 0 ? 'text-green-600' :
                            trade.actualProfit < 0 ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {trade.actualProfit ? formatCurrency(trade.actualProfit) : 'Pending'}
                          </div>
                          {trade.status && (
                            <div className={`text-xs font-medium mt-1 ${
                              trade.status === 'win' ? 'text-green-600' :
                              trade.status === 'loss' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {filteredTrades.length > 5 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => router.push('/am-trade/journal')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View {filteredTrades.length - 5} more trades →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500 mb-2 font-medium">No AM trades found</p>
                  <p className="text-sm text-gray-400 mb-6">Start your morning trading session to see analytics</p>
                  <button
                    onClick={() => router.push('/am-trade/add-am-trade')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Add Your First AM Trade
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trading Week Results & Trading Day Results */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Trading Week Results */}
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-purple-50/30 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-6 border-b border-gray-200/60">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Trading Week Results
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                {/* Week Results Header */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-4 pb-3 border-b border-gray-200/60">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Week</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Trades</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Win Rate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Sum RR</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Sum Profit %</span>
                  </div>
                </div>

                {/* Week Results Data */}
                <div className="space-y-3">
                  {weeklyResults.map((week, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 p-3 bg-white rounded-xl border border-gray-200/60 hover:shadow-md transition-all duration-200">
                      <div className="font-medium text-gray-900">{week.week}</div>
                      <div className="font-semibold text-gray-700">{week.trades}</div>
                      <div className={`font-semibold ${
                        week.winRate > 50 ? 'text-green-600' :
                        week.winRate > 0 ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {week.winRate}%
                      </div>
                      <div className={`font-semibold ${
                        week.sumRR > 0 ? 'text-green-600' :
                        week.sumRR < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {week.sumRR}
                      </div>
                      <div className={`font-semibold ${
                        week.sumProfitPercent > 0 ? 'text-green-600' :
                        week.sumProfitPercent < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {week.sumProfitPercent > 0 ? '+' : ''}{week.sumProfitPercent}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trading Day Results */}
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-orange-50/30 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-6 border-b border-gray-200/60">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Trading Day Results
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                {/* Day Results Header */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-4 pb-3 border-b border-gray-200/60">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Weekday</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Trades</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Win Rate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Sum RR</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Sum Profit %</span>
                  </div>
                </div>

                {/* Day Results Data */}
                <div className="space-y-3">
                  {dailyResults.map((day, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 p-3 bg-white rounded-xl border border-gray-200/60 hover:shadow-md transition-all duration-200">
                      <div className="font-medium text-gray-900">{day.weekday}</div>
                      <div className="font-semibold text-gray-700">{day.trades}</div>
                      <div className={`font-semibold ${
                        day.winRate > 50 ? 'text-green-600' :
                        day.winRate > 0 ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {day.winRate}%
                      </div>
                      <div className={`font-semibold ${
                        day.sumRR > 0 ? 'text-green-600' :
                        day.sumRR < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {day.sumRR}
                      </div>
                      <div className={`font-semibold ${
                        day.sumProfitPercent > 0 ? 'text-green-600' :
                        day.sumProfitPercent < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {day.sumProfitPercent > 0 ? '+' : ''}{day.sumProfitPercent}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Row */}
                <div className="mt-6 pt-4 border-t border-gray-200/60">
                  <div className="grid grid-cols-5 gap-4 p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border border-gray-200/60">
                    <div className="font-bold text-gray-900">SUM</div>
                    <div className="font-bold text-gray-900">
                      {dailyResults.reduce((sum, day) => sum + day.trades, 0)}
                    </div>
                    <div className="font-bold text-gray-900">
                      {dailyResults.length > 0 ?
                        (dailyResults.reduce((sum, day) => sum + (day.winRate * day.trades), 0) /
                         Math.max(dailyResults.reduce((sum, day) => sum + day.trades, 0), 1)).toFixed(1) : '0.0'}%
                    </div>
                    <div className={`font-bold ${
                      dailyResults.reduce((sum, day) => sum + day.sumRR, 0) > 0 ? 'text-green-600' :
                      dailyResults.reduce((sum, day) => sum + day.sumRR, 0) < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {dailyResults.reduce((sum, day) => sum + day.sumRR, 0).toFixed(1)}
                    </div>
                    <div className={`font-bold ${
                      dailyResults.reduce((sum, day) => sum + day.sumProfitPercent, 0) > 0 ? 'text-green-600' :
                      dailyResults.reduce((sum, day) => sum + day.sumProfitPercent, 0) < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {dailyResults.reduce((sum, day) => sum + day.sumProfitPercent, 0) > 0 ? '+' : ''}
                      {dailyResults.reduce((sum, day) => sum + day.sumProfitPercent, 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detailed Performance Metrics */}
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-green-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                AM Session Performance
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200/60">
                  <span className="text-sm font-medium text-gray-600">Average Win</span>
                  <span className="font-bold text-green-600">{formatCurrency(analytics.avgWin)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200/60">
                  <span className="text-sm font-medium text-gray-600">Average Loss</span>
                  <span className="font-bold text-red-600">{formatCurrency(analytics.avgLoss)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200/60">
                  <span className="text-sm font-medium text-gray-600">Best Trade</span>
                  <span className="font-bold text-green-600">{formatCurrency(analytics.bestTrade)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200/60">
                  <span className="text-sm font-medium text-gray-600">Worst Trade</span>
                  <span className="font-bold text-red-600">{formatCurrency(analytics.worstTrade)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200/60">
                  <span className="text-sm font-medium text-gray-600">Profit Factor</span>
                  <span className={`font-bold ${analytics.profitFactor > 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200/60">
                  <span className="text-sm font-medium text-gray-600">Win Streak</span>
                  <span className="font-bold text-blue-600">{analytics.winStreak}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Trading Pairs */}
            <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 p-6 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h3>
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => router.push('/am-trade/add-am-trade')}
                  className="w-full flex items-center space-x-3 p-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-200 border border-blue-200/60 hover:border-blue-300/60"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-blue-700">Add New AM Trade</span>
                </button>
                <button
                  onClick={() => router.push('/am-trade/journal')}
                  className="w-full flex items-center space-x-3 p-4 text-left bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 rounded-xl transition-all duration-200 border border-gray-200/60 hover:border-gray-300/60"
                >
                  <div className="p-2 bg-gradient-to-r from-gray-600 to-slate-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700">View AM Journal</span>
                </button>
              </div>

              {/* Top Trading Pairs */}
              {uniquePairs.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Trading Pairs</h4>
                  <div className="space-y-2">
                    {uniquePairs.slice(0, 5).map(pair => {
                      const pairTrades = filteredTrades.filter(trade => trade.tradingPair === pair);
                      const pairProfit = pairTrades.reduce((sum, trade) => sum + (trade.actualProfit || 0), 0);
                      const pairWinRate = pairTrades.filter(trade => trade.status === 'win').length / pairTrades.length * 100;

                      return (
                        <div key={pair} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200/60">
                          <div>
                            <span className="font-medium text-gray-900">{pair}</span>
                            <div className="text-xs text-gray-500">
                              {pairTrades.length} trades • {pairWinRate.toFixed(0)}% win rate
                            </div>
                          </div>
                          <span className={`font-bold text-sm ${
                            pairProfit > 0 ? 'text-green-600' :
                            pairProfit < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {formatCurrency(pairProfit)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
      )}
    </SidebarWrapper>
  );
}
