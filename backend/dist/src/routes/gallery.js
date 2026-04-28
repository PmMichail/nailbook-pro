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
// Optional auth helper to attach user if logged in
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (e) { }
    }
    next();
};
const requireMaster = (req, res, next) => {
    if (!req.user || req.user.role !== 'MASTER') {
        return res.status(403).json({ error: 'Master access required' });
    }
    next();
};
const requireClient = (req, res, next) => {
    if (!req.user || req.user.role !== 'CLIENT') {
        return res.status(403).json({ error: 'Client access required' });
    }
    next();
};
router.use(optionalAuth);
// GET /gallery (Anonymous Global Feed)
router.get('/', async (req, res) => {
    const items = await prismaClient_1.default.galleryItem.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' }
        // No include master! It's anonymous.
    });
    const formatted = items.map(i => ({
        ...i,
        master: undefined, // ensure no master data
        imageUrl: i.imageUrl.startsWith('http')
            ? i.imageUrl.replace(/^http:\/\//i, 'https://')
            : `https://localhost:3000/${i.imageUrl}`
    }));
    res.json(formatted);
});
// GET /gallery/master/:masterId (Private Portfolio for a Master)
router.get('/master/:masterId', async (req, res) => {
    const items = await prismaClient_1.default.galleryItem.findMany({
        where: { masterId: req.params.masterId, isPublic: false },
        orderBy: { createdAt: 'desc' }
    });
    const formatted = items.map(i => ({
        ...i,
        imageUrl: i.imageUrl.startsWith('http')
            ? i.imageUrl.replace(/^http:\/\//i, 'https://')
            : `https://localhost:3000/${i.imageUrl}`
    }));
    res.json(formatted);
});
// POST /gallery (add new work)
router.post('/', requireMaster, cloudinary_1.uploadCloud.single('image'), async (req, res) => {
    const { tags, isPublic } = req.body;
    let imageUrl = req.file ? req.file.path.replace(/\\/g, '/') : null;
    if (imageUrl) {
        imageUrl = imageUrl.replace(/^http:\/\//i, 'https://');
    }
    if (!imageUrl)
        return res.status(400).json({ error: 'image file required' });
    const tagsArray = tags ? JSON.parse(tags) : [];
    const sub = await prismaClient_1.default.subscription.findUnique({ where: { masterId: req.user.id } });
    const isFree = !sub || sub.plan === 'FREE' || ['EXPIRED', 'CANCELLED'].includes(sub.status);
    const wantsToBePublic = isPublic === 'true' || isPublic === true;
    if (wantsToBePublic) {
        if (isFree) {
            const publicCount = await prismaClient_1.default.galleryItem.count({ where: { masterId: req.user.id, isPublic: true } });
            if (publicCount >= 1)
                return res.status(403).json({ error: 'Ліміт FREE: лише 1 фото в загальну галерею.' });
        }
    }
    else {
        if (isFree) {
            const privateCount = await prismaClient_1.default.galleryItem.count({ where: { masterId: req.user.id, isPublic: false } });
            if (privateCount >= 5)
                return res.status(403).json({ error: 'Ліміт FREE: лише 5 фото в портфоліо.' });
        }
    }
    const newItem = await prismaClient_1.default.galleryItem.create({
        data: { masterId: req.user.id, imageUrl, tags: tagsArray, isPublic: wantsToBePublic }
    });
    return res.status(201).json(newItem);
});
// DELETE /gallery/:id (delete work - Master only)
router.delete('/:id', requireMaster, async (req, res) => {
    const it = await prismaClient_1.default.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!it || it.masterId !== req.user.id)
        return res.status(403).json({ error: 'Forbidden' });
    await prismaClient_1.default.galleryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
// POST /gallery/:id/like (Client only)
router.post('/:id/like', requireClient, async (req, res) => {
    const galleryId = req.params.id;
    const clientId = req.user.id;
    try {
        await prismaClient_1.default.favorite.create({
            data: { clientId, galleryId }
        });
        // increment likes count
        await prismaClient_1.default.galleryItem.update({
            where: { id: galleryId },
            data: { likesNum: { increment: 1 } }
        });
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: 'Already liked or error' });
    }
});
// DELETE /gallery/:id/like
router.delete('/:id/like', requireClient, async (req, res) => {
    const galleryId = req.params.id;
    const clientId = req.user.id;
    try {
        const fav = await prismaClient_1.default.favorite.findUnique({
            where: { clientId_galleryId: { clientId, galleryId } }
        });
        if (fav) {
            await prismaClient_1.default.favorite.delete({ where: { id: fav.id } });
            await prismaClient_1.default.galleryItem.update({
                where: { id: galleryId },
                data: { likesNum: { decrement: 1 } }
            });
        }
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: 'Error' });
    }
});
// GET /gallery/favorites
router.get('/favorites', requireClient, async (req, res) => {
    const favs = await prismaClient_1.default.favorite.findMany({
        where: { clientId: req.user.id },
        include: { gallery: true }
    });
    res.json(favs.map(f => f.gallery));
});
exports.default = router;
//# sourceMappingURL=gallery.js.map