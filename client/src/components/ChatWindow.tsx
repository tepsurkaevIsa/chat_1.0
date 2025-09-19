import { useState, useEffect, useRef } from 'react';
import { User, Message as MessageType } from '../types';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';
import { Send, ArrowLeft } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { useSwipe } from '../hooks/useSwipe';

interface ChatWindowProps {
  currentUser: User;
  otherUser: User | null;
  messages: MessageType[];
  typingUsers: Set<string>;
  onBack: () => void;
  onMenuToggle?: () => void;
}

export function ChatWindow({ 
  currentUser, 
  otherUser, 
  messages, 
  typingUsers, 
  onBack,
  onMenuToggle
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number>();

  // Swipe gestures for mobile
  const swipeHandlers = useSwipe({
    onSwipeRight: () => onMenuToggle?.(),
    threshold: 50,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (messageText.trim() && !isTyping) {
      setIsTyping(true);
      if (otherUser) {
        socketClient.sendTyping(otherUser.id, true);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (messageText.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (otherUser) {
          socketClient.sendTyping(otherUser.id, false);
        }
      }, 1000);
    } else {
      setIsTyping(false);
      if (otherUser) {
        socketClient.sendTyping(otherUser.id, false);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, otherUser, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !otherUser) return;

    try {
      socketClient.sendMessage(otherUser.id, messageText.trim());
      setMessageText('');
      setIsTyping(false);
      if (otherUser) {
        socketClient.sendTyping(otherUser.id, false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a user to start chatting
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Choose someone from the sidebar to begin your conversation
          </p>
          <button
            onClick={onMenuToggle}
            className="lg:hidden px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Open Users List
          </button>
        </div>
      </div>
    );
  }

  const typingUsersList = Array.from(typingUsers)
    .map(userId => ({ id: userId, username: 'Someone', isOnline: true }))
    .filter(user => user.id !== currentUser.id);

  return (
    <div 
      className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full"
      {...swipeHandlers}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
              {otherUser.username.charAt(0).toUpperCase()}
            </div>
            {otherUser.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {otherUser.username}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {otherUser.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8 px-4">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              currentUser={currentUser}
              otherUser={otherUser}
            />
          ))
        )}
        
        {/* Typing indicator */}
        <TypingIndicator 
          users={typingUsersList} 
          currentUserId={currentUser.id} 
        />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={!otherUser}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || !otherUser}
            className="px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}