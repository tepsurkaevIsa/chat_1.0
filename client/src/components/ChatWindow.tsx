import { useState, useEffect, useRef } from 'react';
import { User, Message as MessageType } from '../types';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';
import { MessageCircle, Send } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { useSwipe } from '../hooks/useSwipe';
import { ThemeToggle } from './ui/ThemeToggle';
import styles from './ChatWindow.module.css';
import { Avatar } from './ui/Avatar';

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
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

  // Stabilize scroll after viewport changes (e.g., mobile keyboard open/close)
  useEffect(() => {
    const stabilize = () => {
      const container = messagesContainerRef.current;
      if (!container) return;
      // Keep scrolled to bottom so latest messages remain visible
      container.scrollTop = container.scrollHeight;
    };

    const handleViewportChange = () => {
      // Delay to allow layout to settle after keyboard animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(stabilize);
        });
      });
    };

    const vv = (window as any).visualViewport as VisualViewport | undefined;
    vv?.addEventListener('resize', handleViewportChange);
    vv?.addEventListener('scroll', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    
    // Additional mobile-specific handlers
    const handleTouchEnd = () => {
      // Ensure scroll position is maintained after touch interactions
      setTimeout(stabilize, 50);
    };
    
    const handleScroll = () => {
      // Prevent scroll jumping on mobile
      const container = messagesContainerRef.current;
      if (container) {
        // If user scrolled up, don't force to bottom
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          container.scrollTop = container.scrollHeight;
        }
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      vv?.removeEventListener('resize', handleViewportChange);
      vv?.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      
      if (container) {
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Adjust CSS var to avoid overlapping input by on-screen keyboard (mobile)
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;

    const updateKbAvoid = () => {
      const heightDelta = Math.max(0, window.innerHeight - vv.height);
      const safeBottom = (window as any).CSS?.env ? 0 : 0; // env(safe-area-inset-bottom) handled in CSS
      const avoid = Math.max(0, heightDelta - safeBottom);
      
      // Apply on root of this component
      const container = messagesContainerRef.current?.parentElement as HTMLElement | null;
      if (container) {
        container.style.setProperty('--kb-avoid-bottom', `${avoid}px`);
        
        // Also update document root for global mobile handling
        document.documentElement.style.setProperty('--kb-avoid-bottom', `${avoid}px`);
      }
      
      // Force scroll to bottom when keyboard opens/closes
      const messagesContainer = messagesContainerRef.current;
      if (messagesContainer) {
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      }
    };

    updateKbAvoid();
    vv.addEventListener('resize', updateKbAvoid);
    vv.addEventListener('scroll', updateKbAvoid);
    window.addEventListener('orientationchange', updateKbAvoid);
    
    // Also listen for focus events on inputs to handle keyboard
    const handleInputFocus = () => {
      setTimeout(updateKbAvoid, 100); // Small delay to let keyboard animation start
    };
    
    const handleInputBlur = () => {
      setTimeout(updateKbAvoid, 100); // Small delay to let keyboard animation finish
    };
    
    document.addEventListener('focusin', handleInputFocus);
    document.addEventListener('focusout', handleInputBlur);
    
    return () => {
      vv.removeEventListener('resize', updateKbAvoid);
      vv.removeEventListener('scroll', updateKbAvoid);
      window.removeEventListener('orientationchange', updateKbAvoid);
      document.removeEventListener('focusin', handleInputFocus);
      document.removeEventListener('focusout', handleInputBlur);
    };
  }, []);

  // Measure header and input heights to set CSS vars for scroll padding
  useEffect(() => {
    const applySizes = () => {
      const rootEl = messagesContainerRef.current?.parentElement as HTMLElement | null;
      if (!rootEl) return;
      const headerH = headerRef.current?.getBoundingClientRect().height ?? 0;
      const inputH = inputBarRef.current?.getBoundingClientRect().height ?? 0;
      rootEl.style.setProperty('--chat-header-h', `${Math.round(headerH)}px`);
      rootEl.style.setProperty('--chat-input-h', `${Math.round(inputH)}px`);
    };
    applySizes();
    const ro = new ResizeObserver(applySizes);
    if (headerRef.current) ro.observe(headerRef.current);
    if (inputBarRef.current) ro.observe(inputBarRef.current);
    window.addEventListener('resize', applySizes);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', applySizes);
    };
  }, []);

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
      <div className={styles.header} ref={headerRef}>
        <div className={styles.headerRow}>
          {/* Back button removed per request */}
          <Avatar name={otherUser.username} online={otherUser.isOnline} />
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

      <div className={styles.messages} ref={messagesContainerRef}>
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

      <div className={styles.inputBar} ref={inputBarRef}>
        <form onSubmit={handleSendMessage} className={styles.form} autoComplete="off">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            onBlur={() => {
              // When keyboard closes, ensure scroll remains functional and at bottom
              const container = messagesContainerRef.current;
              if (container) {
                // Use multiple requestAnimationFrame calls to ensure proper timing
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    container.scrollTop = container.scrollHeight;
                  });
                });
              }
            }}
            placeholder="Введите сообщение..."
            className={styles.textInput}
            disabled={!otherUser}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            inputMode="text"
            enterKeyHint="send"
            name="chat-message"
            spellCheck={true}
          />
          <button type="submit" disabled={!messageText.trim() || !otherUser} className={styles.sendBtn} aria-label="Отправить">
            <Send width={20} height={20} />
          </button>
        </form>
      </div>
    </div>
  );
}