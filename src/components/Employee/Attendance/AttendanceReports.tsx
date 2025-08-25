// components/Employee/Attendance/AttendanceReports.tsx
"use client";
import { useState, useEffect } from 'react';
import { IAttendanceSummary } from '@/types/employee/attendance';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function AttendanceReports() {
  const [summary, setSummary] = useState<IAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/employee/attendance/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [dateRange]);

  const getStatusData = () => {
    if (!summary) return [];
    return [
      { name: 'Present', value: summary.presentDays },
      { name: 'Absent', value: summary.absentDays },
      { name: 'Late', value: summary.lateDays },
      { name: 'Early Departure', value: summary.earlyDepartureDays },
      { name: 'On Break', value: summary.onBreakDays }
    ].filter(item => item.value > 0);
  };

  const getWeeklyData = () => {
    if (!summary?.weeklyBreakdown) return [];
    return Object.entries(summary.weeklyBreakdown).map(([week, data]) => ({
      week: `Week ${week}`,
      present: data.present,
      absent: data.absent,
      late: data.late
    }));
  };

  const exportReport = () => {
    if (!summary) return;

    const reportData = [
      ['Attendance Report', '', ''],
      ['Period', `${dateRange.startDate} to ${dateRange.endDate}`, ''],
      ['', '', ''],
      ['Metric', 'Value', 'Percentage'],
      ['Total Days', summary.totalDays, '100%'],
      ['Present Days', summary.presentDays, `${summary.attendanceRate}%`],
      ['Absent Days', summary.absentDays, `${((summary.absentDays / summary.totalDays) * 100).toFixed(1)}%`],
      ['Late Days', summary.lateDays, `${((summary.lateDays / summary.totalDays) * 100).toFixed(1)}%`],
      ['Early Departures', summary.earlyDepartureDays, `${((summary.earlyDepartureDays / summary.totalDays) * 100).toFixed(1)}%`],
      ['', '', ''],
      ['Total Hours', summary.totalRegularHours, ''],
      ['Overtime Hours', summary.totalOvertimeHours, ''],
      ['Break Hours', summary.totalBreakHours, '']
    ];

    const csvContent = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Reports</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze your attendance patterns and trends
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.attendanceRate}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalRegularHours}h
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.lateDays}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Late Days</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.absentDays}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Absent Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Attendance Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {getStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Breakdown Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Weekly Breakdown
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getWeeklyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#10B981" name="Present" />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                    <Bar dataKey="late" fill="#F59E0B" name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detailed Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.totalDays}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.totalOvertimeHours}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Overtime Hours</div>
              </div>
                        <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.totalBreakHours}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Break Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.earlyDepartureDays}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Early Departures</div>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !summary && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No attendance data found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No attendance records were found for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
}