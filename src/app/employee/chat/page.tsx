// app/employee/chat/page.tsx
"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatModule from '@/components/Chat/ChatModule';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');
  const tab = searchParams.get('tab') || 'chats';

  // For now, just pass the ChatModule without props until you update it
  return <ChatModule />;
}

export default function ChatPage() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}