"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
// In-memory storage for MVP
class Store {
    constructor() {
        this.users = new Map();
        this.messages = [];
        this.onlineUsers = new Set();
    }
    // User management
    addUser(username, password) {
        const id = Date.now().toString();
        const user = {
            id,
            username,
            password,
            isOnline: false,
            createdAt: new Date(),
        };
        this.users.set(id, user);
        return user;
    }
    getUser(id) {
        return this.users.get(id);
    }
    getUserByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return undefined;
    }
    getAllUsers() {
        return Array.from(this.users.values());
    }
    setUserOnline(userId, isOnline) {
        const user = this.users.get(userId);
        if (user) {
            user.isOnline = isOnline;
            user.lastSeen = new Date();
            if (isOnline) {
                this.onlineUsers.add(userId);
            }
            else {
                this.onlineUsers.delete(userId);
            }
        }
    }
    getOnlineUsers() {
        return Array.from(this.onlineUsers);
    }
    // Message management
    addMessage(senderId, receiverId, text) {
        const message = {
            id: Date.now().toString(),
            senderId,
            receiverId,
            text,
            createdAt: new Date(),
        };
        this.messages.push(message);
        return message;
    }
    getMessagesBetweenUsers(userId1, userId2, limit = 50) {
        return this.messages
            .filter(msg => (msg.senderId === userId1 && msg.receiverId === userId2) ||
            (msg.senderId === userId2 && msg.receiverId === userId1))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(-limit);
    }
    getRecentMessages(userId, limit = 20) {
        return this.messages
            .filter(msg => msg.senderId === userId || msg.receiverId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
    getChatSummariesForUser(userId) {
        // Group messages by the other participant
        const conversationMap = new Map();
        for (const msg of this.messages) {
            if (msg.senderId !== userId && msg.receiverId !== userId)
                continue;
            const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const current = conversationMap.get(otherId);
            const isUnreadForUser = msg.receiverId === userId && !msg.readAt;
            if (!current) {
                conversationMap.set(otherId, {
                    lastMessage: msg,
                    unreadCount: isUnreadForUser ? 1 : 0,
                });
            }
            else {
                if (msg.createdAt > current.lastMessage.createdAt) {
                    current.lastMessage = msg;
                }
                if (isUnreadForUser) {
                    current.unreadCount += 1;
                }
            }
        }
        const summaries = [];
        for (const [otherId, data] of conversationMap.entries()) {
            const otherUser = this.getUser(otherId);
            if (!otherUser)
                continue;
            summaries.push({ otherUser, lastMessage: data.lastMessage, unreadCount: data.unreadCount });
        }
        // Sort by last message time desc
        summaries.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
        return summaries;
    }
    markMessageAsRead(messageId, userId) {
        const message = this.messages.find(msg => msg.id === messageId);
        if (message && message.receiverId === userId) {
            message.readAt = new Date();
        }
    }
}
exports.store = new Store();
