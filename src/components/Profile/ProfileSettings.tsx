// components/Employee/Profile/ProfileSettings.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Download,
  Mail,
  Smartphone,
  Globe,
  UserX
} from 'lucide-react';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  profileUpdates: boolean;
  teamAnnouncements: boolean;
  birthdayReminders: boolean;
  workAnniversaries: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'team' | 'manager' | 'private';
  showEmail: boolean;
  showMobile: boolean;
  showBirthday: boolean;
  showWorkAnniversary: boolean;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

interface AccountSettings {
  deleteAccount: boolean;
  deleteConfirmation: string;
  feedback: string;
}

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    profileUpdates: true,
    teamAnnouncements: true,
    birthdayReminders: true,
    workAnniversaries: true
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'team',
    showEmail: true,
    showMobile: false,
    showBirthday: true,
    showWorkAnniversary: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    deleteAccount: false,
    deleteConfirmation: '',
    feedback: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch settings');
      }

      if (data.data) {
        setNotificationSettings(data.data.notifications || notificationSettings);
        setPrivacySettings(data.data.privacy || privacySettings);
        setSecuritySettings(prev => ({ 
          ...prev, 
          twoFactorEnabled: data.data.twoFactorEnabled || false 
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handlePrivacyChange = (field: keyof PrivacySettings, value: any) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSecurityChange = (field: keyof SecuritySettings, value: string | boolean) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleAccountChange = (field: keyof AccountSettings, value: string | boolean) => {
    setAccountSettings(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const validatePassword = () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }

    if (securitySettings.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const validateDeleteAccount = () => {
    if (accountSettings.deleteConfirmation.toLowerCase() !== 'delete my account') {
      setError('Please type "delete my account" to confirm');
      return false;
    }

    return true;
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save notification settings');
      }

      setSuccess('Notification settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/settings/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacySettings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save privacy settings');
      }

      setSuccess('Privacy settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: securitySettings.currentPassword,
          newPassword: securitySettings.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setSecuritySettings(prev => ({ 
        ...prev, 
        currentPassword: '',
        newPassword: '',
        confirmPassword: '' 
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/settings/two-factor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !securitySettings.twoFactorEnabled })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update two-factor authentication');
      }

      setSecuritySettings(prev => ({ 
        ...prev, 
        twoFactorEnabled: !prev.twoFactorEnabled 
      }));
      setSuccess(`Two-factor authentication ${!securitySettings.twoFactorEnabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update two-factor authentication');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/profile/export');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to export data');
      }

      // Create download link
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Data exported successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDeleteAccount()) {
      return;
    }

    if (!confirm('Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove all your data from our servers.')) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/settings/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: accountSettings.feedback
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      // Redirect to home page or show success message
      setSuccess('Account deleted successfully. Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
          <p className="text-gray-500 dark:text-gray-400 mt-2">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
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

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Notification Settings</h2>
        </div>

        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                Email Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                <Smartphone className="w-4 h-4 mr-1" />
                Push Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={notificationSettings.profileUpdates}
                onChange={(e) => handleNotificationChange('profileUpdates', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Profile Update Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={notificationSettings.teamAnnouncements}
                onChange={(e) => handleNotificationChange('teamAnnouncements', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Team Announcements
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={notificationSettings.birthdayReminders}
                onChange={(e) => handleNotificationChange('birthdayReminders', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Birthday Reminders
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={notificationSettings.workAnniversaries}
                onChange={(e) => handleNotificationChange('workAnniversaries', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Work Anniversary Reminders
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Saving...
                </div>
              ) : (
                'Save Notification Settings'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Privacy Settings</h2>
        </div>

        <form onSubmit={handleSavePrivacy} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Visibility
            </label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="public">Public (Everyone)</option>
              <option value="team">Team Members Only</option>
              <option value="manager">Manager Only</option>
              <option value="private">Private (Only Me)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={privacySettings.showEmail}
                onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Email Address
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={privacySettings.showMobile}
                onChange={(e) => handlePrivacyChange('showMobile', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Mobile Number
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={privacySettings.showBirthday}
                onChange={(e) => handlePrivacyChange('showBirthday', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Birthday
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={privacySettings.showWorkAnniversary}
                onChange={(e) => handlePrivacyChange('showWorkAnniversary', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Work Anniversary
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Saving...
                </div>
              ) : (
                'Save Privacy Settings'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Security Settings</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={securitySettings.currentPassword}
                  onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={securitySettings.newPassword}
                  onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={securitySettings.confirmPassword}
                  onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.twoFactorEnabled}
                  onChange={handleToggleTwoFactor}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Two-Factor Authentication
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Changing...
                </div>
              ) : (
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">Account Settings</h2>
        </div>

        <form onSubmit={handleDeleteAccount} className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Danger Zone</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={accountSettings.deleteAccount}
              onChange={(e) => handleAccountChange('deleteAccount', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
            />
            <label className="ml-2 text-sm font-medium text-red-700 dark:text-red-300">
              I understand that this action cannot be undone
            </label>
          </div>

          {accountSettings.deleteAccount && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type "delete my account" to confirm
                </label>
                <input
                  type="text"
                  value={accountSettings.deleteConfirmation}
                  onChange={(e) => handleAccountChange('deleteConfirmation', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-red-500 focus:ring-red-500"
                  placeholder="delete my account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  rows={3}
                  value={accountSettings.feedback}
                  onChange={(e) => handleAccountChange('feedback', e.target.value)}
                  placeholder="Please let us know why you're deleting your account..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving || !accountSettings.deleteAccount}
              className={`px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                saving || !accountSettings.deleteAccount ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}