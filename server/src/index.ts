import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket from 'ws';
import path from 'path';
import { SocketManager } from './sockets';
import { store } from './store';
import { ChatSummary } from './types';
import { verifyToken, registerUser, loginUser } from './auth';
import { prisma } from './db';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Раздача фронтенда React (SPA)
app.use(express.static(path.join('../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join('../client/dist/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Registration
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.trim().length === 0 || password.length === 0) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.length > 20) return res.status(400).json({ error: 'Username too long (max 20 chars)' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 chars' });

    const authResponse = await registerUser(username.trim(), password);
    res.json(authResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const authResponse = await loginUser(username.trim(), password);
    res.json(authResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
});

// Users
app.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const userId = verifyToken(token);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const users = await store.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Messages
app.get('/messages/:peerId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const userId = verifyToken(token);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const { peerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;

    const messages = await store.getMessagesBetweenUsers(userId, peerId, limit, before);
    await Promise.all(messages.map(msg => {
      if (msg.receiverId === userId && !msg.readAt) return store.markMessageAsRead(msg.id, userId);
      return Promise.resolve();
    }));

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat summaries
app.get('/chats', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const userId = verifyToken(token);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const chats: ChatSummary[] = await store.getChatSummariesForUser(userId);
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket manager
const socketManager = new SocketManager(wss);

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
(async () => {
  try {
    await prisma.$connect();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to connect to database', error);
    process.exit(1);
  }
})();

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    prisma.$disconnect().finally(() => process.exit(0));
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
