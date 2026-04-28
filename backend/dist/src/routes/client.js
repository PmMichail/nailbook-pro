"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const telegram_1 = require("../services/telegram");
const firebase_1 = require("../services/firebase");
const auth_1 = require("../middleware/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const qrcode_1 = __importDefault(require("qrcode"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const router = (0, express_1.Router)();
// POST /push-token (Any authenticated user)
router.post('/push-token', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, os } = req.body;
        console.log('[PUSH BACKEND] Received token for user:', userId);
        console.log('[PUSH BACKEND] Token value:', token);
        if (!token) {
            console.log('[PUSH BACKEND] No token provided');
            return res.status(400).json({ error: 'Token is required' });
        }
        await prismaClient_1.default.pushToken.upsert({
            where: { userId },
            update: { token, os },
            create: { userId, token, os }
        });
        console.log('[PUSH BACKEND] Token saved successfully in PushToken model');
        res.json({ success: true });
    }
    catch (error) {
        console.error('[PUSH BACKEND] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
const authClient = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'CLIENT')
            return res.status(403).json({ error: 'Not a client' });
        req.user = decoded;
        next();
    }
    catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
router.use(authClient);
// GET /master/:id
router.get('/master/:id', async (req, res) => {
    try {
        const master = await prismaClient_1.default.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true }
        });
        if (!master)
            return res.status(404).json({ error: 'Not found' });
        res.json(master);
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
// PUT /unlink
router.put('/unlink', async (req, res) => {
    try {
        await prismaClient_1.default.user.update({
            where: { id: req.user.id },
            data: { masterId: null }
        });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /masters/search?city=xxx&lat=yyy&lng=zzz
router.get('/masters/search', async (req, res) => {
    const { city, lat, lng } = req.query;
    try {
        const whereClause = { role: 'MASTER' };
        if (city) {
            whereClause.city = { contains: city, mode: 'insensitive' };
        }
        const masters = await prismaClient_1.default.user.findMany({
            where: whereClause,
            select: { id: true, name: true, city: true, address: true, salonName: true, salonLogo: true, avatarUrl: true, lat: true, lng: true }
        });
        let filteredMasters = masters;
        // Geolocation filter (Haversine formula, 20km radius)
        if (lat && lng) {
            const clientLat = parseFloat(lat);
            const clientLng = parseFloat(lng);
            filteredMasters = masters.filter(m => {
                if (!m.lat || !m.lng)
                    return false;
                const R = 6371; // Earth radius in km
                const dLat = (m.lat - clientLat) * Math.PI / 180;
                const dLng = (m.lng - clientLng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(clientLat * Math.PI / 180) * Math.cos(m.lat * Math.PI / 180) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                return distance <= 10; // Within 10km
            });
        }
        res.json(filteredMasters);
    }
    catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
// POST /masters/connect
router.post('/masters/connect', async (req, res) => {
    const { code } = req.body;
    try {
        const connectionCode = await prismaClient_1.default.connectionCode.findUnique({
            where: { code }
        });
        if (!connectionCode) {
            return res.status(404).json({ error: 'Код недійсний' });
        }
        if (new Date() > connectionCode.expiresAt) {
            return res.status(400).json({ error: 'Термін дії коду минув' });
        }
        const masterId = connectionCode.userId;
        const sub = await prismaClient_1.default.subscription.findUnique({ where: { masterId } });
        const isFree = !sub || sub.plan === 'FREE' || ['EXPIRED', 'CANCELLED'].includes(sub.status);
        if (isFree) {
            const clientCount = await prismaClient_1.default.user.count({ where: { masterId, role: 'CLIENT', isActiveClient: true } });
            if (clientCount >= 10) {
                // Wait, what if the client is already connected to this master? We shouldn't block them.
                if (req.user.masterId !== masterId) {
                    return res.status(403).json({ error: 'Майстер тимчасово не приймає нових клієнтів (ліміт бази).' });
                }
            }
        }
        await prismaClient_1.default.user.update({
            where: { id: req.user.id },
            data: { masterId, isActiveClient: true }
        });
        res.json({ success: true, masterId });
    }
    catch (e) {
        res.status(500).json({ error: 'Помилка підключення' });
    }
});
// GET /calendar/:masterId?date=YYYY-MM-DD
// Returns available slots only for a specific date for the master
router.get('/calendar/:masterId', async (req, res) => {
    const masterId = req.params.masterId;
    const dateStr = req.query.date;
    if (!dateStr)
        return res.status(400).json({ error: 'date required' });
    const dateObj = new Date(dateStr);
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0)
        dayOfWeek = 7;
    const settings = await prismaClient_1.default.masterWeeklySettings.findUnique({
        where: { masterId_dayOfWeek: { masterId, dayOfWeek } }
    });
    if (!settings || !settings.isWorking)
        return res.json({ slots: [] });
    const blocked = await prismaClient_1.default.blockedSlot.findMany({
        where: { masterId, date: new Date(dateStr) }
    });
    const appointments = await prismaClient_1.default.appointment.findMany({
        where: { masterId, date: new Date(dateStr) }
    });
    const [startH, startM] = settings.workStart.split(':').map(Number);
    const [endH, endM] = settings.workEnd.split(':').map(Number);
    const duration = settings.timePerClient;
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const availableSlots = [];
    while (currentMinutes + duration <= endMinutes) {
        if (settings.breakStart && settings.breakEnd) {
            const [bStartH, bStartM] = settings.breakStart.split(':').map(Number);
            const [bEndH, bEndM] = settings.breakEnd.split(':').map(Number);
            const breakStartMins = bStartH * 60 + bStartM;
            const breakEndMins = bEndH * 60 + bEndM;
            if (currentMinutes + duration > breakStartMins && currentMinutes < breakEndMins) {
                currentMinutes += duration;
                continue;
            }
        }
        const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
        const m = (currentMinutes % 60).toString().padStart(2, '0');
        const timeStr = `${h}:${m}`;
        const isBlocked = blocked.some(b => b.time === timeStr);
        const hasApp = appointments.some(a => a.time === timeStr && a.status !== 'CANCELLED');
        if (!isBlocked && !hasApp) {
            availableSlots.push(timeStr);
        }
        currentMinutes += duration;
    }
    res.json({ slots: availableSlots });
});
// POST /appointments
router.post('/appointments', async (req, res) => {
    const { date, time, masterId, service, price } = req.body;
    if (masterId !== req.user.masterId)
        return res.status(403).json({ error: 'Forbidden' });
    // Перевірка на блок
    const clientUser = await prismaClient_1.default.user.findUnique({ where: { id: req.user.id } });
    if (clientUser && clientUser.phone) {
        const isBlocked = await prismaClient_1.default.blockedPhone.findFirst({
            where: { masterId, phone: clientUser.phone }
        });
        if (isBlocked) {
            return res.status(403).json({ error: 'Вам відмовлено в доступі до бронювання у цього майстра.' });
        }
    }
    let finalPrice = price;
    let appliedDiscountReason = '';
    // 1. Check if New Client First Booking Discount
    const previousCompleted = await prismaClient_1.default.appointment.count({ where: { clientId: req.user.id, status: 'COMPLETED' } });
    if (previousCompleted === 0) {
        const referredAsNew = await prismaClient_1.default.referralUse.findFirst({
            where: { referredClientId: req.user.id }
        });
        if (referredAsNew) {
            finalPrice = Math.floor(price * 0.9);
            appliedDiscountReason = 'Реферальна знижка 10% на перший запис';
        }
    }
    // 2. If no new client discount, check if they have available Inviter Bonus
    if (finalPrice === price) {
        // User's own code
        const myCode = await prismaClient_1.default.referralCode.findUnique({ where: { clientId: req.user.id } });
        if (myCode) {
            // Find a referral that hasn't been used yet AND where the referred client has at least 1 COMPLETED appointment
            const possibleBonuses = await prismaClient_1.default.referralUse.findMany({
                where: { code: myCode.code, isCodeOwnerDiscountUsed: false },
                include: { referredClient: { include: { myAppointments: { where: { status: 'COMPLETED' } } } } }
            });
            const unusedBonus = possibleBonuses.find((b) => b.referredClient?.myAppointments?.length > 0);
            if (unusedBonus) {
                finalPrice = Math.floor(price * 0.9);
                appliedDiscountReason = 'Реферальний бонус 10% за друга';
                // Mark this bonus as consumed
                await prismaClient_1.default.referralUse.update({
                    where: { id: unusedBonus.id },
                    data: { isCodeOwnerDiscountUsed: true }
                });
            }
        }
    }
    const app = await prismaClient_1.default.appointment.create({
        data: {
            clientId: req.user.id,
            masterId,
            date: new Date(date),
            time,
            service,
            price: finalPrice, // The actual price client will pay
            originalPrice: price, // For display purposes
            status: 'PENDING'
        }
    });
    // Ensure the client becomes active again in the master's book
    await prismaClient_1.default.user.update({
        where: { id: req.user.id },
        data: { isActiveClient: true }
    });
    (0, telegram_1.sendTelegramMessage)(masterId, `Новий запис! Клієнт бажає записатися на ${date} о ${time}.`);
    const masterWithToken = await prismaClient_1.default.user.findUnique({
        where: { id: masterId },
        include: { pushToken: true }
    });
    console.log('[PUSH BACKEND] Master token from DB:', masterWithToken?.pushToken?.token);
    if (masterWithToken?.pushToken?.token) {
        console.log('[PUSH BACKEND] Sending push to master...');
        await (0, firebase_1.sendPushNotification)(masterWithToken.pushToken.token, 'Новий запис!', `Клієнт ${clientUser?.name || 'Клієнт'} записався на ${date} о ${time}.`);
    }
    else {
        console.log('[PUSH BACKEND] Master has no push token');
    }
    res.status(201).json(app);
});
// GET /masters/:id/prices
router.get('/masters/:id/prices', async (req, res) => {
    const prices = await prismaClient_1.default.priceList.findMany({
        where: { masterId: req.params.id },
        orderBy: { createdAt: 'asc' }
    });
    res.json(prices);
});
// GET /appointments (my appointments)
router.get('/appointments', async (req, res) => {
    const apps = await prismaClient_1.default.appointment.findMany({
        where: { clientId: req.user.id },
        include: { master: true },
        orderBy: { date: 'desc' }
    });
    res.json(apps);
});
// DELETE /appointments/:id
router.delete('/appointments/:id', async (req, res) => {
    const app = await prismaClient_1.default.appointment.update({
        where: { id: req.params.id },
        data: { status: 'CANCELLED' }
    });
    (0, telegram_1.sendTelegramMessage)(app.masterId, `Клієнт СКАСУВАВ запис на ${app.date.toISOString().split('T')[0]} о ${app.time}.`);
    res.json({ success: true, app });
});
// GET /appointments/:id/payment
router.get('/appointments/:id/payment', async (req, res) => {
    const app = await prismaClient_1.default.appointment.findUnique({
        where: { id: req.params.id }
    });
    if (!app || app.clientId !== req.user.id)
        return res.status(403).json({ error: 'Forbidden' });
    if (!app.paymentDetails) {
        return res.status(404).json({ error: 'Реквізити ще не додані майстром або запис не підтверджено' });
    }
    const pDetails = app.paymentDetails;
    let amount = app.finalPrice || app.originalPrice || app.price || 0;
    if (app.status === 'AWAITING_PREPAYMENT') {
        amount = app.prepaymentAmount || amount;
    }
    const paymentData = {
        cardNumber: pDetails.cardNumber,
        bankName: pDetails.bankName,
        amount: amount,
        description: `Запис до майстра ${app.date.toISOString().split('T')[0]} ${app.time}`
    };
    let qrCode = '';
    try {
        qrCode = await qrcode_1.default.toDataURL(JSON.stringify(paymentData));
    }
    catch (e) { }
    res.json({
        qrCode,
        paymentLink: pDetails.qrCode,
        cardNumber: pDetails.cardNumber,
        bankName: pDetails.bankName,
        amount,
        prepaymentDeadline: app.prepaymentDeadline,
        isPrepayment: app.status === 'AWAITING_PREPAYMENT'
    });
});
// GET /referral-code
router.get('/referral-code', async (req, res) => {
    try {
        let rc = await prismaClient_1.default.referralCode.findUnique({
            where: { clientId: req.user.id }
        });
        if (!rc) {
            const codeStr = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            rc = await prismaClient_1.default.referralCode.create({
                data: {
                    clientId: req.user.id,
                    code: codeStr
                }
            });
        }
        res.json({ code: rc.code, uses: rc.uses });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /referral-stats
router.get('/referral-stats', async (req, res) => {
    try {
        const rc = await prismaClient_1.default.referralCode.findUnique({
            where: { clientId: req.user.id }
        });
        if (!rc) {
            return res.json({ uses: 0, pendingBonuses: 0, totalDiscountApplied: 0 });
        }
        // Calculate how many of the referred clients actually completed an appointment
        const allUses = await prismaClient_1.default.referralUse.findMany({
            where: { code: rc.code },
            include: { referredClient: { include: { myAppointments: { where: { status: 'COMPLETED' } } } } }
        });
        // Only count uses that have at least 1 completed appointment
        const validUses = allUses.filter((u) => u.referredClient?.myAppointments?.length > 0);
        const pendingBonuses = validUses.filter((u) => !u.isCodeOwnerDiscountUsed).length;
        const totalDiscountApplied = validUses.filter((u) => u.isCodeOwnerDiscountUsed).length * 10;
        res.json({
            uses: validUses.length, // Number of successfully processed friends
            pendingBonuses,
            totalDiscountApplied
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=client.js.map