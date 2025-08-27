// components/Employee/Profile/ProfileExperience.tsx
"use client";
import { useState, useEffect } from 'react';
import { IExperience, ICloudinaryFile } from '@/types/profile';
import { 
  Plus, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  FileText,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  Loader2,
  Award
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ExperienceFormData extends Omit<IExperience, 'id' | 'attachments'> {
  attachments?: ICloudinaryFile[];
}

export default function ProfileExperience() {
  const [experiences, setExperiences] = useState<IExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState<ExperienceFormData>({
    company: '',
    position: '',
    location: '',
    startDate: new Date(),
    endDate: undefined,
    isCurrent: false,
    description: '',
    skillsUsed: [],
    achievements: [],
    attachments: []
  });

  const fetchExperience = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      setExperiences(data.data.experience || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch experience data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperience();
  }, []);

  const handleInputChange = (field: keyof ExperienceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'isCurrent' && value) {
      setFormData(prev => ({ ...prev, endDate: undefined }));
    }
  };

  const handleSkillsChange = (skillsText: string) => {
    const skills = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({ ...prev, skillsUsed: skills }));
  };

  const handleAchievementsChange = (achievementsText: string) => {
    const achievements = achievementsText.split('\n').map(achievement => achievement.trim()).filter(achievement => achievement);
    setFormData(prev => ({ ...prev, achievements }));
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingFiles(true);
    const formDataUpload = new FormData();
    
    Array.from(files).forEach(file => {
      formDataUpload.append('files', file);
    });

    try {
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formDataUpload
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...data.files]
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = async (publicId: string) => {
    try {
      await fetch('/api/profile/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: [publicId] })
      });

      setFormData(prev => ({
        ...prev,
        attachments: prev.attachments?.filter(file => file.public_id !== publicId)
      }));
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const validateForm = () => {
    if (!formData.company.trim() || !formData.position.trim()) {
      setError('Company and position are required');
      return false;
    }

    if (!formData.isCurrent && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('End date must be after start date');
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
      const submitData = {
        ...formData,
        id: editingId || `exp_${Date.now()}`,
        endDate: formData.isCurrent ? undefined : formData.endDate
      };

      const response = await fetch('/api/profile/experience', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save experience');
      }

      setSuccess(editingId ? 'Experience updated successfully!' : 'Experience added successfully!');
      await fetchExperience();
      resetForm();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save experience');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (experience: IExperience) => {
    setFormData({
      company: experience.company,
      position: experience.position,
      location: experience.location || '',
      startDate: new Date(experience.startDate),
      endDate: experience.endDate ? new Date(experience.endDate) : undefined,
      isCurrent: experience.isCurrent,
      description: experience.description || '',
      skillsUsed: experience.skillsUsed || [],
      achievements: experience.achievements || [],
      attachments: experience.attachments || []
    });
    setEditingId(experience.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience entry?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/profile/experience/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete experience');
      }

      setSuccess('Experience deleted successfully!');
      await fetchExperience();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete experience');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      location: '',
      startDate: new Date(),
      endDate: undefined,
      isCurrent: false,
      description: '',
      skillsUsed: [],
      achievements: [],
      attachments: []
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  if (loading && experiences.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Work Experience</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your professional work experience</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Experience' : 'Add Experience'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  disabled={formData.isCurrent}
                  value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isCurrent}
                onChange={(e) => handleInputChange('isCurrent', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                I currently work here
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your responsibilities and achievements..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skills Used (comma-separated)
              </label>
              <textarea
                rows={2}
                value={formData.skillsUsed?.join(', ') || ''}
                onChange={(e) => handleSkillsChange(e.target.value)}
                placeholder="e.g., JavaScript, React, Project Management, Leadership"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Separate multiple skills with commas
              </div>
              {formData.skillsUsed && formData.skillsUsed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.skillsUsed.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Achievements (one per line)
              </label>
              <textarea
                rows={3}
                value={formData.achievements?.join('\n') || ''}
                onChange={(e) => handleAchievementsChange(e.target.value)}
                placeholder="List your key achievements, one per line..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Enter each achievement on a new line
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Supporting Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="experience-file-upload"
                  disabled={uploadingFiles}
                />
                <label
                  htmlFor="experience-file-upload"
                  className={`cursor-pointer ${uploadingFiles ? 'cursor-not-allowed' : ''}`}
                >
                  {uploadingFiles ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-404 mt-3">Uploading files...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Click to upload</span>
                          {' '}supporting documents
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Uploaded Files List */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file) => (
                    <div key={file.public_id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.original_filename}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.bytes / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <a
                          href={file.secure_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file.public_id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingFiles}
                className={`px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  loading || uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update' : 'Add'} Experience
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No experience entries</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Add your professional work experience to showcase your career journey and accomplishments.
            </p>
          </div>
        ) : (
          experiences.map((experience) => (
            <div key={experience.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-start space-x-4 mb-3 sm:mb-0">
                  <div className="flex-shrink-0 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {experience.position}
                    </h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {experience.company}
                    </p>
                    {experience.location && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {experience.location}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(experience)}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(experience.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Calendar className="w-4 h-4 mr-1" />
                <span>
                  {new Date(experience.startDate).toLocaleDateString()} - 
                  {experience.isCurrent ? ' Present' : experience.endDate ? ` ${new Date(experience.endDate).toLocaleDateString()}` : ' N/A'}
                </span>
              </div>

              {experience.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {experience.description}
                </p>
              )}

              {experience.skillsUsed && experience.skillsUsed.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills Used</p>
                  <div className="flex flex-wrap gap-2">
                    {experience.skillsUsed.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {experience.achievements && experience.achievements.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    Key Achievements
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    {experience.achievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {experience.attachments && experience.attachments.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Supporting Documents ({experience.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {experience.attachments.map((file, index) => (
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
                          className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}