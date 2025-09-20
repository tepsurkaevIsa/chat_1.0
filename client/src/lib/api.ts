import { User, Message, AuthResponse, ChatSummary } from '../types';
import { API_BASE_URL } from '../config';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async register(username: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    this.setToken(response.token);
    return response;
  }


  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getMessages(peerId: string, limit: number = 50, before?: string): Promise<Message[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (before) {
      params.append('before', before);
    }

    return this.request<Message[]>(`/messages/${peerId}?${params}`);
  }

  async getChats(): Promise<ChatSummary[]> {
    return this.request<ChatSummary[]>('/chats');
  }
}

export const apiClient = new ApiClient();