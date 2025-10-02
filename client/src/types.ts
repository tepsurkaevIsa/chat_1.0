export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  readAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface WebSocketMessage {
  type: 'message:send' | 'message:new' | 'presence' | 'typing' | 'error';
  data: unknown;
}

export interface TypingData {
  from: string;
  to: string;
  isTyping: boolean;
}

export interface PresenceData {
  userId: string;
  isOnline: boolean;
}

export interface ChatState {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  currentChatUserId: string | null;
  isConnected: boolean;
  typingUsers: Set<string>;
}

export interface ChatSummary {
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
}