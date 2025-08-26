// components/Employee/Attendance/AttendanceReports.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  Calendar,
  BarChart3,
  TrendingUp,
  Download,
  Clock,
  Target,
  Coffee,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

interface AttendanceReport {
  period: string;
  startDate: string;
  endDate: string;
  totalWorkingDays: number;
  presentDays: number;
  totalHours: number;
  averageDailyHours: number;
  punctualityRate: number;
  attendanceRate: number;
  totalTasks: number;
  productivityScore: number;
  topCategories: Array<{
    category: string;
    hours: number;
    percentage: number;
  }>;
  taskPerformance: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    averageHoursPerTask: number;
  };
  timeUtilization: {
    totalHours: number;
    workingHours: number;
    breakHours: number;
    namazHours: number;
    utilization: number;
  };
  trends: any[];
  dailyBreakdown: Array<{
    date: string;
    status: string;
    hours: number;
    tasks: number;
    breakTime: number;
    namazTime: number;
    isLate: boolean;
    isEarlyDeparture: boolean;
    productivityScore: number;
  }>;
  summary: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export default function AttendanceReports() {
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [customRange, setCustomRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    performance: true,
    breakdown: false,
    trends: false,
    insights: true
  });

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (useCustomRange && customRange.startDate && customRange.endDate) {
        params.append('startDate', customRange.startDate);
        params.append('endDate', customRange.endDate);
      } else {
        params.append('period', period);
      }

      const response = await fetch(`/api/employee/attendance/reports?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReport(data.data);
      } else {
        throw new Error(data.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams();
      
      if (useCustomRange && customRange.startDate && customRange.endDate) {
        params.append('startDate', customRange.startDate);
        params.append('endDate', customRange.endDate);
      } else {
        params.append('period', period);
      }
      params.append('export', 'pdf');

      const response = await fetch(`/api/employee/attendance/reports?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `attendance-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export report:', err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Attendance Reports</h2>
            <p className="text-gray-600 dark:text-gray-400">Generate detailed reports on your attendance and productivity</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useCustomRange}
                  onChange={(e) => setUseCustomRange(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Custom Range</span>
              </label>
            </div>
            
            {useCustomRange ? (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            ) : (
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'week' | 'month')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            )}
            
            <button
              onClick={generateReport}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            
            {report && (
              <button
                onClick={exportReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && !report && (
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Report Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('overview')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Report Overview ({formatDate(report.startDate)} - {formatDate(report.endDate)})
              </h3>
              {expandedSections.overview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.overview && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {report.presentDays}/{report.totalWorkingDays}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Days Present</div>
                    <div className={`text-xs font-medium mt-1 ${getScoreColor(report.attendanceRate)}`}>
                      {report.attendanceRate.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {report.totalHours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Total Hours</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {report.averageDailyHours.toFixed(1)}h avg/day
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {report.totalTasks}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Tasks Completed</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {report.taskPerformance.completionRate.toFixed(1)}% rate
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {report.productivityScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">Productivity Score</div>
                    <div className={`text-xs font-medium mt-1 ${getScoreColor(report.punctualityRate)}`}>
                      {report.punctualityRate.toFixed(1)}% punctual
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('performance')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
              {expandedSections.performance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.performance && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Time Utilization */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Time Utilization</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-blue-500 mr-3" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Working Hours</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.timeUtilization.workingHours.toFixed(1)}h
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center">
                          <Coffee className="w-4 h-4 text-orange-500 mr-3" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Break Time</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.timeUtilization.breakHours.toFixed(1)}h
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-purple-500 mr-3" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prayer Time</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.timeUtilization.namazHours.toFixed(1)}h
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Utilization Rate</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                              <div 
                                className="h-2 bg-indigo-500 rounded-full" 
                                style={{ width: `${report.timeUtilization.utilization}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {report.timeUtilization.utilization}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Performance */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Task Performance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Tasks</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.taskPerformance.total}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {report.taskPerformance.completed}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In Progress</span>
                        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                          {report.taskPerformance.inProgress}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Hours/Task</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.taskPerformance.averageHoursPerTask.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Categories */}
                {report.topCategories.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Top Work Categories</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {report.topCategories.map((category, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {category.category}
                            </span>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {category.percentage}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{category.hours.toFixed(1)} hours</span>
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                              <div 
                                className="h-1.5 bg-indigo-500 rounded-full" 
                                style={{ width: `${category.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('breakdown')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Breakdown</h3>
              {expandedSections.breakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.breakdown && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="mt-4 space-y-3">
                  {report.dailyBreakdown.map((day, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(day.date)}
                          </div>
                          
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            day.status === 'present' ? 'bg-green-100 text-green-800 border-green-200' :
                            day.status === 'late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            day.status === 'absent' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {day.status}
                          </div>
                          
                          {day.isLate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Late
                            </span>
                          )}
                          
                          {day.isEarlyDeparture && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Early
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{day.hours.toFixed(1)}h worked</span>
                          <span>{day.tasks} tasks</span>
                          <span>{day.breakTime.toFixed(1)}h breaks</span>
                          <span>{day.namazTime.toFixed(1)}h prayer</span>
                          <span className={`font-medium ${getScoreColor(day.productivityScore)}`}>
                            {day.productivityScore}% score
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Insights and Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('insights')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insights & Recommendations</h3>
              {expandedSections.insights ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.insights && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                  {/* Strengths */}
                  {report.summary.strengths.length > 0 && (
                    <div>
                      <div className="flex items-center mb-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">Strengths</h4>
                      </div>
                      <ul className="space-y-2">
                        {report.summary.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {report.summary.improvements.length > 0 && (
                    <div>
                      <div className="flex items-center mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">Areas for Improvement</h4>
                      </div>
                      <ul className="space-y-2">
                        {report.summary.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.summary.recommendations.length > 0 && (
                    <div>
                      <div className="flex items-center mb-3">
                        <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">Recommendations</h4>
                      </div>
                      <ul className="space-y-2">
                        {report.summary.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Overall Assessment */}
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center mb-2">
                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Overall Assessment</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(report.attendanceRate)}`}>
                        {report.attendanceRate >= 95 ? 'Excellent' :
                         report.attendanceRate >= 85 ? 'Good' :
                         report.attendanceRate >= 75 ? 'Fair' : 'Needs Improvement'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Attendance</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(report.punctualityRate)}`}>
                        {report.punctualityRate >= 95 ? 'Excellent' :
                         report.punctualityRate >= 85 ? 'Good' :
                         report.punctualityRate >= 75 ? 'Fair' : 'Needs Improvement'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Punctuality</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(report.productivityScore)}`}>
                        {report.productivityScore >= 90 ? 'Excellent' :
                         report.productivityScore >= 75 ? 'Good' :
                         report.productivityScore >= 60 ? 'Fair' : 'Needs Improvement'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Productivity</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(report.taskPerformance.completionRate)}`}>
                        {report.taskPerformance.completionRate >= 95 ? 'Excellent' :
                         report.taskPerformance.completionRate >= 85 ? 'Good' :
                         report.taskPerformance.completionRate >= 75 ? 'Fair' : 'Needs Improvement'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Task Completion</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trends */}
          {report.trends && report.trends.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleSection('trends')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trends Analysis</h3>
                {expandedSections.trends ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {expandedSections.trends && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="mt-4 space-y-4">
                    {report.trends.map((trend: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {report.period === 'month' ? 
                              `Week ${index + 1}` : 
                              new Date(trend.date || trend.startDate).toLocaleDateString()
                            }
                          </h5>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {trend.totalHours?.toFixed(1) || trend.hours?.toFixed(1)}h
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Tasks:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {trend.totalTasks || trend.tasks || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Productivity:</span>
                            <span className={`ml-1 font-medium ${getScoreColor(trend.avgProductivity || trend.productivity || 0)}`}>
                              {(trend.avgProductivity || trend.productivity || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Status:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white capitalize">
                              {trend.status || 'working'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Trend indicator */}
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, ((trend.totalHours || trend.hours || 0) / 8) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Report Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Report generated on {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Data period: {formatDate(report.startDate)} to {formatDate(report.endDate)}
            </p>
          </div>
        </div>
      )}

      {!loading && !report && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Report Generated</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Click "Generate Report" to create your attendance analysis
          </p>
        </div>
      )}
    </div>
  );
}