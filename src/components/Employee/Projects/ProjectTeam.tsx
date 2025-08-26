// components/Employee/Projects/ProjectTeam.tsx (Updated with Modal Integration)
"use client";
import { useState } from 'react';
import { ITeamMember } from '@/types/employee/projectmanagement';
import { formatDate, formatDistanceToNow } from '@/utils/dateUtils';
import TeamMemberAddModal from './TeamMemberAddModal';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Clock,
  UserCheck,
  UserX,
  Shield,
  Star,
  MoreVertical,
  Settings
} from 'lucide-react';

interface ProjectTeamProps {
  projectId: string;
  teamMembers: ITeamMember[];
  onRefresh: () => void;
}

export default function ProjectTeam({ projectId, teamMembers = [], onRefresh }: ProjectTeamProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const getRoleIcon = (role: string) => {
    const icons = {
      'project-manager': Shield,
      'developer': UserCheck,
      'designer': Star,
      'tester': UserCheck,
      'analyst': UserCheck,
      'client': UserX,
      'observer': UserX,
      'contributor': UserCheck
    };
    return icons[role as keyof typeof icons] || UserCheck;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'project-manager': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      'developer': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'designer': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      'tester': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'analyst': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'client': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'observer': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      'contributor': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
    };
    return colors[role as keyof typeof colors] || colors.contributor;
  };

  const getPermissionsBadge = (permissions: string[]) => {
    const importantPerms = permissions.filter(p => 
      ['edit-project', 'delete-project', 'manage-team'].includes(p)
    );
    
    if (importantPerms.length === 0) return null;
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
        Admin
      </span>
    );
  };

  const activeMembers = teamMembers.filter(member => member.isActive);
  const inactiveMembers = teamMembers.filter(member => !member.isActive);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {activeMembers.length} active members
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </button>
      </div>

      {/* Active Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Active Members ({activeMembers.length})
          </h3>
        </div>
        
        <div className="p-6">
          {activeMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeMembers.map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                const permissionsBadge = getPermissionsBadge(member.permissions);
                
                return (
                  <div key={member.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium text-lg">
                            {member.employeeName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {member.employeeName}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {member.role.replace('-', ' ')}
                            </span>
                            {permissionsBadge}
                          </div>
                        </div>
                      </div>
                      
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{member.employeeEmail}</span>
                      </div>
                      
                      {member.employeeMobile && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{member.employeeMobile}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          {member.totalHoursLogged || 0}h logged
                        </span>
                      </div>
                      
                      {member.hourlyRate && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Rate: ${member.hourlyRate}/hr</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                      </div>
                      
                      {member.permissions.length > 0 && (
                        <div className="mt-2">
                          <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center">
                            <Settings className="w-3 h-3 mr-1" />
                            {member.permissions.length} permissions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No active team members</p>
            </div>
          )}
        </div>
      </div>

      {/* Inactive Members (if any) */}
      {inactiveMembers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Former Members ({inactiveMembers.length})
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {inactiveMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {member.employeeName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.employeeName}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{member.role.replace('-', ' ')}</span>
                        {member.leftAt && (
                          <span>• Left {formatDate(member.leftAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {member.totalHoursLogged || 0}h logged
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Permissions Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Team Permissions Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'view-project', 'edit-project', 'delete-project', 
            'manage-team', 'create-tasks', 'edit-tasks',
            'assign-tasks', 'comment', 'upload-files'
          ].map(permission => {
            const count = activeMembers.filter(member => 
              member.permissions.includes(permission as any)
            ).length;
            
            return (
              <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {permission.replace('-', ' ')}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {count}/{activeMembers.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <TeamMemberAddModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}