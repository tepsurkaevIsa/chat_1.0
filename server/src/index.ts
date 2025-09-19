import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket from 'ws';
import { SocketManager } from './sockets';
import { store } from './store';
import { verifyToken, registerUser, loginUser } from './auth';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Registration endpoint
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (username.length > 20) {
      return res.status(400).json({ error: 'Username too long (max 20 characters)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const authResponse = await registerUser(username.trim(), password);
    res.json(authResponse);
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(400).json({ error: message });
  }
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const authResponse = await loginUser(username.trim(), password);
    res.json(authResponse);
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(401).json({ error: message });
  }
});


// Get all users
app.get('/users', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const users = store.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages between two users
app.get('/messages/:peerId', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { peerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;

    let messages = store.getMessagesBetweenUsers(userId, peerId, limit);

    if (before) {
      messages = messages.filter(msg => msg.createdAt < before);
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize socket manager
const socketManager = new SocketManager(wss);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  // Demo users log removed
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});