// components/Employee/Leave/LeaveStats.tsx

"use client";
import { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar 
} from 'lucide-react';

interface LeaveStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  upcomingLeaves: number;
}

export default function LeaveStats() {
  const [stats, setStats] = useState<LeaveStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    upcomingLeaves: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/leave/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leave stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statItems = [
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Pending',
      value: stats.pendingApplications,
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Approved',
      value: stats.approvedApplications,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Upcoming',
      value: stats.upcomingLeaves,
      icon: Calendar,
      color: 'bg-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="ml-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${item.color} bg-opacity-10 dark:bg-opacity-20`}>
                <IconComponent className={`w-6 h-6 ${item.textColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}