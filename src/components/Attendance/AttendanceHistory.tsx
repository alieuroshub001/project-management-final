// components/Employee/Attendance/AttendanceHistory.tsx
"use client";
import { useState, useEffect } from 'react';
import { IAttendance } from '@/types/attendance';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Coffee,
  Moon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye
} from 'lucide-react';

export default function AttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState<IAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    shift: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<IAttendance | null>(null);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status && { status: filters.status }),
        ...(filters.shift && { shift: filters.shift })
      });

      const response = await fetch(`/api/attendance?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch attendance history');
      }

      setAttendanceData(data.data.attendance);
      setTotalPages(data.data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [currentPage, filters]);

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'on-leave': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      holiday: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  const getShiftIcon = (shift: string) => {
    const icons = {
      morning: '🌅',
      evening: '🌆', 
      night: '🌙',
      random: '🕐'
    };
    return icons[shift as keyof typeof icons] || '🕐';
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      shift: ''
    });
    setCurrentPage(1);
  };

  if (loading && attendanceData.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance History</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View your complete attendance records</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Records
          </h2>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="partial">Partial</option>
              <option value="on-leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shift
            </label>
            <select
              value={filters.shift}
              onChange={(e) => handleFilterChange('shift', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="">All Shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              <option value="random">Flexible</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {attendanceData.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Working Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {attendanceData.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(record.date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getShiftIcon(record.shift)}</span>
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {record.shift}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.checkInTime ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-green-500 mr-1" />
                            {formatTime(record.checkInTime)}
                            {record.isLateCheckIn && (
                              <div className="relative group ml-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  Late check-in
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.checkOutTime ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-blue-500 mr-1" />
                            {formatTime(record.checkOutTime)}
                            {record.isEarlyCheckOut && (
                              <div className="relative group ml-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  Early check-out
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatDuration(record.totalWorkingHours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status === 'present' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {attendanceData.map((record) => (
                <div key={record.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(record.date)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Shift:</span>
                      <div className="flex items-center mt-1">
                        <span className="mr-2">{getShiftIcon(record.shift)}</span>
                        <span className="text-gray-900 dark:text-white capitalize">{record.shift}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Working Hours:</span>
                      <div className="mt-1 font-medium text-gray-900 dark:text-white">
                        {formatDuration(record.totalWorkingHours)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Check In:</span>
                      <div className="mt-1 text-gray-900 dark:text-white">
                        {record.checkInTime ? formatTime(record.checkInTime) : '--'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Check Out:</span>
                      <div className="mt-1 text-gray-900 dark:text-white">
                        {record.checkOutTime ? formatTime(record.checkOutTime) : '--'}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="mt-3 w-full text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No records found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No attendance records match your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-xl bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Attendance Details - {formatDate(selectedRecord.date)}
                </h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Time Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Check In:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRecord.checkInTime ? formatTime(selectedRecord.checkInTime) : 'Not checked in'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Check Out:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRecord.checkOutTime ? formatTime(selectedRecord.checkOutTime) : 'Not checked out'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Working Hours:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDuration(selectedRecord.totalWorkingHours)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Status & Shift</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                          {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Shift:</span>
                        <span className="text-gray-900 dark:text-white capitalize">
                          {getShiftIcon(selectedRecord.shift)} {selectedRecord.shift}
                        </span>
                      </div>
                      {selectedRecord.isLateCheckIn && (
                        <div className="text-amber-600 dark:text-amber-400 text-xs">
                          Late check-in
                        </div>
                      )}
                      {selectedRecord.isEarlyCheckOut && (
                        <div className="text-amber-600 dark:text-amber-400 text-xs">
                          Early check-out
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Breaks */}
                {(selectedRecord.breaks.length > 0 || selectedRecord.namazBreaks.length > 0) && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Breaks Taken</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRecord.breaks.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Coffee className="w-4 h-4 mr-1" />
                            General Breaks
                          </h5>
                          <div className="space-y-1">
                            {selectedRecord.breaks.map((breakItem) => (
                              <div key={breakItem.id} className="text-xs text-gray-600 dark:text-gray-400">
                                {breakItem.breakType.charAt(0).toUpperCase() + breakItem.breakType.slice(1)} - {formatDuration(breakItem.duration)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedRecord.namazBreaks.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Moon className="w-4 h-4 mr-1" />
                            Prayer Breaks
                          </h5>
                          <div className="space-y-1">
                            {selectedRecord.namazBreaks.map((namazBreak) => (
                              <div key={namazBreak.id} className="text-xs text-gray-600 dark:text-gray-400">
                                {namazBreak.namazType.charAt(0).toUpperCase() + namazBreak.namazType.slice(1)} - {formatDuration(namazBreak.duration)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {selectedRecord.tasksPerformed.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Tasks Performed</h4>
                    <div className="space-y-3">
                      {selectedRecord.tasksPerformed.map((task) => (
                        <div key={task.id} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                              {task.taskDescription}
                            </h5>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                              {formatDuration(task.timeSpent)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="capitalize">Category: {task.taskCategory}</span>
                            <span className="capitalize">Priority: {task.priority}</span>
                          </div>
                          {task.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              {task.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reasons */}
                {(selectedRecord.lateCheckInReason || selectedRecord.earlyCheckOutReason) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-3">Notes & Reasons</h4>
                    {selectedRecord.lateCheckInReason && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Late Check-in Reason:</span>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          {selectedRecord.lateCheckInReason}
                        </p>
                      </div>
                    )}
                    {selectedRecord.earlyCheckOutReason && (
                      <div>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Early Check-out Reason:</span>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          {selectedRecord.earlyCheckOutReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}