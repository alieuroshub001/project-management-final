// components/Employee/Profile/PublicProfileView.tsx
"use client";
import { useState, useEffect } from 'react';
import { IEmployeeProfile } from '@/types/profile';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Mail,
  Phone,
  User,
  Briefcase,
  Star,
  Award,
  GraduationCap,
  ExternalLink,
  Shield,
  Clock,
  Loader2
} from 'lucide-react';

interface PublicProfileViewProps {
  profileId: string;
  onBack: () => void;
}

export default function PublicProfileView({ profileId, onBack }: PublicProfileViewProps) {
  const [profile, setProfile] = useState<IEmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/employees/${profileId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      if (!data.success || !data.data) {
        throw new Error('Profile not found or not accessible');
      }

      setProfile(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to search
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
            Profile Not Available
          </h3>
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to search
        </button>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Profile not found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This profile may not exist or is not publicly visible.
          </p>
        </div>
      </div>
    );
  }

  const yearsOfService = profile.dateOfJoining 
    ? Math.floor((new Date().getTime() - new Date(profile.dateOfJoining).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to search
      </button>

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
          </div>

          <div className="mb-6">
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

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
            </div>
          )}

          {/* Contact Info (based on privacy settings) */}
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
                {yearsOfService}
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

          {/* Certifications */}
          {profile.certifications && profile.certifications.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Certifications
              </h2>
              <div className="space-y-4">
                {profile.certifications.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="border-l-4 border-yellow-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{cert.issuingOrganization}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Issued: {new Date(cert.issueDate).toLocaleDateString()}
                      {cert.doesNotExpire ? ' (Does not expire)' : cert.expirationDate ? 
                        ` - Expires: ${new Date(cert.expirationDate).toLocaleDateString()}` : ''}
                    </p>
                    {cert.credentialId && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {cert.credentialId}
                      </p>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-1"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Social Links */}
          {profile.socialLinks && profile.socialLinks.filter(link => link.isPublic).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ExternalLink className="w-5 h-5 mr-2" />
                Social Links
              </h2>
              <div className="space-y-3">
                {profile.socialLinks.filter(link => link.isPublic).map((link, index) => (
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

          {/* Contact Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <a
                  href={`mailto:${profile.email}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  {profile.email}
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-3" />
                <a
                  href={`tel:${profile.mobile}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  {profile.mobile}
                </a>
              </div>
              {profile.workLocation && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {profile.workLocation}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}</div>
            </div>
          )}

          {/* Recent Education */}
          {profile.education && profile.education.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Education
              </h2>
              <div className="space-y-4">
                {profile.education.slice(0, 3).map((edu) => (
                  <div key={edu.id} className="border-l-4 border-indigo-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(edu.startDate).getFullYear()} - 
                      {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ' N/A'}
                    </p>
                    {edu.grade && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Grade: {edu.grade}
                      </p>
                    )}
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
                Work Experience
              </h2>
              <div className="space-y-4">
                {profile.experience.slice(0, 3).map((exp) => (
                  <div key={exp.id} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{exp.position}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                    {exp.location && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{exp.location}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(exp.startDate).getFullYear()} - 
                      {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).getFullYear()}` : ' N/A'}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}