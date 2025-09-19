import { Message as MessageType, User } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MessageProps {
  message: MessageType;
  currentUser: User;
  otherUser: User;
}

export function Message({ message, currentUser, otherUser }: MessageProps) {
  const isOwn = message.senderId === currentUser.id;
  const sender = isOwn ? currentUser : otherUser;
  const createdAt = new Date(message.createdAt);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 sm:mb-4`}>
      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-primary-500 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
      }`}>
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {sender.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium opacity-75 truncate">
            {sender.username}
          </span>
        </div>
        <p className="text-sm break-words">{message.text}</p>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs opacity-75 ${
            isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: ru })}
          </span>
          {isOwn && message.readAt && (
            <span className="text-xs opacity-75 ml-2 flex-shrink-0">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}