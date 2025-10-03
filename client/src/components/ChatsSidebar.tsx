import { useMemo, useState } from 'react';
import { ChatSummary, User } from '../types';
import { Plus, Users, Search } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import styles from './ChatsSidebar.module.css';
import { Avatar } from './ui/Avatar';
import { SearchInput } from './ui/SearchInput';

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
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <Avatar name={currentUser.username} variant="primary" />
          <div className={styles.userBlock}>
            <h2 className={styles.userName}>{currentUser.username}</h2>
            <p className={styles.online}>В сети</p>
          </div>
          <div className={styles.controls}>
            <button onClick={onNewChat} className={`${styles.newChatBtn} ${styles.desktopOnly}`} aria-label="Новый чат">
              <Plus width={16} height={16} />
              <Users width={16} height={16} />
            </button>
            <div className={styles.mobileOnly}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.search}>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по чатам..."
          icon={<Search width={16} height={16} />}
        />
      </div>

      <div className={styles.list}>
        {filteredChats.length === 0 ? (
          <div className={styles.empty}>Пока нет чатов</div>
        ) : (
          <div className={styles.items}>
            {filteredChats.map(({ otherUser, lastMessage, unreadCount }) => (
              <button
                key={otherUser.id}
                onClick={() => onChatSelect(otherUser.id)}
                className={`${styles.item} ${currentChatUserId === otherUser.id ? styles.itemActive : ''}`}
              >
                <Avatar name={otherUser.username} online={otherUser.isOnline} size="md" />
                <div className={styles.itemText}>
                  <div className={styles.itemTop}>
                    <h4 className={styles.itemName}>{otherUser.username}</h4>
                    {unreadCount > 0 && (
                      <span className={styles.badge}>{unreadCount}</span>
                    )}
                  </div>
                  <p className={styles.itemLast}>{lastMessage.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB to go to Users */}
      <button
        onClick={onNewChat}
        className={styles.fab}
        aria-label="К пользователям"
        title="К пользователям"
      >
        <Users width={22} height={22} />
      </button>
    </div>
  );
}

