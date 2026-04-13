import { Router } from 'express';
import prisma from '../models/prismaClient';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden. Admin role required.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticateAdmin);

// GET /api/admin/masters
router.get('/masters', async (req, res) => {
   try {
       const masters = await prisma.user.findMany({
           where: { role: 'MASTER' },
           select: {
               id: true, name: true, phone: true, email: true, createdAt: true,
               subscription: {
                   select: { plan: true, status: true, trialEndsAt: true, currentPeriodEnd: true }
               }
           },
           orderBy: { createdAt: 'desc' }
       });
       res.json(masters);
   } catch(e) {
       res.status(500).json({ error: 'Server error' });
   }
});

// PUT /api/admin/masters/:id/subscription
router.put('/masters/:id/subscription', async (req, res) => {
   try {
       const masterId = req.params.id;
       const { plan, status, durationDays } = req.body; // e.g. plan: 'PRO', status: 'ACTIVE', durationDays: 30

       let sub = await prisma.subscription.findUnique({ where: { masterId } });
       
       const currentPeriodEnd = new Date();
       if (durationDays) {
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + durationDays);
       }

       if (!sub) {
           sub = await prisma.subscription.create({
               data: {
                   masterId, plan, status, currentPeriodEnd: durationDays ? currentPeriodEnd : null
               }
           });
       } else {
           sub = await prisma.subscription.update({
               where: { masterId },
               data: {
                   plan, status, currentPeriodEnd: durationDays ? currentPeriodEnd : null
               }
           });
       }
       res.json({ success: true, subscription: sub });
   } catch(e) {
       res.status(500).json({ error: 'Server error' });
   }
});

// GET /api/admin/payments
router.get('/payments', async (req, res) => {
   try {
      const payments = await prisma.payment.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
              master: { select: { name: true, phone: true, email: true } }
          }
      });
      res.json(payments);
   } catch(e) {
       res.status(500).json({ error: 'Server error' });
   }
});

// GET /api/admin/statistics
router.get('/statistics', async (req, res) => {
   try {
       const totalMasters = await prisma.user.count({ where: { role: 'MASTER' } });
       const totalClients = await prisma.user.count({ where: { role: 'CLIENT' } });
       const activePro = await prisma.subscription.count({
           where: { plan: 'PRO', status: 'ACTIVE' }
       });
       const activeTrials = await prisma.subscription.count({
           where: { plan: 'PRO', status: 'TRIAL' }
       });
       const canceledOrExpired = await prisma.subscription.count({
           where: { status: { in: ['EXPIRED', 'CANCELLED'] } }
       });
       
       const successfulPayments = await prisma.payment.aggregate({
           where: { status: 'success' },
           _sum: { amount: true }
       });

       const conversionRate = totalMasters > 0 ? ((activePro / totalMasters) * 100).toFixed(1) + '%' : '0%';

       res.json({
           totalMasters,
           totalClients,
           activePro,
           activeTrials,
           canceledOrExpired,
           conversionRate,
           revenue: successfulPayments._sum.amount || 0
       });
   } catch(e) {
       res.status(500).json({ error: 'Server error' });
   }
});

export default router;
