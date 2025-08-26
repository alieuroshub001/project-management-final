// components/Employee/Attendance/AttendanceModule.tsx
"use client";
import { useState, useEffect } from 'react';
import AttendanceDashboard from './AttendanceDashboard';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceRecords from './AttendanceRecords';
import AttendanceTasks from './AttendanceTasks';
import AttendanceReports from './AttendanceReports';
import AttendanceSession from './AttendanceSession';

type TabType = 'dashboard' | 'session' | 'calendar' | 'records' | 'tasks' | 'reports';

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
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10' 
    },
    { 
      id: 'session', 
      label: 'Active Session', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      id: 'calendar', 
      label: 'Calendar', 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z' 
    },
    { 
      id: 'records', 
      label: 'Records', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12l2 2 4-4' 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' 
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AttendanceDashboard onNavigate={setActiveTab} />;
      case 'session':
        return <AttendanceSession />;
      case 'calendar':
        return <AttendanceCalendar />;
      case 'records':
        return <AttendanceRecords />;
      case 'tasks':
        return <AttendanceTasks />;
      case 'reports':
        return <AttendanceReports />;
      default:
        return <AttendanceDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track your attendance, manage tasks, and monitor productivity</p>
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