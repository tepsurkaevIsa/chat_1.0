"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketManager = void 0;
const ws_1 = __importDefault(require("ws"));
const store_1 = require("./store");
const auth_1 = require("./auth");
class SocketManager {
    constructor(wss) {
        this.clients = new Map();
        this.typingUsers = new Map(); // userId -> Set of users typing to them
        this.wss = wss;
        this.setupWebSocketServer();
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection');
            // Set up heartbeat
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            // Handle authentication
            const token = this.extractTokenFromUrl(req.url);
            if (!token) {
                ws.close(1008, 'Authentication required');
                return;
            }
            const userId = (0, auth_1.verifyToken)(token);
            if (!userId) {
                ws.close(1008, 'Invalid token');
                return;
            }
            ws.userId = userId;
            this.clients.set(userId, ws);
            // Set user as online
            void store_1.store.setUserOnline(userId, true).catch((err) => console.error('Failed to set user online:', err));
            this.broadcastPresence(userId, true);
            // Send recent messages to the user
            void this.sendRecentMessages(ws, userId);
            // Handle messages
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    void this.handleMessage(ws, message);
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    this.sendError(ws, 'Invalid message format');
                }
            });
            // Handle disconnect
            ws.on('close', () => {
                if (ws.userId) {
                    this.clients.delete(ws.userId);
                    void store_1.store.setUserOnline(ws.userId, false).catch((err) => console.error('Failed to set user offline:', err));
                    this.broadcastPresence(ws.userId, false);
                    this.typingUsers.delete(ws.userId);
                }
            });
            // Handle errors
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                if (ws.userId) {
                    this.clients.delete(ws.userId);
                    store_1.store.setUserOnline(ws.userId, false);
                    this.broadcastPresence(ws.userId, false);
                }
            });
        });
        // Set up heartbeat interval
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    ws.terminate();
                    return;
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }
    extractTokenFromUrl(url) {
        if (!url)
            return null;
        const urlObj = new URL(url, 'http://localhost');
        return urlObj.searchParams.get('token');
    }
    async handleMessage(ws, message) {
        if (!ws.userId)
            return;
        switch (message.type) {
            case 'message:send':
                await this.handleSendMessage(ws, message.data);
                break;
            case 'typing':
                this.handleTyping(ws, message.data);
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }
    async handleSendMessage(ws, data) {
        if (!ws.userId || !data.to || !data.text) {
            this.sendError(ws, 'Invalid message data');
            return;
        }
        // Rate limiting: max 5 messages per second
        // This is a simple implementation - in production you'd want more sophisticated rate limiting
        const now = Date.now();
        const userKey = `rate_${ws.userId}`;
        const lastMessage = ws[userKey] || 0;
        if (now - lastMessage < 200) { // 200ms = 5 messages per second
            this.sendError(ws, 'Rate limit exceeded');
            return;
        }
        ws[userKey] = now;
        // Add message to store
        const message = await store_1.store.addMessage(ws.userId, data.to, data.text);
        // Send to sender (confirmation)
        this.sendMessage(ws, {
            type: 'message:new',
            data: message,
        });
        // Send to receiver if online
        const receiverWs = this.clients.get(data.to);
        if (receiverWs) {
            this.sendMessage(receiverWs, {
                type: 'message:new',
                data: message,
            });
        }
    }
    handleTyping(ws, data) {
        if (!ws.userId || !data.to)
            return;
        if (data.isTyping) {
            if (!this.typingUsers.has(data.to)) {
                this.typingUsers.set(data.to, new Set());
            }
            this.typingUsers.get(data.to).add(ws.userId);
        }
        else {
            const typingSet = this.typingUsers.get(data.to);
            if (typingSet) {
                typingSet.delete(ws.userId);
                if (typingSet.size === 0) {
                    this.typingUsers.delete(data.to);
                }
            }
        }
        // Notify the target user
        const targetWs = this.clients.get(data.to);
        if (targetWs) {
            this.sendMessage(targetWs, {
                type: 'typing',
                data: {
                    from: ws.userId,
                    to: data.to,
                    isTyping: data.isTyping,
                },
            });
        }
    }
    async sendRecentMessages(ws, userId) {
        const recentMessages = await store_1.store.getRecentMessages(userId, 20);
        recentMessages.forEach(message => {
            this.sendMessage(ws, {
                type: 'message:new',
                data: message,
            });
        });
    }
    sendMessage(ws, message) {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(ws, error) {
        this.sendMessage(ws, {
            type: 'error',
            data: { error },
        });
    }
    broadcastPresence(userId, isOnline) {
        const presenceData = {
            userId,
            isOnline,
        };
        this.clients.forEach((ws) => {
            this.sendMessage(ws, {
                type: 'presence',
                data: presenceData,
            });
        });
    }
    // Public methods for external use
    getOnlineUsers() {
        return Array.from(this.clients.keys());
    }
    isUserOnline(userId) {
        return this.clients.has(userId);
    }
}
exports.SocketManager = SocketManager;
