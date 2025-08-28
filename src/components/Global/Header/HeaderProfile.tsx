"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';

interface ProfileData {
  displayName?: string;
  firstName: string;
  lastName: string;
  profileImage?: {
    secure_url: string;
  };
  email: string;
  designation?: string;
}

interface HeaderProfileProps {
  session?: Session | null;
}

export default function HeaderProfile({ session }: HeaderProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;

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
  }, [session]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/employee/login' });
  };

  // Get user initials safely
  const getUserInitials = () => {
    if (profileData?.displayName) {
      return profileData.displayName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
    }
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
    }
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
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
    return session?.user?.name || 'User';
  };

  // Get user email safely
  const getUserEmail = () => {
    return profileData?.email || session?.user?.email || 'user@example.com';
  };

  // Get user designation
  const getUserDesignation = () => {
    return profileData?.designation || 'Employee';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-15 h-15 rounded-full flex items-center justify-center overflow-hidden">
          {profileData?.profileImage?.secure_url ? (
            <img
              src={profileData.profileImage.secure_url}
              alt={getUserName()}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-base">
                {getUserInitials()}
              </span>
            </div>
          )}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {getUserName()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getUserDesignation()}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {getUserName()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {getUserEmail()}
              </p>
            </div>

            <Link
              href="/employee/profile"
              className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>



            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}