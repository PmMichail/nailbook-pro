import { Router } from 'express';
import prisma from '../models/prismaClient';
import { authenticate, AuthRequest } from '../middleware/auth';
import QRCode from 'qrcode';

const router = Router();
router.use(authenticate);

// Middleware тільки для майстра (для SETUP)
const requireMaster = (req: AuthRequest, res: any, next: any) => {
  if (req.user!.role !== 'MASTER') {
    return res.status(403).json({ error: 'Тільки для майстрів' });
  }
  next();
};

// Зберегти платіжні дані (Master only)
router.put('/setup', requireMaster, async (req: AuthRequest, res) => {
  try {
    const { cardNumber, bankName, fullName } = req.body;

    // Генеруємо QR текст:
    const qrText = `Оплата майстру ${fullName}, картка ${cardNumber}, банк ${bankName}`;
    const qrCodeUrl = await QRCode.toDataURL(qrText);

    const paymentInfo = await prisma.paymentInfo.upsert({
      where: { masterId: req.user!.id },
      update: { cardNumber, bankName, fullName, qrCodeUrl },
      create: { masterId: req.user!.id, cardNumber, bankName, fullName, qrCodeUrl }
    });

    res.json(paymentInfo);
  } catch (error) {
    res.status(500).json({ error: 'Помилка збереження платіжних даних' });
  }
});

// Отримати свої дані (Master only)
router.get('/info', requireMaster, async (req: AuthRequest, res) => {
  try {
    const info = await prisma.paymentInfo.findUnique({
      where: { masterId: req.user!.id }
    });
    res.json(info || null);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Отримати поточний згенерований QR (може отримувати і клієнт, знаючи ID майстра)
// Для майстра повертаємо його QR, а якщо передано query masterId - повертаємо QR вказаного майстра
router.get('/qr', async (req: AuthRequest, res) => {
  try {
    const targetMasterId = (req.query.masterId as string) || req.user!.id;
    
    const info = await prisma.paymentInfo.findUnique({
      where: { masterId: targetMasterId }
    });

    if (!info || !info.qrCodeUrl) {
      return res.status(404).json({ error: 'Оплата не налаштована' });
    }

    // Повертаємо base64 зображення (можна і просто JSON `{ qr: "base64..." }`)
    res.json({ qrCodeUrl: info.qrCodeUrl });
  } catch (error) {
    res.status(500).json({ error: 'Помилка генерації QR' });
  }
});

export default router;
