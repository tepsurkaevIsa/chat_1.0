import { useState, useEffect, useRef } from 'react';
import { User, Message as MessageType } from '../types';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';
import { MessageCircle, Send } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { useSwipe } from '../hooks/useSwipe';
import { ThemeToggle } from './ui/ThemeToggle';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  currentUser: User;
  otherUser: User | null;
  messages: MessageType[];
  typingUsers: Set<string>;
  onMenuToggle?: () => void;
}

export function ChatWindow({ 
  currentUser, 
  otherUser, 
  messages, 
  typingUsers, 
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
      <div className={`${styles.root} ${styles.emptyWrap}`}>
        <div className={styles.emptyInner}>
          <div className={styles.emptyIconWrap}>
            <Send width={32} height={32} color="#9ca3af" />
          </div>
          <h3 className={styles.emptyTitle}>
            Выберите собеседника, чтобы начать чат
          </h3>
          <p className={styles.emptyText}>
            Выберите кого-нибудь в боковой панели, чтобы начать разговор
          </p>
          <button
            onClick={onMenuToggle}
            className={styles.emptyBtn}
          >
            Открыть список пользователей
          </button>
        </div>
      </div>
    );
  }

  const typingUsersList = Array.from(typingUsers)
    .map(userId => ({ id: userId, username: 'Someone', isOnline: true }))
    .filter(user => user.id !== currentUser.id);

  return (
    <div className={styles.root} {...swipeHandlers}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          {/* Back button removed per request */}
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {otherUser.username.charAt(0).toUpperCase()}
            </div>
            {otherUser.isOnline && <div className={styles.onlineDot}></div>}
          </div>
          <div className={styles.titleWrap}>
            <h2 className={styles.title}>{otherUser.username}</h2>
            <p className={styles.subtitle}>{otherUser.isOnline ? 'В сети' : 'Не в сети'}</p>
          </div>
          <button onClick={onMenuToggle} className={`${styles.controlBtn} ${styles.mobileOnly}`} aria-label="Меню">
              <MessageCircle width={20} height={20} />
              <span className={styles.btnText}>Чаты</span>
          </button>
          <div className={styles.mobileOnly}>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>Пока нет сообщений. Начните разговор!</div>
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

        <TypingIndicator users={typingUsersList} currentUserId={currentUser.id} />
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputBar}>
        <form onSubmit={handleSendMessage} className={styles.form}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className={styles.textInput}
            disabled={!otherUser}
          />
          <button type="submit" disabled={!messageText.trim() || !otherUser} className={styles.sendBtn} aria-label="Отправить">
            <Send width={20} height={20} />
          </button>
        </form>
      </div>
    </div>
  );
}