import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/Auth/LogoutButton';
import DeleteAccountButton from '@/components/Auth/DeleteAccountButton';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If user is not logged in, redirect to login
  if (!session) {
    redirect('/auth/employee/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employee Dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          <LogoutButton />
          <DeleteAccountButton userId={session.user.id} />
        </div>
      </div>
      <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-900 dark:text-white">Welcome, {session.user?.name}!</p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">Email: {session.user?.email}</p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">Mobile: {session.user?.mobile}</p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          Role: <span className="capitalize">{session.user?.role}</span>
        </p>
      </div>
      
      {/* Additional dashboard content for employees */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <ul className="space-y-2">
            <li>
              <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm">
                Update Profile
              </button>
            </li>
            <li>
              <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm">
                Change Password
              </button>
            </li>
            <li>
              <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm">
                View Schedule
              </button>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No recent activity
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Status
          </h2>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Email {session.user.emailVerified ? 'verified' : 'not verified'}
          </p>
        </div>
      </div>
    </div>
  );
}