import { User, Message, ChatSummary } from './types';

// In-memory storage for MVP
class Store {
  private users: Map<string, User> = new Map();
  private messages: Message[] = [];
  private onlineUsers: Set<string> = new Set();

  constructor() {}

  // User management
  addUser(username: string, password?: string): User {
    const id = Date.now().toString();
    const user: User = {
      id,
      username,
      password,
      isOnline: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  setUserOnline(userId: string, isOnline: boolean) {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      if (isOnline) {
        this.onlineUsers.add(userId);
      } else {
        this.onlineUsers.delete(userId);
      }
    }
  }

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers);
  }

  // Message management
  addMessage(senderId: string, receiverId: string, text: string): Message {
    const message: Message = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      text,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  getMessagesBetweenUsers(userId1: string, userId2: string, limit: number = 50): Message[] {
    return this.messages
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit);
  }

  getRecentMessages(userId: string, limit: number = 20): Message[] {
    return this.messages
      .filter(msg => msg.senderId === userId || msg.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getChatSummariesForUser(userId: string): ChatSummary[] {
    // Group messages by the other participant
    const conversationMap: Map<string, { lastMessage: Message; unreadCount: number }> = new Map();

    for (const msg of this.messages) {
      if (msg.senderId !== userId && msg.receiverId !== userId) continue;

      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const current = conversationMap.get(otherId);

      const isUnreadForUser = msg.receiverId === userId && !msg.readAt;

      if (!current) {
        conversationMap.set(otherId, {
          lastMessage: msg,
          unreadCount: isUnreadForUser ? 1 : 0,
        });
      } else {
        if (msg.createdAt > current.lastMessage.createdAt) {
          current.lastMessage = msg;
        }
        if (isUnreadForUser) {
          current.unreadCount += 1;
        }
      }
    }

    const summaries: ChatSummary[] = [];
    for (const [otherId, data] of conversationMap.entries()) {
      const otherUser = this.getUser(otherId);
      if (!otherUser) continue;
      summaries.push({ otherUser, lastMessage: data.lastMessage, unreadCount: data.unreadCount });
    }

    // Sort by last message time desc
    summaries.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
    return summaries;
  }

  markMessageAsRead(messageId: string, userId: string) {
    const message = this.messages.find(msg => msg.id === messageId);
    if (message && message.receiverId === userId) {
      message.readAt = new Date();
    }
  }
}

export const store = new Store();