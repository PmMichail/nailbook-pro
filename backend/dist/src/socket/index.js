"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.getSocketId = exports.getIo = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
let ioInstance = null;
const activeUsers = new Map(); // userId -> socketId
const getIo = () => {
    if (!ioInstance)
        throw new Error('Socket.io not initialized');
    return ioInstance;
};
exports.getIo = getIo;
const getSocketId = (userId) => {
    return activeUsers.get(userId);
};
exports.getSocketId = getSocketId;
const initSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    ioInstance = io;
    // Middleware для автентифікації
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err)
                return next(new Error('Authentication error'));
            socket.user = decoded;
            next();
        });
    });
    io.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (userId) {
            activeUsers.set(userId, socket.id);
            console.log(`User connected: ${userId}`);
        }
        // Приєднання до чату (кімната = roomId)
        socket.on('join_chat', (roomId) => {
            socket.join(roomId);
            console.log(`User ${userId} joined chat ${roomId}`);
        });
        // Відправка повідомлення
        socket.on('send_message', async (data) => {
            try {
                if (!data.roomId)
                    return;
                // Знайти або створити чат
                let chat = await prismaClient_1.default.chat.findUnique({ where: { roomId: data.roomId } });
                if (!chat) {
                    chat = await prismaClient_1.default.chat.create({ data: { roomId: data.roomId } });
                }
                // Зберегти повідомлення
                const message = await prismaClient_1.default.message.create({
                    data: {
                        chatId: chat.id,
                        senderId: userId,
                        text: data.text || null,
                        imageUrl: data.imageUrl || null,
                        isRead: false
                    },
                    include: { sender: { select: { id: true, name: true, role: true } } }
                });
                // Відправити всім у кімнаті
                io.to(data.roomId).emit('new_message', message);
                // Тут також можна додати відправку Push-сповіщення іншому учаснику
            }
            catch (error) {
                console.error('Error sending message:', error);
            }
        });
        socket.on('typing', (roomId) => {
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
exports.initSocket = initSocket;
//# sourceMappingURL=index.js.map