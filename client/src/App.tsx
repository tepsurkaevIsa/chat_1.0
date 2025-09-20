import { useState, useEffect } from 'react';
import { Message, ChatState, PresenceData, TypingData, ChatSummary } from './types';
import { apiClient } from './lib/api';
import { socketClient } from './lib/socket';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ChatsSidebar } from './components/ChatsSidebar';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './components/ui/ThemeToggle';

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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isMobile, setIsMobile] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

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

  // Load users and chats when connected
  useEffect(() => {
    if (chatState.currentUser && chatState.isConnected) {
      loadUsers();
      loadChats();
    }
  }, [chatState.currentUser, chatState.isConnected]);

  // Track viewport to determine mobile vs desktop (Tailwind lg breakpoint = 1024px)
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 1024);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const loadUsers = async () => {
    try {
      const users = await apiClient.getUsers();
      setChatState(prev => ({ ...prev, users }));
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Не удалось загрузить пользователей');
    }
  };

  const loadChats = async () => {
    try {
      const list = await apiClient.getChats();
      setChats(list);
    } catch (error) {
      console.error('Error loading chats:', error);
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
      setError(error instanceof Error ? error.message : 'Ошибка входа');
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
      setError(error instanceof Error ? error.message : 'Ошибка регистрации');
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

    try {
      // Load messages for this conversation
      const messages = await apiClient.getMessages(userId, 50);
      setChatState(prev => ({ ...prev, messages }));
      // Reset unread counter for this chat
      setChats(prev => prev.map(c => c.otherUser.id === userId ? { ...c, unreadCount: 0 } : c));
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Не удалось загрузить сообщения');
    }
  };

  const handleBack = () => {
    setChatState(prev => ({ ...prev, currentChatUserId: null, messages: [] }));
    navigate('/chats');
  };

  // Extract chat id from route
  const chatIdFromPath = location.pathname.startsWith('/chat/')
    ? location.pathname.slice('/chat/'.length)
    : null;

  // Keep state in sync with route: when /chat/:id changes, load that conversation
  useEffect(() => {
    if (!chatIdFromPath) return;
    if (chatState.currentChatUserId !== chatIdFromPath) {
      handleUserSelect(chatIdFromPath);
    }
  }, [chatIdFromPath]);

  // On mobile, ensure root routes go to /chats; also clear selection on /users
  useEffect(() => {
    if (isMobile && (location.pathname === '/' || location.pathname === '')) {
      navigate('/chats', { replace: true });
    }
    if (isMobile && location.pathname === '/users') {
      setChatState(prev => ({ ...prev, currentChatUserId: null, messages: [] }));
    }
    if (!isMobile && location.pathname === '/users') {
      // If resized to desktop while on /users, keep the layout root
      navigate('/', { replace: true });
    }
  }, [isMobile, location.pathname]);

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
      setError('Ошибка подключения');
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

      // Update chats list (lastMessage/unread)
      const currentUserId = chatState.currentUser?.id;
      if (!currentUserId) return;
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      setChats(prev => {
        const existing = prev.find(c => c.otherUser.id === otherUserId);
        const isActive = chatState.currentChatUserId === otherUserId;
        if (existing) {
          const isFromOther = message.senderId === otherUserId;
          const unreadCount = isFromOther && !isActive ? existing.unreadCount + 1 : existing.unreadCount;
          return prev.map(c => c.otherUser.id === otherUserId ? { ...c, lastMessage: message, unreadCount } : c);
        } else {
          const otherUser = chatState.users.find(u => u.id === otherUserId);
          if (!otherUser) return prev;
          const unreadCount = message.senderId === otherUserId && !isActive ? 1 : 0;
          return [{ otherUser, lastMessage: message, unreadCount }, ...prev];
        }
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
      setChats(prev => prev.map(c => c.otherUser.id === data.userId ? { ...c, otherUser: { ...c.otherUser, isOnline: data.isOnline } } : c));
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
  }, [chatState.currentUser?.id, chatState.currentChatUserId]);

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
    <div className="h-screen bg-gray-100 dark:bg-gray-950 flex relative safe-area-inset-top safe-area-inset-bottom">
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 underline"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Theme toggle */}
      <div className="absolute top-3 right-3 z-30 hidden lg:block">
        <ThemeToggle />
      </div>

      {isMobile ? (
        // Mobile: use routes as separate pages
        <div className="flex-1 flex flex-col w-full h-full">
          <Routes>
            <Route
              path="/chats"
              element={
                <ChatsSidebar
                  chats={chats}
                  currentUser={chatState.currentUser}
                  currentChatUserId={chatState.currentChatUserId}
                  onChatSelect={(userId) => navigate(`/chat/${userId}`)}
                  onNewChat={() => navigate('/users')}
                />
              }
            />
            <Route
              path="/users"
              element={
                <Sidebar
                  users={chatState.users.filter(u => u.id !== chatState.currentUser!.id && !chats.find(c => c.otherUser.id === u.id))}
                  currentUser={chatState.currentUser}
                  currentChatUserId={chatState.currentChatUserId}
                  onUserSelect={(userId) => navigate(`/chat/${userId}`)}
                />
              }
            />
            <Route
              path="/chat/:id"
              element={
                <ChatWindow
                  currentUser={chatState.currentUser}
                  otherUser={currentChatUser || null}
                  messages={chatState.messages}
                  typingUsers={chatState.typingUsers}
                  onBack={handleBack}
                  onMenuToggle={() => navigate('/chats')}
                />
              }
            />
            <Route path="*" element={<Navigate to="/chats" replace />} />
          </Routes>
        </div>
      ) : (
        // Desktop: classic split view with persistent sidebar
        <>
          <div className="hidden lg:block lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur">
            <ChatsSidebar
              chats={chats}
              currentUser={chatState.currentUser}
              currentChatUserId={chatState.currentChatUserId}
              onChatSelect={(userId) => navigate(`/chat/${userId}`)}
              onNewChat={() => navigate('/users')}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <ChatWindow
              currentUser={chatState.currentUser}
              otherUser={currentChatUser || null}
              messages={chatState.messages}
              typingUsers={chatState.typingUsers}
              onBack={() => {}}
              onMenuToggle={() => {}}
            />
          </div>
        </>
      )}

      <div className="fixed bottom-4 right-4 z-20">
        <div className={`w-3 h-3 rounded-full ${
          chatState.isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} title={chatState.isConnected ? 'Подключено' : 'Отключено'} />
      </div>
    </div>
  );
}

export default App;