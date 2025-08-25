// components/Employee/Leave/LeaveCard.tsx
"use client";
import { useState } from 'react';
import { ILeave } from '@/types/employee/leave';
import { formatDate } from '@/utils/dateUtils';
import LeaveEditModal from './LeaveEditModal';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit,
  X,
  Download,
  User,
  MessageSquare,
  History
} from 'lucide-react';

interface LeaveCardProps {
  leave: ILeave;
  onUpdate: () => void;
}

export default function LeaveCard({ leave, onUpdate }: LeaveCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800',
      'in-review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      cancelled: X,
      'in-review': Clock
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const getLeaveTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      annual: Calendar,
      sick: User,
      casual: Calendar,
      maternity: User,
      paternity: User,
      unpaid: FileText,
      compensatory: FileText,
      bereavement: User,
      sabbatical: History,
      'half-day': Clock,
      'short-leave': Clock,
      'time-off-in-lieu': Clock,
      'jury-duty': FileText,
      volunteer: User,
      religious: User
    };
    return icons[type] || FileText;
  };

  const canCancel = () => {
    if (leave.status !== 'pending' && leave.status !== 'approved') return false;
    
    const now = new Date();
    const startDate = new Date(leave.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return leave.status === 'pending' || (leave.status === 'approved' && hoursUntilStart > 24);
  };

  const canEdit = () => {
    return leave.status === 'pending';
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/employee/leave/${leave.id}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel leave');
      }

      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel leave');
    } finally {
      setCancelling(false);
    }
  };

  const StatusIcon = getStatusIcon(leave.status);
  const LeaveTypeIcon = getLeaveTypeIcon(leave.leaveType);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex items-start space-x-4 mb-3 sm:mb-0">
              <div className="flex-shrink-0 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <LeaveTypeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {leave.leaveType.replace('-', ' ')} Leave
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Applied on {formatDate(leave.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(leave.status)}`}>
                <StatusIcon className="w-4 h-4 mr-1.5" />
                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1).replace('-', ' ')}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Start Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(leave.startDate)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">End Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(leave.endDate)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Duration</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Reason Preview */}
          <div className="mb-5">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Reason:</span>{' '}
              <span className={showDetails ? '' : 'line-clamp-2'}>
                {leave.reason}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium flex items-center"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  View Details
                </>
              )}
            </button>

            <div className="flex flex-wrap gap-2">
              {canEdit() && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit
                </button>
              )}
              
              {canCancel() && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  {cancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-5">
              {leave.emergencyContact && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Emergency Contact
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{leave.emergencyContact}</p>
                </div>
              )}

              {leave.handoverNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Handover Notes
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 pl-6 whitespace-pre-wrap">{leave.handoverNotes}</p>
                </div>
              )}

              {leave.reviewComments && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Review Comments
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 pl-6">{leave.reviewComments}</p>
                  {leave.reviewedByName && leave.reviewedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                      Reviewed by <span className="font-medium">{leave.reviewedByName}</span> on {formatDate(leave.reviewedAt)}
                    </p>
                  )}
                </div>
              )}

              {leave.attachments && leave.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Supporting Documents ({leave.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                    {leave.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.original_filename}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.bytes / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.secure_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium flex-shrink-0 flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <History className="w-4 h-4 mr-2" />
                  Application Timeline
                </p>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Applied on {formatDate(leave.createdAt)}
                    </span>
                  </div>
                  
                  {leave.reviewedAt && (
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        leave.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {leave.status === 'approved' ? 'Approved' : 'Reviewed'} on {formatDate(leave.reviewedAt)}
                        {leave.reviewedByName && ` by ${leave.reviewedByName}`}
                      </span>
                    </div>
                  )}
                  
                  {leave.status === 'cancelled' && (
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Cancelled on {formatDate(leave.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <LeaveEditModal
        leave={leave}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={() => {
          onUpdate();
          setShowEditModal(false);
        }}
      />
    </>
  );
}