import { User, Message, ChatSummary } from './types';
import { prisma } from './db';

class Store {
  // User management (DB-backed)
  async addUser(username: string, password?: string): Promise<User> {
    const user = await prisma.user.create({
      data: {
        username,
        password,
        isOnline: false,
      },
    });
    return user as unknown as User;
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { id } });
    return (user as unknown as User) || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { username } });
    return (user as unknown as User) || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users as unknown as User[];
  }

  async setUserOnline(userId: string, isOnline: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline, lastSeen: new Date() },
    }).catch(() => undefined);
  }

  async getOnlineUsers(): Promise<string[]> {
    const users = await prisma.user.findMany({ where: { isOnline: true }, select: { id: true } });
    return users.map(u => u.id);
  }

  // Message management (DB-backed)
  async addMessage(senderId: string, receiverId: string, text: string): Promise<Message> {
    const message = await prisma.message.create({
      data: { senderId, receiverId, text },
    });
    return message as unknown as Message;
  }

  async getMessagesBetweenUsers(
    userId1: string,
    userId2: string,
    limit: number = 50,
    before?: Date,
  ): Promise<Message[]> {
    const where: any = {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };
    if (before) {
      where.createdAt = { lt: before };
    }

    const messagesDesc = await prisma.message.findMany({
      where: where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    // Return ascending by createdAt (oldest first)
    return (messagesDesc.reverse() as unknown as Message[]);
  }

  async getRecentMessages(userId: string, limit: number = 20): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages as unknown as Message[];
  }

  async getChatSummariesForUser(userId: string): Promise<ChatSummary[]> {
    // Unread counts per peer (sender)
    const unreadGroups = await prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, readAt: null },
      _count: { _all: true },
    }).catch(() => [] as Array<{ senderId: string; _count: { _all: number } }>);

    const unreadCountByPeer: Record<string, number> = {};
    for (const g of unreadGroups) {
      unreadCountByPeer[g.senderId] = g._count._all;
    }

    // Recent messages involving the user, limit to a reasonable window
    const recent = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const lastMessageByPeer = new Map<string, Message>();
    for (const msg of recent) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!lastMessageByPeer.has(otherId)) {
        lastMessageByPeer.set(otherId, msg as unknown as Message);
      }
    }

    const peerIds = Array.from(lastMessageByPeer.keys());
    if (peerIds.length === 0) return [];

    const peers = await prisma.user.findMany({ where: { id: { in: peerIds } } });
    const peerById = new Map(peers.map(u => [u.id, u]));

    const summaries: ChatSummary[] = [];
    for (const peerId of peerIds) {
      const otherUser = peerById.get(peerId);
      const lastMessage = lastMessageByPeer.get(peerId);
      if (!otherUser || !lastMessage) continue;

      summaries.push({
        otherUser: otherUser as unknown as User,
        lastMessage: lastMessage,
        unreadCount: unreadCountByPeer[peerId] || 0,
      });
    }

    summaries.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
    return summaries;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await prisma.message.updateMany({
      where: { id: messageId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

export const store = new Store();