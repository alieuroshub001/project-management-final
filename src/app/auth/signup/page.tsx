// File: app/auth/signup/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Users, Briefcase, Shield, ArrowRight, LogIn } from 'lucide-react';

export default function SignupSelection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    
    // Add a small delay for better UX
    setTimeout(() => {
      switch(role) {
        case 'admin':
          router.push('/auth/signup/admin-euroshub-signup');
          break;
        case 'employee':
          router.push('/auth/signup/euroshub-employee-signup');
          break;
        case 'hr':
          router.push('/auth/signup/hr-signup-euroshub');
          break;
      }
    }, 300);
  };

  const roleOptions = [
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Full system access with management capabilities',
      icon: <Crown className="w-10 h-10 mx-auto text-purple-600" />,
      color: 'border-purple-200 hover:border-purple-400',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'hr',
      title: 'HR Professional',
      description: 'Access to employee management and HR resources',
      icon: <Users className="w-10 h-10 mx-auto text-blue-600" />,
      color: 'border-blue-200 hover:border-blue-400',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'employee',
      title: 'Team Member',
      description: 'Standard access for daily work activities',
      icon: <Briefcase className="w-10 h-10 mx-auto text-green-600" />,
      color: 'border-green-200 hover:border-green-400',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Shield className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Euroshub Account
          </h1>
          <p className="text-lg text-gray-600">
            Select your role to begin the registration process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {roleOptions.map((role) => (
            <div 
              key={role.id}
              className={`relative cursor-pointer transition-all duration-300 ${selectedRole === role.id ? 'scale-95' : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className={`relative bg-white rounded-lg shadow-sm p-6 h-full border-2 ${role.color} transition-colors duration-300 flex flex-col ${selectedRole === role.id ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}`}>
                <div className={`p-3 rounded-full ${role.bgColor} w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                  {role.icon}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-gray-900 text-center">
                  {role.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  {role.description}
                </p>
                <div className="mt-4 text-center">
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center">
                    Select <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center"
            >
              Sign in here <LogIn className="w-4 h-4 ml-1" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}