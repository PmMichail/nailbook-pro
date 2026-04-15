import { Router } from 'express';
import prisma from '../models/prismaClient';
import jwt from 'jsonwebtoken';
import { uploadCloud } from '../services/cloudinary';
// uploadCloud replaces multer({ storage })

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Optional auth helper to attach user if logged in
const optionalAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  next();
};

const requireMaster = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'MASTER') {
    return res.status(403).json({ error: 'Master access required' });
  }
  next();
};

const requireClient = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'CLIENT') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

router.use(optionalAuth);

// GET /gallery (all works from all masters for the common feed)
router.get('/', async (req, res) => {
  const items = await prisma.galleryItem.findMany({
    orderBy: { createdAt: 'desc' },
    include: { master: { select: { name: true, linkSlug: true } } }
  });
  // formatting local urls to absolute, and enforce https for cloudinary
  const formatted = items.map(i => ({
    ...i,
    imageUrl: i.imageUrl.startsWith('http') 
        ? i.imageUrl.replace(/^http:\/\//i, 'https://')
        : `https://localhost:3000/${i.imageUrl}`
  }));
  res.json(formatted);
});

// GET /gallery/master/:masterId (specific master's works)
router.get('/master/:masterId', async (req, res) => {
  const items = await prisma.galleryItem.findMany({
    where: { masterId: req.params.masterId },
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

// POST /gallery (add new work - Master only)
router.post('/', requireMaster, uploadCloud.single('image'), async (req: any, res) => {
  const { tags } = req.body;
  let imageUrl = req.file ? req.file.path.replace(/\\/g, '/') : null;
  if (imageUrl) {
     imageUrl = imageUrl.replace(/^http:\/\//i, 'https://');
  }
  
  if (!imageUrl) return res.status(400).json({ error: 'image file required' });
  
  const tagsArray = tags ? JSON.parse(tags) : [];

  const newItem = await prisma.galleryItem.create({
    data: {
      masterId: req.user.id,
      imageUrl,
      tags: tagsArray
    }
  });
  res.status(201).json(newItem);
});

// DELETE /gallery/:id (delete work - Master only)
router.delete('/:id', requireMaster, async (req: any, res) => {
  // ensure master owns it
  const it = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
  if (!it || it.masterId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  
  await prisma.galleryItem.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /gallery/:id/like (Client only)
router.post('/:id/like', requireClient, async (req: any, res) => {
  const galleryId = req.params.id;
  const clientId = req.user.id;
  
  try {
    await prisma.favorite.create({
      data: { clientId, galleryId }
    });
    // increment likes count
    await prisma.galleryItem.update({
      where: { id: galleryId },
      data: { likesNum: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Already liked or error' });
  }
});

// DELETE /gallery/:id/like
router.delete('/:id/like', requireClient, async (req: any, res) => {
  const galleryId = req.params.id;
  const clientId = req.user.id;
  
  try {
    const fav = await prisma.favorite.findUnique({
      where: { clientId_galleryId: { clientId, galleryId } }
    });
    
    if (fav) {
      await prisma.favorite.delete({ where: { id: fav.id } });
      await prisma.galleryItem.update({
        where: { id: galleryId },
        data: { likesNum: { decrement: 1 } }
      });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Error' });
  }
});

// GET /gallery/favorites
router.get('/favorites', requireClient, async (req: any, res) => {
  const favs = await prisma.favorite.findMany({
    where: { clientId: req.user.id },
    include: { gallery: true }
  });
  res.json(favs.map(f => f.gallery));
});

export default router;
