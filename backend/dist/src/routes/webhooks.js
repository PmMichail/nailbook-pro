"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const router = (0, express_1.Router)();
// POST /api/webhooks/liqpay
router.post('/liqpay', async (req, res) => {
    try {
        const { data, signature } = req.body;
        // Real LiqPay validation
        const privateKey = process.env.LIQPAY_PRIVATE_KEY || '';
        if (!privateKey) {
            console.error('[LIQPAY] Private key not found');
            return res.status(500).json({ error: 'Server misconfigured' });
        }
        const expectedSign = require('crypto')
            .createHash('sha1')
            .update(privateKey + data + privateKey)
            .digest('base64');
        if (expectedSign !== signature) {
            console.error('[LIQPAY] Signature mismatch');
            return res.status(400).json({ error: 'Signature mismatch' });
        }
        const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        console.log(`[LIQPAY WEBHOOK] Status: ${decoded.status}, Order: ${decoded.order_id}`);
        if (decoded.status === 'success' || decoded.status === 'sandbox') {
            const orderId = decoded.order_id; // e.g. "sub_masterId_1231231"
            const parts = orderId.split('_');
            const masterId = parts[1]; // extracted master ID
            if (!masterId)
                return res.status(400).json({ error: 'Invalid order structure' });
            const currentPeriodEnd = new Date();
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // 30 days of PRO
            await prismaClient_1.default.subscription.upsert({
                where: { masterId: String(masterId) },
                create: {
                    masterId: String(masterId),
                    plan: 'PRO',
                    status: 'ACTIVE',
                    currentPeriodEnd
                },
                update: {
                    plan: 'PRO',
                    status: 'ACTIVE',
                    currentPeriodEnd
                }
            });
            // Store Transaction payment
            await prismaClient_1.default.payment.create({
                data: {
                    masterId: String(masterId),
                    amount: Number(decoded.amount) || 0,
                    currency: decoded.currency || 'UAH',
                    status: 'success',
                    liqpayOrderId: String(decoded.payment_id || orderId)
                }
            });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('[LIQPAY ERROR]', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// GET /api/webhooks/mock-payment?orderId=X&masterId=Y
// Simulates a successful checkout from the browser
router.get('/mock-payment', async (req, res) => {
    try {
        const { masterId } = req.query;
        if (!masterId)
            return res.send('Missing masterId');
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // Add 30 days
        await prismaClient_1.default.subscription.upsert({
            where: { masterId: String(masterId) },
            create: {
                masterId: String(masterId),
                plan: 'PRO',
                status: 'ACTIVE',
                currentPeriodEnd
            },
            update: {
                plan: 'PRO',
                status: 'ACTIVE',
                currentPeriodEnd
            }
        });
        const orderId = req.query.orderId || `mock_${Date.now()}`;
        await prismaClient_1.default.payment.create({
            data: {
                masterId: String(masterId),
                amount: 299,
                status: 'success',
                liqpayOrderId: String(orderId)
            }
        });
        res.send(`
           <html>
             <body style="display:flex; justify-content:center; align-items:center; height:100vh; background:#FFF0F5; font-family:sans-serif;">
                <div style="text-align:center; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                   <h1 style="color:#FF69B4">Оплата успішна! 🎉</h1>
                   <p>Вашу підписку PRO активовано на 30 днів.</p>
                   <p>Ви можете закрити це вікно і повернутись у додаток.</p>
                </div>
             </body>
           </html>
       `);
    }
    catch (e) {
        res.status(500).send('Error');
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map