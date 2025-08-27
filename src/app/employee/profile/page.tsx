// app/employee/profile/page.tsx
"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProfileModule from '@/components/Profile/ProfileModule';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  return <ProfileModule initialTab={tab as any} />;
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ProfilePageContent />
      </Suspense>
    </div>
  );
}