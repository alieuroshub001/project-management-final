// app/employee/attendance/page.tsx
"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AttendanceModule from '@/components/Employee/Attendance/AttendanceModule';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';

  return <AttendanceModule initialTab={tab as any} />;
}

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <AttendancePageContent />
      </Suspense>
    </div>
  );
}