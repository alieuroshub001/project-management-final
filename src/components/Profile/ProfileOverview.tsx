// components/Employee/Profile/ProfileOverview.tsx
"use client";
import { useState, useEffect } from 'react';
import { IEmployeeProfile, IProfileWithDetails } from '@/types/profile';
import {
  MapPin,
  Calendar,
  Mail,
  Phone,
  User,
  Briefcase,
  Edit,
  Download,
  Camera,
  Star,
  Award,
  GraduationCap,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Shield,
  RefreshCw
} from 'lucide-react';

interface ProfileOverviewProps {
  onEditClick: () => void;
}

export default function ProfileOverview({ onEditClick }: ProfileOverviewProps) {
  const [profile, setProfile] = useState<IProfileWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching profile...'); // Debug log
      
      const response = await fetch('/api/profile?includeDetails=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Prevent caching issues
      });
      
      console.log('Response status:', response.status); // Debug log
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText); // Debug log
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      if (!data.data) {
        throw new Error('No profile data received');
      }

      setProfile(data.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCompletionIcon = (percentage: number) => {
    if (percentage >= 80) return CheckCircle;
    return AlertCircle;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Profile Load Error</h3>
            <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchProfile}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
          {error.includes('Profile not found') && (
            <button
              onClick={onEditClick}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Create Profile
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Profile Found</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          You don't have a profile yet. Create one to get started with the employee portal.
        </p>
        <button
          onClick={onEditClick}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Create Profile
        </button>
      </div>
    );
  }

  const CompletionIcon = getCompletionIcon(profile.completionPercentage);

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          {profile.coverImage && (
            <img
              src={profile.coverImage.secure_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <button className="absolute top-4 right-4 p-2 bg-black/30 rounded-lg text-white hover:bg-black/50 transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative">
          {/* Profile Picture */}
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage.secure_url}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.displayName || `${profile.firstName} ${profile.lastName}`}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {profile.designation} {profile.department && `• ${profile.department}`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Employee ID: {profile.employeeId}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onEditClick}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              {profile.resume && (
                <a
                  href={profile.resume.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Resume
                </a>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">{profile.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">{profile.mobile}</span>
            </div>
            {profile.workLocation && (
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">{profile.workLocation}</span>
              </div>
            )}
            {profile.dateOfJoining && (
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">
                  Joined {new Date(profile.dateOfJoining).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Profile Completion */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CompletionIcon className={`w-5 h-5 mr-2 ${getCompletionColor(profile.completionPercentage)}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profile Completion
                </span>
              </div>
              <span className={`text-sm font-bold ${getCompletionColor(profile.completionPercentage)}`}>
                {profile.completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  profile.completionPercentage >= 80 ? 'bg-green-500' :
                  profile.completionPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${profile.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Years of Service</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.yearsOfService || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Education</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.education?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.experience?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Certifications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.certifications?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Education */}
          {profile.education && profile.education.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Recent Education
              </h2>
              <div className="space-y-4">
                {profile.education.slice(0, 2).map((edu) => (
                  <div key={edu.id} className="border-l-4 border-indigo-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(edu.startDate).getFullYear()} - 
                      {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ' N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Experience */}
          {profile.experience && profile.experience.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Recent Experience
              </h2>
              <div className="space-y-4">
                {profile.experience.slice(0, 2).map((exp) => (
                  <div key={exp.id} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{exp.position}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(exp.startDate).getFullYear()} - 
                      {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).getFullYear()}` : ' N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Members */}
          {profile.teamMembers && profile.teamMembers.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Members
              </h2>
              <div className="space-y-3">
                {profile.teamMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      {member.profileImage ? (
                        <img
                          src={member.profileImage.secure_url}
                          alt={member.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.displayName || `${member.firstName} ${member.lastName}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reporting Manager */}
          {profile.reportingManagerDetails && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Reporting Manager
              </h2>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  {profile.reportingManagerDetails.profileImage ? (
                    <img
                      src={profile.reportingManagerDetails.profileImage.secure_url}
                      alt={profile.reportingManagerDetails.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile.reportingManagerDetails.displayName || 
                     `${profile.reportingManagerDetails.firstName} ${profile.reportingManagerDetails.lastName}`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.reportingManagerDetails.designation}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {profile.reportingManagerDetails.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Social Links */}
          {profile.socialLinks && profile.socialLinks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ExternalLink className="w-5 h-5 mr-2" />
                Social Links
              </h2>
              <div className="space-y-3">
                {profile.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Languages
              </h2>
              <div className="space-y-2">
                {profile.languages.map((lang, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {lang.language} {lang.isPrimary && "(Primary)"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {lang.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}