import { useMemo, useState } from 'react';
import { ChatSummary, User } from '../types';
import { Plus, Users, Search } from 'lucide-react';

interface ChatsSidebarProps {
  chats: ChatSummary[];
  currentUser: User;
  currentChatUserId: string | null;
  onChatSelect: (userId: string) => void;
  onNewChat: () => void;
}

export function ChatsSidebar({ chats, currentUser, currentChatUserId, onChatSelect, onNewChat }: ChatsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => c.otherUser.username.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  return (
    <div className="w-80 lg:w-80 w-full bg-white/80 dark:bg-gray-900/70 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full backdrop-blur">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold shadow-sm">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentUser.username}</h2>
            <p className="text-sm text-green-500">В сети</p>
          </div>
          <button onClick={onNewChat} className="px-2 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-1">
            <Plus className="w-4 h-4" />
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по чатам..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/70 dark:bg-gray-800/70 dark:text-white"
          />
        </div>
      </div>

      {/* Chats list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredChats.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Пока нет чатов</div>
        ) : (
          <div className="space-y-2">
            {filteredChats.map(({ otherUser, lastMessage, unreadCount }) => (
              <button
                key={otherUser.id}
                onClick={() => onChatSelect(otherUser.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  currentChatUserId === otherUser.id
                    ? 'bg-primary-50/80 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/60'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-700 flex items-center justify-center text-white font-semibold">
                    {otherUser.username.charAt(0).toUpperCase()}
                  </div>
                  {otherUser.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{otherUser.username}</h4>
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lastMessage.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

