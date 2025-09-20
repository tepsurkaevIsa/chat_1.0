import { Message as MessageType, User } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './Message.module.css';

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
    <div className={`${styles.row} ${isOwn ? styles.end : styles.start}`}>
      <div className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}>
        <div className={styles.meta}>
          <div className={styles.avatar}>
            {sender.username.charAt(0).toUpperCase()}
          </div>
          <span className={styles.sender}>
            {sender.username}
          </span>
        </div>
        <p className={styles.text}>{message.text}</p>
        <div className={styles.bottom}>
          <span className={`${styles.time} ${isOwn ? '' : styles.timeOther}`}>
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: ru })}
          </span>
          {isOwn && message.readAt && (
            <span style={{ opacity: 0.75, marginLeft: '0.5rem', fontSize: 12, flexShrink: 0 }}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}