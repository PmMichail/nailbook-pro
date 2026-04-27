import { Router } from 'express';
import prisma from '../models/prismaClient';
import { sendTelegramMessage } from '../services/telegram';
import { sendPushNotification } from '../services/firebase';
import { authenticate } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const router = Router();

// POST /push-token (Any authenticated user)
router.post('/push-token', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { token, os } = req.body;
    
    console.log('[PUSH BACKEND] Received token for user:', userId);
    console.log('[PUSH BACKEND] Token value:', token);

    if (!token) {
      console.log('[PUSH BACKEND] No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }

    await prisma.pushToken.upsert({
      where: { userId },
      update: { token, os },
      create: { userId, token, os }
    });
    
    console.log('[PUSH BACKEND] Token saved successfully in PushToken model');
    res.json({ success: true });
  } catch (error) {
    console.error('[PUSH BACKEND] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const authClient = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'CLIENT') return res.status(403).json({ error: 'Not a client' });
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authClient);

// GET /master/:id
router.get('/master/:id', async (req: any, res) => {
  try {
     const master = await prisma.user.findUnique({
       where: { id: req.params.id },
       select: { id: true, name: true, phone: true, avatarUrl: true, salonName: true }
     });
     if (!master) return res.status(404).json({ error: 'Not found' });
     res.json(master);
  } catch(e) {
     res.status(500).json({ error: 'Server error' });
  }
});

// PUT /unlink
router.put('/unlink', async (req: any, res) => {
  try {
     await prisma.user.update({
         where: { id: req.user.id },
         data: { masterId: null }
     });
     res.json({ success: true });
  } catch(e) {
     res.status(500).json({ error: 'Server error' });
  }
});

// GET /masters/search?city=xxx&lat=yyy&lng=zzz
router.get('/masters/search', async (req: any, res) => {
  const { city, lat, lng } = req.query;
  try {
     const whereClause: any = { role: 'MASTER' };
     if (city) {
         whereClause.city = { contains: city as String, mode: 'insensitive' };
     }
     
     const masters = await prisma.user.findMany({
        where: whereClause,
        select: { id: true, name: true, city: true, address: true, salonName: true, salonLogo: true, avatarUrl: true, lat: true, lng: true }
     });
     
     let filteredMasters = masters;
     
     // Geolocation filter (Haversine formula, 20km radius)
     if (lat && lng) {
        const clientLat = parseFloat(lat);
        const clientLng = parseFloat(lng);
        
        filteredMasters = masters.filter(m => {
           if (!m.lat || !m.lng) return false;
           
           const R = 6371; // Earth radius in km
           const dLat = (m.lat - clientLat) * Math.PI / 180;
           const dLng = (m.lng - clientLng) * Math.PI / 180;
           const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(clientLat * Math.PI / 180) * Math.cos(m.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
           const distance = R * c;
           
           return distance <= 10; // Within 10km
        });
     }
     
     res.json(filteredMasters);
  } catch(e) {
     res.status(500).json({ error: 'Server error' });
  }
});

// POST /masters/connect
router.post('/masters/connect', async (req: any, res) => {
   const { code } = req.body;
   try {
      const connectionCode = await prisma.connectionCode.findUnique({
         where: { code }
      });
      
      if (!connectionCode) {
         return res.status(404).json({ error: 'Код недійсний' });
      }
      if (new Date() > connectionCode.expiresAt) {
         return res.status(400).json({ error: 'Термін дії коду минув' });
      }

      const masterId = connectionCode.userId;
      
      const sub = await prisma.subscription.findUnique({ where: { masterId } });
      const isFree = !sub || sub.plan === 'FREE' || ['EXPIRED', 'CANCELLED'].includes(sub.status);
      
      if (isFree) {
        const clientCount = await prisma.user.count({ where: { masterId, role: 'CLIENT', isActiveClient: true } });
        if (clientCount >= 10) {
           // Wait, what if the client is already connected to this master? We shouldn't block them.
           if (req.user.masterId !== masterId) {
             return res.status(403).json({ error: 'Майстер тимчасово не приймає нових клієнтів (ліміт бази).' });
           }
        }
      }
      
      await prisma.user.update({
         where: { id: req.user.id },
         data: { masterId, isActiveClient: true }
      });
      
      res.json({ success: true, masterId });
   } catch(e) {
      res.status(500).json({ error: 'Помилка підключення' });
   }
});

// GET /calendar/:masterId?date=YYYY-MM-DD
// Returns available slots only for a specific date for the master
router.get('/calendar/:masterId', async (req: any, res) => {
  const masterId = req.params.masterId;
  const dateStr = req.query.date;
  if (!dateStr) return res.status(400).json({ error: 'date required' });

  const dateObj = new Date(dateStr);
  let dayOfWeek = dateObj.getDay(); 
  if (dayOfWeek === 0) dayOfWeek = 7;

  const settings = await prisma.masterWeeklySettings.findUnique({ 
    where: { masterId_dayOfWeek: { masterId, dayOfWeek } } 
  });
  if (!settings || !settings.isWorking) return res.json({ slots: [] });

  const blocked = await prisma.blockedSlot.findMany({
    where: { masterId, date: new Date(dateStr) }
  });

  const appointments = await prisma.appointment.findMany({
    where: { masterId, date: new Date(dateStr) }
  });

  const [startH, startM] = settings.workStart.split(':').map(Number);
  const [endH, endM] = settings.workEnd.split(':').map(Number);
  const duration = settings.timePerClient;

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const availableSlots = [];

  while (currentMinutes + duration <= endMinutes) {
    if (settings.breakStart && settings.breakEnd) {
       const [bStartH, bStartM] = settings.breakStart.split(':').map(Number);
       const [bEndH, bEndM] = settings.breakEnd.split(':').map(Number);
       const breakStartMins = bStartH * 60 + bStartM;
       const breakEndMins = bEndH * 60 + bEndM;
       if (currentMinutes + duration > breakStartMins && currentMinutes < breakEndMins) {
           currentMinutes += duration;
           continue;
       }
    }

    const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
    const m = (currentMinutes % 60).toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;
    
    const isBlocked = blocked.some(b => b.time === timeStr);
    const hasApp = appointments.some(a => a.time === timeStr && a.status !== 'CANCELLED');

    if (!isBlocked && !hasApp) {
      availableSlots.push(timeStr);
    }
    currentMinutes += duration;
  }
  
  res.json({ slots: availableSlots });
});

// POST /appointments
router.post('/appointments', async (req: any, res) => {
  const { date, time, masterId, service, price } = req.body;
  if (masterId !== req.user.masterId) return res.status(403).json({ error: 'Forbidden' });

  // Перевірка на блок
  const clientUser = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (clientUser && clientUser.phone) {
    const isBlocked = await prisma.blockedPhone.findFirst({
      where: { masterId, phone: clientUser.phone }
    });
    if (isBlocked) {
      return res.status(403).json({ error: 'Вам відмовлено в доступі до бронювання у цього майстра.' });
    }
  }

  let finalPrice = price;
  let appliedDiscountReason = '';

  // 1. Check if New Client First Booking Discount
  const previousCompleted = await prisma.appointment.count({ where: { clientId: req.user.id, status: 'COMPLETED' } });
  if (previousCompleted === 0) {
     const referredAsNew = await prisma.referralUse.findFirst({
        where: { referredClientId: req.user.id }
     });
     if (referredAsNew) {
        finalPrice = Math.floor(price * 0.9);
        appliedDiscountReason = 'Реферальна знижка 10% на перший запис';
     }
  }

  // 2. If no new client discount, check if they have available Inviter Bonus
  if (finalPrice === price) {
     // User's own code
     const myCode = await prisma.referralCode.findUnique({ where: { clientId: req.user.id } });
     if (myCode) {
        // Find a referral that hasn't been used yet AND where the referred client has at least 1 COMPLETED appointment
        const possibleBonuses = await prisma.referralUse.findMany({
           where: { code: myCode.code, isCodeOwnerDiscountUsed: false },
           include: { referredClient: { include: { myAppointments: { where: { status: 'COMPLETED' } } } } }
        });
        
        const unusedBonus = possibleBonuses.find((b: any) => b.referredClient?.myAppointments?.length > 0);
        
        if (unusedBonus) {
           finalPrice = Math.floor(price * 0.9);
           appliedDiscountReason = 'Реферальний бонус 10% за друга';
           
           // Mark this bonus as consumed
           await prisma.referralUse.update({
             where: { id: unusedBonus.id },
             data: { isCodeOwnerDiscountUsed: true }
           });
        }
     }
  }

  const app = await prisma.appointment.create({
    data: {
      clientId: req.user.id,
      masterId,
      date: new Date(date),
      time,
      service,
      price: finalPrice, // The actual price client will pay
      originalPrice: price, // For display purposes
      status: 'PENDING'
    }
  });

  // Ensure the client becomes active again in the master's book
  await prisma.user.update({
    where: { id: req.user.id },
    data: { isActiveClient: true }
  });

  sendTelegramMessage(masterId, `Новий запис! Клієнт бажає записатися на ${date} о ${time}.`);
  
  const masterWithToken = await prisma.user.findUnique({
    where: { id: masterId },
    include: { pushToken: true }
  });
  
  console.log('[PUSH BACKEND] Master token from DB:', masterWithToken?.pushToken?.token);

  if (masterWithToken?.pushToken?.token) {
    console.log('[PUSH BACKEND] Sending push to master...');
    await sendPushNotification(
       masterWithToken.pushToken.token,
       'Новий запис!',
       `Клієнт ${clientUser?.name || 'Клієнт'} записався на ${date} о ${time}.`
    );
  } else {
    console.log('[PUSH BACKEND] Master has no push token');
  }

  res.status(201).json(app);
});

// GET /masters/:id/prices
router.get('/masters/:id/prices', async (req: any, res) => {
  const prices = await prisma.priceList.findMany({
    where: { masterId: req.params.id },
    orderBy: { createdAt: 'asc' }
  });
  res.json(prices);
});

// GET /appointments (my appointments)
router.get('/appointments', async (req: any, res) => {
  const apps = await prisma.appointment.findMany({
    where: { clientId: req.user.id },
    include: { master: true },
    orderBy: { date: 'desc' }
  });
  res.json(apps);
});

// DELETE /appointments/:id
router.delete('/appointments/:id', async (req: any, res) => {
  const app = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' }
  });
  sendTelegramMessage(app.masterId, `Клієнт СКАСУВАВ запис на ${app.date.toISOString().split('T')[0]} о ${app.time}.`);
  res.json({ success: true, app });
});

// GET /appointments/:id/payment
router.get('/appointments/:id/payment', async (req: any, res) => {
  const app = await prisma.appointment.findUnique({
    where: { id: req.params.id }
  });
  if (!app || app.clientId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  
  if (!app.paymentDetails) {
    return res.status(404).json({ error: 'Реквізити ще не додані майстром або запис не підтверджено' });
  }

  const pDetails: any = app.paymentDetails;
  let amount = app.finalPrice || app.originalPrice || app.price || 0;
  
  if (app.status === 'AWAITING_PREPAYMENT') {
     amount = app.prepaymentAmount || amount;
  }
  
  const paymentData = {
    cardNumber: pDetails.cardNumber,
    bankName: pDetails.bankName,
    amount: amount,
    description: `Запис до майстра ${app.date.toISOString().split('T')[0]} ${app.time}`
  };
  
  let qrCode = '';
  try {
    qrCode = await QRCode.toDataURL(JSON.stringify(paymentData));
  } catch(e) {}

  res.json({
    qrCode,
    paymentLink: pDetails.qrCode,
    cardNumber: pDetails.cardNumber,
    bankName: pDetails.bankName,
    amount,
    prepaymentDeadline: app.prepaymentDeadline,
    isPrepayment: app.status === 'AWAITING_PREPAYMENT'
  });
});

// GET /referral-code
router.get('/referral-code', async (req: any, res) => {
  try {
    let rc = await prisma.referralCode.findUnique({
      where: { clientId: req.user.id }
    });
    
    if (!rc) {
      const codeStr = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      rc = await prisma.referralCode.create({
        data: {
          clientId: req.user.id,
          code: codeStr
        }
      });
    }
    
    res.json({ code: rc.code, uses: rc.uses });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /referral-stats
router.get('/referral-stats', async (req: any, res) => {
  try {
    const rc = await prisma.referralCode.findUnique({
      where: { clientId: req.user.id }
    });
    
    if (!rc) {
      return res.json({ uses: 0, pendingBonuses: 0, totalDiscountApplied: 0 });
    }
    
    // Calculate how many of the referred clients actually completed an appointment
    const allUses = await prisma.referralUse.findMany({
      where: { code: rc.code },
      include: { referredClient: { include: { myAppointments: { where: { status: 'COMPLETED' } } } } }
    });
    
    // Only count uses that have at least 1 completed appointment
    const validUses = allUses.filter((u: any) => u.referredClient?.myAppointments?.length > 0);
    
    const pendingBonuses = validUses.filter((u: any) => !u.isCodeOwnerDiscountUsed).length;
    const totalDiscountApplied = validUses.filter((u: any) => u.isCodeOwnerDiscountUsed).length * 10;
    
    res.json({
      uses: validUses.length, // Number of successfully processed friends
      pendingBonuses,
      totalDiscountApplied
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
