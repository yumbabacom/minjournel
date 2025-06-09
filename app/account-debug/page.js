'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';

export default function AccountDebug() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [newAccount, setNewAccount] = useState({
    name: 'Test Account',
    balance: '10000',
    tag: 'personal'
  });

  // Load user data on mount
  useEffect(() => {
    const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user');
    
    setAuthToken(token || 'No token found');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    setLoading(false);
  }, []);

  // Function to fetch accounts
  const fetchAccounts = async () => {
    if (!user?.id && !user?._id) {
      setApiResponse('No user ID found');
      return;
    }
    
    const userId = user?.id || user?._id;
    setApiResponse('Fetching accounts...');
    
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/accounts?userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      setApiResponse('Error: ' + error.message);
    }
  };

  // Function to create a new account
  const createAccount = async () => {
    if (!user?.id && !user?._id) {
      setApiResponse('No user ID found');
      return;
    }
    
    const userId = user?.id || user?._id;
    setApiResponse('Creating account...');
    
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      
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
      
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        // Refresh accounts list
        fetchAccounts();
      }
    } catch (error) {
      setApiResponse('Error: ' + error.message);
    }
  };

  // Function to delete an account
  const deleteAccount = async (accountId) => {
    if (!user?.id && !user?._id) {
      setApiResponse('No user ID found');
      return;
    }
    
    const userId = user?.id || user?._id;
    setApiResponse(`Deleting account ${accountId}...`);
    
    try {
      const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/accounts?accountId=${accountId}&userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        // Refresh accounts list
        fetchAccounts();
      }
    } catch (error) {
      setApiResponse('Error: ' + error.message);
    }
  };

  // Test health check
  const testHealthCheck = async () => {
    setApiResponse('Testing health check...');
    
    try {
      const response = await fetch('/api/accounts?health=true');
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResponse('Error: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-4">Account Debugging Tool</h1>
        <p className="text-gray-600">Use this page to test account operations</p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Authentication Info</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">User ID:</span> {user?.id || user?._id || 'Not found'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user?.email || 'Not found'}
                </div>
                <div>
                  <span className="font-medium">Auth Token:</span>
                  <div className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {authToken ? (authToken.length > 20 ? `${authToken.substring(0, 20)}...` : authToken) : 'Not found'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Test Operations</h2>
              <div className="space-y-4">
                <button
                  onClick={testHealthCheck}
                  className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Test Health Check
                </button>
                <button
                  onClick={fetchAccounts}
                  className="w-full py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  Fetch Accounts
                </button>
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Create New Account</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      placeholder="Balance"
                      value={newAccount.balance}
                      onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <select
                    value={newAccount.tag}
                    onChange={(e) => setNewAccount({ ...newAccount, tag: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="personal">Personal</option>
                    <option value="funded">Funded</option>
                    <option value="demo">Demo</option>
                    <option value="forex">Forex</option>
                    <option value="crypto">Crypto</option>
                  </select>
                  <button
                    onClick={createAccount}
                    className="w-full py-2 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">API Response</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto">
                {apiResponse || 'No response yet'}
              </pre>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Accounts List</h2>
              {accounts.length === 0 ? (
                <p className="text-gray-500">No accounts found</p>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div key={account._id} className="p-3 border border-gray-200 rounded flex justify-between items-center">
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-gray-600">${parseFloat(account.balance).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{account.tag} • ID: {account._id}</div>
                      </div>
                      <button
                        onClick={() => deleteAccount(account._id)}
                        className="py-1 px-3 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 