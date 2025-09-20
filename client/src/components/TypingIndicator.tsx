import { User } from '../types';
import styles from './TypingIndicator.module.css';

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
    <div className={styles.root}>
      <div className={styles.dots}>
        <div className={styles.dot}></div>
        <div className={`${styles.dot} ${styles.dot2}`}></div>
        <div className={`${styles.dot} ${styles.dot3}`}></div>
      </div>
      <span>
        {typingUsers.length === 1 
          ? `${typingUsers[0].username} печатает...`
          : `${typingUsers.length} человек печатают...`
        }
      </span>
    </div>
  );
}