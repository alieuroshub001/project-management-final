// components/Employee/Leave/LeaveModule.tsx (Updated with initialTab prop)
"use client";
import { useState, useEffect } from 'react';
import LeaveApplication from './LeaveApplication';
import LeaveList from './LeaveList';
import LeaveBalance from './LeaveBalance';
import LeaveCalendar from './LeaveCalendar';
import LeaveStats from './LeaveStats';
import LeaveQuickActions from './LeaveQuickActions';

type TabType = 'apply' | 'list' | 'balance' | 'calendar';

interface LeaveModuleProps {
  initialTab?: TabType;
}

export default function LeaveModule({ initialTab = 'balance' }: LeaveModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { id: 'balance', label: 'Leave Balance', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'apply', label: 'Apply Leave', icon: 'M12 4v16m8-8H4' },
    { id: 'list', label: 'My Leaves', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
  ];

  // Handler function to convert string to TabType
  const handleActionClick = (action: string) => {
    if (action === 'apply' || action === 'list' || action === 'balance' || action === 'calendar') {
      setActiveTab(action as TabType);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'apply':
        return <LeaveApplication onSuccess={() => setActiveTab('list')} />;
      case 'list':
        return <LeaveList />;
      case 'balance':
        return (
          <div className="space-y-8">
            <LeaveStats />
            <LeaveQuickActions onActionClick={handleActionClick} />
            <LeaveBalance />
          </div>
        );
      case 'calendar':
        return <LeaveCalendar />;
      default:
        return (
          <div className="space-y-8">
            <LeaveStats />
            <LeaveQuickActions onActionClick={handleActionClick} />
            <LeaveBalance />
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your leave applications and balance</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}