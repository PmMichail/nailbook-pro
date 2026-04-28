"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../models/prismaClient"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Додати до обраного (або прибрати, якщо вже є)
router.post('/:galleryId', async (req, res) => {
    try {
        const existingFav = await prismaClient_1.default.favorite.findUnique({
            where: { userId_galleryId: { userId: req.user.id, galleryId: req.params.galleryId } }
        });
        if (existingFav) {
            await prismaClient_1.default.favorite.delete({ where: { id: existingFav.id } });
            res.json({ favorited: false });
        }
        else {
            await prismaClient_1.default.favorite.create({
                data: { userId: req.user.id, galleryId: req.params.galleryId }
            });
            res.json({ favorited: true });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка обробки обраного' });
    }
});
// Отримати всі свої обрані
router.get('/', async (req, res) => {
    try {
        const favorites = await prismaClient_1.default.favorite.findMany({
            where: { userId: req.user.id },
            include: {
                gallery: {
                    include: {
                        master: { select: { id: true, name: true } },
                        _count: { select: { likes: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Маппимо щоб повернути чистий список gallery objects
        const formattedFavs = favorites.map(f => f.gallery);
        res.json(formattedFavs);
    }
    catch (error) {
        res.status(500).json({ error: 'Помилка отримання обраного' });
    }
});
exports.default = router;
//# sourceMappingURL=favorites.js.map