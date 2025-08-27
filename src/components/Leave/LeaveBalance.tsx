// components/Employee/Leave/LeaveBalance.tsx
"use client";
import { useState, useEffect } from 'react';
import { ILeaveBalance } from '@/types/leave';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Calendar,
  Heart,
  Baby,
  User,
  FileText,
  Coins,
  PieChart,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function LeaveBalance() {
  const [balance, setBalance] = useState<ILeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const leaveTypes = [
    { 
      key: 'annualLeave', 
      label: 'Annual Leave', 
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      key: 'sickLeave', 
      label: 'Sick Leave', 
      icon: Heart,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    { 
      key: 'casualLeave', 
      label: 'Casual Leave', 
      icon: User,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      key: 'maternityLeave', 
      label: 'Maternity Leave', 
      icon: Baby,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    },
    { 
      key: 'paternityLeave', 
      label: 'Paternity Leave', 
      icon: User,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    { 
      key: 'unpaidLeave', 
      label: 'Unpaid Leave', 
      icon: Coins,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    },
  ];

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/leave/balance?year=${selectedYear}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch balance');
      }

      setBalance(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [selectedYear]);

  const getUsedValue = (key: string) => {
    const usedKey = `used${key.charAt(0).toUpperCase() + key.slice(1)}`;
    return balance?.[usedKey as keyof ILeaveBalance] as number || 0;
  };

  const getProgress = (total: number, used: number) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchBalance}
          className="mt-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Balance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overview of your available leave days
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaveTypes.map((type) => {
          const IconComponent = type.icon;
          const total = (balance?.[type.key as keyof ILeaveBalance] as number) || 0;
          const used = getUsedValue(type.key);
          const remaining = Math.max(0, total - used);
          const progress = getProgress(total, used);

          return (
            <div key={type.key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${type.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white ml-3">{type.label}</h3>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {selectedYear}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{total} days</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Used</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{used} days</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{remaining} days</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress > 80 ? 'bg-red-500' : progress > 60 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {progress.toFixed(1)}% used
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
            <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {leaveTypes.reduce((sum, type) => sum + ((balance?.[type.key as keyof ILeaveBalance] as number) || 0), 0)}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Entitled</div>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {leaveTypes.reduce((sum, type) => sum + getUsedValue(type.key), 0)}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Used</div>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {leaveTypes.reduce((sum, type) => {
                  const total = (balance?.[type.key as keyof ILeaveBalance] as number) || 0;
                  const used = getUsedValue(type.key);
                  return sum + Math.max(0, total - used);
                }, 0)}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}