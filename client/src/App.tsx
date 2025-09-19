import { useState, useEffect } from 'react';
import { Message, ChatState, PresenceData, TypingData } from './types';
import { apiClient } from './lib/api';
import { socketClient } from './lib/socket';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';

function App() {
  const [chatState, setChatState] = useState<ChatState>({
    currentUser: null,
    users: [],
    messages: [],
    currentChatUserId: null,
    isConnected: false,
    typingUsers: new Set(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Initialize app
  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedToken = localStorage.getItem('chatToken');
    const savedUser = localStorage.getItem('chatUser');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setChatState(prev => ({ ...prev, currentUser: user }));
        apiClient.setToken(savedToken);
        socketClient.connect(savedToken);
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('chatToken');
        localStorage.removeItem('chatUser');
      }
    }
  }, []);

  // Load users when connected
  useEffect(() => {
    if (chatState.currentUser && chatState.isConnected) {
      loadUsers();
    }
  }, [chatState.currentUser, chatState.isConnected]);

  const loadUsers = async () => {
    try {
      const users = await apiClient.getUsers();
      setChatState(prev => ({ ...prev, users }));
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await apiClient.login(username, password);
      
      // Save to localStorage
      localStorage.setItem('chatToken', authResponse.token);
      localStorage.setItem('chatUser', JSON.stringify(authResponse.user));
      
      setChatState(prev => ({ 
        ...prev, 
        currentUser: authResponse.user,
        isConnected: false 
      }));

      // Connect to WebSocket
      socketClient.connect(authResponse.token);
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await apiClient.register(username, password);
      
      // Save to localStorage
      localStorage.setItem('chatToken', authResponse.token);
      localStorage.setItem('chatUser', JSON.stringify(authResponse.user));
      
      setChatState(prev => ({ 
        ...prev, 
        currentUser: authResponse.user,
        isConnected: false 
      }));

      // Connect to WebSocket
      socketClient.connect(authResponse.token);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };


  // const handleLogout = () => {
  //   socketClient.disconnect();
  //   localStorage.removeItem('chatToken');
  //   localStorage.removeItem('chatUser');
  //   setChatState({
  //     currentUser: null,
  //     users: [],
  //     messages: [],
  //     currentChatUserId: null,
  //     isConnected: false,
  //     typingUsers: new Set(),
  //   });
  // };

  const handleUserSelect = async (userId: string) => {
    if (chatState.currentChatUserId === userId) return;

    setChatState(prev => ({ ...prev, currentChatUserId: userId, messages: [] }));
    setIsMobileMenuOpen(false); // Close mobile menu when user is selected

    try {
      // Load messages for this conversation
      const messages = await apiClient.getMessages(userId, 50);
      setChatState(prev => ({ ...prev, messages }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleBack = () => {
    setChatState(prev => ({ ...prev, currentChatUserId: null, messages: [] }));
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // WebSocket event handlers
  useEffect(() => {
    const handleConnected = () => {
      setChatState(prev => ({ ...prev, isConnected: true }));
      setError(null);
    };

    const handleDisconnected = () => {
      setChatState(prev => ({ ...prev, isConnected: false }));
    };

    const handleError = (error: any) => {
      console.error('Socket error:', error);
      setError('Connection error');
    };

    const handleMessage = (message: Message) => {
      setChatState(prev => {
        // Only add message if it's for the current conversation
        if (prev.currentChatUserId && 
            (message.senderId === prev.currentChatUserId || message.receiverId === prev.currentChatUserId)) {
          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        }
        return prev;
      });
    };

    const handlePresence = (data: PresenceData) => {
      setChatState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === data.userId 
            ? { ...user, isOnline: data.isOnline }
            : user
        )
      }));
    };

    const handleTyping = (data: TypingData) => {
      setChatState(prev => {
        const newTypingUsers = new Set(prev.typingUsers);
        if (data.isTyping) {
          newTypingUsers.add(data.from);
        } else {
          newTypingUsers.delete(data.from);
        }
        return { ...prev, typingUsers: newTypingUsers };
      });
    };

    // Register event handlers
    socketClient.on('connected', handleConnected);
    socketClient.on('disconnected', handleDisconnected);
    socketClient.on('error', handleError);
    socketClient.on('message:new', handleMessage);
    socketClient.on('presence', handlePresence);
    socketClient.on('typing', handleTyping);

    return () => {
      socketClient.off('connected');
      socketClient.off('disconnected');
      socketClient.off('error');
      socketClient.off('message:new');
      socketClient.off('presence');
      socketClient.off('typing');
    };
  }, []);

  // Show auth forms if not authenticated
  if (!chatState.currentUser) {
    if (authMode === 'login') {
      return (
        <LoginForm 
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthMode('register')}
          isLoading={isLoading} 
        />
      );
    } else {
      return (
        <RegisterForm 
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthMode('login')}
          isLoading={isLoading} 
        />
      );
    }
  }

  const currentChatUser = chatState.users.find(user => user.id === chatState.currentChatUserId);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex relative safe-area-inset-top safe-area-inset-bottom">
      {/* Error banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40`}>
        <Sidebar
          users={chatState.users}
          currentUser={chatState.currentUser}
          currentChatUserId={chatState.currentChatUserId}
          onUserSelect={handleUserSelect}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <ChatWindow
          currentUser={chatState.currentUser}
          otherUser={currentChatUser || null}
          messages={chatState.messages}
          typingUsers={chatState.typingUsers}
          onBack={handleBack}
          onMenuToggle={toggleMobileMenu}
        />
      </div>

      {/* Connection status indicator */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className={`w-3 h-3 rounded-full ${
          chatState.isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} title={chatState.isConnected ? 'Connected' : 'Disconnected'} />
      </div>
    </div>
  );
}

export default App;