import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Server as HttpServer } from 'http';
import prisma from '../models/prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

interface AuthSocket extends Socket {
  user?: {
    id: string;
    role: string;
  };
}

let ioInstance: Server | null = null;
const activeUsers = new Map<string, string>(); // userId -> socketId

export const getIo = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

export const getSocketId = (userId: string) => {
  return activeUsers.get(userId);
};

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  // Middleware для автентифікації
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.user?.id;
    if (userId) {
      activeUsers.set(userId, socket.id);
      console.log(`User connected: ${userId}`);
    }

    // Приєднання до чату (кімната = roomId)
    socket.on('join_chat', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${userId} joined chat ${roomId}`);
    });

    // Відправка повідомлення
    socket.on('send_message', async (data: { roomId: string, text?: string, imageUrl?: string }) => {
      try {
        if (!data.roomId) return;
        // Знайти або створити чат
        let chat = await prisma.chat.findUnique({ where: { roomId: data.roomId } });
        if (!chat) {
          chat = await prisma.chat.create({ data: { roomId: data.roomId } });
        }

        // Зберегти повідомлення
        const message = await prisma.message.create({
          data: {
            chatId: chat.id,
            senderId: userId!,
            text: data.text || null,
            imageUrl: data.imageUrl || null,
            isRead: false
          },
          include: { sender: { select: { id: true, name: true, role: true } } }
        });

        // Відправити всім у кімнаті
        io.to(data.roomId).emit('new_message', message);
        
        // Тут також можна додати відправку Push-сповіщення іншому учаснику
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('typing', (roomId: string) => {
      socket.to(roomId).emit('typing', { userId });
    });

    socket.on('disconnect', () => {
      if (userId) {
        activeUsers.delete(userId);
      }
      console.log('User disconnected');
    });
  });

  return io;
};
