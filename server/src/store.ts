import { User, Message } from './types';

// In-memory storage for MVP
class Store {
  private users: Map<string, User> = new Map();
  private messages: Message[] = [];
  private onlineUsers: Set<string> = new Set();

  constructor() {
    // Initialize with demo users
    this.initializeDemoUsers();
  }

  private initializeDemoUsers() {
    const demoUsers = [
      { 
        id: '1', 
        username: 'Alice', 
        isOnline: false, 
        createdAt: new Date('2024-01-01') 
      },
      { 
        id: '2', 
        username: 'Bob', 
        isOnline: false, 
        createdAt: new Date('2024-01-01') 
      },
      { 
        id: '3', 
        username: 'Charlie', 
        isOnline: false, 
        createdAt: new Date('2024-01-01') 
      },
      { 
        id: '4', 
        username: 'Diana', 
        isOnline: false, 
        createdAt: new Date('2024-01-01') 
      },
      { 
        id: '5', 
        username: 'Eve', 
        isOnline: false, 
        createdAt: new Date('2024-01-01') 
      },
    ];

    demoUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

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

  markMessageAsRead(messageId: string, userId: string) {
    const message = this.messages.find(msg => msg.id === messageId);
    if (message && message.receiverId === userId) {
      message.readAt = new Date();
    }
  }
}

export const store = new Store();