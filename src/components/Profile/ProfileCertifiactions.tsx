// components/Employee/Profile/ProfileCertifications.tsx
"use client";
import { useState, useEffect } from 'react';
import { ICertification, ICloudinaryFile } from '@/types/profile';
import { 
  Plus, 
  Award, 
  Calendar, 
  ExternalLink, 
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
  Shield
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CertificationFormData extends Omit<ICertification, 'id' | 'attachments'> {
  attachments?: ICloudinaryFile[];
}

export default function ProfileCertifications() {
  const [certifications, setCertifications] = useState<ICertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState<CertificationFormData>({
    name: '',
    issuingOrganization: '',
    issueDate: new Date(),
    expirationDate: undefined,
    doesNotExpire: false,
    credentialId: '',
    credentialUrl: '',
    attachments: []
  });

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      setCertifications(data.data.certifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch certifications data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  const handleInputChange = (field: keyof CertificationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'doesNotExpire' && value) {
      setFormData(prev => ({ ...prev, expirationDate: undefined }));
    }
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
    if (!formData.name.trim() || !formData.issuingOrganization.trim()) {
      setError('Certification name and issuing organization are required');
      return false;
    }

    if (!formData.doesNotExpire && formData.expirationDate && new Date(formData.issueDate) > new Date(formData.expirationDate)) {
      setError('Expiration date must be after issue date');
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
        id: editingId || `cert_${Date.now()}`,
        expirationDate: formData.doesNotExpire ? undefined : formData.expirationDate
      };

      const response = await fetch('/api/profile/certifications', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save certification');
      }

      setSuccess(editingId ? 'Certification updated successfully!' : 'Certification added successfully!');
      await fetchCertifications();
      resetForm();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save certification');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (certification: ICertification) => {
    setFormData({
      name: certification.name,
      issuingOrganization: certification.issuingOrganization,
      issueDate: new Date(certification.issueDate),
      expirationDate: certification.expirationDate ? new Date(certification.expirationDate) : undefined,
      doesNotExpire: certification.doesNotExpire,
      credentialId: certification.credentialId || '',
      credentialUrl: certification.credentialUrl || '',
      attachments: certification.attachments || []
    });
    setEditingId(certification.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/profile/certifications/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete certification');
      }

      setSuccess('Certification deleted successfully!');
      await fetchCertifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete certification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      issuingOrganization: '',
      issueDate: new Date(),
      expirationDate: undefined,
      doesNotExpire: false,
      credentialId: '',
      credentialUrl: '',
      attachments: []
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  if (loading && certifications.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your professional certifications and credentials</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
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
              {editingId ? 'Edit Certification' : 'Add Certification'}
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
                  Certification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issuing Organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.issuingOrganization}
                  onChange={(e) => handleInputChange('issuingOrganization', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.issueDate.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('issueDate', new Date(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  disabled={formData.doesNotExpire}
                  value={formData.expirationDate ? formData.expirationDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('expirationDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credential ID
                </label>
                <input
                  type="text"
                  value={formData.credentialId}
                  onChange={(e) => handleInputChange('credentialId', e.target.value)}
                  placeholder="e.g., ABC123456789"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credential URL
                </label>
                <input
                  type="url"
                  value={formData.credentialUrl}
                  onChange={(e) => handleInputChange('credentialUrl', e.target.value)}
                  placeholder="https://example.com/verify/credential-id"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.doesNotExpire}
                onChange={(e) => handleInputChange('doesNotExpire', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                This certification does not expire
              </label>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Certification Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="certification-file-upload"
                  disabled={uploadingFiles}
                />
                <label
                  htmlFor="certification-file-upload"
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
                          {' '}certification documents
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
                    {editingId ? 'Update' : 'Add'} Certification
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Certifications List */}
      <div className="space-y-4">
        {certifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No certifications added</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Add your professional certifications to showcase your qualifications and expertise.
            </p>
          </div>
        ) : (
          certifications.map((certification) => (
            <div key={certification.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-start space-x-4 mb-3 sm:mb-0">
                  <div className="flex-shrink-0 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {certification.name}
                    </h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {certification.issuingOrganization}
                    </p>
                    {certification.credentialId && (
                      <p className="text-gray-600 dark:text-gray-400">
                        Credential ID: {certification.credentialId}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {certification.credentialUrl && (
                    <a
                      href={certification.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(certification)}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(certification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Calendar className="w-4 h-4 mr-1" />
                <span>
                  Issued: {new Date(certification.issueDate).toLocaleDateString()}
                  {certification.doesNotExpire ? ' (Does not expire)' : certification.expirationDate ? 
                    ` - Expires: ${new Date(certification.expirationDate).toLocaleDateString()}` : ''}
                </span>
              </div>

              {certification.attachments && certification.attachments.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Certification Documents ({certification.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {certification.attachments.map((file, index) => (
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