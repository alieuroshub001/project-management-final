// components/Chat/ChatModuleServer.tsx
import ChatModuleClient from './ChatModuleClient';

type TabType = 'dashboard' | 'chats' | 'announcements' | 'settings';

interface ChatModuleServerProps {
  initialTab?: TabType;
  selectedChatId?: string;
}

export default function ChatModuleServer(props: ChatModuleServerProps) {
  return <ChatModuleClient {...props} />;
}