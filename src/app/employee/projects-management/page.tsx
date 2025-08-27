// app/employee/projects/page.tsx
"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProjectModule from '@/components/Projects/ProjectModule';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';
  const selectedProjectId = searchParams.get('project');

  return (
    <ProjectModule 
      initialTab={tab as any} 
      selectedProjectId={selectedProjectId || undefined}
    />
  );
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ProjectsPageContent />
      </Suspense>
    </div>
  );
}