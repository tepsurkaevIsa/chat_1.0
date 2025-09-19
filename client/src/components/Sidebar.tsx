import { User } from '../types';
import { Users, MessageCircle } from 'lucide-react';

interface SidebarProps {
  users: User[];
  currentUser: User;
  currentChatUserId: string | null;
  onUserSelect: (userId: string) => void;
}

export function Sidebar({ users, currentUser, currentChatUserId, onUserSelect }: SidebarProps) {
  const otherUsers = users.filter(user => user.id !== currentUser.id);

  return (
    <div className="w-80 lg:w-80 w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentUser.username}
            </h2>
            <p className="text-sm text-green-500">Online</p>
          </div>
          {/* Close button for mobile */}
          <button className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Users
            </h3>
          </div>
          
          <div className="space-y-2">
            {otherUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  currentChatUserId === user.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {user.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.username}
                    </h4>
                    {user.isOnline && (
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                <MessageCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}