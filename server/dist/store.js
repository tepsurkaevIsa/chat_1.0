"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const db_1 = require("./db");
class Store {
    // User management (DB-backed)
    async addUser(username, password) {
        const user = await db_1.prisma.user.create({
            data: {
                username,
                password,
                isOnline: false,
            },
        });
        return user;
    }
    async getUser(id) {
        const user = await db_1.prisma.user.findUnique({ where: { id } });
        return user || undefined;
    }
    async getUserByUsername(username) {
        const user = await db_1.prisma.user.findUnique({ where: { username } });
        return user || undefined;
    }
    async getAllUsers() {
        const users = await db_1.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
        return users;
    }
    async setUserOnline(userId, isOnline) {
        await db_1.prisma.user.update({
            where: { id: userId },
            data: { isOnline, lastSeen: new Date() },
        }).catch(() => undefined);
    }
    async getOnlineUsers() {
        const users = await db_1.prisma.user.findMany({ where: { isOnline: true }, select: { id: true } });
        return users.map(u => u.id);
    }
    // Message management (DB-backed)
    async addMessage(senderId, receiverId, text) {
        const message = await db_1.prisma.message.create({
            data: { senderId, receiverId, text },
        });
        return message;
    }
    async getMessagesBetweenUsers(userId1, userId2, limit = 50, before) {
        const where = {
            OR: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 },
            ],
        };
        if (before) {
            where.createdAt = { lt: before };
        }
        const messagesDesc = await db_1.prisma.message.findMany({
            where: where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        // Return ascending by createdAt (oldest first)
        return messagesDesc.reverse();
    }
    async getRecentMessages(userId, limit = 20) {
        const messages = await db_1.prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return messages;
    }
    async getChatSummariesForUser(userId) {
        // Unread counts per peer (sender)
        const unreadGroups = await db_1.prisma.message.groupBy({
            by: ['senderId'],
            where: { receiverId: userId, readAt: null },
            _count: { _all: true },
        }).catch(() => []);
        const unreadCountByPeer = {};
        for (const g of unreadGroups) {
            unreadCountByPeer[g.senderId] = g._count._all;
        }
        // Recent messages involving the user, limit to a reasonable window
        const recent = await db_1.prisma.message.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        const lastMessageByPeer = new Map();
        for (const msg of recent) {
            const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!lastMessageByPeer.has(otherId)) {
                lastMessageByPeer.set(otherId, msg);
            }
        }
        const peerIds = Array.from(lastMessageByPeer.keys());
        if (peerIds.length === 0)
            return [];
        const peers = await db_1.prisma.user.findMany({ where: { id: { in: peerIds } } });
        const peerById = new Map(peers.map(u => [u.id, u]));
        const summaries = [];
        for (const peerId of peerIds) {
            const otherUser = peerById.get(peerId);
            const lastMessage = lastMessageByPeer.get(peerId);
            if (!otherUser || !lastMessage)
                continue;
            summaries.push({
                otherUser: otherUser,
                lastMessage: lastMessage,
                unreadCount: unreadCountByPeer[peerId] || 0,
            });
        }
        summaries.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
        return summaries;
    }
    async markMessageAsRead(messageId, userId) {
        await db_1.prisma.message.updateMany({
            where: { id: messageId, receiverId: userId, readAt: null },
            data: { readAt: new Date() },
        });
    }
}
exports.store = new Store();
