// components/Employee/Projects/ProjectCreate.tsx (Complete)
"use client";
import { useState } from 'react';
import { 
  IProjectCreateRequest, 
  ProjectPriority, 
  ProjectCategory,
  ICloudinaryFile
} from '@/types/employee/projectmanagement';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FolderPlus,
  Calendar,
  Users,
  FileText,
  Upload,
  X,
  Eye,
  AlertCircle,
  CheckCircle,
  Target,
  DollarSign,
  Clock,
  Flag,
  Loader2
} from 'lucide-react';

interface ProjectCreateProps {
  onSuccess: () => void;
}

export default function ProjectCreate({ onSuccess }: ProjectCreateProps) {
  const [formData, setFormData] = useState<IProjectCreateRequest>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    estimatedHours: 40,
    category: 'web-development',
    tags: [],
    cloudinaryAttachments: []
  });

  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const priorityOptions: { value: ProjectPriority; label: string; description: string; icon: string; color: string }[] = [
    { value: 'low', label: 'Low', description: 'No rush, can be completed anytime', icon: '🟢', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', description: 'Standard priority project', icon: '🟡', color: 'text-yellow-600' },
    { value: 'high', label: 'High', description: 'Important project, needs attention', icon: '🟠', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', description: 'Business critical, high impact', icon: '🔴', color: 'text-red-600' },
    { value: 'urgent', label: 'Urgent', description: 'Immediate attention required', icon: '🚨', color: 'text-red-700' }
  ];

  const categoryOptions: { value: ProjectCategory; label: string; description: string }[] = [
    { value: 'web-development', label: 'Web Development', description: 'Websites and web applications' },
    { value: 'mobile-app', label: 'Mobile App', description: 'iOS and Android applications' },
    { value: 'design', label: 'Design', description: 'UI/UX and graphic design' },
    { value: 'marketing', label: 'Marketing', description: 'Marketing campaigns and content' },
    { value: 'research', label: 'Research', description: 'Research and analysis projects' },
    { value: 'maintenance', label: 'Maintenance', description: 'System maintenance and updates' },
    { value: 'infrastructure', label: 'Infrastructure', description: 'IT infrastructure projects' },
    { value: 'testing', label: 'Testing', description: 'Quality assurance and testing' },
    { value: 'documentation', label: 'Documentation', description: 'Documentation and guides' },
    { value: 'other', label: 'Other', description: 'Other types of projects' }
  ];

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingFiles(true);
    const uploadFormData = new FormData();
    
    Array.from(files).forEach(file => {
      uploadFormData.append('files', file);
    });

    try {
      const response = await fetch('/api/employee/projects/upload', {
        method: 'POST',
        body: uploadFormData
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
      await fetch('/api/employee/projects/upload', {
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Project name is required');
      return false;
    }
    if (formData.name.length < 3) {
      setError('Project name must be at least 3 characters long');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Project description is required');
      return false;
    }
    if (formData.description.length < 10) {
      setError('Project description must be at least 10 characters long');
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return false;
    }
    if (formData.estimatedHours <= 0) {
      setError('Estimated hours must be greater than 0');
      return false;
    }
    if (formData.estimatedHours > 10000) {
      setError('Estimated hours seems too high. Please verify.');
      return false;
    }
    if (formData.budget && formData.budget < 0) {
      setError('Budget cannot be negative');
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
      const response = await fetch('/api/employee/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      setSuccess('Project created successfully! Redirecting...');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estimatedHours: 40,
        category: 'web-development',
        tags: [],
        cloudinaryAttachments: []
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estimatedHours: 40,
      category: 'web-development',
      tags: [],
      cloudinaryAttachments: []
    });
    setError('');
    setSuccess('');
    setTagInput('');
    setShowAdvanced(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-4">
              <FolderPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Set up a new project and start collaborating with your team</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-8 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Basic Information Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a descriptive project name..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-4 text-lg text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    maxLength={100}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formData.name.length}/100 characters
                  </p>
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project objectives, scope, key deliverables, and expected outcomes..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-4 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-vertical"
                    maxLength={2000}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formData.description.length}/2000 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Project Settings Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Priority Level
                  </label>
                  <div className="space-y-3">
                    {priorityOptions.map(option => (
                      <label
                        key={option.value}
                        className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all duration-200 ${
                          formData.priority === option.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={option.value}
                          checked={formData.priority === option.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as ProjectPriority }))}
                          className="sr-only"
                        />
                        <div className="flex items-center w-full">
                          <span className="text-2xl mr-3">{option.icon}</span>
                          <div className="flex-1">
                            <div className={`font-medium ${option.color} dark:${option.color.replace('text-', 'text-')}`}>
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {option.description}
                            </div>
                          </div>
                        </div>
                        {formData.priority === option.value && (
                          <div className="absolute -inset-px rounded-xl border-2 border-indigo-500 pointer-events-none" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Project Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ProjectCategory }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-4 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Timeline & Resources Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Timeline & Resources</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      required
                      value={formData.startDate.toISOString().split('T')[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      required
                      min={formData.startDate.toISOString().split('T')[0]}
                      value={formData.endDate.toISOString().split('T')[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Estimated Hours <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      min="1"
                      max="10000"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      placeholder="Hours"
                    />
                  </div>
                </div>
              </div>

              {/* Duration Display */}
              {calculateDuration() > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">
                        Project Duration: {calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}
                      </p>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">
                        Estimated completion: {formData.endDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-6"
              >
                <Target className="w-5 h-5 mr-2" />
                Advanced Options
                <svg className={`w-5 h-5 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAdvanced && (
                <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Project Budget (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.budget || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || undefined }))}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Optional budget allocation for this project
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Project Tags
                    </label>
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add a tag..."
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Add Tag
                      </button>
                    </div>
                    
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-1 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* File Attachments Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                  <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Documents</h2>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
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
                      <Loader2 className="animate-spin w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uploading files...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          <span className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Click to upload</span>
                          {' '}or drag and drop
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Documents, images, spreadsheets, and presentations
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, PDF, DOC, XLS, PPT up to 10MB each
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Uploaded Files List */}
              {formData.cloudinaryAttachments && formData.cloudinaryAttachments.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploaded Files ({formData.cloudinaryAttachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.cloudinaryAttachments.map((file) => (
                      <div key={file.public_id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center min-w-0 flex-1">
                          <FileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.original_filename}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.bytes / 1024 / 1024).toFixed(2)} MB • {file.format.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
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
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <button
                type="submit"
                disabled={loading || uploadingFiles}
                className={`px-8 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg ${
                  loading || uploadingFiles ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Creating Project...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FolderPlus className="w-5 h-5 mr-2" />
                    Create Project
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}