"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = require("../services/cloudinary");
// uploadCloud replaces multer({ storage })
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'No token provided' });
    try {
        req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
router.use(authenticate);
// PUT /api/user/profile
router.put('/profile', cloudinary_1.uploadCloud.fields([{ name: 'avatar', maxCount: 1 }, { name: 'salonLogo', maxCount: 1 }]), async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, password, salonName } = req.body;
        let avatarUrl = undefined;
        let salonLogo = undefined;
        if (req.files) {
            if (req.files['avatar'] && req.files['avatar'].length > 0) {
                avatarUrl = req.files['avatar'][0].path.replace(/\\/g, '/');
            }
            if (req.files['salonLogo'] && req.files['salonLogo'].length > 0) {
                salonLogo = req.files['salonLogo'][0].path.replace(/\\/g, '/');
            }
        }
        const dataToUpdate = {};
        if (name)
            dataToUpdate.name = name;
        if (phone)
            dataToUpdate.phone = phone;
        if (avatarUrl)
            dataToUpdate.avatarUrl = avatarUrl;
        if (salonName !== undefined)
            dataToUpdate.salonName = salonName;
        if (salonLogo)
            dataToUpdate.salonLogo = salonLogo;
        if (password && password.trim().length > 0) {
            const bcrypt = require('bcrypt');
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prismaClient_1.default.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true,
                role: true,
                city: true,
                linkSlug: true,
                salonName: true,
                salonLogo: true
            }
        });
        res.json(updatedUser);
    }
    catch (err) {
        console.error('[PROFILE UPDATE ERROR]', err);
        res.status(500).json({ error: 'Помилка оновлення профілю' });
    }
});
// GET /api/user/unread-count
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        // Count unread messages in all chats where user is a participant and not the sender
        const unreadMessages = await prismaClient_1.default.message.count({
            where: {
                isRead: false,
                senderId: { not: userId },
                chat: {
                    OR: [
                        { masterId: userId },
                        { clientId: userId }
                    ]
                }
            }
        });
        // We can also count pending appointments if they are a master
        let pendingAppointments = 0;
        if (req.user.role === 'MASTER') {
            pendingAppointments = await prismaClient_1.default.appointment.count({
                where: { masterId: userId, status: 'PENDING' }
            });
        }
        res.json({ count: unreadMessages + pendingAppointments });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
// DELETE /api/user/profile
router.delete('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        // Delete prices, settings, etc cascaded or manually if needed
        await prismaClient_1.default.masterWeeklySettings.deleteMany({ where: { masterId: userId } });
        await prismaClient_1.default.priceList.deleteMany({ where: { masterId: userId } });
        await prismaClient_1.default.appointment.deleteMany({ where: { OR: [{ masterId: userId }, { clientId: userId }] } });
        await prismaClient_1.default.chatMessage.deleteMany({ where: { senderId: userId } });
        // chats with roomId matching
        const userChats = await prismaClient_1.default.chat.findMany({ where: { roomId: { contains: userId } } });
        await prismaClient_1.default.chatMessage.deleteMany({ where: { chatId: { in: userChats.map(c => c.id) } } });
        await prismaClient_1.default.chat.deleteMany({ where: { roomId: { contains: userId } } });
        await prismaClient_1.default.user.delete({ where: { id: userId } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: 'Помилка видалення акаунта' });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map