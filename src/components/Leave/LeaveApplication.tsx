// components/Employee/Leave/LeaveApplication.tsx
"use client";
import { useState } from 'react';
import { ILeaveCreateRequest, LeaveType } from '@/types/leave';
import { calculateDaysBetween } from '@/utils/dateUtils';
import {
  Calendar,
  Heart,
  Baby,
  User,
  FileText,
  Coins,
  Scale,
  Feather,
  RotateCcw,
  Upload,
  X,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';

interface LeaveApplicationProps {
  onSuccess?: () => void;
}

export default function LeaveApplication({ onSuccess }: LeaveApplicationProps) {
  const [formData, setFormData] = useState<ILeaveCreateRequest>({
    leaveType: 'annual',
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
    emergencyContact: '',
    handoverNotes: '',
    attachments: [],
    cloudinaryAttachments: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const leaveTypes: { value: LeaveType; label: string; description: string; icon: React.ElementType }[] = [
    { value: 'annual', label: 'Annual Leave', description: 'Yearly vacation time', icon: Calendar },
    { value: 'sick', label: 'Sick Leave', description: 'Medical leave for illness', icon: Heart },
    { value: 'casual', label: 'Casual Leave', description: 'Short-term personal leave', icon: User },
    { value: 'maternity', label: 'Maternity Leave', description: 'Leave for new mothers', icon: Baby },
    { value: 'paternity', label: 'Paternity Leave', description: 'Leave for new fathers', icon: User },
    { value: 'unpaid', label: 'Unpaid Leave', description: 'Leave without pay', icon: Coins },
    { value: 'compensatory', label: 'Compensatory Leave', description: 'Time off for overtime work', icon: Scale },
    { value: 'bereavement', label: 'Bereavement Leave', description: 'Leave for family loss', icon: Feather },
  ];

  const calculateTotalDays = () => {
    if (formData.startDate && formData.endDate) {
      return calculateDaysBetween(formData.startDate, formData.endDate);
    }
    return 0;
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingFiles(true);
    const formDataUpload = new FormData();
    
    Array.from(files).forEach(file => {
      formDataUpload.append('files', file);
    });

    try {
      const response = await fetch('/api/leave/upload', {
        method: 'POST',
        body: formDataUpload
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setFormData(prev => ({
        ...prev,
        cloudinaryAttachments: [...(prev.cloudinaryAttachments || []), ...data.files]
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = async (publicId: string) => {
    try {
      await fetch('/api/leave/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: [publicId] })
      });

      setFormData(prev => ({
        ...prev,
        cloudinaryAttachments: prev.cloudinaryAttachments?.filter(file => file.public_id !== publicId)
      }));
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const validateForm = () => {
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setError('Please fill in all required fields');
      return false;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('End date must be after start date');
      return false;
    }

    if (calculateTotalDays() > 365) {
      setError('Leave duration cannot exceed 365 days');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess('Leave application submitted successfully!');
      
      // Reset form
      setFormData({
        leaveType: 'annual',
        startDate: new Date(),
        endDate: new Date(),
        reason: '',
        emergencyContact: '',
        handoverNotes: '',
        attachments: [],
        cloudinaryAttachments: []
      });

      // Call onSuccess callback if provided
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leaveType: 'annual',
      startDate: new Date(),
      endDate: new Date(),
      reason: '',
      emergencyContact: '',
      handoverNotes: '',
      attachments: [],
      cloudinaryAttachments: []
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apply for Leave</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Fill in the details below to request time off</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset Form
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <p className="text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {leaveTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all duration-200 ${
                        formData.leaveType === type.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="leaveType"
                        value={type.value}
                        checked={formData.leaveType === type.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value as LeaveType }))}
                        className="sr-only"
                      />
                      <div className="flex items-start w-full">
                        <div className={`p-2 rounded-lg ${
                          formData.leaveType === type.value 
                            ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            formData.leaveType === type.value 
                              ? 'text-indigo-600 dark:text-indigo-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{type.description}</div>
                        </div>
                      </div>
                      {formData.leaveType === type.value && (
                        <div className="absolute -inset-px rounded-xl border-2 border-indigo-500 pointer-events-none" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={formData.startDate.toISOString().split('T')[0]}
                  value={formData.endDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Total Days Display */}
            {calculateTotalDays() > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center">
                  <Info className="w-5 h-5 text-blue-500 mr-3" />
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    <strong>Total Duration:</strong> {calculateTotalDays()} day{calculateTotalDays() !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please provide a detailed reason for your leave request..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                maxLength={1000}
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {formData.reason.length}/1000 characters
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={formData.emergencyContact}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                placeholder="Phone number for emergency contact"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                maxLength={20}
              />
            </div>

            {/* Handover Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Work Handover Notes
              </label>
              <textarea
                rows={3}
                value={formData.handoverNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, handoverNotes: e.target.value }))}
                placeholder="Work handover instructions or notes for colleagues..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                maxLength={2000}
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {formData.handoverNotes?.length || 0}/2000 characters
              </div>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Supporting Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={uploadingFiles}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer ${uploadingFiles ? 'cursor-not-allowed' : ''}`}
                >
                  {uploadingFiles ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">Uploading files...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Click to upload</span>
                          {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          PNG, JPG, PDF, DOC up to 10MB each
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Uploaded Files List */}
              {formData.cloudinaryAttachments && formData.cloudinaryAttachments.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploaded Files ({formData.cloudinaryAttachments.length})
                  </p>
                  {formData.cloudinaryAttachments.map((file) => (
                    <div key={file.public_id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.original_filename}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.bytes / 1024 / 1024).toFixed(2)} MB • {file.format.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <a
                          href={file.secure_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file.public_id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading || uploadingFiles}
                className={`px-8 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  loading || uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}