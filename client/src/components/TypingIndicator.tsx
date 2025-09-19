import { User } from '../types';

interface TypingIndicatorProps {
  users: User[];
  currentUserId: string;
}

export function TypingIndicator({ users, currentUserId }: TypingIndicatorProps) {
  const typingUsers = users.filter(user => user.id !== currentUserId);
  
  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>
        {typingUsers.length === 1 
          ? `${typingUsers[0].username} is typing...`
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </div>
  );
}