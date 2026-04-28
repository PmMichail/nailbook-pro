"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
// GET /api/master/subscription
router.get('/', async (req, res) => {
    try {
        const masterId = req.user.id;
        let sub = await prismaClient_1.default.subscription.findUnique({
            where: { masterId }
        });
        if (!sub) {
            sub = await prismaClient_1.default.subscription.create({
                data: {
                    masterId,
                    plan: 'FREE',
                    status: 'ACTIVE'
                }
            });
        }
        // Auto-expire trials
        if (sub.status === 'TRIAL' && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
            sub = await prismaClient_1.default.subscription.update({
                where: { masterId },
                data: { status: 'EXPIRED' }
            });
        }
        // Auto-expire pro
        if (sub.plan === 'PRO' && sub.status === 'ACTIVE' && sub.currentPeriodEnd && new Date() > sub.currentPeriodEnd) {
            sub = await prismaClient_1.default.subscription.update({
                where: { masterId },
                data: { status: 'EXPIRED' }
            });
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const clientCount = await prismaClient_1.default.user.count({
            where: {
                masterId,
                role: 'CLIENT',
                OR: [
                    { isActiveClient: true },
                    { myAppointments: { some: { date: { gte: thirtyDaysAgo } } } }
                ]
            }
        });
        res.json({
            subscription: sub,
            activeClientsCount: clientCount
        });
    }
    catch (err) {
        console.error('[SUB GET ERROR]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/master/subscription/trial
// Starts a 14-day free trial (one time)
router.post('/trial', async (req, res) => {
    try {
        const masterId = req.user.id;
        const sub = await prismaClient_1.default.subscription.findUnique({ where: { masterId } });
        if (!sub || (sub.plan === 'PRO' || sub.status === 'TRIAL' || sub.status === 'EXPIRED')) {
            return res.status(400).json({ error: 'Тріал вже використано або ви вже на тарифі Pro' });
        }
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const updated = await prismaClient_1.default.subscription.update({
            where: { masterId },
            data: {
                plan: 'PRO',
                status: 'TRIAL',
                trialEndsAt,
                currentPeriodEnd: trialEndsAt
            }
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/master/subscription/checkout
router.post('/checkout', async (req, res) => {
    try {
        const masterId = req.user.id;
        const orderId = `sub_${masterId}_${Date.now()}`;
        // Fallback constants
        const publicKey = process.env.LIQPAY_PUBLIC_KEY || '';
        const privateKey = process.env.LIQPAY_PRIVATE_KEY || '';
        const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
        if (!publicKey || !privateKey) {
            return res.status(500).json({ error: 'LiqPay не сконфігуровано' });
        }
        let proPrice = 299;
        const config = await prismaClient_1.default.systemConfig.findUnique({ where: { key: 'PRO_PRICE' } });
        if (config && config.value) {
            proPrice = parseInt(config.value, 10);
        }
        const payload = {
            public_key: publicKey,
            version: 3,
            action: 'pay',
            amount: proPrice,
            currency: 'UAH',
            description: 'Підписка PRO на NailsBook',
            order_id: orderId,
            server_url: `${serverUrl}/api/webhooks/liqpay`,
            result_url: `${serverUrl}/api/webhooks/liqpay/success`,
            // Testing sandbox parameter. When ready for prod, we can remove it or map it.
            // However, the 'sandbox' parameter forces the payment into a test gateway.
            sandbox: 1
        };
        const dataBuffer = Buffer.from(JSON.stringify(payload));
        const dataString = dataBuffer.toString('base64');
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const signatureString = crypto.createHash('sha1').update(privateKey + dataString + privateKey).digest('base64');
        // Return the HTML checkout form that automatically submits to LiqPay
        const formHtml = `
      <html>
        <head><title>NailsBook Payment</title></head>
        <body onload="document.forms['liqpay'].submit();" style="display:flex; justify-content:center; align-items:center; height:100vh;">
            <p>Перенаправлення на сторінку оплати...</p>
            <form id="liqpay" name="liqpay" action="https://www.liqpay.ua/api/3/checkout" method="POST">
                <input type="hidden" name="data" value="${dataString}" />
                <input type="hidden" name="signature" value="${signatureString}" />
            </form>
        </body>
      </html>
    `;
        res.json({
            htmlForm: formHtml,
            orderId
        });
    }
    catch (err) {
        console.error('[CHECKOUT ERROR]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/master/subscription
router.delete('/', async (req, res) => {
    try {
        const masterId = req.user.id;
        const sub = await prismaClient_1.default.subscription.findUnique({ where: { masterId } });
        if (sub && sub.plan === 'PRO') {
            await prismaClient_1.default.subscription.update({
                where: { masterId },
                data: {
                    status: 'CANCELLED'
                }
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=subscription.js.map