"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const ws_1 = __importDefault(require("ws"));
const sockets_1 = require("./sockets");
const store_1 = require("./store");
const auth_1 = require("./auth");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const wss = new ws_1.default.Server({ server });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        const authResponse = await (0, auth_1.registerUser)(username.trim(), password);
        res.json(authResponse);
    }
    catch (error) {
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
        const authResponse = await (0, auth_1.loginUser)(username.trim(), password);
        res.json(authResponse);
    }
    catch (error) {
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
        const userId = (0, auth_1.verifyToken)(token);
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const users = store_1.store.getAllUsers();
        res.json(users);
    }
    catch (error) {
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
        const userId = (0, auth_1.verifyToken)(token);
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const { peerId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before ? new Date(req.query.before) : undefined;
        let messages = store_1.store.getMessagesBetweenUsers(userId, peerId, limit);
        if (before) {
            messages = messages.filter(msg => msg.createdAt < before);
        }
        // Mark messages as read for the authenticated user
        messages.forEach(msg => {
            if (msg.receiverId === userId && !msg.readAt) {
                store_1.store.markMessageAsRead(msg.id, userId);
            }
        });
        res.json(messages);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get chat summaries for the authenticated user
app.get('/chats', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const userId = (0, auth_1.verifyToken)(token);
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const chats = store_1.store.getChatSummariesForUser(userId);
        res.json(chats);
    }
    catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Initialize socket manager
const socketManager = new sockets_1.SocketManager(wss);
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
