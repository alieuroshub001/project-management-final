"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SidebarLinks from './SidebarLinks';
import LogoutButton from '@/components/Auth/LogoutButton';

interface ProfileData {
  displayName?: string;
  firstName: string;
  lastName: string;
  profileImage?: {
    secure_url: string;
  };
  designation?: string;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setProfileData(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };

    fetchProfile();
  }, []);

  // Get user initials safely
  const getUserInitials = () => {
    if (profileData?.displayName) {
      return profileData.displayName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
    }
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  // Get user name safely
  const getUserName = () => {
    if (profileData?.displayName) {
      return profileData.displayName;
    }
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    return 'User Name';
  };

  // Get user designation
  const getUserDesignation = () => {
    return profileData?.designation || 'Employee';
  };

  return (
    <div className={`flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6.5 border-b border-gray-200 dark:border-gray-700">
        <Link 
          href="/employee/dashboard" 
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-1'}`}
        >
          <div className="w-2 h-14 bg-cyan-600 rounded-lg flex items-center justify-center">
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ProjectsHub
            </span>
          )}
        </Link>
        
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <SidebarLinks isCollapsed={isCollapsed} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                {profileData?.profileImage?.secure_url ? (
                  <img
                    src={profileData.profileImage.secure_url}
                    alt={getUserName()}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {getUserName()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {getUserDesignation()}
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Expand sidebar"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <LogoutButton compact={isCollapsed} />
        </div>
      </div>
    </div>
  );
}