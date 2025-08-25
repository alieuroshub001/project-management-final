// components/Employee/Leave/LeaveEditModal.tsx
"use client";
import { useState, useEffect } from 'react';
import { ILeave, ILeaveUpdateRequest, LeaveType } from '@/types/employee/leave';

interface LeaveEditModalProps {
  leave: ILeave | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LeaveEditModal({ leave, isOpen, onClose, onUpdate }: LeaveEditModalProps) {
  const [formData, setFormData] = useState<ILeaveUpdateRequest>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leaveTypes: { value: LeaveType; label: string }[] = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
    { value: 'compensatory', label: 'Compensatory Leave' },
    { value: 'bereavement', label: 'Bereavement Leave' }
  ];

  useEffect(() => {
    if (leave && isOpen) {
      setFormData({
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        emergencyContact: leave.emergencyContact,
        handoverNotes: leave.handoverNotes
      });
    }
  }, [leave, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leave) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/employee/leave/${leave.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update leave');
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update leave');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !leave) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Leave Application</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Leave Type
              </label>
              <select
                value={formData.leaveType || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value as LeaveType }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              >
                {leaveTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason
              </label>
              <textarea
                rows={3}
                value={formData.reason || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={formData.emergencyContact || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Handover Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Handover Notes
              </label>
              <textarea
                rows={3}
                value={formData.handoverNotes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, handoverNotes: e.target.value }))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Updating...' : 'Update Leave'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}