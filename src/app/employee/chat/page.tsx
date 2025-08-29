// app/employee/chat/page.tsx
"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatModule from '@/components/Chat/ChatModule';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';
  const chatId = searchParams.get('chatId');

  return <ChatModule initialTab={tab as any} selectedChatId={chatId || undefined} />;
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}