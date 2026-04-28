"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const express_1 = require("express");
const expo_server_sdk_1 = require("expo-server-sdk");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
let expo = new expo_server_sdk_1.Expo();
// Зберегти токен девайсу для Push-сповіщень
router.post('/register-token', auth_1.authenticate, async (req, res) => {
    try {
        const { token, os } = req.body;
        if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
            return res.status(400).json({ error: 'Недійсний Push-токен Expo' });
        }
        await prismaClient_1.default.pushToken.upsert({
            where: { userId: req.user.id },
            update: { token, os },
            create: { userId: req.user.id, token, os }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка збереження токену' });
    }
});
// Функція для надсилання сповіщення будь-якому юзеру (викликається внутрішньо з інших сервісів)
const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        const pushToken = await prismaClient_1.default.pushToken.findUnique({ where: { userId } });
        if (!pushToken || !expo_server_sdk_1.Expo.isExpoPushToken(pushToken.token)) {
            return;
        }
        const messages = [{
                to: pushToken.token,
                sound: 'default',
                title,
                body,
                data
            }];
        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }
    }
    catch (error) {
        console.error('Error sending push notification', error);
    }
};
exports.sendPushNotification = sendPushNotification;
exports.default = router;
//# sourceMappingURL=notifications.js.map