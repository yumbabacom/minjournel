'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Journal() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchTrades(parsedUser.id);
  }, []);

  useEffect(() => {
    filterAndSortTrades();
  }, [trades, filter, searchTerm, sortBy]);

  const fetchTrades = async (userId) => {
    try {
      const response = await fetch(`/api/trades?userId=${userId}`);
      const data = await response.json();
      if (data.trades) {
        setTrades(data.trades);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
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
        trade.tradingPair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.tags.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.analysis.toLowerCase().includes(searchTerm.toLowerCase())
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

  const deleteTrade = async (tradeId) => {
    if (!confirm('Are you sure you want to delete this trade?')) return;

    try {
      const response = await fetch(`/api/trades?tradeId=${tradeId}&userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrades(trades.filter(trade => trade._id !== tradeId));
        alert('Trade deleted successfully!');
      } else {
        alert('Failed to delete trade');
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Failed to delete trade');
    }
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
    const total = trades.length;
    const planning = trades.filter(t => t.status === 'planning').length;
    const open = trades.filter(t => t.status === 'open').length;
    const closed = trades.filter(t => t.status === 'closed').length;
    
    const totalRisk = trades.reduce((sum, trade) => sum + (trade.calculations?.riskAmount || 0), 0);
    const totalPotentialProfit = trades.reduce((sum, trade) => sum + (trade.calculations?.potentialProfit || 0), 0);
    
    return { total, planning, open, closed, totalRisk, totalPotentialProfit };
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trading Journal</h1>
                <p className="text-gray-600">Track and analyze your trading performance</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/add-trade')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Trade</span>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm font-medium"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Trades</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Planning</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.planning}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Open</h3>
              <p className="text-2xl font-bold text-green-600">{stats.open}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Closed</h3>
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Risk</h3>
              <p className="text-2xl font-bold text-red-600">${stats.totalRisk.toFixed(0)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Potential Profit</h3>
              <p className="text-2xl font-bold text-purple-600">${stats.totalPotentialProfit.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search trades..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="profit">Highest Profit</option>
                <option value="risk">Highest Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trades Grid */}
        {filteredTrades.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-600 mb-6">Start building your trading journal by adding your first trade.</p>
            <button
              onClick={() => router.push('/add-trade')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-medium"
            >
              Add Your First Trade
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrades.map((trade) => (
              <div key={trade._id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                
                {/* Trade Header */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${trade.direction === 'LONG' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <h3 className="text-xl font-bold text-gray-900">{trade.tradingPair}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trade.status)}`}>
                      {trade.status === 'planning' ? '📋' : trade.status === 'open' ? '📈' : '✅'} {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Direction</p>
                      <p className={`font-bold ${getDirectionColor(trade.direction)}`}>
                        {trade.direction === 'LONG' ? '↗️' : '↘️'} {trade.direction}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Entry Price</p>
                      <p className="font-bold text-gray-900">{parseFloat(trade.entryPrice).toFixed(5)}</p>
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/trade/${trade._id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => deleteTrade(trade._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 