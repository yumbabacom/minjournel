'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar({
  user,
  currentAccountId,
  accounts = [],
  onAccountSwitch,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onLogout,
  onUpdateUser
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingBalance, setEditingBalance] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAMTradeMode, setIsAMTradeMode] = useState(false);
  const [userSettings, setUserSettings] = useState({
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: user?.avatar || null,
    notifications: {
      email: true,
      push: true,
      trades: true,
      reports: false
    },
    preferences: {
      theme: 'light',
      currency: 'USD',
      timezone: 'UTC',
      language: 'en'
    }
  });

  // Prevent hydration mismatch by only rendering client-specific content after mount
  useEffect(() => {
    setMounted(true);
    // Only enable AM Trade mode if currently on an AM Trade page, not from localStorage
    const isOnAMTradePage = pathname?.startsWith('/am-trade');

    if (isOnAMTradePage) {
      setIsAMTradeMode(true);
      localStorage.setItem('isAMTradeMode', 'true');
    } else {
      // If not on AM Trade page, ensure AM Trade mode is disabled
      setIsAMTradeMode(false);
      localStorage.setItem('isAMTradeMode', 'false');
    }
  }, [pathname]);

  // Update userSettings when user prop changes
  useEffect(() => {
    if (user) {
      setUserSettings(prev => ({
        ...prev,
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        avatar: user.avatar || null
      }));
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowUserDropdown(false);
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get current active account
  const currentAccount = accounts.find(acc =>
    (acc.id === currentAccountId) || (acc._id === currentAccountId)
  ) || accounts[0] || {
    id: null,
    name: 'No Account',
    balance: 0,
    tag: 'personal',
    color: 'bg-gray-600',
    isActive: false
  };

  // Ensure current account has color property
  if (currentAccount && !currentAccount.color) {
    currentAccount.color = getTagColor(currentAccount.tag);
  }

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

  const handleSwitchAccount = (accountId) => {
    if (!accountId) return;
    onAccountSwitch?.(accountId);
    setShowAccountDropdown(false);
  };

  const handleEditBalance = (accountId) => {
    const account = accounts.find(acc => (acc.id === accountId) || (acc._id === accountId));
    setEditingAccountId(accountId);
    setEditingBalance(account?.balance?.toString() || '');
  };

  const handleSaveBalance = (accountId) => {
    onEditAccount?.(accountId, { balance: parseFloat(editingBalance) || 0 });
    setEditingAccountId(null);
    setEditingBalance('');
  };

  const handleAMTradeToggle = () => {
    const newMode = !isAMTradeMode;
    setIsAMTradeMode(newMode);
    localStorage.setItem('isAMTradeMode', newMode.toString());

    // Navigate to appropriate page
    if (newMode) {
      router.push('/am-trade');
    } else {
      router.push('/dashboard');
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserSettings(prev => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenSettings = () => {
    // Reset form with current user data when opening
    setUserSettings(prev => ({
      ...prev,
      fullName: user?.fullName || user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      avatar: user?.avatar || null
    }));
    setShowSettingsModal(true);
    setShowUserDropdown(false);
  };

  const handleSaveSettings = async () => {
    try {
      // Get token from cookies or localStorage with better error handling
      let token = null;

      // Try to get from cookies first
      try {
        const cookies = document.cookie.split('; ');
        const authCookie = cookies.find(row => row.startsWith('auth-token='));
        if (authCookie) {
          token = authCookie.split('=')[1];
        }
      } catch (cookieError) {
        console.log('Error reading cookies:', cookieError);
      }

      // Fallback to localStorage
      if (!token) {
        try {
          token = localStorage.getItem('auth-token');
        } catch (storageError) {
          console.log('Error reading localStorage:', storageError);
        }
      }

      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      console.log('Using token for profile update:', token ? 'Token found' : 'No token');

      // Prepare data to send
      const updateData = {
        fullName: userSettings.fullName,
        email: userSettings.email,
        currentPassword: userSettings.currentPassword,
        newPassword: userSettings.newPassword,
        confirmPassword: userSettings.confirmPassword
      };

      // Make API call
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Profile updated successfully!');
        setShowSettingsModal(false);

        // Update user data in parent component if callback provided
        if (typeof onUpdateUser === 'function') {
          onUpdateUser(data.user);
        }

        // Refresh page to update user data in UI
        window.location.reload();
      } else {
        console.error('Profile update failed:', data);
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('An error occurred while saving settings. Please try again.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // AM Trade menu items (removed Balance - it's shown in sidebar account section)
  const amTradeMenuItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
        </svg>
      )
    },
    {
      id: 'add-am-trade',
      name: 'Add AM Trade',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      highlight: true
    },
    {
      id: 'journal',
      name: 'Journal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  // Regular menu items
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
      id: 'journal',
      name: 'Journal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
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
      id: 'forex-news',
      name: 'Forex News',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
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

  const handleNavigation = (itemId) => {
    if (isAMTradeMode) {
      // AM Trade mode navigation
      if (itemId === 'overview') {
        router.push('/am-trade/overview');
      } else if (itemId === 'add-am-trade') {
        router.push('/am-trade/add-am-trade');
      } else if (itemId === 'journal') {
        router.push('/am-trade/journal');
      } else {
        router.push('/am-trade');
      }
    } else {
      // Regular mode navigation
      if (itemId === 'add-trade') {
        router.push('/add-trade');
      } else if (itemId === 'dashboard') {
        router.push('/dashboard');
      } else if (itemId === 'journal') {
        router.push('/journal');
      } else {
        router.push(`/dashboard?section=${itemId}`);
      }
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-50 via-white to-gray-50/50 border-r border-gray-200/60 flex flex-col fixed left-0 top-0 h-screen shadow-xl backdrop-blur-sm">
      {/* Compact User Profile */}
      <div className="p-4 border-b border-gray-200/60">
        <div className="relative dropdown-container">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/80 transition-all duration-200 group shadow-sm hover:shadow-md border border-transparent hover:border-gray-200/60"
          >
            <div className="relative">
              {userSettings.avatar ? (
                <img
                  src={userSettings.avatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-xl object-cover border-2 border-gray-200/60 group-hover:border-blue-300/60 transition-all duration-200 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center border-2 border-gray-200/60 group-hover:border-blue-300/60 transition-all duration-200 shadow-lg">
                  <span className="text-white font-bold text-sm tracking-wide">
                    {getInitials(user?.fullName || user?.name)}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-green-400 to-green-500 border-2 border-white rounded-full shadow-sm">
                <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {user?.fullName || user?.name || 'User'}
              </p>
              <div className="flex items-center mt-1">
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200/60">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <svg
                className={`w-4 h-4 text-gray-400 transition-all duration-200 ${showUserDropdown ? 'rotate-180 text-blue-500' : 'group-hover:text-gray-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Minimal User Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute top-full left-0 mt-3 w-full bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3">
                {/* Profile Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100/60 mb-3">
                  <p className="font-bold text-gray-900 text-sm tracking-tight">{user?.fullName || user?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  <button
                    onClick={handleOpenSettings}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 text-sm font-medium group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>Account Settings</span>
                  </button>

                  <div className="border-t border-gray-200/60 my-3"></div>

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-xl transition-all duration-200 text-sm font-medium group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all duration-200">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Account Balance Card */}
        <div className="mt-4 relative dropdown-container">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAccountDropdown(!showAccountDropdown);
            }}
            className="w-full p-4 bg-gradient-to-br from-white via-gray-50/50 to-slate-50/30 border border-gray-200/60 rounded-xl hover:border-gray-300/60 hover:shadow-md transition-all duration-200 group backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="text-left flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${currentAccount.color} shadow-sm`}></div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                    currentAccount.tag === 'funded' ? 'bg-green-100 text-green-700 border-green-200' :
                    currentAccount.tag === 'demo' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    currentAccount.tag === 'forex' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    currentAccount.tag === 'crypto' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                    'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {getTagDisplayName(currentAccount.tag)}
                  </span>
                </div>
                <p className="font-bold text-gray-900 text-lg tracking-tight mb-1">${Number(currentAccount.balance || 0).toLocaleString()}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600 truncate font-medium">{currentAccount.name}</p>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-all duration-200 ${showAccountDropdown ? 'rotate-180 text-blue-500' : 'group-hover:text-gray-600'}`}
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

          {/* Minimal Account Dropdown */}
          {showAccountDropdown && (
            <div
              className="absolute top-full left-0 mt-3 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                {/* Add New Account Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onAddAccount === 'function') {
                      onAddAccount();
                      setShowAccountDropdown(false);
                    }
                  }}
                  className="w-full flex items-center space-x-4 p-4 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-300 border border-blue-200/60 bg-gradient-to-r from-blue-25 to-indigo-25 hover:border-blue-300/60 group shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 shadow-sm">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-blue-700 text-sm">Add New Account</span>
                    <p className="text-xs text-blue-500 mt-0.5">Create a new trading account</p>
                  </div>
                </button>

                <div className="border-t border-gray-200 my-3"></div>

                {/* Existing Accounts */}
                <div className="space-y-2">
                  {accounts.map((account, index) => {
                    const accountId = account.id || account._id;
                    const isCurrentAccount = String(accountId) === String(currentAccountId);

                    if (!account.color) {
                      account.color = getTagColor(account.tag);
                    }

                    return (
                      <div
                        key={accountId}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 border ${
                          isCurrentAccount
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'hover:bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSwitchAccount(accountId);
                        }}
                      >
                        <div className="flex items-center space-x-3 flex-1 cursor-pointer">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${account.color} shadow-sm`}></div>
                            {isCurrentAccount && (
                              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {account.name}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {editingAccountId === accountId ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    value={editingBalance}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setEditingBalance(e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter balance"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleSaveBalance(accountId);
                                    }}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditBalance(accountId);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit Balance"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {accounts.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof onDeleteAccount === 'function') {
                                  onDeleteAccount(accountId);
                                }
                              }}
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
                    );
                  })}
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

        {/* Compact AM Trade Toggle */}
        <div className="mt-4 p-3 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl border border-orange-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-0.5">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"></div>
                <p className="text-sm font-semibold text-gray-900">AM Trade Mode</p>
              </div>
              <p className="text-xs text-gray-600">Morning trading interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAMTradeMode}
                onChange={handleAMTradeToggle}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-3 peer-focus:ring-orange-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-amber-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Compact Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {(isAMTradeMode ? amTradeMenuItems : menuItems).map((item) => {
            // Calculate active state only after component is mounted
            const isActive = mounted && (
              isAMTradeMode ? (
                pathname === `/am-trade/${item.id}` ||
                (pathname === '/am-trade' && item.id === 'overview') ||
                (pathname === '/am-trade/add-am-trade' && item.id === 'add-am-trade') ||
                (pathname === '/am-trade/journal' && item.id === 'journal')
              ) : (
                pathname === `/${item.id}` ||
                (pathname === '/add-trade' && item.id === 'add-trade') ||
                (pathname === '/journal' && item.id === 'journal')
              )
            );

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : item.highlight
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 border border-green-200/60'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.highlight
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  {item.icon}
                </div>
                <span className="flex-1 text-left">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Compact Footer */}
      <div className="p-4 border-t border-gray-200/60">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-medium transition-all duration-200 group"
        >
          <div className="w-7 h-7 bg-gray-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-all duration-200">
            <svg className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>

      {/* Settings Modal - Portal to body */}
      {showSettingsModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden relative z-[10000]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                  <p className="text-sm text-gray-600">Update your account information</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Form Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={userSettings.fullName}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={userSettings.currentPassword}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={userSettings.newPassword}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={userSettings.confirmPassword}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-6 mt-8 border-t border-gray-200 space-x-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}