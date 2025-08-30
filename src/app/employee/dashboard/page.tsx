import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DeleteAccountButton from '@/components/Auth/DeleteAccountButton';
import AttendanceCheckInOut from '@/components/Attendance/AttendanceCheckInOut';
import LeaveQuickActions from '@/components/Leave/LeaveQuickActions';
import ProjectDashboard from '@/components/Projects/ProjectDashboard';
import { 
  Clock, 
  Calendar, 
  FolderOpen, 
  BarChart3, 
  Users, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Timer,
  MapPin,
  Coffee,
  Heart,
  FileText,
  Target,
  Activity,
  Plus,
  Bell,
  Settings,
  LogOut,
  Home,
  Briefcase,
  Award,
  Info,
  ChevronRight,
  Star
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/employee/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Employee Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {session.user?.name}! Here's your overview for today.
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <DeleteAccountButton userId={session.user.id} />
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                <p className="text-xs text-green-600 dark:text-green-400">+1 this week</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Tasks</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">2 due today</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week's Hours</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">32</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">8h remaining</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Leave Balance</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">days remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Attendance & Quick Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Attendance Check In/Out */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Attendance Management
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Office Location
                </div>
              </div>
              <AttendanceCheckInOut onSuccess={() => {}} />
            </div>

            {/* Project Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Project Overview
                </h2>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    New Project
                  </button>
                  <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    View All
                  </button>
                </div>
              </div>
              
              {/* Project Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">In Progress</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">2</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">1</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Due Soon</p>
                      <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">1</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Recent Projects */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Projects</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Employee Portal Redesign</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Frontend Development</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                        In Progress
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">75%</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">API Documentation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Backend Documentation</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                        Completed
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">100%</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Mobile App Testing</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Quality Assurance</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                        Overdue
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">45%</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Leave Management
                </h2>
                <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Leave
                </button>
              </div>

              {/* Leave Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Annual Leave</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">8 days</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div className="bg-green-600 dark:bg-green-400 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">8 of 20 days used</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Sick Leave</p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">3 days</p>
                    </div>
                    <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" style={{width: '30%'}}></div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">3 of 10 days used</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Personal Leave</p>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-100">2 days</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                    <div className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">2 of 5 days used</p>
                </div>
              </div>

              {/* Leave Quick Actions */}
              <LeaveQuickActions onActionClick={(action) => console.log('Leave action:', action)} />
            </div>
          </div>

          {/* Right Column - Today's Info & Activities */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Schedule
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Team Stand-up</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">9:00 AM - 9:30 AM</p>
                  </div>
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">Code Review Session</p>
                    <p className="text-sm text-green-700 dark:text-green-300">2:00 PM - 3:00 PM</p>
                  </div>
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-purple-900 dark:text-purple-100">Sprint Planning</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">4:00 PM - 5:00 PM</p>
                  </div>
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Break Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Coffee className="w-5 h-5 mr-2" />
                Break Management
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-3" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tea Break</span>
                  </div>
                  <button className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors">
                    Start Break
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 text-green-600 dark:text-green-400 mr-3" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Prayer Break</span>
                  </div>
                  <button className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors">
                    Start Prayer
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-3" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Lunch Break</span>
                  </div>
                  <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors">
                    Start Lunch
                  </button>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Account Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{session.user?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{session.user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mobile</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{session.user?.mobile}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{session.user?.role}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <button className="flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">Team Directory</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>

                <button className="flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">Performance</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>

                <button className="flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">Office Map</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Completed task: <span className="font-medium">User Authentication Module</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Checked in at <span className="font-medium">9:15 AM</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">This morning</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Milestone reached: <span className="font-medium">Beta Release</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Yesterday</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      Updated profile: <span className="font-medium">Added new skills</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                Upcoming Deadlines
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Mobile App Testing</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Due tomorrow</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                    Urgent
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">Code Review</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Due in 3 days</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                    Medium
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Documentation Update</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Due in 1 week</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                    Low
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Performance Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Task Completion Rate</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{width: '92%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">On-Time Delivery</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">88%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{width: '88%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Code Quality Score</span>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{width: '95%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Full Width Project Dashboard */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FolderOpen className="w-5 h-5 mr-2" />
              Project Management Dashboard
            </h2>
            <div className="flex space-x-3">
              <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                <Target className="w-4 h-4 mr-2" />
                New Project
              </button>
              <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                View All Projects
              </button>
            </div>
          </div>
          
          {/* Mini Project Dashboard */}
          <ProjectDashboard 
            onProjectSelect={(projectId) => console.log('Selected project:', projectId)}
            showStatistics={false}
          />
        </div>

        {/* Weekly Overview */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Weekly Performance Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">32</div>
              <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Hours Worked</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Target: 40 hours</div>
              <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-1 mt-3">
                <div className="bg-indigo-600 dark:bg-indigo-400 h-1 rounded-full" style={{width: '80%'}}></div>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">8</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Tasks Completed</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">+25% from last week</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
                <span className="text-xs text-green-600 dark:text-green-400">Trending up</span>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">2</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Milestones</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Achieved this week</div>
              <div className="flex items-center justify-center mt-2">
                <Award className="w-3 h-3 text-purple-600 dark:text-purple-400 mr-1" />
                <span className="text-xs text-purple-600 dark:text-purple-400">Great job!</span>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">95%</div>
              <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Productivity</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Above average</div>
              <div className="flex items-center justify-center mt-2">
                <Star className="w-3 h-3 text-amber-600 dark:text-amber-400 mr-1" />
                <span className="text-xs text-amber-600 dark:text-amber-400">Excellent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Announcements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Team Announcements
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">New Security Guidelines</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Please review the updated security protocols for remote work.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Posted 1 hour ago</p>
                  </div>
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 dark:text-green-100">Team Building Event</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Join us for the monthly team lunch this Friday at 1 PM.
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">Posted yesterday</p>
                  </div>
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Q3 Performance Reviews</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Performance review cycle starts next Monday. Please prepare your self-assessment.
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Posted 3 days ago</p>
                  </div>
                  <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/employee/profile" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">My Profile</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </a>

              <a href="/employee/attendance" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Attendance</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </a>

              <a href="/employee/projects" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center">
                  <FolderOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Projects</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </a>

              <a href="/employee/leave" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Leave</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </a>

              <a href="/employee/reports" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Reports</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </a>

              <a href="/employee/team" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Team</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </a>

              <a href="/employee/settings" className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Settings</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </a>

              <button className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
                <div className="flex items-center">
                  <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Logout</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Employee Portal v2.0 | Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
