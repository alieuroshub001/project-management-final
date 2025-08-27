// components/Employee/Projects/TeamMemberAddModal.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  ITeamMemberAddRequest, 
  TeamRole, 
  TeamPermission,
  IProjectApiResponse
} from '@/types/projectmanagement';
import {
  X,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  UserCheck
} from 'lucide-react';

interface TeamMemberAddModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  isAvailable: boolean;
}

interface IEmployeeSearchResponse {
  success: boolean;
  message: string;
  data?: {
    employees: EmployeeOption[];
  };
  error?: string;
}

export default function TeamMemberAddModal({ 
  projectId, 
  onClose, 
  onSuccess 
}: TeamMemberAddModalProps) {
  const [formData, setFormData] = useState<ITeamMemberAddRequest>({
    employeeId: '',
    role: 'contributor',
    permissions: ['view-project'],
    hourlyRate: undefined
  });

  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);

  const roleOptions: { value: TeamRole; label: string; description: string }[] = [
    { value: 'project-manager', label: 'Project Manager', description: 'Full project control and management' },
    { value: 'developer', label: 'Developer', description: 'Code development and implementation' },
    { value: 'designer', label: 'Designer', description: 'UI/UX design and creative work' },
    { value: 'tester', label: 'Tester', description: 'Quality assurance and testing' },
    { value: 'analyst', label: 'Analyst', description: 'Business analysis and requirements' },
    { value: 'client', label: 'Client', description: 'External stakeholder with limited access' },
    { value: 'observer', label: 'Observer', description: 'View-only access to project' },
    { value: 'contributor', label: 'Contributor', description: 'General project contributor' }
  ];

  const permissionOptions: { value: TeamPermission; label: string; description: string; category: string }[] = [
    { value: 'view-project', label: 'View Project', description: 'Access to view project details', category: 'Basic' },
    { value: 'edit-project', label: 'Edit Project', description: 'Modify project settings and details', category: 'Project' },
    { value: 'delete-project', label: 'Delete Project', description: 'Delete the entire project', category: 'Project' },
    { value: 'manage-team', label: 'Manage Team', description: 'Add/remove team members and assign roles', category: 'Team' },
    { value: 'create-tasks', label: 'Create Tasks', description: 'Create new tasks in the project', category: 'Tasks' },
    { value: 'edit-tasks', label: 'Edit Tasks', description: 'Modify existing tasks', category: 'Tasks' },
    { value: 'delete-tasks', label: 'Delete Tasks', description: 'Remove tasks from the project', category: 'Tasks' },
    { value: 'assign-tasks', label: 'Assign Tasks', description: 'Assign tasks to team members', category: 'Tasks' },
    { value: 'comment', label: 'Comment', description: 'Add comments to tasks and project', category: 'Communication' },
    { value: 'upload-files', label: 'Upload Files', description: 'Upload attachments and documents', category: 'Files' },
    { value: 'track-time', label: 'Track Time', description: 'Log time entries for tasks', category: 'Time' },
    { value: 'view-reports', label: 'View Reports', description: 'Access project reports and analytics', category: 'Reports' }
  ];

  // Role-based default permissions
  const getRolePermissions = (role: TeamRole): TeamPermission[] => {
    switch (role) {
      case 'project-manager':
        return [
          'view-project', 'edit-project', 'manage-team', 'create-tasks', 
          'edit-tasks', 'assign-tasks', 'comment', 'upload-files', 
          'track-time', 'view-reports'
        ];
      case 'developer':
        return [
          'view-project', 'create-tasks', 'edit-tasks', 'comment', 
          'upload-files', 'track-time'
        ];
      case 'designer':
        return [
          'view-project', 'create-tasks', 'edit-tasks', 'comment', 
          'upload-files', 'track-time'
        ];
      case 'tester':
        return [
          'view-project', 'create-tasks', 'edit-tasks', 'comment', 
          'upload-files', 'track-time'
        ];
      case 'analyst':
        return [
          'view-project', 'create-tasks', 'edit-tasks', 'comment', 
          'upload-files', 'view-reports'
        ];
      case 'client':
        return ['view-project', 'comment'];
      case 'observer':
        return ['view-project'];
      case 'contributor':
        return ['view-project', 'comment', 'upload-files'];
      default:
        return ['view-project'];
    }
  };

  const searchEmployees = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setEmployees([]);
      return;
    }

    setSearchLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/employee/projects/employee-search?q=${encodeURIComponent(query)}&projectId=${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }
      
      const data: IEmployeeSearchResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to search employees');
      }
      
      setEmployees(data.data?.employees || []);
      
    } catch (err) {
      console.error('Failed to search employees:', err);
      if (err instanceof Error) {
        if (err.message.includes('non-JSON response')) {
          setError('Server error: Please check if the employee search API endpoint exists and is working correctly.');
        } else if (err.message.includes('404')) {
          setError('Employee search API not found. Please ensure the endpoint is implemented.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to search employees. Please try again.');
      }
      setEmployees([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchEmployees(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, projectId]);

  const handleRoleChange = (role: TeamRole) => {
    const defaultPermissions = getRolePermissions(role);
    setFormData(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions
    }));
  };

  const togglePermission = (permission: TeamPermission) => {
    const currentPermissions = formData.permissions || [];
    const hasPermission = currentPermissions.includes(permission);
    
    if (hasPermission) {
      setFormData(prev => ({
        ...prev,
        permissions: currentPermissions.filter(p => p !== permission)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...currentPermissions, permission]
      }));
    }
  };

  const validateForm = () => {
    if (!formData.employeeId) {
      setError('Please select an employee');
      return false;
    }
    if (!formData.role) {
      setError('Please select a role');
      return false;
    }
    if (!formData.permissions || formData.permissions.length === 0) {
      setError('Please select at least one permission');
      return false;
    }
    if (formData.hourlyRate !== undefined && formData.hourlyRate < 0) {
      setError('Hourly rate cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare the data with employee details
      const submitData = {
        ...formData,
        employeeName: selectedEmployee?.name,
        employeeEmail: selectedEmployee?.email,
        employeeMobile: selectedEmployee?.mobile
      };

      const response = await fetch(`/api/employee/projects/${projectId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data: IProjectApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      onSuccess();
      onClose();

    } catch (err) {
      console.error('Add team member error:', err);
      if (err instanceof Error) {
        if (err.message.includes('non-JSON response')) {
          setError('Server error: Please check if the team API endpoint exists and is working correctly.');
        } else if (err.message.includes('404')) {
          setError('Team management API not found. Please ensure the endpoint is implemented.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to add team member. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = permissionOptions.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, typeof permissionOptions>);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-4">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Team Member</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Invite a new member to join the project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Employee Selection */}
          <div className="space-y-6">
            {/* Employee Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Search Employee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email (min 2 characters)..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  minLength={2}
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Type at least 2 characters to search for employees
              </p>

              {/* Search Results */}
              {searchQuery.length >= 2 && employees.length > 0 && (
                <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                  {employees.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => {
                        if (employee.isAvailable) {
                          setSelectedEmployee(employee);
                          setFormData(prev => ({ ...prev, employeeId: employee.id }));
                        }
                      }}
                      disabled={!employee.isAvailable}
                      className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors ${
                        employee.isAvailable
                          ? selectedEmployee?.id === employee.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-3">
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{employee.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{employee.mobile}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full mr-2">
                            {employee.role}
                          </span>
                          {employee.isAvailable ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <span className="text-xs text-red-600 dark:text-red-400">Already member</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && employees.length === 0 && !searchLoading && (
                <div className="mt-3 text-center py-4 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No employees found matching "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try a different search term or check the spelling</p>
                </div>
              )}

              {searchQuery.length >= 1 && searchQuery.length < 2 && (
                <div className="mt-3 text-center py-2 text-gray-400 dark:text-gray-500 text-sm">
                  Please enter at least 2 characters to search
                </div>
              )}
            </div>

            {/* Selected Employee */}
            {selectedEmployee && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Selected Employee</h4>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {selectedEmployee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-indigo-900 dark:text-indigo-100">{selectedEmployee.name}</p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">{selectedEmployee.email}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">{selectedEmployee.mobile}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      Role: {selectedEmployee.role}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Project Role <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {roleOptions.map(option => (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all ${
                      formData.role === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={(e) => handleRoleChange(e.target.value as TeamRole)}
                      className="sr-only"
                    />
                    <div className="flex items-center w-full">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {option.description}
                        </div>
                      </div>
                      {formData.role === option.value && (
                        <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hourly Rate (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for time tracking and billing calculations
              </p>
            </div>
          </div>

          {/* Right Column - Permissions */}
          <div>
            <div className="sticky top-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions <span className="text-red-500">*</span>
              </label>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      {category}
                    </h5>
                    <div className="space-y-2">
                      {permissions.map(permission => (
                        <label
                          key={permission.value}
                          className="flex items-start cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions?.includes(permission.value) || false}
                            onChange={() => togglePermission(permission.value)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {permission.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Permissions can be modified later in team settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedEmployee}
            className={`px-6 py-3 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors ${
              loading || !selectedEmployee ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Adding Member...
              </div>
            ) : (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Add Team Member
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}