// components/Employee/Profile/ProfileEdit.tsx
"use client";
import { useState, useEffect } from 'react';
import { IEmployeeProfile, IProfileUpdateRequest, EmploymentType } from '@/types/profile';
import { 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  FileText,
  Loader2
} from 'lucide-react';

interface ProfileEditProps {
  onSuccess?: () => void;
}

export default function ProfileEdit({ onSuccess }: ProfileEditProps) {
  const [profile, setProfile] = useState<IEmployeeProfile | null>(null);
  const [formData, setFormData] = useState<IProfileUpdateRequest>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const employmentTypes: { value: EmploymentType; label: string }[] = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'temporary', label: 'Temporary' }
  ];

  const fetchProfile = async () => {
    try {
      setFetchLoading(true);
      setError('');
      
      const response = await fetch('/api/profile');
      
      if (response.status === 404) {
        // No profile exists - this is normal for new users
        console.log('No profile found - user needs to create one');
        setProfile(null);
        setIsCreatingNew(true);
        
        // Initialize form with empty data for new profile
        setFormData({
          firstName: '',
          lastName: '',
          displayName: '',
          dateOfJoining: undefined,
          dateOfBirth: undefined,
          designation: '',
          department: '',
          bio: '',
          skills: [],
          workLocation: '',
          employmentType: 'full-time'
        });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      if (data.success && data.data) {
        setProfile(data.data);
        setIsCreatingNew(false);
        
        // Initialize form with existing profile data
        setFormData({
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          displayName: data.data.displayName,
          dateOfJoining: data.data.dateOfJoining ? new Date(data.data.dateOfJoining) : undefined,
          dateOfBirth: data.data.dateOfBirth ? new Date(data.data.dateOfBirth) : undefined,
          designation: data.data.designation,
          department: data.data.department,
          bio: data.data.bio,
          skills: data.data.skills || [],
          workLocation: data.data.workLocation,
          employmentType: data.data.employmentType
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (field: keyof IProfileUpdateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSkillsChange = (skillsText: string) => {
    const skills = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const method = isCreatingNew ? 'POST' : 'PUT';
      const response = await fetch('/api/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isCreatingNew ? 'create' : 'update'} profile`);
      }

      setSuccess(`Profile ${isCreatingNew ? 'created' : 'updated'} successfully!`);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isCreatingNew ? 'create' : 'update'} profile`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        dateOfJoining: profile.dateOfJoining ? new Date(profile.dateOfJoining) : undefined,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
        designation: profile.designation,
        department: profile.department,
        bio: profile.bio,
        skills: profile.skills || [],
        workLocation: profile.workLocation,
        employmentType: profile.employmentType
      });
    } else {
      // Reset to empty form for new profile
      setFormData({
        firstName: '',
        lastName: '',
        displayName: '',
        dateOfJoining: undefined,
        dateOfBirth: undefined,
        designation: '',
        department: '',
        bio: '',
        skills: [],
        workLocation: '',
        employmentType: 'full-time'
      });
    }
    setError('');
    setSuccess('');
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isCreatingNew ? 'Preparing profile creation...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isCreatingNew ? 'Create Your Profile' : 'Edit Profile'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isCreatingNew 
                  ? 'Fill in your details to create your employee profile'
                  : 'Update your personal and professional information'
                }
              </p>
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
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName || ''}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="How you'd like to be known"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation || ''}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    placeholder="Your job title"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Your department"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfJoining ? formData.dateOfJoining.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('dateOfJoining', e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType || 'full-time'}
                    onChange={(e) => handleInputChange('employmentType', e.target.value as EmploymentType)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {employmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={formData.workLocation || ''}
                    onChange={(e) => handleInputChange('workLocation', e.target.value)}
                    placeholder="Your work location/office"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                About
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself, your interests, and what motivates you..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  maxLength={1000}
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {(formData.bio || '').length}/1000 characters
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Skills
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills (comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={formData.skills?.join(', ') || ''}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  placeholder="e.g., JavaScript, React, Project Management, Communication"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Separate multiple skills with commas
                </div>
                {formData.skills && formData.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
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
                disabled={loading}
                className={`px-8 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    {isCreatingNew ? 'Creating...' : 'Saving...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    {isCreatingNew ? 'Create Profile' : 'Save Changes'}
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