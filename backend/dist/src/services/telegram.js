"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAppointmentNotification = exports.sendTelegramNotification = exports.sendTelegramMessage = void 0;
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const token = process.env.TELEGRAM_BOT_TOKEN || '';
let bot = null;
if (token) {
    try {
        bot = new node_telegram_bot_api_1.default(token, { polling: true });
        bot.onText(/\/start (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const linkToken = match ? match[1] : null;
            if (linkToken) {
                try {
                    const user = await prismaClient_1.default.user.findFirst({
                        where: { id: linkToken }
                    });
                    if (user) {
                        await prismaClient_1.default.telegramLink.upsert({
                            where: { userId: user.id },
                            update: { chatId: String(chatId) },
                            create: { userId: user.id, chatId: String(chatId) }
                        });
                        bot?.sendMessage(chatId, `Вітаємо, ${user.name}! Ваш акаунт успішно підв'язано до Telegram. Ви будете отримувати сповіщення сюди.`);
                    }
                    else {
                        bot?.sendMessage(chatId, `Помилка: користувача не знайдено.`);
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
        });
        bot.onText(/\/start$/, (msg) => {
            bot?.sendMessage(msg.chat.id, "Вітаємо в NailsBook Pro Bot! Будь ласка, перейдіть до бота за спеціальним посиланням з додатку.");
        });
    }
    catch (e) {
        console.error('Failed to init Telegram Bot:', e);
    }
}
const sendTelegramMessage = async (userId, message) => {
    try {
        if (!bot) {
            console.log(`[TELEGRAM MOCK] To User: ${userId}, Message: ${message}`);
            return true;
        }
        const link = await prismaClient_1.default.telegramLink.findUnique({ where: { userId } });
        if (link && link.chatId) {
            await bot.sendMessage(link.chatId, message);
            return true;
        }
        console.log(`[TELEGRAM INFO] User ${userId} has no connected Telegram account.`);
        return false; // User has not linked Telegram
    }
    catch (e) {
        console.log('TG send err', e);
        return false;
    }
};
exports.sendTelegramMessage = sendTelegramMessage;
const sendTelegramNotification = async (chatId, message) => {
    try {
        if (!bot) {
            console.log(`[TELEGRAM MOCK] To Chat: ${chatId}, Message: ${message}`);
            return true;
        }
        await bot.sendMessage(chatId, message);
        return true;
    }
    catch (e) {
        console.log('TG send err', e);
        return false;
    }
};
exports.sendTelegramNotification = sendTelegramNotification;
const sendAppointmentNotification = async (userId, appointment, type) => {
    let msg = '';
    if (type === 'created')
        msg = `Новий запис! Дата: ${appointment.date}, Час: ${appointment.time}`;
    if (type === 'confirmed')
        msg = `Ваш запис на ${appointment.date} о ${appointment.time} ПІДТВЕРДЖЕНО.`;
    if (type === 'cancelled')
        msg = `Ваш запис на ${appointment.date} о ${appointment.time} СКАСОВАНО.`;
    return (0, exports.sendTelegramMessage)(userId, msg);
};
exports.sendAppointmentNotification = sendAppointmentNotification;
//# sourceMappingURL=telegram.js.map