// components/Employee/Attendance/AttendanceReports.tsx
"use client";
import { useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function AttendanceReports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [reportParams, setReportParams] = useState({
    startDate: '',
    endDate: '',
    includeBreakdown: true
  });

  const generateReport = async () => {
    if (!reportParams.startDate || !reportParams.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(reportParams.startDate) > new Date(reportParams.endDate)) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/attendance/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportParams)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate report');
      }

      setReportData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const downloadReport = () => {
    if (!reportData) return;

    const csvContent = generateCSVContent(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `attendance-report-${reportParams.startDate}-to-${reportParams.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVContent = (data: any) => {
    const headers = ['Date', 'Shift', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Breaks', 'Tasks'];
    let csv = headers.join(',') + '\n';

    if (data.attendanceRecords) {
      data.attendanceRecords.forEach((record: any) => {
        const row = [
          new Date(record.date).toLocaleDateString(),
          record.shift,
          record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '',
          record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '',
          formatDuration(record.totalWorkingHours),
          record.status,
          `${record.breaks.length + record.namazBreaks.length} breaks`,
          `${record.tasksPerformed.length} tasks`
        ];
        csv += row.join(',') + '\n';
      });
    }

    return csv;
  };

  const quickReportOptions = [
    {
      title: 'This Month',
      description: 'Generate report for current month',
      onClick: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setReportParams({
          ...reportParams,
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        });
      }
    },
    {
      title: 'Last Month',
      description: 'Generate report for previous month',
      onClick: () => {
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        setReportParams({
          ...reportParams,
          startDate: startOfLastMonth.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0]
        });
      }
    },
    {
      title: 'Last 30 Days',
      description: 'Generate report for last 30 days',
      onClick: () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        setReportParams({
          ...reportParams,
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        });
      }
    },
    {
      title: 'This Quarter',
      description: 'Generate report for current quarter',
      onClick: () => {
        const now = new Date();
        const quarter = Math.floor((now.getMonth() / 3));
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        
        setReportParams({
          ...reportParams,
          startDate: startOfQuarter.toISOString().split('T')[0],
          endDate: endOfQuarter.toISOString().split('T')[0]
        });
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Generate detailed attendance reports for any period</p>
      </div>

      {/* Quick Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickReportOptions.map((option, index) => (
          <button
            key={index}
            onClick={option.onClick}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 group"
          >
            <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {option.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {/* Custom Report Generator */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generate Custom Report</h2>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={reportParams.startDate}
              onChange={(e) => setReportParams(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={reportParams.endDate}
              onChange={(e) => setReportParams(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reportParams.includeBreakdown}
                onChange={(e) => setReportParams(prev => ({ ...prev, includeBreakdown: e.target.checked }))}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include detailed breakdown</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={generateReport}
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Generating...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Generate Report
              </div>
            )}
          </button>

          {reportData && (
            <button
              onClick={downloadReport}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Report Summary</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {reportParams.startDate} to {reportParams.endDate}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Days</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                    {(reportData as any).totalDays}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Present Days</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                    {(reportData as any).presentDays}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Working Hours</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                    {formatDuration((reportData as any).totalWorkingHours)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
                <div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Attendance %</p>
                  <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">
                    {(reportData as any).attendancePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Time Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Check-in:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(reportData as any).averageCheckInTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Check-out:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(reportData as any).averageCheckOutTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Break Time:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDuration((reportData as any).totalBreakTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overtime Hours:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDuration((reportData as any).totalOvertimeHours)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Attendance Issues</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Late Check-ins:</span>
                  <span className={`font-medium ${
                    (reportData as any).lateCheckIns > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {(reportData as any).lateCheckIns}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Early Check-outs:</span>
                  <span className={`font-medium ${
                    (reportData as any).earlyCheckOuts > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {(reportData as any).earlyCheckOuts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Absent Days:</span>
                  <span className={`font-medium ${
                    (reportData as any).absentDays > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {(reportData as any).absentDays}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}