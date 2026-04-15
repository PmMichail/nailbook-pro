import { Router } from 'express';
import prisma from '../models/prismaClient';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Додати до обраного (або прибрати, якщо вже є)
router.post('/:galleryId', async (req: AuthRequest, res) => {
  try {
    const existingFav = await prisma.favorite.findUnique({
      where: { userId_galleryId: { userId: req.user!.id, galleryId: req.params.galleryId } }
    });

    if (existingFav) {
      await prisma.favorite.delete({ where: { id: existingFav.id } });
      res.json({ favorited: false });
    } else {
      await prisma.favorite.create({
        data: { userId: req.user!.id, galleryId: req.params.galleryId }
      });
      res.json({ favorited: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Помилка обробки обраного' });
  }
});

// Отримати всі свої обрані
router.get('/', async (req: AuthRequest, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
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
  } catch (error) {
    res.status(500).json({ error: 'Помилка отримання обраного' });
  }
});

export default router;
