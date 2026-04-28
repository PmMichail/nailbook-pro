"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const auth_1 = require("../middleware/auth");
const qrcode_1 = __importDefault(require("qrcode"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Middleware тільки для майстра (для SETUP)
const requireMaster = (req, res, next) => {
    if (req.user.role !== 'MASTER') {
        return res.status(403).json({ error: 'Тільки для майстрів' });
    }
    next();
};
// Зберегти платіжні дані (Master only)
router.put('/setup', requireMaster, async (req, res) => {
    try {
        const { cardNumber, bankName, fullName } = req.body;
        // Генеруємо QR текст:
        const qrText = `Оплата майстру ${fullName}, картка ${cardNumber}, банк ${bankName}`;
        const qrCodeUrl = await qrcode_1.default.toDataURL(qrText);
        const paymentInfo = await prismaClient_1.default.paymentInfo.upsert({
            where: { masterId: req.user.id },
            update: { cardNumber, bankName, fullName, qrCodeUrl },
            create: { masterId: req.user.id, cardNumber, bankName, fullName, qrCodeUrl }
        });
        res.json(paymentInfo);
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка збереження платіжних даних' });
    }
});
// Отримати свої дані (Master only)
router.get('/info', requireMaster, async (req, res) => {
    try {
        const info = await prismaClient_1.default.paymentInfo.findUnique({
            where: { masterId: req.user.id }
        });
        res.json(info || null);
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});
// Отримати поточний згенерований QR (може отримувати і клієнт, знаючи ID майстра)
// Для майстра повертаємо його QR, а якщо передано query masterId - повертаємо QR вказаного майстра
router.get('/qr', async (req, res) => {
    try {
        const targetMasterId = req.query.masterId || req.user.id;
        const info = await prismaClient_1.default.paymentInfo.findUnique({
            where: { masterId: targetMasterId }
        });
        if (!info || !info.qrCodeUrl) {
            return res.status(404).json({ error: 'Оплата не налаштована' });
        }
        // Повертаємо base64 зображення (можна і просто JSON `{ qr: "base64..." }`)
        res.json({ qrCodeUrl: info.qrCodeUrl });
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка генерації QR' });
    }
});
exports.default = router;
//# sourceMappingURL=payment.js.map