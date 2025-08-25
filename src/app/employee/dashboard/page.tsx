import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DeleteAccountButton from '@/components/Employee/auth/DeleteAccountButton';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employee Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {session.user?.name}!
          </p>
        </div>
        <DeleteAccountButton userId={session.user.id} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Projects</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Pending Tasks</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">This Week's Hours</span>
              <span className="font-semibold text-green-600 dark:text-green-400">32</span>
            </div>

     
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No recent activity
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Name:</span> {session.user?.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Email:</span> {session.user?.email}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Mobile:</span> {session.user?.mobile}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Role:</span> {session.user?.role}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Status:</span>{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}