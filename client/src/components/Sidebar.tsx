import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Users, MessageCircle, Search } from 'lucide-react';
import styles from './Sidebar.module.css';
import { ThemeToggle } from './ui/ThemeToggle';

interface SidebarProps {
  users: User[];
  currentUser: User;
  currentChatUserId: string | null;
  onUserSelect: (userId: string) => void;
}

export function Sidebar({ users, currentUser, currentChatUserId, onUserSelect }: SidebarProps) {
  const navigate = useNavigate();
  const otherUsers = users.filter(user => user.id !== currentUser.id);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return otherUsers;
    return otherUsers.filter(user => user.username.toLowerCase().includes(q));
  }, [otherUsers, searchQuery]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.avatar}>
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userBlock}>
            <h2 className={styles.userName}>{currentUser.username}</h2>
            <p className={styles.online}>В сети</p>
          </div>
          <div className={styles.controls}>
            <button
              onClick={() => navigate('/chats')}
              aria-label="К чатам"
              title="К чатам"
              className={styles.controlBtn}
            >
              <MessageCircle width={20} height={20} />
              <span className={styles.btnText}>Чаты</span>
            </button>
            <div className={styles.mobileOnly}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.list}>
        <div className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <Users width={20} height={20} />
            <h3 className={styles.sectionTitle}>Пользователи</h3>
          </div>

          <div className={styles.search}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по нику..."
              className={styles.searchInput}
            />
          </div>
          
          <div>
            {filteredUsers.length === 0 ? (
              <div className={styles.userStatus}>Ничего не найдено</div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onUserSelect(user.id)}
                  className={`${styles.userItem} ${currentChatUserId === user.id ? styles.userItemActive : ''}`}
                >
                  <div className={styles.userAvatarWrap}>
                    <div className={styles.userAvatar}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {user.isOnline && (
                      <div className={styles.onlineDot}></div>
                    )}
                  </div>
                  <div className={styles.itemText}
                  >
                    <div className={styles.userNameRow}>
                      <h4 className={styles.userNameText}>
                        {user.username}
                      </h4>
                      {user.isOnline && (
                        <div className={styles.userNameDot}></div>
                      )}
                    </div>
                    <p className={styles.userStatus}>
                      {user.isOnline ? 'В сети' : 'Не в сети'}
                    </p>
                  </div>
                  <MessageCircle className={styles.msgIcon} />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}