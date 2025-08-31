// components/Chat/index.ts

// Main chat module exports
export { default as ChatModuleServer } from './ChatModuleServer';
export { default as ChatModuleClient } from './ChatModuleClient';
export { default as EnhancedChatModule } from './EnhancedChatModule';

// Individual component exports
export { default as WhatsAppChatList } from './WhatsAppChatList';
export { default as ChatWindow } from './ChatWindow';
export { default as MessageBubble } from './MessageBubble';
export { default as MessageInput } from './MessageInput';

// Legacy components (keep for compatibility)
export { default as ChatModule } from './ChatModule';
export { default as ChatList } from './ChatList';
export { default as ChatDetails } from './ChatDetails';
export { default as ChatDashboard } from './ChatDashboard';
export { default as ChatCard } from './ChatCard';
export { default as MessageItem } from './MessageItem';
export { default as NewChatModal } from './NewChatModal';
export { default as ChatFilters } from './ChatFilters';

// Named exports
export { ChatSettings } from './ChatSettings';
export { AnnouncementCenter } from './AnnouncementCenter';
export { ChatQuickActions } from './ChatQuickActions';
export { ChatInfo } from './ChatInfo';

// Hook export
export { useChat } from '@/hooks/useChat';