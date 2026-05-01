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
                id: true, name: true, phone: true, email: true, createdAt: true, isBanned: true,
                subscription: {
                    select: { plan: true, status: true, currentPeriodEnd: true }
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

// GET /api/admin/clients
router.get('/clients', async (req, res) => {
   try {
       const clients = await prisma.user.findMany({
           where: { role: 'CLIENT' },
           select: { id: true, name: true, phone: true, email: true, createdAt: true, isBanned: true, masterId: true },
           orderBy: { createdAt: 'desc' }
       });
       res.json(clients);
   } catch(e) {
       res.status(500).json({ error: 'Server error' });
   }
});

// GET /api/admin/statistics
router.get('/statistics', async (req, res) => {
   try {
       const totalMasters = await prisma.user.count({ where: { role: 'MASTER' } });
       
       // Calculate Last 7 Days Revenue
       const sevenDaysAgo = new Date();
       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
       
       const recentPayments = await prisma.payment.findMany({
           where: { status: 'success', createdAt: { gte: sevenDaysAgo } },
           select: { amount: true, createdAt: true }
       });
       
       const recentUsers = await prisma.user.findMany({
           where: { role: 'MASTER', createdAt: { gte: sevenDaysAgo } },
           select: { createdAt: true }
       });
       
       const last7DaysRevenue: number[] = [0,0,0,0,0,0,0];
       const last7DaysRegs: number[] = [0,0,0,0,0,0,0];
       
       for (let i = 0; i < 7; i++) {
           const d = new Date();
           d.setDate(d.getDate() - (6 - i));
           const dateStr = d.toISOString().split('T')[0];
           
           recentPayments.forEach(p => {
               if (p.createdAt.toISOString().split('T')[0] === dateStr) {
                   last7DaysRevenue[i]! += p.amount || 0;
               }
           });
           recentUsers.forEach(u => {
               if (u.createdAt.toISOString().split('T')[0] === dateStr) {
                   last7DaysRegs[i]! += 1;
               }
           });
       }

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
           last7DaysRevenue, last7DaysRegs,
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

// PUT /api/admin/masters/:id/reset-password
import bcrypt from 'bcrypt';
router.put('/masters/:id/reset-password', async (req, res) => {
   try {
       const masterId = req.params.id;
       const newPassword = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits code
       const hashedPassword = await bcrypt.hash(newPassword, 10);
       
       await prisma.user.update({
           where: { id: masterId },
           data: { password: hashedPassword }
       });
       
       res.json({ newPassword });
   } catch(e) {
       res.status(500).json({ error: 'Server error' });
   }
});

// GET /api/admin/config
router.get('/config', async (req, res) => {
    try {
        const configs = await prisma.systemConfig.findMany();
        const configMap: Record<string, string> = {};
        configs.forEach(c => configMap[c.key] = c.value);
        
        // Return default PRO_PRICE if not explicitly saved yet
        if (!configMap['PRO_PRICE']) configMap['PRO_PRICE'] = '299';
        
        res.json(configMap);
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/config
router.post('/config', async (req, res) => {
    try {
        const { key, value } = req.body;
        const config = await prisma.systemConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });
        res.json({ success: true, config });
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/activity
router.get('/activity', async (req, res) => {
    try {
        const limit = 30;
        // Fetch latest users
        const users = await prisma.user.findMany({ 
            take: limit, orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, role: true, createdAt: true, phone: true }
        });
        // Fetch latest appointments
        const appts = await prisma.appointment.findMany({ 
            take: limit, orderBy: { createdAt: 'desc' },
            select: { id: true, service: true, createdAt: true, client: { select: { name: true } }, master: { select: { name: true } } }
        });
        // Fetch latest payments
        const payments = await prisma.payment.findMany({ 
            take: limit, orderBy: { createdAt: 'desc' },
            select: { id: true, amount: true, status: true, createdAt: true, master: { select: { name: true } } }
        });

        // Merge and sort
        const events: any[] = [];
        users.forEach(u => events.push({ id: `usr_${u.id}`, type: 'USER_REG', title: `Новий ${u.role === 'MASTER' ? 'Майстер' : 'Клієнт'}`, details: `${u.name} (${u.phone})`, timestamp: u.createdAt }));
        appts.forEach(a => events.push({ id: `apt_${a.id}`, type: 'NEW_APPT', title: `Новий Запис`, details: `Клієнт ${a.client?.name || 'Невідомо'} до майстра ${a.master?.name || 'Невідомо'} (${a.service || 'Без послуги'})`, timestamp: a.createdAt }));
        payments.forEach(p => events.push({ id: `pay_${p.id}`, type: 'PAYMENT', title: `Оплата Підписки`, details: `Майстер ${p.master?.name || 'Невідомо'} сплатив ${p.amount || 0} грн [${p.status}]`, timestamp: p.createdAt }));

        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        res.json(events.slice(0, 50));
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/regions
router.get('/regions', async (req, res) => {
    try {
        const masters = await prisma.user.findMany({
            where: { role: 'MASTER' },
            select: { id: true, city: true, lat: true, lng: true }
        });

        const clients = await prisma.user.findMany({
            where: { role: 'CLIENT', masterId: { not: null } },
            select: { masterId: true }
        });

        // Country Classification Logic
        const regionMap = new Map();
        
        const getCountry = (lat: number, lng: number) => {
             if (lat > 44 && lat < 52.5 && lng > 22 && lng < 40.5) return 'Україна';
             if (lat > 49 && lat < 55 && lng > 14 && lng < 24) return 'Польща';
             if (lat > 47 && lat < 55 && lng > 5 && lng < 15) return 'Німеччина';
             return 'Інші (Європа)';
        };

        masters.forEach(m => {
            let regionKey = 'Не вказано';
            if (m.lat && m.lng) {
                regionKey = getCountry(m.lat, m.lng);
            } else if (m.city && m.city.trim() !== '') {
                // Fallback to city parsing (basic)
                const c = m.city.toLowerCase();
                if (c.includes('kyiv') || c.includes('київ') || c.includes('lviv') || c.includes('львів')) regionKey = 'Україна';
                else if (c.includes('warsaw') || c.includes('варшава') || c.includes('krakow') || c.includes('краків')) regionKey = 'Польща';
                else if (c.includes('berlin') || c.includes('берлін') || c.includes('munich') || c.includes('мюнхен')) regionKey = 'Німеччина';
                else regionKey = 'Інші';
            }

            if (!regionMap.has(regionKey)) {
                regionMap.set(regionKey, { region: regionKey, masterCount: 0 });
            }
            regionMap.get(regionKey).masterCount += 1;
        });

        const sortedRegions = Array.from(regionMap.values()).sort((a, b) => b.masterCount - a.masterCount);
        res.json(sortedRegions);
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
    try {
        const { isBanned } = req.body;
        const u = await prisma.user.update({
            where: { id: req.params.id },
            data: { isBanned }
        });
        res.json({ success: true, isBanned: u.isBanned });
    } catch(e) {
        res.status(500).json({ error: 'Failed to update ban status' });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        await prisma.masterWeeklySettings.deleteMany({ where: { masterId: userId } });
        await prisma.priceList.deleteMany({ where: { masterId: userId } });
        await prisma.appointment.deleteMany({ where: { OR: [{ masterId: userId }, { clientId: userId }] } });
        await prisma.message.deleteMany({ where: { senderId: userId } });
        const userChats = await prisma.chat.findMany({ where: { roomId: { contains: userId } }});
        await prisma.message.deleteMany({ where: { chatId: { in: userChats.map(c => c.id) } }});
        await prisma.chat.deleteMany({ where: { roomId: { contains: userId } } });
        
        await prisma.user.delete({ where: { id: userId } });
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// GET /api/admin/masters/:id/analytics
router.get('/masters/:id/analytics', async (req, res) => {
    try {
        const masterId = req.params.id;
        const totalClients = await prisma.user.count({ where: { role: 'CLIENT', masterId } });
        const totalAppointments = await prisma.appointment.count({ where: { masterId } });
        
        const completedAppointments = await prisma.appointment.count({ where: { masterId, status: 'COMPLETED' } });
        const cancelledAppointments = await prisma.appointment.count({ where: { masterId, status: 'CANCELLED' } });
        const pendingAppointments = await prisma.appointment.count({ where: { masterId, status: 'PENDING' } });
        const confirmedAppointments = await prisma.appointment.count({ where: { masterId, status: 'CONFIRMED' } });
        
        res.json({
            totalClients,
            totalAppointments,
            chartData: [
                { name: 'Completed', count: completedAppointments },
                { name: 'Cancelled', count: cancelledAppointments },
                { name: 'Confirmed', count: confirmedAppointments },
                { name: 'Pending', count: pendingAppointments }
            ]
        });
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
