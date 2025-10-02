"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const ws_1 = __importDefault(require("ws"));
const path_1 = __importDefault(require("path"));
const sockets_1 = require("./sockets");
const store_1 = require("./store");
const auth_1 = require("./auth");
const db_1 = require("./db");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const wss = new ws_1.default.Server({ server });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        if (username.length > 20)
            return res.status(400).json({ error: 'Username too long (max 20 chars)' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 chars' });
        const authResponse = await (0, auth_1.registerUser)(username.trim(), password);
        res.json(authResponse);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
});
// Login
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: 'Username and password required' });
        const authResponse = await (0, auth_1.loginUser)(username.trim(), password);
        res.json(authResponse);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
});
// Users
app.get('/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ error: 'Authentication required' });
        const userId = (0, auth_1.verifyToken)(token);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const users = await store_1.store.getAllUsers();
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Messages
app.get('/messages/:peerId', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ error: 'Authentication required' });
        const userId = (0, auth_1.verifyToken)(token);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const { peerId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before ? new Date(req.query.before) : undefined;
        const messages = await store_1.store.getMessagesBetweenUsers(userId, peerId, limit, before);
        await Promise.all(messages.map(msg => {
            if (msg.receiverId === userId && !msg.readAt)
                return store_1.store.markMessageAsRead(msg.id, userId);
            return Promise.resolve();
        }));
        res.json(messages);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chat summaries
app.get('/chats', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ error: 'Authentication required' });
        const userId = (0, auth_1.verifyToken)(token);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const chats = await store_1.store.getChatSummariesForUser(userId);
        res.json(chats);
    }
    catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Абсолютный путь к сборке фронтенда
const clientPath = path_1.default.join(__dirname, '../../client/dist');
// Раздаём статику
app.use(express_1.default.static(clientPath));
// Любой другой GET — отдаём index.html
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});
// WebSocket manager
const socketManager = new sockets_1.SocketManager(wss);
// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
(async () => {
    try {
        await db_1.prisma.$connect();
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 WebSocket server ready`);
        });
    }
    catch (error) {
        console.error('Failed to connect to database', error);
        process.exit(1);
    }
})();
// Graceful shutdown
const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        db_1.prisma.$disconnect().finally(() => process.exit(0));
    });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
