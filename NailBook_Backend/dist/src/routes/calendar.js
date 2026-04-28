"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAppointmentToCalendar = void 0;
const express_1 = require("express");
const googleapis_1 = require("googleapis");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID || 'mock_client_id', process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret', process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback');
// Отримати URL для авторизації Google Calendar
router.get('/auth', auth_1.authenticate, (req, res) => {
    if (req.user.role !== 'MASTER')
        return res.status(403).json({ error: 'Тільки для майстрів' });
    const scopes = ['https://www.googleapis.com/auth/calendar.events'];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: req.user.id // Передаємо ID майстра, щоб після callback знати кому зберегти токен
    });
    res.json({ url });
});
// Callback після підтвердження авторизації (виклик від Google)
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.status(400).send('Invalid request');
        }
        const { tokens } = await oauth2Client.getToken(code);
        const masterId = state;
        await prismaClient_1.default.calendarSync.upsert({
            where: { masterId },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date,
                isEnabled: true
            },
            create: {
                masterId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date,
                isEnabled: true
            }
        });
        res.send('Google Calendar успішно підключено! Ви можете повернутися в додаток.');
    }
    catch (error) {
        res.status(500).send('Помилка підключення Google Calendar.');
    }
});
// Синхронізувати (додати запис до календаря) - цей метод буде викликатись при ствренні Appointment
const syncAppointmentToCalendar = async (masterId, appointmentInfo) => {
    try {
        const syncInfo = await prismaClient_1.default.calendarSync.findUnique({ where: { masterId } });
        if (!syncInfo || !syncInfo.isEnabled || !syncInfo.refreshToken)
            return;
        oauth2Client.setCredentials({
            access_token: syncInfo.accessToken,
            refresh_token: syncInfo.refreshToken,
            expiry_date: Number(syncInfo.expiryDate)
        });
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: `Манікюр: ${appointmentInfo.clientName}`,
                description: `Послуга: ${appointmentInfo.serviceName}`,
                start: { dateTime: appointmentInfo.startTime.toISOString() },
                end: { dateTime: appointmentInfo.endTime.toISOString() },
            }
        });
    }
    catch (error) {
        console.error('Calendar Sync Error', error);
    }
};
exports.syncAppointmentToCalendar = syncAppointmentToCalendar;
router.delete('/disconnect', auth_1.authenticate, async (req, res) => {
    try {
        await prismaClient_1.default.calendarSync.delete({ where: { masterId: req.user.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка відключення' });
    }
});
exports.default = router;
//# sourceMappingURL=calendar.js.map