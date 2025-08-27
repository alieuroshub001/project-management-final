"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VerifyOTPFormProps {
  email: string;
  type: 'verification' | 'password-reset';
}

export default function VerifyOTPForm({ email, type }: VerifyOTPFormProps) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For password reset, validate passwords match
      if (type === 'password-reset' && newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          otp,
          type,
          ...(type === 'password-reset' && { newPassword })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setSuccess(data.message);
      
      // Redirect to login after short delay
      setTimeout(() => {
        router.push('/auth/employee/login');
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {type === 'password-reset' ? 'Reset Password' : 'Verify Email'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter the OTP sent to {email}
          </p>
        </div>
        {error && (
          <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-20 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded relative">
            {success}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="otp" className="sr-only">
                OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            
            {type === 'password-reset' && (
              <>
                <div>
                  <label htmlFor="newPassword" className="sr-only">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading 
                ? type === 'password-reset' ? 'Processing...' : 'Verifying...' 
                : type === 'password-reset' ? 'Reset Password' : 'Verify OTP'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <button
            onClick={() => router.push('/auth/employee/login')}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}