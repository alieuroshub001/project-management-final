// components/Employee/Leave/LeaveQuickActions.tsx
"use client";

import { 
  FileText, 
  PieChart, 
  Calendar, 
  History,
  PlusCircle,
  ArrowRight
} from 'lucide-react';

interface LeaveQuickActionsProps {
  onActionClick: (action: string) => void;
}

export default function LeaveQuickActions({ onActionClick }: LeaveQuickActionsProps) {
  const quickActions = [
    {
      title: 'Apply for Leave',
      description: 'Submit a new leave application',
      icon: PlusCircle,
      action: 'apply',
      color: 'indigo'
    },
    {
      title: 'Check Balance',
      description: 'View your current leave balance',
      icon: PieChart,
      action: 'balance',
      color: 'green'
    },
    {
      title: 'View Calendar',
      description: 'See your leaves on calendar',
      icon: Calendar,
      action: 'calendar',
      color: 'blue'
    },
    {
      title: 'Leave History',
      description: 'View all your leave applications',
      icon: History,
      action: 'list',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-800',
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700',
        icon: 'text-indigo-600 dark:text-indigo-400',
        arrow: 'text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        arrow: 'text-green-600 dark:text-green-400 group-hover:translate-x-1'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        arrow: 'text-blue-600 dark:text-blue-400 group-hover:translate-x-1'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
        arrow: 'text-purple-600 dark:text-purple-400 group-hover:translate-x-1'
      }
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickActions.map((action, index) => {
        const IconComponent = action.icon;
        const colorClasses = getColorClasses(action.color);
        
        return (
          <button
            key={index}
            onClick={() => onActionClick(action.action)}
            className={`group p-6 border rounded-xl transition-all duration-200 text-left ${colorClasses.bg} ${colorClasses.border} ${colorClasses.hover} hover:shadow-md transform hover:-translate-y-1`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClasses.bg} bg-opacity-50 dark:bg-opacity-30`}>
                  <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                </div>
                <ArrowRight className={`w-4 h-4 ${colorClasses.arrow} transition-transform duration-200`} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {action.description}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  Quick Access
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}