"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const firebase_1 = require("./firebase");
const telegram_1 = require("./telegram");
const startCronJobs = () => {
    // Check every 15 minutes
    node_cron_1.default.schedule('*/15 * * * *', async () => {
        try {
            const now = new Date();
            // Boundaries
            const in24hStart = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 15 * 60 * 1000);
            const in24hEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000);
            const in2hStart = new Date(now.getTime() + 2 * 60 * 60 * 1000 - 15 * 60 * 1000);
            const in2hEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000);
            // fetch CONFIRMED apps upcoming
            const upcomingApps = await prismaClient_1.default.appointment.findMany({
                where: {
                    status: 'CONFIRMED',
                },
                include: {
                    client: { include: { pushToken: true } },
                    master: { include: { pushToken: true } }
                }
            });
            for (let app of upcomingApps) {
                const appTimeStr = app.time.split(':');
                const appDate = new Date(app.date);
                appDate.setHours(parseInt(appTimeStr[0], 10), parseInt(appTimeStr[1], 10));
                const sent = app.remindersSent || {};
                let updateRequired = false;
                // Check 24 hours
                if (appDate >= in24hStart && appDate <= in24hEnd && !sent['24h']) {
                    if (app.client.pushToken) {
                        await (0, firebase_1.sendPushNotification)(app.client.pushToken.token, 'Нагадування про запис', `Ваш запис до майстра ${app.master.name} завтра о ${app.time}`);
                    }
                    else {
                        await (0, telegram_1.sendTelegramMessage)(app.clientId, `⏳ Нагадування: Ваш запис до майстра ${app.master.name} завтра о ${app.time}`);
                    }
                    if (app.master.pushToken) {
                        await (0, firebase_1.sendPushNotification)(app.master.pushToken.token, 'Нагадування про клієнта', `У вас запис завтра о ${app.time} (клієнт: ${app.client.name})`);
                    }
                    else {
                        await (0, telegram_1.sendTelegramMessage)(app.masterId, `⏳ Нагадування: У вас запис завтра о ${app.time} (клієнт: ${app.client.name})`);
                    }
                    sent['24h'] = true;
                    updateRequired = true;
                }
                // Check 2 hours
                if (appDate >= in2hStart && appDate <= in2hEnd && !sent['2h']) {
                    if (app.client.pushToken) {
                        await (0, firebase_1.sendPushNotification)(app.client.pushToken.token, 'Скоро Ваш запис!', `Чекаємо на Вас сьогодні о ${app.time}.`);
                    }
                    else {
                        await (0, telegram_1.sendTelegramMessage)(app.clientId, `⚠️ Скоро Ваш запис! Чекаємо на Вас сьогодні о ${app.time}.`);
                    }
                    if (app.master.pushToken) {
                        await (0, firebase_1.sendPushNotification)(app.master.pushToken.token, 'Наступний клієнт!', `Запис сьогодні о ${app.time} (клієнт: ${app.client.name})`);
                    }
                    else {
                        await (0, telegram_1.sendTelegramMessage)(app.masterId, `⚠️ Наступний клієнт! Запис сьогодні о ${app.time} (клієнт: ${app.client.name})`);
                    }
                    sent['2h'] = true;
                    updateRequired = true;
                }
                if (updateRequired) {
                    await prismaClient_1.default.appointment.update({
                        where: { id: app.id },
                        data: { remindersSent: sent }
                    });
                }
            }
        }
        catch (e) {
            console.error('Cron error', e);
        }
    });
    console.log('Cron jobs started (checking reminders every 15 minutes)');
};
exports.startCronJobs = startCronJobs;
//# sourceMappingURL=cron.js.map