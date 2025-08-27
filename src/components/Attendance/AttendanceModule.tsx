// components/Employee/Attendance/AttendanceModule.tsx
"use client";
import { useState, useEffect } from 'react';
import AttendanceDashboard from './AttendanceDashboard';
import AttendanceHistory from './AttendanceHistory';
import AttendanceReports from './AttendanceReports';
import AttendanceCheckInOut from './AttendanceCheckInOut';
import AttendanceStats from './AttendanceStats';
import AttendanceQuickActions from './AttendanceQuickActions';

type TabType = 'dashboard' | 'checkin' | 'history' | 'reports';

interface AttendanceModuleProps {
  initialTab?: TabType;
}

export default function AttendanceModule({ initialTab = 'dashboard' }: AttendanceModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1h-6z' 
    },
    { 
      id: 'checkin', 
      label: 'Check In/Out', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' 
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'checkin':
        return <AttendanceCheckInOut onSuccess={() => setActiveTab('dashboard')} />;
      case 'history':
        return <AttendanceHistory />;
      case 'reports':
        return <AttendanceReports />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-8">
            <AttendanceStats />
            <AttendanceQuickActions onActionClick={setActiveTab} />
            <AttendanceDashboard />
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track your daily attendance and working hours</p>
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