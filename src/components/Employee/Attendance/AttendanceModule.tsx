// components/Employee/Attendance/AttendanceModule.tsx
"use client";
import { useState, useEffect } from 'react';
import AttendanceCheckin from './AttendanceCheckin';
import AttendanceList from './AttendanceList';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceStats from './AttendanceStats';
import AttendanceQuickActions from './AttendanceQuickActions';

type TabType = 'dashboard' | 'checkin' | 'list' | 'calendar';

interface AttendanceModuleProps {
  initialTab?: TabType;
}

export default function AttendanceModule({ initialTab = 'dashboard' }: AttendanceModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2zm0 0V9a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { id: 'checkin', label: 'Check In/Out', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'list', label: 'My Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'checkin':
        return <AttendanceCheckin onSuccess={() => setActiveTab('list')} />;
      case 'list':
        return <AttendanceList />;
      case 'calendar':
        return <AttendanceCalendar />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-8">
            <AttendanceStats />
            <AttendanceQuickActions onActionClick={setActiveTab} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="lg:col-span-2">
                <AttendanceCalendar compact />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track your check-ins, check-outs, and attendance records</p>
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