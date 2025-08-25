// app/employee/leave/page.tsx
"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LeaveModule from '@/components/Employee/Leave/LeaveModule';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function LeavePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'balance';

  return <LeaveModule initialTab={tab as any} />;
}

export default function LeavePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <LeavePageContent />
      </Suspense>
    </div>
  );
}