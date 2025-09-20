export interface User {
  id: string;
  username: string;
  password?: string; // Хешированный пароль
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  readAt?: Date;
}

export interface ChatSummary {
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
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
  data: any;
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