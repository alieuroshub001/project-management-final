// components/Employee/Attendance/AttendanceRecords.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Coffee,
  Users,
  Target,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  FileText
} from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  totalWorkingMinutes: number;
  totalBreakMinutes: number;
  totalNamazMinutes: number;
  actualWorkingMinutes: number;
  isLate: boolean;
  isEarlyDeparture: boolean;
  isRemote: boolean;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  breaks: any[];
  namaz: any[];
  tasksCompleted: any[];
  summary: {
    productivityScore: number;
    totalTasks: number;
    completedTasks: number;
  };
  dailyNotes?: string;
  isApproved: boolean;
  rejectionReason?: string;
}

interface AttendanceFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  isApproved?: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AttendanceRecords() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AttendanceFilters>({});
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNext: false,
    hasPrev: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecords = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/employee/attendance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRecords(data.data.records);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch records');
      }
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const applyFilters = () => {
    fetchRecords(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchRecords(1);
  };

  const exportRecords = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>),
        export: 'csv'
      });

      const response = await fetch(`/api/employee/attendance?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export records:', err);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800 border-green-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      'half-day': 'bg-orange-100 text-orange-800 border-orange-200',
      'early-departure': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status as keyof typeof colors] || colors.present;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      present: CheckCircle,
      late: AlertTriangle,
      absent: XCircle,
      'half-day': Clock,
      'early-departure': Clock
    };
    return icons[status as keyof typeof icons] || CheckCircle;
  };

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      record.status.toLowerCase().includes(searchLower) ||
      formatDate(record.date).toLowerCase().includes(searchLower) ||
      (record.dailyNotes && record.dailyNotes.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    fetchRecords(1);
  }, []);

  if (loading && records.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance Records</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.totalRecords} total records
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </button>
          
          <button
            onClick={exportRecords}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="early-departure">Early Departure</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Approval Status
              </label>
              <select
                value={filters.isApproved === undefined ? '' : filters.isApproved.toString()}
                onChange={(e) => handleFilterChange('isApproved', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Records Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || Object.keys(filters).length > 0 
                ? 'Try adjusting your search or filters'
                : 'No attendance records available'
              }
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const StatusIcon = getStatusIcon(record.status);
            return (
              <div key={record._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.status)}`}>
                        <StatusIcon className="w-4 h-4 mr-1.5" />
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </div>
                      
                      {!record.isApproved && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                          Pending Approval
                        </span>
                      )}
                      
                      {record.isRemote && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Remote
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDate(record.date)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Score: {record.summary.productivityScore}%
                      </div>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {formatTime(record.totalWorkingMinutes)}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">Total Time</div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                      <Target className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <div className="text-sm font-medium text-green-900 dark:text-green-100">
                        {formatTime(record.actualWorkingMinutes)}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">Working</div>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                      <Coffee className="w-5 h-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                      <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        {formatTime(record.totalBreakMinutes)}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">Breaks</div>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                      <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {formatTime(record.totalNamazMinutes)}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">Prayer</div>
                    </div>
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-center">
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                      <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        {record.tasksCompleted.length}
                      </div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400">Tasks</div>
                    </div>
                  </div>

                  {/* Check-in/out times */}
                  {(record.checkIn || record.checkOut) && (
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div>
                        {record.checkIn && (
                          <span>Check-in: {formatDateTime(record.checkIn)}</span>
                        )}
                        {record.isLate && record.lateMinutes > 0 && (
                          <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                            (Late by {formatTime(record.lateMinutes)})
                          </span>
                        )}
                      </div>
                      <div>
                        {record.checkOut && (
                          <span>Check-out: {formatDateTime(record.checkOut)}</span>
                        )}
                        {record.isEarlyDeparture && record.earlyDepartureMinutes > 0 && (
                          <span className="ml-2 text-orange-600 dark:text-orange-400">
                            (Early by {formatTime(record.earlyDepartureMinutes)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Daily Notes */}
                  {record.dailyNotes && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Notes: </span>
                        {record.dailyNotes}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {record.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <span className="font-medium">Rejection Reason: </span>
                        {record.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Breaks: {record.breaks.length}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Prayers: {record.namaz.length}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Completed Tasks: {record.summary.completedTasks}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchRecords(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev || loading}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => fetchRecords(pagination.currentPage + 1)}
              disabled={!pagination.hasNext || loading}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Attendance Details - {formatDate(selectedRecord.date)}
                </h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Detailed view content here */}
              <div className="space-y-6">
                {/* Status and basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Basic Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                          {selectedRecord.status}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Check-in:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRecord.checkIn ? formatDateTime(selectedRecord.checkIn) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Check-out:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRecord.checkOut ? formatDateTime(selectedRecord.checkOut) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Time Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Total Time:</span>
                        <span className="text-gray-900 dark:text-white">{formatTime(selectedRecord.totalWorkingMinutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Working Time:</span>
                        <span className="text-gray-900 dark:text-white">{formatTime(selectedRecord.actualWorkingMinutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Break Time:</span>
                        <span className="text-gray-900 dark:text-white">{formatTime(selectedRecord.totalBreakMinutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Prayer Time:</span>
                        <span className="text-gray-900 dark:text-white">{formatTime(selectedRecord.totalNamazMinutes)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breaks */}
                {selectedRecord.breaks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Breaks ({selectedRecord.breaks.length})</h4>
                    <div className="space-y-2">
                      {selectedRecord.breaks.map((breakItem: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Coffee className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {breakItem.type} Break
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {breakItem.duration ? formatTime(breakItem.duration) : 'Active'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prayers */}
                {selectedRecord.namaz.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Prayers ({selectedRecord.namaz.length})</h4>
                    <div className="space-y-2">
                      {selectedRecord.namaz.map((namazItem: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {namazItem.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {namazItem.duration ? formatTime(namazItem.duration) : 'Active'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {selectedRecord.tasksCompleted.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Tasks ({selectedRecord.tasksCompleted.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedRecord.tasksCompleted.map((task: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">{task.title}</h5>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Category: {task.category}</span>
                            <span>Time: {task.hoursSpent}h</span>
                            <span>Priority: {task.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}