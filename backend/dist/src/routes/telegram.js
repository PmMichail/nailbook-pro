"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = exports.bot = void 0;
const express_1 = require("express");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Ініціалізація Telegram бота
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
exports.bot = null;
try {
    exports.bot = TELEGRAM_TOKEN ? new node_telegram_bot_api_1.default(TELEGRAM_TOKEN, { polling: true }) : null;
    if (exports.bot) {
        exports.bot.on('polling_error', (error) => {
            console.log('[TELEGRAM] Помилка підключення (polling_error):', error.message);
        });
    }
}
catch (error) {
    console.log('[TELEGRAM] Бот тимчасово вимкнено через помилку:', error.message);
    exports.bot = null;
}
// Обробник старту бота
if (exports.bot) {
    exports.bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id.toString();
        const token = match?.[1];
        if (!token)
            return;
        try {
            // Find token in temporary cache or directly mapped
            // For MVP, if token is valid user ID:
            const existingUser = await prismaClient_1.default.user.findUnique({ where: { id: token } });
            if (existingUser) {
                await prismaClient_1.default.telegramLink.upsert({
                    where: { userId: existingUser.id },
                    update: { chatId, username: msg.chat.username },
                    create: { userId: existingUser.id, chatId, username: msg.chat.username }
                });
                exports.bot.sendMessage(chatId, `Вітаємо, ${existingUser.name}! Ваш акаунт NailsBook успішно прив'язано до Telegram. Тепер ви будете отримувати тут сповіщення.`);
            }
        }
        catch (error) {
            console.error('Telegram Link Error', error);
        }
    });
}
// Прив'язка з додатку (повертає унікальне посилання для переходу в бот)
router.post('/link', auth_1.authenticate, async (req, res) => {
    try {
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'nailbook_bot';
        const link = `https://t.me/${botUsername}?start=${req.user.id}`;
        res.json({ link });
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка' });
    }
});
const sendTelegramMessage = async (userId, message) => {
    if (!exports.bot)
        return;
    try {
        const link = await prismaClient_1.default.telegramLink.findUnique({ where: { userId } });
        if (link && link.notifEnabled) {
            await exports.bot.sendMessage(link.chatId, message);
        }
    }
    catch (error) {
        console.error('Failed to send telegram message to user:', userId, error);
    }
};
exports.sendTelegramMessage = sendTelegramMessage;
exports.default = router;
//# sourceMappingURL=telegram.js.map